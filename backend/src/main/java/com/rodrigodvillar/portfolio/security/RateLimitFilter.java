package com.rodrigodvillar.portfolio.security;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.rodrigodvillar.portfolio.config.RateLimitProperties;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimitProperties rateLimitProperties;
    private final ClientIpResolver clientIpResolver;
    private final com.github.benmanes.caffeine.cache.Cache<String, Bucket> bucketCache;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    public RateLimitFilter(RateLimitProperties rateLimitProperties, ClientIpResolver clientIpResolver) {
        this.rateLimitProperties = rateLimitProperties;
        this.clientIpResolver = clientIpResolver;
        this.bucketCache = Caffeine.newBuilder()
                .maximumSize(rateLimitProperties.bucketCapacity() > 0 ? rateLimitProperties.bucketCapacity() : 10000)
                .expireAfterAccess(rateLimitProperties.bucketExpirationHours() > 0 ? rateLimitProperties.bucketExpirationHours() : 1, TimeUnit.HOURS)
                .build();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        if (!rateLimitProperties.enabled() || rateLimitProperties.rules() == null) {
            filterChain.doFilter(request, response);
            return;
        }

        Optional<RateLimitProperties.Rule> matchingRule = rateLimitProperties.rules().stream()
                .filter(rule -> rule.method().equalsIgnoreCase(request.getMethod()) &&
                        pathMatcher.match(rule.pathPattern(), request.getRequestURI()))
                .findFirst();

        if (matchingRule.isEmpty()) {
            filterChain.doFilter(request, response);
            return;
        }

        RateLimitProperties.Rule rule = matchingRule.get();
        String ip = clientIpResolver.resolveIp(request);
        String cacheKey = rule.method() + ":" + rule.pathPattern() + ":" + ip;

        Bucket bucket = bucketCache.get(cacheKey, key -> createNewBucket(rule));
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);

        if (probe.isConsumed()) {
            response.setHeader("X-Rate-Limit-Remaining", String.valueOf(probe.getRemainingTokens()));
            filterChain.doFilter(request, response);
        } else {
            long waitForRefill = probe.getNanosToWaitForRefill() / 1_000_000_000;
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setHeader("Retry-After", String.valueOf(waitForRefill));
            response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
            
            String problemDetail = """
                    {
                        "type": "about:blank",
                        "title": "Too Many Requests",
                        "status": 429,
                        "detail": "Rate limit exceeded. Try again in %d seconds."
                    }
                    """.formatted(waitForRefill);
            response.getWriter().write(problemDetail);
        }
    }

    private Bucket createNewBucket(RateLimitProperties.Rule rule) {
        io.github.bucket4j.local.LocalBucketBuilder builder = Bucket.builder();
        for (RateLimitProperties.Bandwidth bw : rule.bandwidths()) {
            Refill refill = Refill.greedy(bw.capacity(), bw.duration());
            Bandwidth bandwidth = Bandwidth.classic(bw.capacity(), refill);
            builder.addLimit(bandwidth);
        }
        return builder.build();
    }
}
