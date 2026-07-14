# ---- builder stage ----
FROM python:3.12-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# ---- runtime stage ----
FROM python:3.12-slim AS runtime
WORKDIR /app

RUN groupadd -r appgroup && useradd -r -g appgroup appuser

COPY --from=builder /root/.local /home/appuser/.local
COPY operations.py worker.py ./

ENV PATH=/home/appuser/.local/bin:$PATH \
    PYTHONUNBUFFERED=1

RUN chown -R appuser:appgroup /app /home/appuser/.local
USER appuser

CMD ["python", "worker.py"]
