package com.rodrigodvillar.portfolio.controller;

import com.rodrigodvillar.portfolio.dto.AdminContactMessageResponse;
import com.rodrigodvillar.portfolio.service.AdminMessageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/messages")
@Tag(name = "Admin Messages", description = "Admin operations for contact messages")
@SecurityRequirement(name = "bearerAuth")
@Validated
public class AdminMessageController {

    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final int MAX_PAGE_SIZE = 50;

    private final AdminMessageService messageService;

    public AdminMessageController(AdminMessageService messageService) {
        this.messageService = messageService;
    }

    @GetMapping
    @Operation(
            summary = "List contact messages",
            description = "Returns the newest contact messages first. The sender IP is never included."
    )
    @ApiResponse(
            responseCode = "200",
            description = "Contact messages retrieved",
            content = @Content(
                    mediaType = "application/json",
                    examples = @ExampleObject(
                            name = "messagesPage",
                            value = """
                                    {
                                      "content": [
                                        {
                                          "id": "123e4567-e89b-12d3-a456-426614174000",
                                          "name": "Juan Perez",
                                          "email": "juan@example.com",
                                          "message": "Hola, me interesa tu perfil.",
                                          "status": "SENT",
                                          "createdAt": "2026-10-24T18:00:00Z",
                                          "sentAt": "2026-10-24T18:00:02Z"
                                        }
                                      ],
                                      "pageable": {
                                        "pageNumber": 0,
                                        "pageSize": 20
                                      },
                                      "totalElements": 1,
                                      "totalPages": 1,
                                      "last": true
                                    }
                                    """
                    )
            )
    )
    @ApiResponse(responseCode = "400", description = "Page must be non-negative and size must be between 1 and 50")
    public ResponseEntity<Page<AdminContactMessageResponse>> getMessages(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "" + DEFAULT_PAGE_SIZE) @Min(1) @Max(MAX_PAGE_SIZE) int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(messageService.getMessages(pageable));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a contact message")
    @ApiResponse(responseCode = "204", description = "Contact message deleted")
    @ApiResponse(responseCode = "404", description = "Contact message not found")
    public ResponseEntity<Void> deleteMessage(@PathVariable UUID id) {
        messageService.deleteMessage(id);
        return ResponseEntity.noContent()
                .cacheControl(CacheControl.noStore())
                .build();
    }
}
