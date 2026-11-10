package com.rodrigodvillar.portfolio.dto;

import com.rodrigodvillar.portfolio.entity.MediaType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record MediaItemDto(
        @NotNull
        MediaType type,

        @NotBlank
        @Size(max = 500)
        @Pattern(regexp = "^https://.*")
        String url
) {}