package com.rodrigodvillar.portfolio.validation;

import com.rodrigodvillar.portfolio.dto.MediaItemDto;
import com.rodrigodvillar.portfolio.dto.ProjectRequest;
import com.rodrigodvillar.portfolio.dto.RepoItemDto;
import com.rodrigodvillar.portfolio.entity.MediaType;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ValidMediaValidatorTest {

    private static final Validator VALIDATOR = Validation.buildDefaultValidatorFactory().getValidator();
    private static final MediaItemDto IMAGE = new MediaItemDto(MediaType.IMAGE, "https://img.test/a.png");

    private static MediaItemDto youtube(String url) {
        return new MediaItemDto(MediaType.YOUTUBE, url);
    }

    private static ProjectRequest requestWith(List<MediaItemDto> media, List<RepoItemDto> repos) {
        return new ProjectRequest(
                "slug",
                new ProjectRequest.Translations("T", "T"),
                new ProjectRequest.SummaryTranslations("S", "S"),
                new ProjectRequest.DescriptionTranslations("D", "D"),
                List.of("Java"),
                "https://img.test/cover.png",
                null,
                "https://github.com/a/b",
                null,
                true,
                true,
                0,
                media,
                repos);
    }

    private static boolean valid(List<MediaItemDto> media) {
        return VALIDATOR.validate(requestWith(media, null)).isEmpty();
    }

    @Test
    void acceptsNullAndEmptyMedia() {
        assertThat(valid(null)).isTrue();
        assertThat(valid(List.of())).isTrue();
    }

    @Test
    void acceptsSupportedYoutubeLinkShapes() {
        assertThat(valid(List.of(
                youtube("https://www.youtube.com/watch?v=abc123_DEF"),
                youtube("https://youtu.be/abc123_DEF"),
                youtube("https://www.youtube.com/shorts/abc123_DEF"),
                youtube("https://www.youtube-nocookie.com/embed/abc123_DEF")))).isTrue();
    }

    @Test
    void rejectsInvalidYoutubeLinks() {
        assertThat(valid(List.of(youtube("https://vimeo.com/123456789")))).isFalse();
        assertThat(valid(List.of(youtube("https://www.youtube.com/watch")))).isFalse();
        assertThat(valid(List.of(youtube("https://www.youtube.com/watch?v=x")))).isFalse();
        assertThat(valid(List.of(youtube("http://www.youtube.com/watch?v=abc123_DEF")))).isFalse();
        assertThat(valid(List.of(youtube("https://evil.com/?u=youtube.com/watch?v=abc123_DEF")))).isFalse();
    }

    @Test
    void enforcesImageAndVideoLimits() {
        List<MediaItemDto> tenImages = Collections.nCopies(10, IMAGE);
        List<MediaItemDto> elevenImages = Collections.nCopies(11, IMAGE);
        List<MediaItemDto> fiveVideos = Collections.nCopies(5, youtube("https://youtu.be/abc123_DEF"));
        List<MediaItemDto> sixVideos = Collections.nCopies(6, youtube("https://youtu.be/abc123_DEF"));

        List<MediaItemDto> maxMixed = new ArrayList<>(tenImages);
        maxMixed.addAll(fiveVideos);

        assertThat(valid(maxMixed)).isTrue();
        assertThat(valid(elevenImages)).isFalse();
        assertThat(valid(sixVideos)).isFalse();
    }

    @Test
    void enforcesRepoLimitAndHttps() {
        RepoItemDto repo = new RepoItemDto("Frontend", "https://github.com/a/b");
        assertThat(VALIDATOR.validate(requestWith(null, Collections.nCopies(5, repo)))).isEmpty();
        assertThat(VALIDATOR.validate(requestWith(null, Collections.nCopies(6, repo)))).isNotEmpty();
        assertThat(VALIDATOR.validate(requestWith(null, List.of(new RepoItemDto("x", "http://insecure.test"))))).isNotEmpty();
        assertThat(VALIDATOR.validate(requestWith(null, List.of(new RepoItemDto("x".repeat(31), "https://github.com/a/b"))))).isNotEmpty();
    }
}