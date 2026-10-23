package com.rodrigodvillar.portfolio.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.rodrigodvillar.portfolio.config.ContactProperties;
import com.rodrigodvillar.portfolio.exception.TurnstileRejectedException;
import com.rodrigodvillar.portfolio.exception.TurnstileUnavailableException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.util.List;

@Service
public class TurnstileVerifier {

    private static final Logger log = LoggerFactory.getLogger(TurnstileVerifier.class);

    private final RestClient.Builder restClientBuilder;
    private final ContactProperties properties;

    public TurnstileVerifier(
            @org.springframework.beans.factory.annotation.Qualifier("turnstileRestClientBuilder")
            RestClient.Builder restClientBuilder,
            ContactProperties properties
    ) {
        this.restClientBuilder = restClientBuilder;
        this.properties = properties;
    }

    public void verify(String token, String remoteIp) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("secret", properties.turnstileSecretKey());
        form.add("response", token);
        if (remoteIp != null && !remoteIp.isBlank()) {
            form.add("remoteip", remoteIp);
        }

        TurnstileResponse response;
        try {
            response = restClientBuilder.build().post()
                    .uri("/turnstile/v0/siteverify")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(TurnstileResponse.class);
        } catch (RestClientException ex) {
            if (ex instanceof RestClientResponseException responseException
                    && responseException.getStatusCode().is4xxClientError()) {
                log.warn("Turnstile rejected with HTTP status: {}", responseException.getStatusCode().value());
                throw new TurnstileRejectedException("turnstile_http_rejected");
            }
            throw new TurnstileUnavailableException("turnstile_unavailable", ex);
        }

        if (response == null) {
            throw new TurnstileUnavailableException("turnstile_empty_response", null);
        }
        if (!response.success()) {
            log.warn("Turnstile rejected request: {}", response.errorCodes());
            throw new TurnstileRejectedException("turnstile_rejected");
        }
        if (!allowedHostname(response.hostname())) {
            log.warn("Turnstile rejected hostname: {}", response.hostname());
            throw new TurnstileRejectedException("turnstile_hostname_rejected");
        }
    }

    private boolean allowedHostname(String hostname) {
        List<String> allowed = properties.turnstileAllowedHostnames().stream()
                .filter(value -> value != null && !value.isBlank())
                .map(String::trim)
                .toList();
        return allowed.isEmpty() || (hostname != null && allowed.contains(hostname));
    }

    private record TurnstileResponse(
            boolean success,
            String hostname,
            @JsonProperty("error-codes") List<String> errorCodes
    ) {
    }
}
