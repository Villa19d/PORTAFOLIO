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
}
