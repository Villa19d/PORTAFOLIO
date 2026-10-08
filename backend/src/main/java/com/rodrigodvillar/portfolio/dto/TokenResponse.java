package com.rodrigodvillar.portfolio.dto;

public record TokenResponse(
    String accessToken,
    long expiresIn
) {}
