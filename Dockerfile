FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    HTTP_PORT=8787 \
    OUTPUT_DIR=output \
    FORMAT=json \
    UPDATE_STATUS=all \
    UPDATE_SOURCE=scrape \
    UPDATE_TIME=06:00 \
    RUN_ON_START=true \
    TZ=Europe/Berlin

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src ./src
COPY frontend ./frontend
COPY index.html .
COPY README.md .

RUN mkdir -p output

EXPOSE 8787

CMD ["python", "-m", "src.docker_runner"]
