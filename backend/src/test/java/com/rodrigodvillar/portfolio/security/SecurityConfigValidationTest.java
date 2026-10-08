package com.rodrigodvillar.portfolio.security;

import com.rodrigodvillar.portfolio.config.SecurityProperties;
import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Configuration;

import static org.assertj.core.api.Assertions.assertThat;

class SecurityConfigValidationTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withUserConfiguration(TestConfig.class);

    @Configuration
    @EnableConfigurationProperties(SecurityProperties.class)
    static class TestConfig {}

    @Test
    void shouldFailWhenJwtSecretIsTooShort() {
        contextRunner
                .withPropertyValues(
                        "portfolio.security.jwt-secret=short",
                        "portfolio.security.admin-username=admin",
                        "portfolio.security.admin-password-hash=hash"
                )
                .run(context -> {
                    assertThat(context).hasFailed();
                    assertThat(context.getStartupFailure())
                            .hasRootCauseInstanceOf(org.springframework.boot.context.properties.bind.validation.BindValidationException.class);
                });
    }

    @Test
    void shouldPassWhenConfigurationIsValid() {
        contextRunner
                .withPropertyValues(
                        "portfolio.security.jwt-secret=12345678901234567890123456789012",
                        "portfolio.security.admin-username=admin",
                        "portfolio.security.admin-password-hash=hash"
                )
                .run(context -> assertThat(context).hasNotFailed());
    }
}

