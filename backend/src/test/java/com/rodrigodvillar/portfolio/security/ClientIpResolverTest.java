package com.rodrigodvillar.portfolio.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;

class ClientIpResolverTest {

    private final ClientIpResolver resolver = new ClientIpResolver();

    @Test
    @DisplayName("Ausencia de cabeceras: debe retornar directamente el remoteAddr del socket TCP")
    void resolveIp_whenNoHeaders_returnsRemoteAddr() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("192.168.1.50");

        String ip = resolver.resolve(request);

        assertThat(ip).isEqualTo("192.168.1.50");
    }

    @ParameterizedTest(name = "XFF con menos de 3 IPs ({0}): debe hacer fallback a remoteAddr")
    @ValueSource(strings = {
            "203.0.113.195",
            "203.0.113.195, 10.0.0.1"
    })
    @DisplayName("X-Forwarded-For con 1 o 2 entradas: fallback a remoteAddr")
    void resolveIp_whenXForwardedForHasLessThanThreeHops_fallsBackToRemoteAddr(String shortXff) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("192.168.1.50");
        request.addHeader("X-Forwarded-For", shortXff);

        String ip = resolver.resolve(request);

        assertThat(ip).isEqualTo("192.168.1.50");
    }

    @ParameterizedTest(name = "XFF vacío o en blanco: fallback a remoteAddr")
    @ValueSource(strings = {"", "   "})
    @DisplayName("X-Forwarded-For vacío o en blanco: fallback a remoteAddr")
    void resolveIp_whenXForwardedForBlank_fallsBackToRemoteAddr(String emptyXff) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("192.168.1.50");
        request.addHeader("X-Forwarded-For", emptyXff);

        String ip = resolver.resolve(request);

        assertThat(ip).isEqualTo("192.168.1.50");
    }

    @Test
    @DisplayName("X-Forwarded-For con exactamente 3 entradas: extrae posición 0 (length - 3)")
    void resolveIp_whenXForwardedForHasExactlyThreeHops_extractsClientIp() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("10.0.0.1");
        request.addHeader("X-Forwarded-For", "203.0.113.50, 172.71.147.4, 10.27.84.220");

        String ip = resolver.resolve(request);

        assertThat(ip).isEqualTo("203.0.113.50");
    }

    @Test
    @DisplayName("Cabeceras alternativas falsificadas: se ignoran frente a XFF")
    void resolveIp_whenAlternativeHeadersPresent_usesRightmostXff() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("203.0.113.10");
        request.addHeader("X-Forwarded-For", "198.51.100.1, 198.51.100.2, 10.0.0.5");
        request.addHeader("CF-Connecting-IP", "203.0.113.195");
        request.addHeader("True-Client-IP", "8.8.8.8");
        request.addHeader("X-Real-IP", "7.7.7.7");
        request.addHeader("Forwarded", "for=6.6.6.6");

        String ip = resolver.resolve(request);

        assertThat(ip).isEqualTo("198.51.100.1");
    }

    @ParameterizedTest(name = "Cabecera no confiable {0} con valor falso {1} debe ser ignorada ante proxy confiable")
    @CsvSource({
            "True-Client-IP, 1.2.3.4",
            "X-Real-IP, 2.3.4.5",
            "Forwarded, for=3.4.5.6",
            "X-Client-IP, 4.5.6.7"
    })
    @DisplayName("Cliente envía cabeceras no confiables falsificadas: deben ignorarse")
    void resolveIp_whenUntrustedHeadersSent_ignoresThem(String headerName, String fakeValue) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("203.0.113.10");
        request.addHeader(headerName, fakeValue);

        String ip = resolver.resolve(request);

        assertThat(ip).isEqualTo("203.0.113.10");
        assertThat(ip).isNotEqualTo(fakeValue);
    }

    @Test
    @DisplayName("X-Forwarded-For con varios saltos (5 entradas): debe extraer el elemento length - 3")
    void resolveIp_whenXForwardedForMultipleHops_extractsRightmostPublicIp() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("203.0.113.10");
        request.addHeader("X-Forwarded-For", "9.9.9.9, 8.8.8.8, 198.51.100.77, 172.71.147.4, 10.27.84.220");

        String ip = resolver.resolve(request);

        assertThat(ip).isEqualTo("198.51.100.77");
    }

    @Test
    @DisplayName("X-Forwarded-For usa el offset determinista de Render")
    void resolveIp_whenXForwardedForHasPrivateLoadBalancer_usesPreviousPublicIp() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("203.0.113.10");
        request.addHeader("X-Forwarded-For", "198.51.100.1, 198.51.100.42, 10.0.0.2");

        String ip = resolver.resolve(request);

        assertThat(ip).isEqualTo("198.51.100.1");
    }

    @Test
    @DisplayName("X-Forwarded-For devuelve el valor del offset aunque sea basura")
    void resolveIp_whenXForwardedForContainsGarbage_skipsInvalidValues() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("203.0.113.10");
        request.addHeader("X-Forwarded-For", "<script>alert(1)</script>, invalid ip with spaces, 10.0.0.2");

        String ip = resolver.resolve(request);

        assertThat(ip).isEqualTo("<script>alert(1)</script>");
    }

    @Test
    @DisplayName("X-Forwarded-For con último valor malformado mantiene el offset")
    void resolveIp_whenRightmostXForwardedForIsMalformed_skipsInvalidValue() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("203.0.113.10");
        request.addHeader("X-Forwarded-For", "203.0.113.5, malformed, 10.0.0.2");

        assertThat(resolver.resolve(request)).isEqualTo("203.0.113.5");
    }

    @Test
    @DisplayName("X-Forwarded-For con IPv6 válida: resuelve el valor del offset")
    void resolveIp_whenXForwardedForContainsValidIpv6_extractsIpv6() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("203.0.113.10");
        request.addHeader("X-Forwarded-For", "198.51.100.1, 2001:db8:85a3::8a2e:370:7334, 172.16.0.2, 10.0.0.2");

        String ip = resolver.resolve(request);

        assertThat(ip).isEqualTo("2001:db8:85a3::8a2e:370:7334");
    }

    @Test
    @DisplayName("X-Forwarded-For con los dos hops de Render devuelve el cliente público")
    void resolveIp_whenXForwardedForHasMultiplePrivateHops_usesFirstPublicFromRight() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("203.0.113.88");
        request.addHeader("X-Forwarded-For", "79.127.147.89, 172.71.147.4, 10.27.84.220");

        String ip = resolver.resolve(request);

        assertThat(ip).isEqualTo("79.127.147.89");
    }
}
