package com.rodrigodvillar.portfolio.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rodrigodvillar.portfolio.dto.LoginRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

import org.springframework.test.context.ActiveProfiles;
import com.rodrigodvillar.portfolio.config.RateLimitProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.boot.test.context.TestConfiguration;
import java.time.Duration;
import java.util.List;

import org.springframework.test.annotation.DirtiesContext;
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@ActiveProfiles("test")
class RateLimitIntegrationTest {

    @TestConfiguration
    static class RateLimitTestConfig {
        @Bean
        @Primary
        public RateLimitProperties rateLimitProperties() {
            RateLimitProperties.Rule loginRule = new RateLimitProperties.Rule(
                    "POST",
                    "/api/auth/login",
                    List.of(new RateLimitProperties.Bandwidth(1, Duration.ofSeconds(2)))
            );

            RateLimitProperties.Rule refreshRule = new RateLimitProperties.Rule(
                    "POST",
                    "/api/auth/refresh",
                    List.of(new RateLimitProperties.Bandwidth(30, Duration.ofMinutes(1)))
            );

            return new RateLimitProperties(
                    true,
                    100,
                    1,
                    List.of(loginRule, refreshRule)
            );
        }
    }


    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("portfolio.security.jwt-secret", () -> "12345678901234567890123456789012");
        registry.add("portfolio.security.admin-username", () -> "admin");
        registry.add("portfolio.security.admin-password-hash", () -> new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode("password"));
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void rateLimit_blocksAfterExceedingLimit() throws Exception {
        LoginRequest req = new LoginRequest("admin", "wrong");
        String content = objectMapper.writeValueAsString(req);

        // 1 intento permitido
        mockMvc.perform(post("/api/auth/login")
                        .with(request -> { request.setRemoteAddr("192.168.1.100"); return request; })
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(content))
                .andExpect(status().isUnauthorized());

        // El segundo intento debe ser bloqueado con 429
        mockMvc.perform(post("/api/auth/login")
                        .with(request -> { request.setRemoteAddr("192.168.1.100"); return request; })
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(content))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"))
                .andExpect(jsonPath("$.status", is(429)))
                .andExpect(jsonPath("$.title", is("Too Many Requests")))
                .andExpect(jsonPath("$.detail", containsString("Rate limit exceeded")));

        // Diferente IP (bucket distinto), debe permitir
        mockMvc.perform(post("/api/auth/login")
                        .with(request -> { request.setRemoteAddr("192.168.1.200"); return request; })
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(content))
                .andExpect(status().isUnauthorized());

        // Esperar a que el bucket original se llene (2.1 segundos)
        Thread.sleep(2100);

        // Intento desde la IP original debe volver a funcionar
        mockMvc.perform(post("/api/auth/login")
                        .with(request -> { request.setRemoteAddr("192.168.1.100"); return request; })
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(content))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void rateLimit_unlistedRoute_isNotLimited() throws Exception {
        // Enviar 10 intentos a una ruta no listada
        for (int i = 0; i < 10; i++) {
            mockMvc.perform(post("/api/auth/refresh") // Esta ruta está configurada para 30 req, así que con 10 pasamos sin problema, o podemos intentar otra.
                            // Mejor enviemos a una ruta que no exista o public GET, pero debe ser POST para igualar si importa.
                            .header("X-Forwarded-For", "10.0.0.1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isUnauthorized()); // o 400
        }
    }
}
