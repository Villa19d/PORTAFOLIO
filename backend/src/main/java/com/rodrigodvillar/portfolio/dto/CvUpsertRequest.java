package com.rodrigodvillar.portfolio.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CvUpsertRequest(
        @NotBlank
        @Size(max = 500)
        @Pattern(regexp = "^https://res\\.cloudinary\\.com/[^\\s?#]+/raw/upload/[^\\s?#]+\\.pdf$")
        String url,

        @NotBlank
        @Size(max = 120)
        @Pattern(regexp = "^[^\\p{Cntrl}]+$")
        String fileName
) {
}
