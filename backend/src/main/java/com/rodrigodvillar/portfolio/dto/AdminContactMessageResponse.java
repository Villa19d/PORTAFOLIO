package com.rodrigodvillar.portfolio.dto;

import com.rodrigodvillar.portfolio.entity.ContactMessage;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AdminContactMessageResponse(
        UUID id,
        String name,
        String email,
        String message,
        ContactMessage.Status status,
        OffsetDateTime createdAt,
        OffsetDateTime sentAt
) {
}
