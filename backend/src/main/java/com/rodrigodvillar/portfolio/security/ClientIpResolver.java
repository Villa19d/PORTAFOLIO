package com.rodrigodvillar.portfolio.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

import java.net.InetAddress;
import java.net.UnknownHostException;

@Component
public class ClientIpResolver {
    /**
     * Render appends internal load balancer addresses to X-Forwarded-For.
     * The first public address found from right to left is the client address.
     * All other forwarding headers are intentionally ignored.
     */
    public String resolve(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            String[] values = xForwardedFor.split(",");
            for (int index = values.length - 1; index >= 0; index--) {
                String candidate = values[index].trim();
                if (isPublicIp(candidate)) {
                    return candidate;
                }
            }
        }

        String remoteAddr = request.getRemoteAddr();
        return remoteAddr != null ? remoteAddr : "unknown";
    }

    private boolean isPublicIp(String value) {
        if (!value.matches("^[0-9a-fA-F:.]+$")) {
            return false;
        }

        try {
            InetAddress address = InetAddress.getByName(value);
            return !address.isAnyLocalAddress()
                    && !address.isLoopbackAddress()
                    && !address.isLinkLocalAddress()
                    && !address.isSiteLocalAddress()
                    && !isPrivateIpv4(value);
        } catch (UnknownHostException exception) {
            return false;
        }
    }

    private boolean isPrivateIpv4(String value) {
        String[] octets = value.split("\\.");
        if (octets.length != 4) {
            return false;
        }

        try {
            int first = Integer.parseInt(octets[0]);
            int second = Integer.parseInt(octets[1]);
            return first == 10
                    || first == 127
                    || (first == 172 && second >= 16 && second <= 31)
                    || (first == 192 && second == 168);
        } catch (NumberFormatException exception) {
            return false;
        }
    }
}
