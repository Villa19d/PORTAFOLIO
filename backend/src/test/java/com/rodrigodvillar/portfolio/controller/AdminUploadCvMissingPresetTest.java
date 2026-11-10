package com.rodrigodvillar.portfolio.controller;

import com.rodrigodvillar.portfolio.security.JwtService;
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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class AdminUploadCvMissingPresetTest {

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
        registry.add("portfolio.cloudinary.cv-upload-preset", () -> "");
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Test
    void signDocument_withoutCvPreset_shouldReturn503() throws Exception {
        mockMvc.perform(post("/api/admin/uploads/sign-document")
                        .header("Authorization", "Bearer " + jwtService.generateAccessToken("admin")))
                .andExpect(status().isServiceUnavailable())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));
    }
}
