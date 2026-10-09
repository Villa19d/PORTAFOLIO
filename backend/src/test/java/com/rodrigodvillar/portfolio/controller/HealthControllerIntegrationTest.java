package com.rodrigodvillar.portfolio.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.head;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import com.rodrigodvillar.portfolio.security.SecurityConfig;

import org.springframework.boot.test.mock.mockito.MockBean;
import com.rodrigodvillar.portfolio.service.ProjectService;
import com.rodrigodvillar.portfolio.security.JwtService;

@WebMvcTest(
    controllers = HealthController.class,
    excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = SecurityConfig.class),
    excludeAutoConfiguration = SecurityAutoConfiguration.class
)
@ActiveProfiles("test")
public class HealthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProjectService projectService;

    @MockBean
    private JwtService jwtService;

    @Test
    public void testHealthGet() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"));
    }

    @Test
    public void testHealthHead() throws Exception {
        // HEAD request shouldn't return body, just 200 OK headers
        mockMvc.perform(head("/api/health"))
                .andExpect(status().isOk())
                .andExpect(content().string(""));
    }
}
