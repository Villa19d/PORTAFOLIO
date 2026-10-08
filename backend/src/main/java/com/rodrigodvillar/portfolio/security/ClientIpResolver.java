package com.rodrigodvillar.portfolio.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

@Component
public class ClientIpResolver {

    /**
     * Resuelve la IP del cliente de manera segura.
     * Al usar server.forward-headers-strategy=framework, Spring registra un filtro que procesa
     * la cabecera X-Forwarded-For y sobreescribe el valor devuelto por getRemoteAddr().
     * En producción, será necesario restringir de qué IPs proxy aceptamos estas cabeceras.
     */
    public String resolveIp(HttpServletRequest request) {
        return request.getRemoteAddr();
    }
}
