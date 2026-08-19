package com.enterprise.telemetry.kafka;

import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.clients.producer.RecordMetadata;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.ExecutionException;

@Service
public class KafkaTelemetryProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;

    @Autowired
    public KafkaTelemetryProducer(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void sendTelemetryMessage(String topic, String message) {
        try {
            ProducerRecord<String, String> record = new ProducerRecord<>(topic, message);
            RecordMetadata metadata = kafkaTemplate.send(record).get().getRecordMetadata();
            System.out.printf("Sent message to topic %s partition %d offset %d%n", 
                              metadata.topic(), metadata.partition(), metadata.offset());
        } catch (InterruptedException | ExecutionException e) {
            e.printStackTrace();
        }
    }
}