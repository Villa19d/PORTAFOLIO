package com.rodrigodvillar.portfolio.dto;

import com.rodrigodvillar.portfolio.validation.ValidMedia;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;

public record ProjectRequest(
        @NotBlank
        @Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$")
        @Size(max = 80)
        String slug,

        @NotNull
        @Valid
        Translations title,

        @NotNull
        @Valid
        SummaryTranslations summary,

        @NotNull
        @Valid
        DescriptionTranslations description,

        @NotNull
        @Size(min = 1, max = 20)
        List<@NotBlank @Size(max = 40) String> techStack,

        @NotBlank
        @Pattern(regexp = "^https://.*")
        String imageUrl,

        @Pattern(regexp = "^https://.*")
        String videoUrl,

        @NotBlank
        @Pattern(regexp = "^https://.*")
        String repoUrl,

        @Pattern(regexp = "^https://.*")
        String liveUrl,

        @NotNull
        Boolean featured,

        @NotNull
        Boolean published,

        @NotNull
        @Min(0)
        Integer displayOrder,

        // null = leave untouched on update, [] = clear. Order is display order.
        @Size(max = 15)
        @ValidMedia
        List<@NotNull @Valid MediaItemDto> media,

        // null = leave untouched on update. When non-empty, repos[0] becomes repoUrl.
        @Size(max = 5)
        List<@NotNull @Valid RepoItemDto> repos
) {
    /** Backwards-compatible constructor for callers that predate media and repos. */
    public ProjectRequest(
            String slug,
            Translations title,
            SummaryTranslations summary,
            DescriptionTranslations description,
            List<String> techStack,
            String imageUrl,
            String videoUrl,
            String repoUrl,
            String liveUrl,
            Boolean featured,
            Boolean published,
            Integer displayOrder
    ) {
        this(slug, title, summary, description, techStack, imageUrl, videoUrl, repoUrl,
                liveUrl, featured, published, displayOrder, null, null);
    }

    public record Translations(
            @NotBlank
            @Size(max = 120)
            String es,

            @NotBlank
            @Size(max = 120)
            String en
    ) {}

    public record SummaryTranslations(
            @NotBlank
            @Size(max = 300)
            String es,

            @NotBlank
            @Size(max = 300)
            String en
    ) {}

    public record DescriptionTranslations(
            @NotBlank
            @Size(max = 20000)
            String es,

            @NotBlank
            @Size(max = 20000)
            String en
    ) {}
}