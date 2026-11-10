package com.rodrigodvillar.portfolio.dto;

import java.time.OffsetDateTime;

public record CvDocumentDto(
        String url,
        String fileName,
        OffsetDateTime updatedAt
) {
}
