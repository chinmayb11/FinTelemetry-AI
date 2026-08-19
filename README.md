# Enterprise Telemetry Platform

An autonomous observability and predictive incident remediation platform for payment-critical distributed systems. It combines live telemetry ingestion, deterministic RCA enrichment, financial exposure translation, and controlled remediation dispatch.

## Components

- **telemetry-service**: Spring Boot ingestion and incident control plane backed by H2.
- **ai-agent-service**: Python telemetry generator for payment, pool, identity, cache, and heap anomalies.
- **frontend**: React/Vite executive command center with RCA and remediation workflows.

## Launch

With Docker Desktop running:

```bash
docker compose up -d --build
```

Open `http://localhost:3000`. The telemetry generator posts a new anomaly every five seconds. The API is available at `http://localhost:8080/api/v1/telemetry`.

For local development, start the Spring service with `mvn spring-boot:run`, run `python ai-agent-service/main.py` with `TELEMETRY_URL=http://localhost:8080/api/v1/telemetry/ingest`, and start the frontend with `npm install` followed by `npm run dev` in `frontend`.

## API

- `POST /api/v1/telemetry/ingest` accepts `serviceName`, `errorCode`, `stackTrace`, `severity`, `transactionVolumeAtRisk`, and `timestamp`.
- `GET /api/v1/telemetry/incidents` returns enriched active and remediated incidents.
- `POST /api/v1/telemetry/remediate/{id}` records an acknowledged autonomous remediation.
