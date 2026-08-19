package com.enterprise.telemetry.entity;

import java.time.LocalDateTime;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;
import javax.persistence.Column;
import com.fasterxml.jackson.annotation.JsonAlias;

@Entity
@Table(name = "incident_logs")
public class IncidentLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private LocalDateTime timestamp;
    private String description;
    @JsonAlias("service_name")
    private String serviceName;
    @JsonAlias("error_code")
    private String errorCode;
    @Column(length = 4000)
    @JsonAlias("stack_trace")
    private String stackTrace;
    private String severity;
    @JsonAlias("transaction_volume_at_risk")
    private Double transactionVolumeAtRisk;
    @JsonAlias("ai_confidence")
    private Double aiConfidence;
    @JsonAlias("financial_risk_per_minute")
    private Double financialRiskPerMinute;
    private String rootCause;
    private String remediation;
    private String status;

    public IncidentLog() {
    }

    public IncidentLog(Long id, LocalDateTime timestamp, String description) {
        this.id = id;
        this.timestamp = timestamp;
        this.description = description;
    }

    public String getServiceName() { return serviceName; }
    public void setServiceName(String serviceName) { this.serviceName = serviceName; }
    public String getErrorCode() { return errorCode; }
    public void setErrorCode(String errorCode) { this.errorCode = errorCode; }
    public String getStackTrace() { return stackTrace; }
    public void setStackTrace(String stackTrace) { this.stackTrace = stackTrace; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public Double getTransactionVolumeAtRisk() { return transactionVolumeAtRisk; }
    public void setTransactionVolumeAtRisk(Double transactionVolumeAtRisk) { this.transactionVolumeAtRisk = transactionVolumeAtRisk; }
    public Double getAiConfidence() { return aiConfidence; }
    public void setAiConfidence(Double aiConfidence) { this.aiConfidence = aiConfidence; }
    public Double getFinancialRiskPerMinute() { return financialRiskPerMinute; }
    public void setFinancialRiskPerMinute(Double financialRiskPerMinute) { this.financialRiskPerMinute = financialRiskPerMinute; }
    public String getRootCause() { return rootCause; }
    public void setRootCause(String rootCause) { this.rootCause = rootCause; }
    public String getRemediation() { return remediation; }
    public void setRemediation(String remediation) { this.remediation = remediation; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}