package com.rodrigodvillar.portfolio.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "portfolio.contact")
public record ContactProperties(
        String resendApiKey,
        String toEmail,
        String from,
        String turnstileSecretKey,
        List<String> turnstileAllowedHostnames,
        int dailyCap,
        Mode mode
) {
    public ContactProperties {
        if (turnstileAllowedHostnames == null) {
            turnstileAllowedHostnames = List.of();
        }
        if (mode == null) {
            mode = Mode.RESEND;
        }
    }

    public enum Mode {
        RESEND,
        LOG
    }
}
