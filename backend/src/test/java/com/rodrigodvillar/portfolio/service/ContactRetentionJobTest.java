package com.rodrigodvillar.portfolio.service;

import com.rodrigodvillar.portfolio.config.ContactProperties;
import com.rodrigodvillar.portfolio.repository.ContactMessageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ContactRetentionJobTest {

    @Mock
    private ContactMessageRepository repository;

    private ContactRetentionJob job;

    @BeforeEach
    void setUp() {
        ContactProperties properties = new ContactProperties(
                "resend-key",
                "owner@example.com",
                "Portfolio <contact@example.com>",
                "turnstile-secret",
                List.of("localhost"),
                40,
                ContactProperties.Mode.RESEND,
                30
        );
        job = new ContactRetentionJob(repository, properties);
    }

    @Test
    void deletesMessagesOlderThanConfiguredRetention() {
        when(repository.deleteByCreatedAtBefore(any())).thenReturn(3);
        OffsetDateTime before = OffsetDateTime.now(ZoneOffset.UTC).minusDays(30);

        job.deleteExpiredMessages();

        var cutoff = org.mockito.ArgumentCaptor.forClass(OffsetDateTime.class);
        verify(repository).deleteByCreatedAtBefore(cutoff.capture());
        assertThat(cutoff.getValue()).isBetween(
                before.minusSeconds(2),
                before.plusSeconds(2)
        );
    }

    @Test
    void runsRetentionWhenApplicationIsReady() {
        when(repository.deleteByCreatedAtBefore(any())).thenReturn(0);

        job.deleteExpiredMessagesOnStartup();

        verify(repository).deleteByCreatedAtBefore(any());
    }
}
