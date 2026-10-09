package com.rodrigodvillar.portfolio.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rodrigodvillar.portfolio.dto.ProjectRequest;
import com.rodrigodvillar.portfolio.entity.Project;
import com.rodrigodvillar.portfolio.repository.ProjectRepository;
import com.rodrigodvillar.portfolio.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
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

import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.springframework.test.annotation.DirtiesContext;
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class AdminProjectIntegrationTest {

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
    private ProjectRepository projectRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    private String validToken;
    private Project existingProject;
    private Project unpublishedProject;

    @BeforeEach
    void setUp() {
        projectRepository.deleteAll();
        validToken = jwtService.generateAccessToken("admin");

        existingProject = new Project();
        existingProject.setSlug("test-project");
        existingProject.setTitleEs("Título ES");
        existingProject.setTitleEn("Title EN");
        existingProject.setSummaryEs("Resumen ES");
        existingProject.setSummaryEn("Summary EN");
        existingProject.setDescriptionEs("Descripción ES");
        existingProject.setDescriptionEn("Description EN");
        existingProject.setTechStack(List.of("Java", "Spring"));
        existingProject.setImageUrl("https://example.com/img.png");
        existingProject.setRepoUrl("https://github.com/test");
        existingProject.setPublished(true);
        existingProject.setFeatured(true);
        existingProject.setDisplayOrder(1);

        unpublishedProject = new Project();
        unpublishedProject.setSlug("unpublished-project");
        unpublishedProject.setTitleEs("Oculto ES");
        unpublishedProject.setTitleEn("Hidden EN");
        unpublishedProject.setSummaryEs("Resumen Oculto");
        unpublishedProject.setSummaryEn("Hidden Summary");
        unpublishedProject.setDescriptionEs("Desc oculta");
        unpublishedProject.setDescriptionEn("Hidden desc");
        unpublishedProject.setTechStack(List.of("Node"));
        unpublishedProject.setImageUrl("https://example.com/img2.png");
        unpublishedProject.setRepoUrl("https://github.com/test2");
        unpublishedProject.setPublished(false);
        unpublishedProject.setFeatured(false);
        unpublishedProject.setDisplayOrder(2);

        projectRepository.saveAll(List.of(existingProject, unpublishedProject));
    }

    @Test
    void getAll_withValidToken_returnsAllProjects() throws Exception {
        mockMvc.perform(get("/api/admin/projects")
                        .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].slug", is("test-project")))
                .andExpect(jsonPath("$[1].slug", is("unpublished-project")));
    }

    @Test
    void getById_withValidToken_returnsProject() throws Exception {
        mockMvc.perform(get("/api/admin/projects/" + existingProject.getId())
                        .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.slug", is("test-project")));
    }

    @Test
    void create_withValidRequest_returns201AndLocation() throws Exception {
        ProjectRequest request = new ProjectRequest(
                "new-slug",
                new ProjectRequest.Translations("Nuevo T", "New T"),
                new ProjectRequest.SummaryTranslations("Nuevo S", "New S"),
                new ProjectRequest.DescriptionTranslations("Nueva D", "New D"),
                List.of("Go"),
                "https://example.com/new.png",
                null,
                "https://github.com/new",
                null,
                true,
                false,
                3
        );

        mockMvc.perform(post("/api/admin/projects")
                        .header("Authorization", "Bearer " + validToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.slug", is("new-slug")));
    }

    @Test
    void create_duplicateSlug_returns409() throws Exception {
        ProjectRequest request = new ProjectRequest(
                "test-project", // existing
                new ProjectRequest.Translations("Nuevo T", "New T"),
                new ProjectRequest.SummaryTranslations("Nuevo S", "New S"),
                new ProjectRequest.DescriptionTranslations("Nueva D", "New D"),
                List.of("Go"),
                "https://example.com/new.png",
                null,
                "https://github.com/new",
                null,
                true,
                false,
                3
        );

        mockMvc.perform(post("/api/admin/projects")
                        .header("Authorization", "Bearer " + validToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status", is(409)))
                .andExpect(jsonPath("$.detail", containsString("test-project")));
    }

    @Test
    void update_existingProject_updatesAndReturns200() throws Exception {
        ProjectRequest request = new ProjectRequest(
                "test-project-updated",
                new ProjectRequest.Translations("U", "U"),
                new ProjectRequest.SummaryTranslations("U", "U"),
                new ProjectRequest.DescriptionTranslations("U", "U"),
                List.of("Java"),
                "https://example.com/u.png",
                null,
                "https://github.com/u",
                null,
                true,
                true,
                1
        );

        mockMvc.perform(put("/api/admin/projects/" + existingProject.getId())
                        .header("Authorization", "Bearer " + validToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.slug", is("test-project-updated")));
    }

    @Test
    void delete_existingProject_returns204() throws Exception {
        mockMvc.perform(delete("/api/admin/projects/" + existingProject.getId())
                        .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/admin/projects/" + existingProject.getId())
                        .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void anyEndpoint_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/admin/projects"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void create_invalidRequest_returns400() throws Exception {
        ProjectRequest request = new ProjectRequest(
                "invalid slug!!!", // invalid pattern
                new ProjectRequest.Translations("", ""), // empty
                new ProjectRequest.SummaryTranslations("S", "S"),
                new ProjectRequest.DescriptionTranslations("D", "D"),
                List.of(), // empty
                "not-a-url", // invalid URL
                null,
                null,
                null,
                null, // required null
                null, // required null
                -1 // negative
        );

        mockMvc.perform(post("/api/admin/projects")
                        .header("Authorization", "Bearer " + validToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
