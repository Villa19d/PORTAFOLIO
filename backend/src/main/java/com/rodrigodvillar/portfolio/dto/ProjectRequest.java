package com.rodrigodvillar.portfolio.dto;

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
        Integer displayOrder
) {
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
