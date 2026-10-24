package com.rodrigodvillar.portfolio.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.Min;
import java.util.List;

@ConfigurationProperties(prefix = "portfolio.contact")
@Validated
public record ContactProperties(
        String resendApiKey,
        String toEmail,
        String from,
        String turnstileSecretKey,
        List<String> turnstileAllowedHostnames,
        int dailyCap,
        Mode mode,
        @DefaultValue("30") @Min(1) int retentionDays
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
