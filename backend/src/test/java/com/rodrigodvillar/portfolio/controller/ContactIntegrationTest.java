package com.rodrigodvillar.portfolio.controller;

import com.rodrigodvillar.portfolio.entity.ContactMessage;
import com.rodrigodvillar.portfolio.repository.ContactMessageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.jdbc.core.JdbcTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import jakarta.annotation.Resource;
import com.rodrigodvillar.portfolio.service.ContactRetentionJob;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.UNPROCESSABLE_ENTITY;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers
@ExtendWith(OutputCaptureExtension.class)
class ContactIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("portfolio.contact.daily-cap", () -> "40");
        registry.add("portfolio.contact.turnstile-allowed-hostnames", () -> "localhost");
        registry.add("portfolio.contact.turnstile-secret-key", () -> "test-turnstile-secret");
        registry.add("portfolio.contact.resend-api-key", () -> "test-resend-key");
        registry.add("portfolio.contact.to-email", () -> "owner@example.com");
        registry.add("portfolio.contact.from", () -> "Portfolio <contact@example.com>");
        registry.add("portfolio.contact.retention-days", () -> "30");
    }

    @Resource
    private MockMvc mockMvc;

    @Resource(name = "turnstileRestClientBuilder")
    private org.springframework.web.client.RestClient.Builder turnstileRestClientBuilder;

    @Resource(name = "resendRestClientBuilder")
    private org.springframework.web.client.RestClient.Builder resendRestClientBuilder;

    @Resource
    private ContactMessageRepository repository;

    @Resource
    private ContactRetentionJob retentionJob;

    @Resource
    private JdbcTemplate jdbcTemplate;

    private MockRestServiceServer turnstileServer;
    private MockRestServiceServer resendServer;

    @BeforeEach
    void setUpServers() {
        repository.deleteAll();
        turnstileServer = MockRestServiceServer.bindTo(turnstileRestClientBuilder).build();
        resendServer = MockRestServiceServer.bindTo(resendRestClientBuilder).build();
    }

    @Test
    void acceptsAndSendsMessage() throws Exception {
        expectTurnstileSuccess();
        resendServer.expect(requestTo("https://api.resend.com/emails"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess("{\"id\":\"email-id\"}", MediaType.APPLICATION_JSON));

        mockMvc.perform(contactRequest("valid-ip"))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.status").value("SENT"));

        assertThat(repository.findAll()).singleElement()
                .extracting(ContactMessage::getStatus)
                .isEqualTo(ContactMessage.Status.SENT);
        turnstileServer.verify();
        resendServer.verify();
    }

    @Test
    void rejectsTurnstile() throws Exception {
        turnstileServer.expect(requestTo("https://challenges.cloudflare.com/turnstile/v0/siteverify"))
                .andRespond(withSuccess("{\"success\":false,\"error-codes\":[\"invalid-input-response\"]}", MediaType.APPLICATION_JSON));

        mockMvc.perform(contactRequest("reject-ip"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("Turnstile validation failed"));

        assertThat(repository.count()).isZero();
    }

    @Test
    void returns503WhenTurnstileIsUnavailable() throws Exception {
        turnstileServer.expect(requestTo("https://challenges.cloudflare.com/turnstile/v0/siteverify"))
                .andRespond(withServerError());

        mockMvc.perform(contactRequest("unavailable-ip"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(header().string("Retry-After", "60"));
    }

    @Test
    void acceptsAndPersistsFailedResend(CapturedOutput output) throws Exception {
        expectTurnstileSuccess();
        resendServer.expect(requestTo("https://api.resend.com/emails"))
                .andRespond(withStatus(UNPROCESSABLE_ENTITY));

        MvcResult result = mockMvc.perform(contactRequest("resend-failure-ip"))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.status").value("FAILED"))
                .andReturn();

        ContactMessage message = repository.findAll().getFirst();
        assertThat(message.getFailureReason()).isEqualTo("resend_422");
        assertThat(output).contains(message.getId().toString(), "resend_422")
                .doesNotContain("Ana Example", "ana@example.com", "token-for-test");
        assertThat(result.getResponse().getContentAsString()).doesNotContain("ana@example.com");
    }

    @Test
    void rejectsInvalidPayloadWithoutEchoingInput() throws Exception {
        String secretValue = "secret-email@example.com";
        mockMvc.perform(post("/api/contact")
                        .header("CF-Connecting-IP", "validation-ip")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"bad\\u0000name","email":"%s","message":"short","turnstileToken":"token"}
                                """.formatted(secretValue)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Validation failed"))
                .andExpect(jsonPath("$").value(not(containsString(secretValue))));
    }

    @Test
    void returns503WhenDailyCapIsExceeded() throws Exception {
        for (int i = 0; i < 40; i++) {
            repository.save(new ContactMessage("Existing", "existing@example.com", "Existing contact message"));
        }

        mockMvc.perform(contactRequest("cap-ip"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(header().string("Retry-After", "3600"));
    }

    @Test
    void rejectsControlCharactersInTokenAndEmail() throws Exception {
        mockMvc.perform(post("/api/contact")
                        .header("CF-Connecting-IP", "control-ip")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Valid Name","email":"valid@example.com\\nBcc:evil@example.com","message":"A valid message here","turnstileToken":"token\\u0007"}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void retentionJobDeletesOnlyMessagesOlderThanRetentionPeriod() {
        ContactMessage oldMessage = repository.saveAndFlush(
                new ContactMessage("Old Contact", "old@example.com", "An old contact message")
        );
        ContactMessage recentMessage = repository.saveAndFlush(
                new ContactMessage("Recent Contact", "recent@example.com", "A recent contact message")
        );
        jdbcTemplate.update(
                "update contact_messages set created_at = now() - interval '31 days' where id = ?",
                oldMessage.getId()
        );

        retentionJob.deleteExpiredMessages();

        assertThat(repository.existsById(oldMessage.getId())).isFalse();
        assertThat(repository.existsById(recentMessage.getId())).isTrue();
    }

    private void expectTurnstileSuccess() {
        turnstileServer.expect(requestTo("https://challenges.cloudflare.com/turnstile/v0/siteverify"))
                .andRespond(withSuccess("{\"success\":true,\"hostname\":\"localhost\"}", MediaType.APPLICATION_JSON));
    }

    private org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder contactRequest(String ip) {
        return post("/api/contact")
                .header("CF-Connecting-IP", ip)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name":"Ana Example","email":"ana@example.com","message":"A valid contact message","turnstileToken":"token-for-test"}
                        """);
    }
}
