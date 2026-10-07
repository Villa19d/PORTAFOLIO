package com.rodrigodvillar.portfolio.dto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record ProjectResponse(
        UUID id,
        String slug,
        Translations title,
        Translations summary,
        Translations description,
        List<String> techStack,
        String imageUrl,
        String videoUrl,
        String repoUrl,
        String liveUrl,
        boolean featured,
        boolean published,
        int displayOrder,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public record Translations(String es, String en) {}
}
