package com.rodrigodvillar.portfolio.dto;

public record ClientIpDiagnosticsResponse(
        String resolvedIp,
        String remoteAddr,
        String xForwardedFor,
        String xRealIp,
        String cfConnectingIp,
        String trueClientIp,
        String forwarded
) {
}
