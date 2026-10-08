package com.rodrigodvillar.portfolio.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import java.time.Duration;
import java.util.List;

@ConfigurationProperties(prefix = "portfolio.rate-limit")
public record RateLimitProperties(
        boolean enabled,
        long bucketCapacity,
        long bucketExpirationHours,
        List<Rule> rules
) {
    public record Rule(
            String method,
            String pathPattern,
            List<Bandwidth> bandwidths
    ) {}

    public record Bandwidth(
            long capacity,
            Duration duration
    ) {}
}
