package com.rodrigodvillar.portfolio.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;

class ClientIpResolverTest {

    private final ClientIpResolver resolver = new ClientIpResolver();

    @Test
    void resolveIp_whenNoHeaders_returnsRemoteAddr() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("192.168.1.50");

        String ip = resolver.resolveIp(request);

        assertThat(ip).isEqualTo("192.168.1.50");
    }

    @Test
    void resolveIp_whenCfConnectingIpPresent_prefersCfConnectingIpEvenIfXForwardedForIsSpoofed() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("10.0.0.1");
        request.addHeader("X-Forwarded-For", "9.9.9.9");
        request.addHeader("CF-Connecting-IP", "203.0.113.195");

        String ip = resolver.resolveIp(request);

        assertThat(ip).isEqualTo("203.0.113.195");
    }

    @Test
    void resolveIp_whenTrueClientIpPresent_returnsTrueClientIp() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("10.0.0.1");
        request.addHeader("X-Forwarded-For", "9.9.9.9");
        request.addHeader("True-Client-IP", "198.51.100.44");

        String ip = resolver.resolveIp(request);

        assertThat(ip).isEqualTo("198.51.100.44");
    }

    @Test
    void resolveIp_whenXRealIpPresent_returnsXRealIp() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("10.0.0.1");
        request.addHeader("X-Forwarded-For", "9.9.9.9");
        request.addHeader("X-Real-IP", "198.51.100.77");

        String ip = resolver.resolveIp(request);

        assertThat(ip).isEqualTo("198.51.100.77");
    }

    @Test
    void resolveIp_whenUntrustedClientSendsXForwardedFor_ignoresSpoofedIpAndReturnsRemoteAddr() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        // Conexión directa desde internet (no es proxy interno 10.x, 127.x, 172.16-31.x, etc.)
        request.setRemoteAddr("203.0.113.50");
        request.addHeader("X-Forwarded-For", "9.9.9.9");

        String ip = resolver.resolveIp(request);

        // No debe tomar 9.9.9.9 porque el socket directo no proviene de un proxy confiable
        assertThat(ip).isEqualTo("203.0.113.50");
        assertThat(ip).isNotEqualTo("9.9.9.9");
    }

    @Test
    void resolveIp_whenTrustedProxySendsXForwardedForChain_extractsLastIpAppendedByProxy() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        // Conexión proveniente del balanceador interno de Render (10.x.x.x)
        request.setRemoteAddr("10.100.1.5");
        // El cliente intentó inyectar 9.9.9.9 y el proxy concatenó la IP real al final
        request.addHeader("X-Forwarded-For", "9.9.9.9, 198.51.100.88");

        String ip = resolver.resolveIp(request);

        // Debe tomar la última IP (198.51.100.88) agregada por el proxy, ignorando 9.9.9.9
        assertThat(ip).isEqualTo("198.51.100.88");
        assertThat(ip).isNotEqualTo("9.9.9.9");
    }
}
