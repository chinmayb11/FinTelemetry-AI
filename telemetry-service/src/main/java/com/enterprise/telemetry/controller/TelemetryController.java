package com.enterprise.telemetry.controller;

import com.enterprise.telemetry.entity.IncidentLog;
import com.enterprise.telemetry.repository.IncidentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/telemetry")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class TelemetryController {

    private final IncidentRepository incidentRepository;

    public TelemetryController(IncidentRepository incidentRepository) {
        this.incidentRepository = incidentRepository;
    }

    @GetMapping("/incidents")
    public List<IncidentLog> getAllIncidents() {
        return incidentRepository.findAll().stream()
                .sorted(Comparator.comparing(IncidentLog::getTimestamp, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @PostMapping("/ingest")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public IncidentLog ingest(@RequestBody IncidentLog telemetry) {
        if (telemetry.getServiceName() == null || telemetry.getErrorCode() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "service_name and error_code are required");
        }
        telemetry.setTimestamp(telemetry.getTimestamp() == null ? LocalDateTime.now() : telemetry.getTimestamp());
        telemetry.setSeverity(telemetry.getSeverity() == null ? "WARNING" : telemetry.getSeverity().toUpperCase());
        telemetry.setStatus("ACTIVE");
        telemetry.setAiConfidence(telemetry.getAiConfidence() == null ? confidenceFor(telemetry.getErrorCode()) : telemetry.getAiConfidence());
        telemetry.setFinancialRiskPerMinute(telemetry.getFinancialRiskPerMinute() == null
                ? riskPerMinute(telemetry.getSeverity(), telemetry.getTransactionVolumeAtRisk()) : telemetry.getFinancialRiskPerMinute());
        telemetry.setRootCause(telemetry.getRootCause() == null ? rootCauseFor(telemetry.getErrorCode()) : telemetry.getRootCause());
        telemetry.setRemediation(telemetry.getRemediation() == null ? remediationFor(telemetry.getErrorCode()) : telemetry.getRemediation());
        telemetry.setDescription(telemetry.getDescription() == null ? telemetry.getRootCause() : telemetry.getDescription());
        return incidentRepository.save(telemetry);
    }

    @PostMapping("/remediate/{id}")
    @Transactional
    public IncidentLog remediate(@PathVariable Long id) {
        IncidentLog incident = incidentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Incident not found with id " + id));
        incident.setStatus("REMEDIATED");
        return incidentRepository.save(incident);
    }

    private double confidenceFor(String code) {
        return code != null && (code.contains("POOL") || code.contains("REDIS")) ? 98.4 : 96.8;
    }

    private double riskPerMinute(String severity, Double volume) {
        double multiplier = "CRITICAL".equals(severity) ? 0.08 : 0.03;
        return Math.round((volume == null ? 10000 : volume) * multiplier * 100) / 100.0;
    }

    private String rootCauseFor(String code) {
        if (code == null) return "Anomaly pattern requires operator review";
        if (code.contains("POOL")) return "Database connection pool saturation is blocking payment workflows";
        if (code.contains("JWT")) return "Token verification queue growth is delaying authenticated requests";
        if (code.contains("REDIS")) return "Primary cache failover is increasing session lookup latency";
        if (code.contains("HEAP")) return "Heap pressure is reducing service throughput and recovery margin";
        return "Payment gateway latency trend indicates a pre-incident degradation pattern";
    }

    private String remediationFor(String code) {
        if (code != null && code.contains("POOL")) return "Increase pool capacity and route new traffic to healthy replicas";
        if (code != null && code.contains("REDIS")) return "Trip the circuit breaker and reroute cache reads to the replica";
        if (code != null && code.contains("HEAP")) return "Scale the service and trigger a controlled heap recovery";
        return "Apply adaptive traffic shaping and scale the affected service";
    }
}