package com.rodrigodvillar.portfolio.repository;

import com.rodrigodvillar.portfolio.entity.ContactMessage;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import java.time.OffsetDateTime;

public interface ContactMessageRepository extends JpaRepository<ContactMessage, UUID> {
    long countByCreatedAtGreaterThanEqual(OffsetDateTime since);

    @Modifying
    @Transactional
    @Query("delete from ContactMessage message where message.createdAt < :cutoff")
    int deleteByCreatedAtBefore(OffsetDateTime cutoff);
}
