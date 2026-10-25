package com.rodrigodvillar.portfolio.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

@Component
public class ClientIpResolver {

    // Render: [cliente, edge de Cloudflare, proxy interno]. La IP real es la 3.ª desde la derecha.
    private static final int TRUSTED_HOPS = 3;

    public String resolve(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff == null || xff.isBlank()) {
            return request.getRemoteAddr();
        }
        String[] ips = xff.split(",");
        if (ips.length < TRUSTED_HOPS) {
            return request.getRemoteAddr();
        }
        String candidate = ips[ips.length - TRUSTED_HOPS].trim();
        return looksLikeIp(candidate) ? candidate : request.getRemoteAddr();
    }

    private static boolean looksLikeIp(String value) {
        return value.matches("[0-9a-fA-F:.]{2,45}") && (value.contains(".") || value.contains(":"));
    }
}
