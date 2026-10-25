package com.rodrigodvillar.portfolio.controller;

import com.rodrigodvillar.portfolio.dto.ClientIpDiagnosticsResponse;
import com.rodrigodvillar.portfolio.security.ClientIpResolver;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/diagnostics")
@Tag(name = "Admin Diagnostics")
@SecurityRequirement(name = "bearerAuth")
public class AdminDiagnosticsController {

    private final ClientIpResolver clientIpResolver;

    public AdminDiagnosticsController(ClientIpResolver clientIpResolver) {
        this.clientIpResolver = clientIpResolver;
    }

    @GetMapping("/client-ip")
    @Operation(summary = "Inspect client IP resolution")
    public ResponseEntity<ClientIpDiagnosticsResponse> clientIp(HttpServletRequest request) {
        ClientIpDiagnosticsResponse response = new ClientIpDiagnosticsResponse(
                clientIpResolver.resolveIp(request),
                request.getRemoteAddr(),
                request.getHeader("X-Forwarded-For"),
                request.getHeader("X-Real-IP"),
                request.getHeader("CF-Connecting-IP"),
                request.getHeader("True-Client-IP"),
                request.getHeader("Forwarded")
        );

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(response);
    }
}
