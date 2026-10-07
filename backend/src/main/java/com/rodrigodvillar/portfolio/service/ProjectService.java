package com.rodrigodvillar.portfolio.service;

import com.rodrigodvillar.portfolio.dto.ProjectResponse;
import com.rodrigodvillar.portfolio.exception.ResourceNotFoundException;
import com.rodrigodvillar.portfolio.mapper.ProjectMapper;
import com.rodrigodvillar.portfolio.repository.ProjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMapper projectMapper;

    public ProjectService(ProjectRepository projectRepository, ProjectMapper projectMapper) {
        this.projectRepository = projectRepository;
        this.projectMapper = projectMapper;
    }

    public List<ProjectResponse> getPublishedProjects() {
        return projectRepository.findByPublishedTrueOrderByDisplayOrderAsc()
                .stream()
                .map(projectMapper::toResponse)
                .toList();
    }

    public ProjectResponse getProjectBySlug(String slug) {
        return projectRepository.findBySlugAndPublishedTrue(slug)
                .map(projectMapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Project with slug '" + slug + "' not found"));
    }
}
