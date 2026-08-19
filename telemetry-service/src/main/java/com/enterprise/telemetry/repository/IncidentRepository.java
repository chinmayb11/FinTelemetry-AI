package com.enterprise.telemetry.repository;

import com.enterprise.telemetry.entity.IncidentLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IncidentRepository extends JpaRepository<IncidentLog, Long> {
    // Additional query methods can be defined here if needed
}