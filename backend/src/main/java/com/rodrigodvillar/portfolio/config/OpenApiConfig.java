package com.rodrigodvillar.portfolio.config;

import io.swagger.v3.oas.models.OpenAPI;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI().addServersItem(new io.swagger.v3.oas.models.servers.Server().url("https://api.rodrigodvillar.com"));
    }
}
