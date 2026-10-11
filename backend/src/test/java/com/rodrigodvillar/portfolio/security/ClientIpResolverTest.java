package com.rodrigodvillar.portfolio.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;

class ClientIpResolverTest {

    private final ClientIpResolver resolver = new ClientIpResolver();

    @Test
    @DisplayName("Ausencia de cabeceras: debe retornar directamente el remoteAddr del socket TCP")
    void resolveIp_whenNoHeaders_returnsRemoteAddr() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("192.168.1.50");

        String ip = resolver.resolveIp(request);

        assertThat(ip).isEqualTo("192.168.1.50");
    }

    @Test
    @DisplayName("CF-Connecting-IP presente: debe tener prioridad absoluta como fuente única autoritativa")
    void resolveIp_whenCfConnectingIpPresent_returnsCfConnectingIp() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("10.0.0.1"); // Proxy confiable
        request.addHeader("CF-Connecting-IP", "203.0.113.195");
        request.addHeader("X-Forwarded-For", "9.9.9.9");
        request.addHeader("True-Client-IP", "8.8.8.8");
        request.addHeader("X-Real-IP", "7.7.7.7");

        String ip = resolver.resolveIp(request);

        assertThat(ip).isEqualTo("203.0.113.195");
    }

    @ParameterizedTest(name = "Cabecera no confiable {0} con valor falso {1} debe ser ignorada ante proxy confiable")
    @CsvSource({
            "True-Client-IP, 1.2.3.4",
            "X-Real-IP, 2.3.4.5",
            "Forwarded, for=3.4.5.6",
            "X-Client-IP, 4.5.6.7"
    })
    @DisplayName("Cliente envía cabeceras no confiables falsificadas: deben ser ignoradas")
    void resolveIp_whenUntrustedHeadersSent_ignoresThem(String headerName, String fakeValue) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        // Conexión proveniente de proxy interno, cliente inyecta cabeceras espurias
        request.setRemoteAddr("10.0.0.1");
        request.addHeader(headerName, fakeValue);

        String ip = resolver.resolveIp(request);

        // Al no existir CF-Connecting-IP ni XFF válido, debe caer al socket
        assertThat(ip).isEqualTo("10.0.0.1");
        assertThat(ip).isNotEqualTo(fakeValue);
    }

    @Test
    @DisplayName("X-Forwarded-For con varios saltos: debe extraer el rightmost no privado añadido por el proxy")
    void resolveIp_whenXForwardedForMultipleHops_extractsRightmostPublicIp() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("10.0.0.5"); // Proxy interno confiable de Render
        // Cadena: spoofed1, spoofed2, real_client_ip
        request.addHeader("X-Forwarded-For", "9.9.9.9, 8.8.8.8, 198.51.100.77");

        String ip = resolver.resolveIp(request);

        assertThat(ip).isEqualTo("198.51.100.77");
    }

    @Test
    @DisplayName("X-Forwarded-For con proxy interno adicional al final: descarta proxies y toma la IP pública previa")
    void resolveIp_whenXForwardedForHasInternalProxiesAtEnd_extractsPreviousPublicIp() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("10.0.0.1");
        // Cadena: spoofed, ip_publica_real, proxy_interno_intermedio
        request.addHeader("X-Forwarded-For", "9.9.9.9, 198.51.100.42, 10.0.0.2");

        String ip = resolver.resolveIp(request);

        assertThat(ip).isEqualTo("198.51.100.42");
    }

    @Test
    @DisplayName("X-Forwarded-For con basura o caracteres maliciosos: no crashea e ignora la basura")
    void resolveIp_whenXForwardedForContainsGarbage_ignoresAndFallsBackToRemoteAddr() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("10.0.0.1");
        request.addHeader("X-Forwarded-For", "<script>alert(1)</script>, invalid ip with spaces");

        String ip = resolver.resolveIp(request);

        assertThat(ip).isEqualTo("10.0.0.1");
    }

    @Test
    @DisplayName("X-Forwarded-For con IPv6 válida: debe resolver correctamente la dirección IPv6")
    void resolveIp_whenXForwardedForContainsValidIpv6_extractsIpv6() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("10.0.0.1");
        request.addHeader("X-Forwarded-For", "9.9.9.9, 2001:db8:85a3::8a2e:370:7334");

        String ip = resolver.resolveIp(request);

        assertThat(ip).isEqualTo("2001:db8:85a3::8a2e:370:7334");
    }

    @Test
    @DisplayName("Conexión directa no confiable con XFF: descarta XFF por venir de socket no confiable")
    void resolveIp_whenUntrustedSocketSendsXff_ignoresXff() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("203.0.113.88"); // Socket público directo (no es proxy 10.x, 172.x, etc.)
        request.addHeader("X-Forwarded-For", "9.9.9.9");

        String ip = resolver.resolveIp(request);

        assertThat(ip).isEqualTo("203.0.113.88");
        assertThat(ip).isNotEqualTo("9.9.9.9");
    }
}
