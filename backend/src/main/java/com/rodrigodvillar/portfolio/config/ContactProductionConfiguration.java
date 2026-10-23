package com.rodrigodvillar.portfolio.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.context.annotation.Profile;

@Configuration(proxyBeanMethods = false)
@Profile("prod")
@Lazy(false)
public class ContactProductionConfiguration {

    public ContactProductionConfiguration(ContactProperties properties) {
        requireText(properties.resendApiKey(), "RESEND_API_KEY");
        requireText(properties.toEmail(), "CONTACT_TO_EMAIL");
        requireText(properties.from(), "CONTACT_FROM");
        requireText(properties.turnstileSecretKey(), "TURNSTILE_SECRET_KEY");
        if (properties.turnstileAllowedHostnames().isEmpty()
                || properties.turnstileAllowedHostnames().stream().anyMatch(hostname -> hostname == null || hostname.isBlank())) {
            throw new IllegalStateException("TURNSTILE_ALLOWED_HOSTNAMES debe contener al menos un hostname válido en prod");
        }
        if (properties.dailyCap() <= 0) {
            throw new IllegalStateException("CONTACT_DAILY_CAP debe ser mayor que cero en prod");
        }
        if (properties.mode() == ContactProperties.Mode.LOG) {
            throw new IllegalStateException("CONTACT_MODE=log no está permitido en prod");
        }
    }

    private static void requireText(String value, String variableName) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(variableName + " es obligatorio en prod");
        }
    }
}
