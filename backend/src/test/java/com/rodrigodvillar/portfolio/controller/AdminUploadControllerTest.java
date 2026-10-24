package com.rodrigodvillar.portfolio.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class AdminUploadControllerTest {

    private static final String API_SECRET = "test-cloudinary-secret";
    private static final String FOLDER = "portfolio/projects";
    private static final String UPLOAD_PRESET = "portfolio_signed";

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
        registry.add("portfolio.cloudinary.api-secret", () -> API_SECRET);
        registry.add("portfolio.cloudinary.upload-preset", () -> UPLOAD_PRESET);
        registry.add("portfolio.cloudinary.folder", () -> FOLDER);
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtService jwtService;

    @Test
    void sign_withoutToken_shouldReturn401() throws Exception {
        mockMvc.perform(post("/api/admin/uploads/sign"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void sign_withRefreshToken_shouldReturn401() throws Exception {
        mockMvc.perform(post("/api/admin/uploads/sign")
                        .header("Authorization", "Bearer " + jwtService.generateRefreshToken("admin")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void sign_withAccessToken_shouldReturnSignatureWithoutSecret() throws Exception {
        long timestamp = System.currentTimeMillis() / 1000;

        String responseBody = mockMvc.perform(post("/api/admin/uploads/sign")
                        .header("Authorization", "Bearer " + jwtService.generateAccessToken("admin")))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", containsString("no-store")))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.cloudName").value("test-cloud"))
                .andExpect(jsonPath("$.apiKey").value("test-api-key"))
                .andExpect(jsonPath("$.folder").value(FOLDER))
                .andExpect(jsonPath("$.uploadPreset").value(UPLOAD_PRESET))
                .andExpect(jsonPath("$.apiSecret").doesNotExist())
                .andExpect(content().string(not(containsString(API_SECRET))))
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode response = objectMapper.readTree(responseBody);
        long responseTimestamp = response.get("timestamp").asLong();
        String signatureInput = "folder=" + FOLDER
                + "&timestamp=" + responseTimestamp
                + "&upload_preset=" + UPLOAD_PRESET
                + API_SECRET;

        org.junit.jupiter.api.Assertions.assertTrue(Math.abs(responseTimestamp - timestamp) <= 2);
        org.junit.jupiter.api.Assertions.assertEquals(
                sha1Hex(signatureInput),
                response.get("signature").asText()
        );
    }

    private String sha1Hex(String value) throws Exception {
        byte[] digest = MessageDigest.getInstance("SHA-1")
                .digest(value.getBytes(StandardCharsets.UTF_8));
        StringBuilder hex = new StringBuilder(digest.length * 2);
        for (byte current : digest) {
            hex.append(String.format("%02x", current));
        }
        return hex.toString();
    }
}
