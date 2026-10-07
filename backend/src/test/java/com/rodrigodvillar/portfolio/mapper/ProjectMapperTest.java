package com.rodrigodvillar.portfolio.mapper;

import com.rodrigodvillar.portfolio.dto.ProjectResponse;
import com.rodrigodvillar.portfolio.entity.Project;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class ProjectMapperTest {

    private final ProjectMapper mapper = new ProjectMapper();

    @Test
    void toResponse_mapsFieldsCorrectly() {
        Project project = new Project();
        project.setId(UUID.randomUUID());
        project.setSlug("test-slug");
        project.setTitleEs("Título ES");
        project.setTitleEn("Title EN");
        project.setSummaryEs("Resumen ES");
        project.setSummaryEn("Summary EN");
        project.setDescriptionEs("Desc ES");
        project.setDescriptionEn("Desc EN");
        project.setTechStack(List.of("Java", "Spring"));
        project.setImageUrl("http://image");
        project.setRepoUrl("http://repo");
        project.setFeatured(true);
        project.setPublished(true);
        project.setDisplayOrder(1);

        ProjectResponse response = mapper.toResponse(project);

        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo(project.getId());
        assertThat(response.slug()).isEqualTo("test-slug");
        assertThat(response.title().es()).isEqualTo("Título ES");
        assertThat(response.title().en()).isEqualTo("Title EN");
        assertThat(response.summary().es()).isEqualTo("Resumen ES");
        assertThat(response.summary().en()).isEqualTo("Summary EN");
        assertThat(response.description().es()).isEqualTo("Desc ES");
        assertThat(response.description().en()).isEqualTo("Desc EN");
        assertThat(response.techStack()).containsExactly("Java", "Spring");
        assertThat(response.imageUrl()).isEqualTo("http://image");
        assertThat(response.repoUrl()).isEqualTo("http://repo");
        assertThat(response.featured()).isTrue();
        assertThat(response.published()).isTrue();
        assertThat(response.displayOrder()).isEqualTo(1);
    }
}
