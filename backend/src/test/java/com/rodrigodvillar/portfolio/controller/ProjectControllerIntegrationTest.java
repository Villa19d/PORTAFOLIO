package com.rodrigodvillar.portfolio.controller;

import com.rodrigodvillar.portfolio.entity.Project;
import com.rodrigodvillar.portfolio.repository.ProjectRepository;
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

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class ProjectControllerIntegrationTest {

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
    private ProjectRepository projectRepository;

    @BeforeEach
    void setUp() {
        projectRepository.deleteAll();

        Project p1 = new Project();
        p1.setSlug("publicado-1");
        p1.setTitleEs("T1"); p1.setTitleEn("T1 EN");
        p1.setSummaryEs("S1"); p1.setSummaryEn("S1 EN");
        p1.setDescriptionEs("D1"); p1.setDescriptionEn("D1 EN");
        p1.setTechStack(List.of("Java"));
        p1.setImageUrl("img1"); p1.setRepoUrl("repo1");
        p1.setPublished(true);
        p1.setDisplayOrder(2);

        Project p2 = new Project();
        p2.setSlug("publicado-2");
        p2.setTitleEs("T2"); p2.setTitleEn("T2 EN");
        p2.setSummaryEs("S2"); p2.setSummaryEn("S2 EN");
        p2.setDescriptionEs("D2"); p2.setDescriptionEn("D2 EN");
        p2.setTechStack(List.of("React"));
        p2.setImageUrl("img2"); p2.setRepoUrl("repo2");
        p2.setPublished(true);
        p2.setDisplayOrder(1);

        Project p3 = new Project();
        p3.setSlug("oculto");
        p3.setTitleEs("T3"); p3.setTitleEn("T3 EN");
        p3.setSummaryEs("S3"); p3.setSummaryEn("S3 EN");
        p3.setDescriptionEs("D3"); p3.setDescriptionEn("D3 EN");
        p3.setTechStack(List.of("Node"));
        p3.setImageUrl("img3"); p3.setRepoUrl("repo3");
        p3.setPublished(false);
        p3.setDisplayOrder(0);

        projectRepository.saveAll(List.of(p1, p2, p3));
    }

    @Test
    void getProjects_returnsOnlyPublishedInOrder() throws Exception {
        mockMvc.perform(get("/api/projects"))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "max-age=60, public"))
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].slug", is("publicado-2")))
                .andExpect(jsonPath("$[1].slug", is("publicado-1")));
    }

    @Test
    void getProjectBySlug_existingPublished_returnsProject() throws Exception {
        mockMvc.perform(get("/api/projects/publicado-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slug", is("publicado-1")))
                .andExpect(jsonPath("$.title.es", is("T1")));
    }

    @Test
    void getProjectBySlug_notPublished_returns404ProblemDetail() throws Exception {
        mockMvc.perform(get("/api/projects/oculto"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.title", is("Not Found")))
                .andExpect(jsonPath("$.detail", containsString("oculto")));
    }
}
