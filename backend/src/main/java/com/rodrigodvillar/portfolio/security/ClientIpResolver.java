package com.rodrigodvillar.portfolio.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

@Component
public class ClientIpResolver {
    public String resolve(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff == null || xff.trim().isEmpty()) {
            return request.getRemoteAddr();
        }
        String[] ips = xff.split(",");
        int realIpIndex = Math.max(0, ips.length - 3);
        return ips[realIpIndex].trim();
    }
}
