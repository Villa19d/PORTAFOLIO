package com.rodrigodvillar.portfolio.mapper;

import com.rodrigodvillar.portfolio.dto.MediaItemDto;
import com.rodrigodvillar.portfolio.dto.ProjectRequest;
import com.rodrigodvillar.portfolio.dto.ProjectResponse;
import com.rodrigodvillar.portfolio.dto.RepoItemDto;
import com.rodrigodvillar.portfolio.entity.MediaItem;
import com.rodrigodvillar.portfolio.entity.Project;
import com.rodrigodvillar.portfolio.entity.RepoItem;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

//imports: ProjectRequest, MediaItemDto, RepoItemDto, MediaItem, MediaType, RepoItem:
import com.rodrigodvillar.portfolio.entity.MediaType;
import com.rodrigodvillar.portfolio.dto.MediaItemDto;
import com.rodrigodvillar.portfolio.dto.RepoItemDto;
import com.rodrigodvillar.portfolio.dto.ProjectRequest;
import com.rodrigodvillar.portfolio.entity.MediaItem;
import com.rodrigodvillar.portfolio.entity.RepoItem;
import com.rodrigodvillar.portfolio.entity.Project;

class ProjectMapperTest {

    private final ProjectMapper mapper = new ProjectMapper();
    private ProjectRequest request(List<MediaItemDto> media, List<RepoItemDto> repos) {
    return new ProjectRequest(
            "slug",
            new ProjectRequest.Translations("T", "T"),
            new ProjectRequest.SummaryTranslations("S", "S"),
            new ProjectRequest.DescriptionTranslations("D", "D"),
            List.of("Java"), "https://img.test/c.png", null,
            "https://github.com/legacy/repo", null, true, true, 1, media, repos);
}

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

    
    @Test
    void toResponse_fallsBackToRepoUrlWhenReposAreEmpty() {
        Project project = new Project();
        project.setRepoUrl("https://github.com/a/b");

        ProjectResponse response = mapper.toResponse(project);

        assertThat(response.media()).isEmpty();
        assertThat(response.repos()).containsExactly(new RepoItemDto(null, "https://github.com/a/b"));
    }

    @Test
    void update_withNullMediaAndRepos_leavesThemUntouched() {
        Project project = new Project();
        project.setMedia(List.of(new MediaItem(MediaType.IMAGE, "https://img.test/1.png")));
        project.setRepos(List.of(new RepoItem("Backend", "https://github.com/a/back")));

        mapper.updateEntityFromRequest(request(null, null), project);

        assertThat(project.getMedia()).hasSize(1);
        assertThat(project.getRepos()).hasSize(1);
    }

    @Test
    void update_withEmptyLists_clearsThem() {
        Project project = new Project();
        project.setMedia(List.of(new MediaItem(MediaType.IMAGE, "https://img.test/1.png")));

        mapper.updateEntityFromRequest(request(List.of(), List.of()), project);

        assertThat(project.getMedia()).isEmpty();
        assertThat(project.getRepos()).isEmpty();
        assertThat(project.getRepoUrl()).isEqualTo("https://github.com/legacy/repo");
    }

    @Test
    void update_preservesOrderAndDerivesRepoUrlFromFirstRepo() {
        Project project = new Project();

        mapper.updateEntityFromRequest(request(
                List.of(new MediaItemDto(MediaType.YOUTUBE, "https://youtu.be/abc123_DEF"),
                        new MediaItemDto(MediaType.IMAGE, "https://img.test/1.png")),
                List.of(new RepoItemDto(" Frontend ", "https://github.com/a/front"),
                        new RepoItemDto("  ", "https://github.com/a/back"))), project);

        assertThat(project.getMedia()).extracting(MediaItem::type)
                .containsExactly(MediaType.YOUTUBE, MediaType.IMAGE);
        assertThat(project.getRepos()).extracting(RepoItem::label).containsExactly("Frontend", null);
        assertThat(project.getRepoUrl()).isEqualTo("https://github.com/a/front");
    }

}
