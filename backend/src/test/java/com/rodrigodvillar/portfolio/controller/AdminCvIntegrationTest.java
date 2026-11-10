package com.rodrigodvillar.portfolio.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rodrigodvillar.portfolio.dto.CvUpsertRequest;
import com.rodrigodvillar.portfolio.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class AdminCvIntegrationTest {

    private static final String CV_URL =
            "https://res.cloudinary.com/demo/raw/upload/v1712345678/portfolio/cv/cv-es.pdf";

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
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void cleanCvDocuments() {
        jdbcTemplate.update("DELETE FROM cv_documents");
    }

    @Test
    void put_withoutToken_shouldReturn401() throws Exception {
        mockMvc.perform(put("/api/admin/cv/es")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(CV_URL, "cv-es.pdf")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void put_withValidPayload_shouldReturn200() throws Exception {
        mockMvc.perform(put("/api/admin/cv/es")
                        .header("Authorization", accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(CV_URL, "cv-es.pdf")))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", containsString("no-store")))
                .andExpect(jsonPath("$.url", is(CV_URL)))
                .andExpect(jsonPath("$.fileName", is("cv-es.pdf")))
                .andExpect(jsonPath("$.updatedAt").exists());
    }

    @Test
    void put_withHttpUrl_shouldReturn400() throws Exception {
        expectBadRequest("es", "http://res.cloudinary.com/demo/raw/upload/v1/cv.pdf", "cv.pdf");
    }

    @Test
    void put_withForeignHost_shouldReturn400() throws Exception {
        expectBadRequest("es", "https://example.com/demo/raw/upload/v1/cv.pdf", "cv.pdf");
    }

    @Test
    void put_withUrlWithoutRawUploadSegment_shouldReturn400() throws Exception {
        expectBadRequest("es", "https://res.cloudinary.com/demo/image/upload/v1/cv.pdf", "cv.pdf");
    }

    @Test
    void put_withUrlWithoutPdfExtension_shouldReturn400() throws Exception {
        expectBadRequest("es", "https://res.cloudinary.com/demo/raw/upload/v1/cv.docx", "cv.docx");
    }

    @Test
    void put_withInvalidLang_shouldReturn400() throws Exception {
        expectBadRequest("fr", CV_URL, "cv-es.pdf");
    }

    @Test
    void delete_shouldReturn204AndBeIdempotent() throws Exception {
        mockMvc.perform(put("/api/admin/cv/en")
                        .header("Authorization", accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(CV_URL, "cv-en.pdf")))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/admin/cv/en")
                        .header("Authorization", accessToken()))
                .andExpect(status().isNoContent());

        mockMvc.perform(delete("/api/admin/cv/en")
                        .header("Authorization", accessToken()))
                .andExpect(status().isNoContent());
    }

    private void expectBadRequest(String lang, String url, String fileName) throws Exception {
        mockMvc.perform(put("/api/admin/cv/{lang}", lang)
                        .header("Authorization", accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(url, fileName)))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));
    }

    private String accessToken() {
        return "Bearer " + jwtService.generateAccessToken("admin");
    }

    private String body(String url, String fileName) throws Exception {
        return objectMapper.writeValueAsString(new CvUpsertRequest(url, fileName));
    }
}
