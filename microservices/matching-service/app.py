import asyncio, base64, hashlib, json, logging, os, sys, uuid
from contextlib import asynccontextmanager
from pathlib import Path
import httpx, jwt, numpy as np
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.responses import JSONResponse, Response
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from psycopg_pool import AsyncConnectionPool
import redis.asyncio as aioredis

sys.path.insert(0, "/app/legacy")
import server as legacy

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"), format='{"level":"%(levelname)s","service":"matching-service","message":"%(message)s"}')
log = logging.getLogger("matching-service")
pool = AsyncConnectionPool(os.environ["DATABASE_URL"], min_size=0, max_size=int(os.getenv("DB_POOL_MAX", "4")), open=False)
requests_total = Counter("jobportal_matching_requests_total", "Requests", ["method", "path", "status"])
latency = Histogram("jobportal_matching_duration_seconds", "Latency", ["path"])

def quality_ready(): return legacy.MODEL is not None and legacy.quality_passed()
def user_from(header):
    if not header or not header.startswith("Bearer "): raise HTTPException(401, "Authentication required")
    try: return jwt.decode(header[7:], os.environ["JWT_SECRET"], algorithms=["HS256"])
    except jwt.PyJWTError: raise HTTPException(401, "Invalid or expired token")
def model_name(): return os.getenv("CVJD_MODEL_VERSION", "experimental-v1")
def vector_literal(values): return "[" + ",".join(f"{float(x):.8g}" for x in values) + "]"

@asynccontextmanager
async def lifespan(_app):
    await pool.open()
    worker = asyncio.create_task(event_worker()) if os.getenv("REDIS_URL") else None
    yield
    if worker:
        worker.cancel()
        await asyncio.gather(worker, return_exceptions=True)
    await pool.close()

app = FastAPI(title="JobPortal matching service", docs_url=None, redoc_url=None, lifespan=lifespan)

async def event_worker():
    redis=aioredis.from_url(os.environ["REDIS_URL"],decode_responses=True)
    stream=os.getenv("EVENT_STREAM","jobportal.events.v1");group="matching-service.v1"
    try:
        try: await redis.xgroup_create(stream,group,id="0",mkstream=True)
        except Exception as exc:
            if "BUSYGROUP" not in str(exc): raise
        while True:
            batches=await redis.xreadgroup(group,"matching-service",{stream:">"},count=20,block=2000)
            for _,messages in batches:
                for message_id,event in messages:
                    try:
                        async with pool.connection() as conn:
                            processed = await (await conn.execute("SELECT 1 FROM processed_events WHERE event_id=%s",(event["id"],))).fetchone()
                            if not processed:
                                payload=json.loads(event["payload"]);kind=event["type"].split(".")[0]
                                if event["type"] in {"job.updated","job.deleted","resume.updated","resume.deleted"}:
                                    entity_id=payload.get(f"{kind}Id") or payload.get("id")
                                    if entity_id: await conn.execute("UPDATE embeddings SET invalidated_at=now() WHERE entity_type=%s AND entity_id=%s AND invalidated_at IS NULL",(kind,entity_id))
                                await conn.execute("INSERT INTO processed_events(event_id,event_type) VALUES(%s,%s) ON CONFLICT DO NOTHING",(event["id"],event["type"]))
                        await redis.xack(stream,group,message_id)
                    except Exception as exc: log.error("event handling failed: %s",exc)
    finally: await redis.aclose()

@app.middleware("http")
async def request_context(request: Request, call_next):
    request.state.request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
    with latency.labels(request.url.path).time():
        try: response = await call_next(request)
        except Exception as exc: log.exception("request failed"); response = JSONResponse({"success":False,"error":"Server error","requestId":request.state.request_id},500)
    response.headers["x-request-id"] = request.state.request_id
    requests_total.labels(request.method, request.url.path, response.status_code).inc()
    return response

@app.get("/health")
async def health():
    async with pool.connection() as conn: await conn.execute("SELECT 1")
    return {"status":"healthy","service":"matching-service","modelLoaded":legacy.MODEL is not None}

@app.get("/ready")
async def ready():
    if not quality_ready(): raise HTTPException(503,"Validated local artifacts unavailable")
    return {"status":"ready","service":"matching-service","modelVersion":model_name()}

@app.get("/metrics")
async def metrics(): return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

async def service_get(url, token=None, internal=False):
    headers={}
    if token: headers["authorization"]=token
    if internal: headers["x-internal-service-token"]=os.environ["INTERNAL_SERVICE_TOKEN"]
    async with httpx.AsyncClient(timeout=10) as client: response=await client.get(url,headers=headers)
    if response.status_code==404: raise HTTPException(404,"Source entity not found")
    if not response.is_success: raise HTTPException(503,"Domain service unavailable")
    return response.json()["data"]

def encode(text, maxlen):
    from tensorflow.keras.preprocessing.sequence import pad_sequences
    seq=legacy.TOKENIZER.texts_to_sequences([text])
    tokens=pad_sequences(seq,maxlen=maxlen,padding="post",truncating="post")
    model=legacy.MODEL
    embedding=model.get_layer("embedding"); encoder=model.get_layer("bidirectional"); attention=model.get_layer("attention_pooling")
    value=attention(encoder(embedding(tokens))).numpy()[0].astype(float)
    norm=np.linalg.norm(value)
    if norm: value=value/norm
    if value.shape[0]!=128: raise RuntimeError(f"Unexpected encoder output: {value.shape}")
    return value

async def model_version(conn):
    metadata=json.loads((Path(os.getenv("MATCHER_ARTIFACTS","/app/artifacts"))/"model_metadata.json").read_text())
    row=await conn.execute("INSERT INTO model_versions(name,architecture,vector_dimensions,metadata,quality_gate_passed) VALUES(%s,'siamese_bigru_attention',128,%s,true) ON CONFLICT(name) DO UPDATE SET metadata=excluded.metadata,quality_gate_passed=excluded.quality_gate_passed RETURNING id",(model_name(),json.dumps(metadata)))
    return (await row.fetchone())[0]

async def save_embedding(conn,kind,entity_id,owner,content_hash,value,metadata):
    version=await model_version(conn)
    await conn.execute("UPDATE embeddings SET invalidated_at=now() WHERE entity_type=%s AND entity_id=%s AND model_version_id=%s AND content_hash<>%s AND invalidated_at IS NULL",(kind,entity_id,version,content_hash))
    await conn.execute("INSERT INTO embeddings(entity_type,entity_id,owner_user_id,model_version_id,content_hash,embedding,metadata) VALUES(%s,%s,%s,%s,%s,%s::vector,%s) ON CONFLICT DO NOTHING",(kind,entity_id,owner,version,content_hash,vector_literal(value),json.dumps(metadata)))
    return version

@app.post("/api/matches/jobs/{job_id}/resumes/{resume_id}")
async def match(job_id:str,resume_id:str,authorization:str=Header(None)):
    user=user_from(authorization)
    if user.get("role")!="jobseeker": raise HTTPException(403,"Insufficient permissions")
    if not quality_ready() or os.getenv("CVJD_MATCHING_ENABLED","false")!="true": raise HTTPException(503,"Experimental analysis is unavailable")
    try: uuid.UUID(job_id); uuid.UUID(resume_id)
    except ValueError: raise HTTPException(400,"Invalid job or CV ID")
    job,resume=await __import__("asyncio").gather(service_get(f'{os.getenv("JOB_SERVICE_URL","http://job-service:3000")}/api/jobs/{job_id}',authorization),service_get(f'{os.getenv("RESUME_SERVICE_URL","http://resume-service:3000")}/api/resumes/internal/{resume_id}/content',internal=True))
    if resume["userId"]!=user["id"]: raise HTTPException(404,"CV not found")
    raw=base64.b64decode(resume["fileBase64"],validate=True);cv=legacy.extract(raw,resume["mimeType"])
    result=legacy.analyze(cv,job)
    job_text="\n".join(str(job.get(k) or "") for k in ("title","description","requirements","responsibilities","education","experience","skills"))
    input_hash=hashlib.sha256(raw+json.dumps(job,sort_keys=True).encode()).hexdigest()
    async with pool.connection() as conn:
        version=await save_embedding(conn,"resume",resume_id,user["id"],resume["contentHash"],encode(cv,legacy.CV_LENGTH),{"mimeType":resume["mimeType"]})
        await save_embedding(conn,"job",job_id,None,hashlib.sha256(job_text.encode()).hexdigest(),encode(job_text,legacy.JD_LENGTH),{"status":job.get("status")})
        await conn.execute("INSERT INTO match_results(user_id,resume_id,job_id,model_version_id,input_hash,result) VALUES(%s,%s,%s,%s,%s,%s) ON CONFLICT(user_id,resume_id,job_id,model_version_id,input_hash) DO UPDATE SET result=excluded.result,created_at=now()",(user["id"],resume_id,job_id,version,input_hash,json.dumps(result)))
    return {"success":True,"data":result}

@app.get("/api/matches/resumes/{resume_id}/top-jobs")
async def top_jobs(resume_id:str,k:int=10,authorization:str=Header(None)):
    user=user_from(authorization)
    if not quality_ready(): raise HTTPException(503,"Validated local artifacts unavailable")
    k=max(1,min(k,50))
    async with pool.connection() as conn:
        query=await conn.execute("SELECT embedding,model_version_id FROM embeddings WHERE entity_type='resume' AND entity_id=%s AND owner_user_id=%s AND invalidated_at IS NULL ORDER BY embedded_at DESC LIMIT 1",(resume_id,user["id"])); source=await query.fetchone()
        if not source: raise HTTPException(404,"Resume embedding not found; run an authorized match first")
        rows=await conn.execute("SELECT entity_id,1-(embedding <=> %s::vector) similarity,metadata FROM embeddings WHERE entity_type='job' AND model_version_id=%s AND invalidated_at IS NULL ORDER BY embedding <=> %s::vector LIMIT %s",(str(source[0]),source[1],str(source[0]),k))
        data=[{"jobId":str(r[0]),"cosineSimilarity":float(r[1]),"metadata":r[2]} async for r in rows]
    return {"success":True,"data":data,"warning":"Experimental cosine retrieval; not a hiring recommendation."}
