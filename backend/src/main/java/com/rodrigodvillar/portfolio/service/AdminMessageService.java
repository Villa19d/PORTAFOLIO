package com.rodrigodvillar.portfolio.service;

import com.rodrigodvillar.portfolio.dto.AdminContactMessageResponse;
import com.rodrigodvillar.portfolio.entity.ContactMessage;
import com.rodrigodvillar.portfolio.exception.ResourceNotFoundException;
import com.rodrigodvillar.portfolio.repository.ContactMessageRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class AdminMessageService {

    private final ContactMessageRepository repository;

    public AdminMessageService(ContactMessageRepository repository) {
        this.repository = repository;
    }

    public Page<AdminContactMessageResponse> getMessages(Pageable pageable) {
        return repository.findAll(pageable).map(this::toResponse);
    }

    @Transactional
    public void deleteMessage(UUID id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Contact message with id '" + id + "' not found");
        }
        repository.deleteById(id);
    }

    private AdminContactMessageResponse toResponse(ContactMessage message) {
        return new AdminContactMessageResponse(
                message.getId(),
                message.getName(),
                message.getEmail(),
                message.getMessage(),
                message.getStatus(),
                message.getCreatedAt(),
                message.getSentAt()
        );
    }
}
