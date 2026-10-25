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
        if (ips.length < 3) {
            return request.getRemoteAddr();
        }
        return ips[ips.length - 3].trim();
    }
}
