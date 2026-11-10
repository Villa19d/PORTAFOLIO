package com.rodrigodvillar.portfolio.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rodrigodvillar.portfolio.dto.MediaItemDto;
import com.rodrigodvillar.portfolio.dto.ProjectRequest;
import com.rodrigodvillar.portfolio.dto.RepoItemDto;
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
//MediaItemDto, RepoItemDto y MediaType
import static com.rodrigodvillar.portfolio.entity.MediaType.YOUTUBE;
import static com.rodrigodvillar.portfolio.entity.MediaType.IMAGE;
import com.rodrigodvillar.portfolio.dto.MediaItemDto;
import com.rodrigodvillar.portfolio.dto.RepoItemDto;

@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class AdminProjectIntegrationTest {
        private ProjectRequest richRequest(String slug, List<MediaItemDto> media, List<RepoItemDto> repos) {
        return new ProjectRequest(
                slug,
                new ProjectRequest.Translations("T", "T"),
                new ProjectRequest.SummaryTranslations("S", "S"),
                new ProjectRequest.DescriptionTranslations("D", "D"),
                List.of("Java"), "https://example.com/cover.png", null,
                "https://github.com/legacy", null, true, true, 5, media, repos);
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

    @Test
    void create_withMediaAndRepos_roundTripsInOrder() throws Exception {
    ProjectRequest request = richRequest("rich",
                List.of(new MediaItemDto(com.rodrigodvillar.portfolio.entity.MediaType.YOUTUBE, "https://youtu.be/abc123_DEF"),
                        new MediaItemDto(com.rodrigodvillar.portfolio.entity.MediaType.IMAGE, "https://example.com/1.png")),
                List.of(new RepoItemDto("Frontend", "https://github.com/a/front"),
                        new RepoItemDto("Backend", "https://github.com/a/back")));

        mockMvc.perform(post("/api/admin/projects")
                        .header("Authorization", "Bearer " + validToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.media[0].type", is("YOUTUBE")))
                .andExpect(jsonPath("$.media[1].type", is("IMAGE")))
                .andExpect(jsonPath("$.repos[1].label", is("Backend")))
                .andExpect(jsonPath("$.repoUrl", is("https://github.com/a/front")));

        mockMvc.perform(get("/api/projects/rich"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.media", hasSize(2)))
                .andExpect(jsonPath("$.repos", hasSize(2)));
        }

        @Test
        void create_withInvalidYoutubeLink_returns400() throws Exception {
        ProjectRequest request = richRequest("bad-video",
                List.of(new MediaItemDto(com.rodrigodvillar.portfolio.entity.MediaType.YOUTUBE, "https://vimeo.com/123456789")), null);

        mockMvc.perform(post("/api/admin/projects")
                        .header("Authorization", "Bearer " + validToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
        }

        @Test
        void update_withoutMedia_keepsExistingMedia() throws Exception {
        mockMvc.perform(put("/api/admin/projects/" + existingProject.getId())
                        .header("Authorization", "Bearer " + validToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(richRequest("test-project",
                                List.of(new MediaItemDto(com.rodrigodvillar.portfolio.entity.MediaType.IMAGE, "https://example.com/1.png")), null))))
                .andExpect(status().isOk());

        // legacy client: no media/repos fields at all
        mockMvc.perform(put("/api/admin/projects/" + existingProject.getId())
                        .header("Authorization", "Bearer " + validToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(richRequest("test-project", null, null))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.media", hasSize(1)));
        }
}
