package com.rodrigodvillar.portfolio.mapper;

import com.rodrigodvillar.portfolio.dto.ProjectResponse;
import com.rodrigodvillar.portfolio.entity.Project;
import org.springframework.stereotype.Component;

@Component
public class ProjectMapper {

    public ProjectResponse toResponse(Project project) {
        if (project == null) {
            return null;
        }

        return new ProjectResponse(
                project.getId(),
                project.getSlug(),
                new ProjectResponse.Translations(project.getTitleEs(), project.getTitleEn()),
                new ProjectResponse.Translations(project.getSummaryEs(), project.getSummaryEn()),
                new ProjectResponse.Translations(project.getDescriptionEs(), project.getDescriptionEn()),
                project.getTechStack(),
                project.getImageUrl(),
                project.getVideoUrl(),
                project.getRepoUrl(),
                project.getLiveUrl(),
                project.isFeatured(),
                project.isPublished(),
                project.getDisplayOrder(),
                project.getCreatedAt(),
                project.getUpdatedAt()
        );
    }

    public Project toEntity(com.rodrigodvillar.portfolio.dto.ProjectRequest request) {
        if (request == null) {
            return null;
        }
        Project project = new Project();
        updateEntityFromRequest(request, project);
        return project;
    }

    public void updateEntityFromRequest(com.rodrigodvillar.portfolio.dto.ProjectRequest request, Project project) {
        if (request == null || project == null) {
            return;
        }
        project.setSlug(request.slug());
        project.setTitleEs(request.title().es());
        project.setTitleEn(request.title().en());
        project.setSummaryEs(request.summary().es());
        project.setSummaryEn(request.summary().en());
        project.setDescriptionEs(request.description().es());
        project.setDescriptionEn(request.description().en());
        project.setTechStack(request.techStack());
        project.setImageUrl(request.imageUrl());
        project.setVideoUrl(request.videoUrl());
        project.setRepoUrl(request.repoUrl());
        project.setLiveUrl(request.liveUrl());
        project.setFeatured(request.featured());
        project.setPublished(request.published());
        project.setDisplayOrder(request.displayOrder());
    }
}
