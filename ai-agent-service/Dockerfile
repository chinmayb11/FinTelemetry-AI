FROM python:3.10-slim
WORKDIR /app

# Copy ONLY the requirements first
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# THEN copy the rest of your app code
COPY . .

CMD ["python", "main.py"]