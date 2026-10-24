package com.rodrigodvillar.portfolio.controller;

import com.rodrigodvillar.portfolio.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class AdminMessageControllerTest {

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
        registry.add("portfolio.security.cookie-secure", () -> "false");
        registry.add("portfolio.cloudinary.cloud-name", () -> "test-cloud");
        registry.add("portfolio.cloudinary.api-key", () -> "test-api-key");
        registry.add("portfolio.cloudinary.api-secret", () -> "test-cloudinary-secret");
        registry.add("portfolio.cloudinary.upload-preset", () -> "portfolio_signed");
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void cleanMessages() {
        jdbcTemplate.update("DELETE FROM contact_messages");
    }

    @Test
    void list_withoutToken_shouldReturn401() throws Exception {
        mockMvc.perform(get("/api/admin/messages"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void list_withRefreshToken_shouldReturn401() throws Exception {
        mockMvc.perform(get("/api/admin/messages")
                        .header("Authorization", "Bearer " + jwtService.generateRefreshToken("admin")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void list_shouldRejectSizeAbove50() throws Exception {
        mockMvc.perform(get("/api/admin/messages")
                        .param("size", "51")
                        .header("Authorization", accessToken()))
                .andExpect(status().isBadRequest());
    }

    @Test
    void list_shouldUseDescendingCreatedAtOrderAndPagination() throws Exception {
        insertMessage("Old message", "2026-10-24T10:00:00Z");
        insertMessage("Newest message", "2026-10-24T12:00:00Z");

        mockMvc.perform(get("/api/admin/messages")
                        .param("page", "0")
                        .param("size", "1")
                        .header("Authorization", accessToken()))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", containsString("no-store")))
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].message").value("Newest message"))
                .andExpect(jsonPath("$.size").value(1))
                .andExpect(jsonPath("$.number").value(0))
                .andExpect(jsonPath("$.totalElements").value(2));
    }

    @Test
    void delete_shouldReturn204ForExistingMessage() throws Exception {
        UUID id = insertMessage("Delete me", "2026-10-24T12:00:00Z");

        mockMvc.perform(delete("/api/admin/messages/{id}", id)
                        .header("Authorization", accessToken()))
                .andExpect(status().isNoContent());

        org.junit.jupiter.api.Assertions.assertEquals(
                0,
                jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM contact_messages WHERE id = ?",
                        Integer.class,
                        id
                )
        );
    }

    @Test
    void delete_shouldReturn404ForMissingMessage() throws Exception {
        mockMvc.perform(delete("/api/admin/messages/{id}", UUID.randomUUID())
                        .header("Authorization", accessToken()))
                .andExpect(status().isNotFound());
    }

    private String accessToken() {
        return "Bearer " + jwtService.generateAccessToken("admin");
    }

    private UUID insertMessage(String message, String createdAt) {
        UUID id = UUID.randomUUID();
        jdbcTemplate.update(
                """
                INSERT INTO contact_messages
                    (id, name, email, message, status, created_at, sent_at)
                VALUES (?, ?, ?, ?, ?, ?::timestamptz, ?::timestamptz)
                """,
                id,
                "Test sender",
                "sender@example.com",
                message,
                "SENT",
                createdAt,
                createdAt
        );
        return id;
    }
}
