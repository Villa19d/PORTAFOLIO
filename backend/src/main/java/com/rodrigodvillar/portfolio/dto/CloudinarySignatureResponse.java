package com.rodrigodvillar.portfolio.dto;

public record CloudinarySignatureResponse(
        String cloudName,
        String apiKey,
        long timestamp,
        String folder,
        String uploadPreset,
        String signature
) {
}
