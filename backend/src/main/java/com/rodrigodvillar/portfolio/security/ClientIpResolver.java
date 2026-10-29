package com.rodrigodvillar.portfolio.security;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.net.Inet6Address;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.regex.Pattern;

@Component
public class ClientIpResolver {
    private static final Logger log = LoggerFactory.getLogger(ClientIpResolver.class);
    private static final int TRUSTED_HOPS = 3; // Render: [cliente, edge Cloudflare, proxy interno]
    private static final Pattern IPV4 = Pattern.compile(
        "^(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}$");
    private static final Pattern IPV6 = Pattern.compile("^[0-9a-fA-F:]{2,39}$");

    public String resolve(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff == null || xff.isBlank()) return request.getRemoteAddr();
        String[] hops = xff.split(",");
        if (hops.length < TRUSTED_HOPS) return fallback(request, "cadena corta");
        String key = normalize(hops[hops.length - TRUSTED_HOPS].trim());
        return key != null ? key : fallback(request, "IP invalida");
    }

    private String fallback(HttpServletRequest request, String reason) {
        log.warn("X-Forwarded-For con forma inesperada ({}); se usa remoteAddr", reason);
        return request.getRemoteAddr();
    }

    private static String normalize(String v) {
        if (IPV4.matcher(v).matches()) return v;
        if (v.indexOf(':') >= 0 && IPV6.matcher(v).matches()) {
            try {
                InetAddress a = InetAddress.getByName(v);
                if (a instanceof Inet6Address) {
                    byte[] b = a.getAddress();
                    return String.format("%02x%02x:%02x%02x:%02x%02x:%02x%02x::/64",
                        b[0], b[1], b[2], b[3], b[4], b[5], b[6], b[7]);
                }
                return a.getHostAddress();
            } catch (UnknownHostException e) { return null; }
        }
        return null;
    }
}
