package com.rodrigodvillar.portfolio.service;

import com.rodrigodvillar.portfolio.dto.ProjectResponse;
import com.rodrigodvillar.portfolio.entity.Project;
import com.rodrigodvillar.portfolio.exception.ResourceNotFoundException;
import com.rodrigodvillar.portfolio.mapper.ProjectMapper;
import com.rodrigodvillar.portfolio.repository.ProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    private ProjectMapper projectMapper = new ProjectMapper();

    private ProjectService projectService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        projectService = new ProjectService(projectRepository, projectMapper);
    }

    @Test
    void getPublishedProjects_returnsMappedProjects() {
        Project p = new Project();
        p.setSlug("test");
        when(projectRepository.findByPublishedTrueOrderByDisplayOrderAsc()).thenReturn(List.of(p));

        List<ProjectResponse> result = projectService.getPublishedProjects();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).slug()).isEqualTo("test");
    }

    @Test
    void getProjectBySlug_existing_returnsMappedProject() {
        Project p = new Project();
        p.setSlug("test-slug");
        when(projectRepository.findBySlugAndPublishedTrue("test-slug")).thenReturn(Optional.of(p));

        ProjectResponse result = projectService.getProjectBySlug("test-slug");

        assertThat(result).isNotNull();
        assertThat(result.slug()).isEqualTo("test-slug");
    }

    @Test
    void getProjectBySlug_notFound_throwsException() {
        when(projectRepository.findBySlugAndPublishedTrue("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> projectService.getProjectBySlug("missing"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("missing");
    }
}
