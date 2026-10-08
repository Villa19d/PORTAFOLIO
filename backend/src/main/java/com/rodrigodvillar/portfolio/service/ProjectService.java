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

    public List<ProjectResponse> getAllAdmin() {
        return projectRepository.findAllByOrderByDisplayOrderAsc()
                .stream()
                .map(projectMapper::toResponse)
                .toList();
    }

    public ProjectResponse getByIdAdmin(java.util.UUID id) {
        return projectRepository.findById(id)
                .map(projectMapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Project with id '" + id + "' not found"));
    }

    @Transactional
    public ProjectResponse create(com.rodrigodvillar.portfolio.dto.ProjectRequest request) {
        try {
            com.rodrigodvillar.portfolio.entity.Project project = projectMapper.toEntity(request);
            project = projectRepository.saveAndFlush(project);
            return projectMapper.toResponse(project);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            throw new com.rodrigodvillar.portfolio.exception.DuplicateResourceException("Project with slug '" + request.slug() + "' already exists");
        }
    }

    @Transactional
    public ProjectResponse update(java.util.UUID id, com.rodrigodvillar.portfolio.dto.ProjectRequest request) {
        com.rodrigodvillar.portfolio.entity.Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project with id '" + id + "' not found"));
        
        projectMapper.updateEntityFromRequest(request, project);
        try {
            project = projectRepository.saveAndFlush(project);
            return projectMapper.toResponse(project);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            throw new com.rodrigodvillar.portfolio.exception.DuplicateResourceException("Project with slug '" + request.slug() + "' already exists");
        }
    }

    @Transactional
    public void delete(java.util.UUID id) {
        if (!projectRepository.existsById(id)) {
            throw new ResourceNotFoundException("Project with id '" + id + "' not found");
        }
        projectRepository.deleteById(id);
    }
}
