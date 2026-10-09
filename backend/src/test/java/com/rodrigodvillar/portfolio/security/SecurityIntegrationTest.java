package com.rodrigodvillar.portfolio.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rodrigodvillar.portfolio.dto.LoginRequest;
import com.rodrigodvillar.portfolio.dto.TokenResponse;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.springframework.test.annotation.DirtiesContext;
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class SecurityIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("portfolio.security.jwt-secret", () -> "12345678901234567890123456789012");
        registry.add("portfolio.security.admin-username", () -> "admin");
        registry.add("portfolio.security.admin-password-hash", () -> new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode("password")); // "password"
        registry.add("portfolio.security.cookie-secure", () -> "false");
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @TestConfiguration
    static class TestControllerConfig {
        @RestController
        @RequestMapping("/api/admin")
        static class TestAdminController {
            @GetMapping("/ping")
            public String ping() {
                return "pong";
            }
        }
    }

    @Test
    void publicEndpoints_shouldBeAccessible() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk());
    }

    @Test
    void adminEndpoints_withoutToken_shouldReturn401() throws Exception {
        mockMvc.perform(get("/api/admin/ping"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));
    }

    @Test
    void login_withInvalidCredentials_shouldReturn401() throws Exception {
        LoginRequest req = new LoginRequest("admin", "wrong");
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void login_withValidCredentials_shouldReturnTokenAndCookie() throws Exception {
        LoginRequest req = new LoginRequest("admin", "password");
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists())
                .andExpect(header().exists("Set-Cookie"))
                .andExpect(header().string("Set-Cookie", org.hamcrest.Matchers.containsString("refresh_token=")))
                .andExpect(header().string("Set-Cookie", org.hamcrest.Matchers.containsString("HttpOnly")));
    }

    @Test
    void refresh_withValidToken_shouldReturnNewToken() throws Exception {
        LoginRequest req = new LoginRequest("admin", "password");
        MvcResult res = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andReturn();

        String setCookieHeader = res.getResponse().getHeader("Set-Cookie");
        String tokenValue = setCookieHeader.split(";")[0].split("=")[1];
        Cookie refreshToken = new Cookie("refresh_token", tokenValue);

        mockMvc.perform(post("/api/auth/refresh")
                .cookie(refreshToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists())
                .andExpect(header().exists("Set-Cookie"))
                .andExpect(header().string("Set-Cookie", org.hamcrest.Matchers.containsString("refresh_token=")));
    }

    @Test
    void refresh_withAccessToken_shouldReturn401() throws Exception {
        LoginRequest req = new LoginRequest("admin", "password");
        MvcResult res = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andReturn();

        String body = res.getResponse().getContentAsString();
        TokenResponse tokenResponse = objectMapper.readValue(body, TokenResponse.class);

        Cookie fakeRefresh = new Cookie("refresh_token", tokenResponse.accessToken());

        mockMvc.perform(post("/api/auth/refresh")
                .cookie(fakeRefresh))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void preflight_shouldReturn200() throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options("/api/admin/ping")
                .header("Origin", "http://localhost:3000")
                .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk());
    }
}

