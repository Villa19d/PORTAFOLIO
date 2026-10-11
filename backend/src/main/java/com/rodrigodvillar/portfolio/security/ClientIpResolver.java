package com.rodrigodvillar.portfolio.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Set;

@Component
public class ClientIpResolver {

    // Subnets privadas estándar consideradas proxies internos (Docker / Kubernetes / Render)
    private static final Set<String> TRUSTED_PROXY_PREFIXES = Set.of(
            "10.", "127.", "172.16.", "172.17.", "172.18.", "172.19.", "172.20.",
            "172.21.", "172.22.", "172.23.", "172.24.", "172.25.", "172.26.",
            "172.27.", "172.28.", "172.29.", "172.30.", "172.31.", "192.168.",
            "0:0:0:0:0:0:0:1", "::1"
    );

    /**
     * Resuelve de forma segura y confiable la dirección IP real del cliente,
     * mitigando ataques de evasión de Rate Limit e IP Spoofing.
     *
     * Regla de auditoría (Ticket 4.4 / ADR 12 en DECISIONS.md):
     * 1. Fuente autoritativa única documentada: 'CF-Connecting-IP'.
     *    Cloudflare (el edge de Render) garantiza que sobrescribe incondicionalmente cualquier
     *    cabecera 'CF-Connecting-IP' enviada por el cliente con la IP real del visitante.
     *    Cabeceras como 'True-Client-IP', 'X-Real-IP' y 'Forwarded' fueron auditadas y
     *    ELIMINADAS de la lista de confianza porque el edge no garantiza su sobrescritura
     *    en planes estándar.
     * 2. Fallback X-Forwarded-For: Solo se evalúa si la conexión proviene de un proxy
     *    interno confiable (Docker/Render private subnet). En tal caso, se extrae el elemento
     *    rightmost válido que no sea un proxy privado (último añadido por la infraestructura confiable),
     *    descartando valores basura o manipulados por el cliente.
     * 3. Fallback final: request.getRemoteAddr() directo del socket TCP.
     */
    public String resolveIp(HttpServletRequest request) {
        // 1. Fuente única verificada y documentada en edge: Cloudflare (Render)
        String cfConnectingIp = request.getHeader("CF-Connecting-IP");
        if (StringUtils.hasText(cfConnectingIp)) {
            String ip = cfConnectingIp.trim();
            if (isValidIp(ip)) {
                return ip;
            }
        }

        String remoteAddr = request.getRemoteAddr();
        String xff = request.getHeader("X-Forwarded-For");

        // 2. Fallback de X-Forwarded-For solo si el socket remoto es un proxy interno de confianza
        if (StringUtils.hasText(xff) && isTrustedProxy(remoteAddr)) {
            String[] parts = xff.split(",");
            for (int i = parts.length - 1; i >= 0; i--) {
                String candidate = parts[i].trim();
                if (isValidIp(candidate) && !isTrustedProxy(candidate)) {
                    return candidate;
                }
            }
        }

        // 3. Fallback al socket TCP
        return remoteAddr != null ? remoteAddr : "unknown";
    }

    public boolean isTrustedProxy(String ip) {
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
        if (!StringUtils.hasText(ip) || ip.equalsIgnoreCase("unknown")) {
            return false;
        }
        // Validar formato sintáctico básico (IPv4 o IPv6), descartando inyecciones o basura
        return ip.matches("^[0-9a-fA-F.:]+$") && !ip.contains(" ");
    }
}
