package com.rodrigodvillar.portfolio.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Set;

@Component
public class ClientIpResolver {
    private static final Set<String> TRUSTED_PROXY_PREFIXES = Set.of(
            "10.", "127.", "172.16.", "172.17.", "172.18.", "172.19.",
            "172.20.", "172.21.", "172.22.", "172.23.", "172.24.",
            "172.25.", "172.26.", "172.27.", "172.28.", "172.29.",
            "172.30.", "172.31.", "192.168.", "0:0:0:0:0:0:0:1", "::1"
    );

    /**
     * Render appends the client address to the right side of X-Forwarded-For.
     * X-Forwarded-For is accepted only when the original TCP peer is a trusted
     * proxy. All other forwarding headers are intentionally ignored.
     */
    public String resolveIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        String remoteAddr = request.getRemoteAddr();
        if (StringUtils.hasText(xForwardedFor) && isTrustedProxy(remoteAddr)) {
            String[] values = xForwardedFor.split(",");
            String candidate = values[values.length - 1].trim();
            if (isValidIp(candidate)) {
                return candidate;
            }
        }

        return remoteAddr != null ? remoteAddr : "unknown";
    }

    private boolean isTrustedProxy(String ip) {
        if (!StringUtils.hasText(ip)) {
            return false;
        }
        return TRUSTED_PROXY_PREFIXES.stream().anyMatch(ip::startsWith);
    }

    private boolean isValidIp(String ip) {
        if (!StringUtils.hasText(ip) || ip.equalsIgnoreCase("unknown")) {
            return false;
        }
        // Validar formato sintáctico básico (IPv4 o IPv6), descartando inyecciones o basura
        return ip.matches("^[0-9a-fA-F.:]+$") && !ip.contains(" ");
    }
}
