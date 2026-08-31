package com.upsc.editorial.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "gemini")
public class GeminiProperties {
    private boolean enabled = false;
    private String apiKey = "";
    private String model = "gemini-2.5-flash";
    private int timeoutSeconds = 15;
}
