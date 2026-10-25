package com.rodrigodvillar.portfolio.controller;

import com.rodrigodvillar.portfolio.dto.ContactRequest;
import com.rodrigodvillar.portfolio.entity.ContactMessage;
import com.rodrigodvillar.portfolio.security.ClientIpResolver;
import com.rodrigodvillar.portfolio.service.ContactService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

@RestController
@RequestMapping("/api/contact")
public class ContactController {

    private final ContactService contactService;
    private final ClientIpResolver clientIpResolver;

    public ContactController(ContactService contactService, ClientIpResolver clientIpResolver) {
        this.contactService = contactService;
        this.clientIpResolver = clientIpResolver;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> submit(
            @Valid @RequestBody ContactRequest request,
            HttpServletRequest httpRequest
    ) {
        ContactMessage message = contactService.submit(request, clientIpResolver.resolve(httpRequest));
        return ResponseEntity.accepted().body(Map.of(
                "id", message.getId(),
                "status", message.getStatus()
        ));
    }
}
