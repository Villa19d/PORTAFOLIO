package com.rodrigodvillar.portfolio.config;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "portfolio.security")
public record SecurityProperties(
        @NotBlank(message = "JWT_SECRET es obligatorio")
        @Size(min = 32, message = "JWT_SECRET debe tener al menos 32 caracteres (256 bits) para HS256")
        String jwtSecret,

        String jwtIssuer,

        @NotBlank(message = "ADMIN_USERNAME es obligatorio")
        String adminUsername,

        @NotBlank(message = "ADMIN_PASSWORD_HASH es obligatorio")
        String adminPasswordHash,

        Boolean cookieSecure,
        String cookieDomain,
        Long accessTtlSeconds,
        Long refreshTtlSeconds
) {
    public SecurityProperties {
        if (jwtIssuer == null || jwtIssuer.isBlank()) jwtIssuer = "rodrigodvillar.com";
        if (cookieSecure == null) cookieSecure = true;
        if (accessTtlSeconds == null) accessTtlSeconds = 900L; // 15 min
        if (refreshTtlSeconds == null) refreshTtlSeconds = 604800L; // 7 days
    }
}
