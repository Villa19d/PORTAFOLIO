package com.rodrigodvillar.portfolio.service;

import com.rodrigodvillar.portfolio.config.ContactProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class ResendMailer {

    private static final Logger log = LoggerFactory.getLogger(ResendMailer.class);
    private static final Pattern CONTROL_CHARACTERS = Pattern.compile("[\\p{Cc}\\p{Cf}]");

    private final RestClient.Builder restClientBuilder;
    private final ContactProperties properties;

    public ResendMailer(
            @org.springframework.beans.factory.annotation.Qualifier("resendRestClientBuilder")
            RestClient.Builder restClientBuilder,
            ContactProperties properties
    ) {
        this.restClientBuilder = restClientBuilder;
        this.properties = properties;
    }

    public MailResult send(UUID messageId, String name, String email, String message) {
        String cleanName = cleanHeaderValue(name);
        String subject = "Nuevo mensaje de contacto de " + cleanName;
        ResendRequest request = new ResendRequest(
                properties.from(),
                List.of(properties.toEmail()),
                subject,
                message,
                email
        );

        try {
            Integer status = restClientBuilder.build().post()
                    .uri("/emails")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + properties.resendApiKey())
                    .header("Idempotency-Key", messageId.toString())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .exchange((ignored, response) -> response.getStatusCode().value());

            if (status == null || status < 200 || status >= 300) {
                String reason = "resend_" + (status == null ? "unknown" : status);
                log.warn("Resend request failed: {}", reason);
                return MailResult.failed(reason);
            }
            return MailResult.sent();
        } catch (Exception ex) {
            String reason = isTimeout(ex) ? "resend_timeout" : "resend_error";
            log.warn("Resend request failed: {}", reason);
            return MailResult.failed(reason);
        }
    }

    private static String cleanHeaderValue(String value) {
        return CONTROL_CHARACTERS.matcher(value == null ? "" : value)
                .replaceAll("")
                .replaceAll("[\\r\\n]+", " ")
                .trim();
    }

    private static boolean isTimeout(Exception exception) {
        Throwable current = exception;
        while (current != null) {
            if (current instanceof java.net.SocketTimeoutException
                    || current instanceof java.net.http.HttpTimeoutException) {
                return true;
            }
            current = current.getCause();
        }
        return false;
    }

    public record MailResult(Status status, String failureReason) {
        public static MailResult sent() {
            return new MailResult(Status.SENT, null);
        }

        public static MailResult failed(String reason) {
            return new MailResult(Status.FAILED, reason);
        }
    }

    public enum Status {
        SENT,
        FAILED
    }

    private record ResendRequest(
            String from,
            List<String> to,
            String subject,
            String text,
            @com.fasterxml.jackson.annotation.JsonProperty("reply_to") String replyTo
    ) {}
}
