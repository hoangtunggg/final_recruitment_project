FROM python:3.12-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 TF_NUM_INTRAOP_THREADS=2 TF_NUM_INTEROP_THREADS=2 OMP_NUM_THREADS=2
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY model.py server.py text_chunks.py ./
RUN useradd -r -u 10001 matcher
USER matcher
EXPOSE 8000
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
