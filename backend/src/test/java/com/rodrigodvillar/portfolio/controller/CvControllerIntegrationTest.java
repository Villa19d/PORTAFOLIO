package com.rodrigodvillar.portfolio.controller;

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

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class CvControllerIntegrationTest {

    private static final String CV_URL =
            "https://res.cloudinary.com/demo/raw/upload/v1712345678/portfolio/cv/cv-es.pdf";

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void cleanCvDocuments() {
        jdbcTemplate.update("DELETE FROM cv_documents");
    }

    @Test
    void get_withoutDocuments_shouldReturnEmptySlots() throws Exception {
        mockMvc.perform(get("/api/cv"))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "max-age=60, public"))
                .andExpect(jsonPath("$.es").value(nullValue()))
                .andExpect(jsonPath("$.en").value(nullValue()));
    }

    @Test
    void get_withStoredDocument_shouldReturnIt() throws Exception {
        jdbcTemplate.update(
                """
                INSERT INTO cv_documents (lang, url, file_name, updated_at)
                VALUES (?, ?, ?, ?::timestamptz)
                """,
                "es",
                CV_URL,
                "cv-es.pdf",
                "2026-10-24T12:00:00Z"
        );

        mockMvc.perform(get("/api/cv"))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "max-age=60, public"))
                .andExpect(jsonPath("$.es.url", is(CV_URL)))
                .andExpect(jsonPath("$.es.fileName", is("cv-es.pdf")))
                .andExpect(jsonPath("$.es.updatedAt").exists())
                .andExpect(jsonPath("$.en").value(nullValue()));
    }
}
