FROM python:3.12.8-slim-bookworm AS runtime
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 TF_NUM_INTRAOP_THREADS=2 TF_NUM_INTEROP_THREADS=2 OMP_NUM_THREADS=2
COPY microservices/matching-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY ml-service/model.py ml-service/server.py ml-service/text_chunks.py ./legacy/
COPY microservices/matching-service/app.py microservices/matching-service/migrate.py ./
COPY microservices/matching-service/migrations ./migrations
RUN useradd -r -u 10001 matcher && chown -R matcher:matcher /app
USER matcher
EXPOSE 8000
HEALTHCHECK --interval=20s --timeout=4s --retries=4 CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health',timeout=3)"
CMD ["uvicorn","app:app","--host","0.0.0.0","--port","8000","--workers","1"]
