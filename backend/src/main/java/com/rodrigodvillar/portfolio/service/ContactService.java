package com.rodrigodvillar.portfolio.service;

import com.rodrigodvillar.portfolio.config.ContactProperties;
import com.rodrigodvillar.portfolio.dto.ContactRequest;
import com.rodrigodvillar.portfolio.entity.ContactMessage;
import com.rodrigodvillar.portfolio.exception.ContactDailyCapExceededException;
import com.rodrigodvillar.portfolio.repository.ContactMessageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Service
public class ContactService {

    private static final Logger log = LoggerFactory.getLogger(ContactService.class);
    private static final long DAILY_CAP_RETRY_AFTER_SECONDS = 3600;

    private final ContactMessageRepository repository;
    private final ContactProperties properties;
    private final TurnstileVerifier turnstileVerifier;
    private final ResendMailer resendMailer;

    public ContactService(
            ContactMessageRepository repository,
            ContactProperties properties,
            TurnstileVerifier turnstileVerifier,
            ResendMailer resendMailer
    ) {
        this.repository = repository;
        this.properties = properties;
        this.turnstileVerifier = turnstileVerifier;
        this.resendMailer = resendMailer;
    }

    public ContactMessage submit(ContactRequest request, String remoteIp) {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        long recentMessages = repository.countByCreatedAtGreaterThanEqual(now.minusHours(24));
        if (recentMessages >= properties.dailyCap()) {
            throw new ContactDailyCapExceededException(DAILY_CAP_RETRY_AFTER_SECONDS);
        }

        turnstileVerifier.verify(request.turnstileToken(), remoteIp);

        ContactMessage contactMessage = repository.saveAndFlush(
                new ContactMessage(request.name(), request.email(), request.message())
        );

        if (properties.mode() == ContactProperties.Mode.LOG) {
            log.info("Contact message {} processed with status SENT", contactMessage.getId());
            contactMessage.markSent(OffsetDateTime.now(ZoneOffset.UTC));
            return repository.save(contactMessage);
        }

        ResendMailer.MailResult result = resendMailer.send(
                contactMessage.getId(),
                contactMessage.getName(),
                contactMessage.getEmail(),
                contactMessage.getMessage()
        );
        if (result.status() == ResendMailer.Status.SENT) {
            contactMessage.markSent(OffsetDateTime.now(ZoneOffset.UTC));
            log.info("Contact message {} processed with status SENT", contactMessage.getId());
        } else {
            contactMessage.markFailed(result.failureReason());
            log.warn("Contact message {} processed with status FAILED and code {}", contactMessage.getId(), result.failureReason());
        }
        return repository.save(contactMessage);
    }
}
