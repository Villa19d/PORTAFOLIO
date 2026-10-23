package com.rodrigodvillar.portfolio.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Configuration(proxyBeanMethods = false)
public class ExternalClientsConfiguration {

    @Bean("turnstileRestClientBuilder")
    RestClient.Builder turnstileRestClientBuilder() {
        return RestClient.builder()
                .requestFactory(requestFactory(Duration.ofSeconds(3), Duration.ofSeconds(5)))
                .baseUrl("https://challenges.cloudflare.com");
    }

    @Bean("resendRestClientBuilder")
    RestClient.Builder resendRestClientBuilder() {
        return RestClient.builder()
                .requestFactory(requestFactory(Duration.ofSeconds(3), Duration.ofSeconds(8)))
                .baseUrl("https://api.resend.com");
    }

    private static SimpleClientHttpRequestFactory requestFactory(
            Duration connectTimeout,
            Duration readTimeout
    ) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(connectTimeout);
        factory.setReadTimeout(readTimeout);
        return factory;
    }
}
