package com.rodrigodvillar.portfolio;

import com.rodrigodvillar.portfolio.config.RateLimitProperties;
import com.rodrigodvillar.portfolio.config.SecurityProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties({SecurityProperties.class, RateLimitProperties.class})
public class PortfolioApplication {


	public static void main(String[] args) {
		SpringApplication.run(PortfolioApplication.class, args);
	}

}
