import os
import random
import time
from datetime import datetime, timezone

import requests


class Agent:
    """Produces realistic telemetry events for local demos and integration tests."""

    EVENTS = [
        ("payment-gateway", "PAYMENT_LATENCY_SPIKE", "CRITICAL", "Gateway response latency exceeded the pre-incident threshold", "GatewayHandler.process: line 184"),
        ("transaction-ledger", "HIKARI_POOL_CONTENTION", "CRITICAL", "Connection pool wait time is rising across write transactions", "HikariPool.getConnection: line 712"),
        ("identity-verifier", "JWT_QUEUE_BACKUP", "WARNING", "JWT verification queue is approaching saturation", "TokenVerifier.verifyAsync: line 96"),
        ("session-cache", "REDIS_FAILOVER_DELAY", "WARNING", "Cache primary failover is delaying session lookups", "ReplicaSelector.route: line 241"),
        ("settlement-worker", "HEAP_PRESSURE", "CRITICAL", "Heap utilization trend predicts worker degradation", "BatchAllocator.allocate: line 58"),
    ]

    def __init__(self, name="Telemetry Generator", service_url=None, interval=5):
        self.name = name
        self.service_url = service_url or os.getenv("TELEMETRY_URL", "http://telemetry-service:8080/api/v1/telemetry/ingest")
        self.interval = interval

    def process_data(self, data):
        response = requests.post(self.service_url, json=data, timeout=5)
        response.raise_for_status()
        return response.json()

    def next_event(self):
        service, code, severity, description, trace = random.choice(self.EVENTS)
        volume = random.randint(18000, 72000)
        return {
            "serviceName": service,
            "errorCode": code,
            "stackTrace": f"{trace}\n{description}",
            "description": description,
            "severity": severity,
            "transactionVolumeAtRisk": volume,
            "timestamp": datetime.now(timezone.utc).replace(tzinfo=None).isoformat(),
        }

    def run(self):
        while True:
            try:
                result = self.process_data(self.next_event())
                print(f"ingested incident {result.get('id')} ({result.get('errorCode')})", flush=True)
            except requests.RequestException as error:
                print(f"telemetry backend unavailable: {error}", flush=True)
            time.sleep(self.interval)