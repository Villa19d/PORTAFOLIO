package com.rodrigodvillar.portfolio.service;

import com.rodrigodvillar.portfolio.config.ContactProperties;
import com.rodrigodvillar.portfolio.repository.ContactMessageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

@Component
public class ContactRetentionJob {

    private static final Logger log = LoggerFactory.getLogger(ContactRetentionJob.class);

    private final ContactMessageRepository repository;
    private final ContactProperties properties;

    public ContactRetentionJob(
            ContactMessageRepository repository,
            ContactProperties properties
    ) {
        this.repository = repository;
        this.properties = properties;
    }

    @Scheduled(cron = "0 0 0 * * ?")
    public void deleteExpiredMessages() {
        OffsetDateTime cutoff = OffsetDateTime.now(ZoneOffset.UTC)
                .minusDays(properties.retentionDays());
        int deletedRows = repository.deleteByCreatedAtBefore(cutoff);
        log.info("Deleted {} old contact messages", deletedRows);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void deleteExpiredMessagesOnStartup() {
        deleteExpiredMessages();
    }
}
