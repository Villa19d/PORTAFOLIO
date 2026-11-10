package com.rodrigodvillar.portfolio.mapper;

import com.rodrigodvillar.portfolio.dto.MediaItemDto;
import com.rodrigodvillar.portfolio.dto.ProjectRequest;
import com.rodrigodvillar.portfolio.dto.ProjectResponse;
import com.rodrigodvillar.portfolio.dto.RepoItemDto;
import com.rodrigodvillar.portfolio.entity.MediaItem;
import com.rodrigodvillar.portfolio.entity.Project;
import com.rodrigodvillar.portfolio.entity.RepoItem;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

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
                project.getUpdatedAt(),
                project.getMedia().stream()
                        .map(item -> new MediaItemDto(item.type(), item.url()))
                        .toList(),
                resolveRepos(project)
        );
    }

    public Project toEntity(ProjectRequest request) {
        if (request == null) {
            return null;
        }
        Project project = new Project();
        updateEntityFromRequest(request, project);
        return project;
    }

    public void updateEntityFromRequest(ProjectRequest request, Project project) {
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
        project.setLiveUrl(request.liveUrl());
        project.setFeatured(request.featured());
        project.setPublished(request.published());
        project.setDisplayOrder(request.displayOrder());

        if (request.media() != null) {
            List<MediaItem> media = new ArrayList<>();
            for (MediaItemDto item : request.media()) {
                media.add(new MediaItem(item.type(), item.url().trim()));
            }
            project.setMedia(media);
        }

        String repoUrl = request.repoUrl();
        if (request.repos() != null) {
            List<RepoItem> repos = new ArrayList<>();
            for (RepoItemDto item : request.repos()) {
                String label = item.label() == null || item.label().isBlank() ? null : item.label().trim();
                repos.add(new RepoItem(label, item.url().trim()));
            }
            project.setRepos(repos);
            if (!repos.isEmpty()) {
                repoUrl = repos.get(0).url();
            }
        }
        project.setRepoUrl(repoUrl);
    }

    private List<RepoItemDto> resolveRepos(Project project) {
        if (!project.getRepos().isEmpty()) {
            return project.getRepos().stream()
                    .map(item -> new RepoItemDto(item.label(), item.url()))
                    .toList();
        }
        String repoUrl = project.getRepoUrl();
        if (repoUrl != null && !repoUrl.isBlank()) {
            return List.of(new RepoItemDto(null, repoUrl));
        }
        return List.of();
    }
}