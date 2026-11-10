package com.rodrigodvillar.portfolio.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RepoItemDto(
        @Size(max = 30)
        String label,

        @NotBlank
        @Size(max = 500)
        @Pattern(regexp = "^https://.*")
        String url
) {}