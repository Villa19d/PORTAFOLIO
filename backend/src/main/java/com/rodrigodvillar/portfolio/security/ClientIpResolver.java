package com.rodrigodvillar.portfolio.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Set;

@Component
public class ClientIpResolver {

    private static final List<String> TRUSTED_EDGE_HEADERS = List.of(
            "CF-Connecting-IP", // Inyectado por Cloudflare en Render (inmutable por el cliente)
            "True-Client-IP",   // CDN / Akamai / Cloudflare Enterprise
            "X-Real-IP"         // Nginx / Ingress de Render
    );

    // Subnets privadas estándar consideradas proxies internos (Docker / Kubernetes / Render)
    private static final Set<String> TRUSTED_PROXY_PREFIXES = Set.of(
            "10.", "127.", "172.16.", "172.17.", "172.18.", "172.19.", "172.20.",
            "172.21.", "172.22.", "172.23.", "172.24.", "172.25.", "172.26.",
            "172.27.", "172.28.", "172.29.", "172.30.", "172.31.", "192.168.",
            "0:0:0:0:0:0:0:1", "::1"
    );

    /**
     * Resuelve de forma segura y confiable la dirección IP real del cliente,
     * mitigando ataques de IP Spoofing a través de cabeceras de proxy manipuladas.
     *
     * Orden de resolución:
     * 1. Cabeceras de borde inmutables inyectadas por Cloudflare/Render
     *    (CF-Connecting-IP, True-Client-IP, X-Real-IP).
     * 2. Si sólo existe X-Forwarded-For:
     *    - Si la conexión TCP directa (remoteAddr) NO proviene de un proxy interno confiable,
     *      se descarta X-Forwarded-For (el cliente está intentando spoofing directo).
     *    - Si proviene de un proxy confiable y hay una cadena de IPs (ej: "spoofed, real_ip"),
     *      se extrae la última IP validada por el proxy.
     * 3. Fallback a request.getRemoteAddr().
     */
    public String resolveIp(HttpServletRequest request) {
        // 1. Cabeceras autoritativas inyectadas en el edge
        for (String header : TRUSTED_EDGE_HEADERS) {
            String val = request.getHeader(header);
            if (StringUtils.hasText(val)) {
                String ip = val.trim();
                if (isValidIp(ip)) {
                    return ip;
                }
            }
        }

        String remoteAddr = request.getRemoteAddr();
        String xff = request.getHeader("X-Forwarded-For");

        // 2. Validación de X-Forwarded-For
        if (StringUtils.hasText(xff)) {
            // Si el socket proviene de un proxy interno confiable, el proxy concatenó la IP real al final
            if (isTrustedProxy(remoteAddr)) {
                String[] parts = xff.split(",");
                String candidate = parts[parts.length - 1].trim();
                if (isValidIp(candidate) && !isTrustedProxy(candidate)) {
                    return candidate;
                }
            }
            // Si la conexión directa no proviene de un proxy interno, X-Forwarded-For no es confiable.
        }

        // 3. Fallback al socket TCP
        return remoteAddr != null ? remoteAddr : "unknown";
    }

    private boolean isTrustedProxy(String ip) {
        if (!StringUtils.hasText(ip)) {
            return false;
        }
        for (String prefix : TRUSTED_PROXY_PREFIXES) {
            if (ip.startsWith(prefix)) {
                return true;
            }
        }
        return false;
    }

    private boolean isValidIp(String ip) {
        return StringUtils.hasText(ip) && !ip.equalsIgnoreCase("unknown");
    }
}
