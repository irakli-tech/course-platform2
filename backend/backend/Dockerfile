# --- Backend Dockerfile (Django + DRF) ---
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# 1. System dependencies - Retry მექანიზმით და ქსელის პრობლემების პრევენციით
RUN apt-get update || (sleep 3 && apt-get update) && \
    apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 2. Pip-ის განახლება და დამოკიდებულებების დაყენება
COPY requirements.txt .
RUN pip install --no-cache-dir --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org --upgrade pip && \
    pip install --no-cache-dir --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org -r requirements.txt
# 3. პროექტის ფაილების კოპირება
COPY . .

# 4. Entrypoint-ის უფლებების გაწერა
RUN chmod +x /app/entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]
