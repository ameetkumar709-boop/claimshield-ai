FROM python:3.10-slim

WORKDIR /app

# Copy requirements
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files (includes claims, denials, and appeals in SQLite DB)
COPY . .

# Expose port
EXPOSE 8000

# Start command
CMD ["uvicorn", "ai_service:app", "--host", "0.0.0.0", "--port", "8000"]
