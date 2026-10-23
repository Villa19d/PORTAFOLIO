package com.rodrigodvillar.portfolio.repository;

import com.rodrigodvillar.portfolio.entity.ContactMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;
import java.time.OffsetDateTime;

public interface ContactMessageRepository extends JpaRepository<ContactMessage, UUID> {
    long countByCreatedAtGreaterThanEqual(OffsetDateTime since);
}
