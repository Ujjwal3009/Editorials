package com.upsc.editorial.config;

import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DatabaseConfig {

    @Bean
    @Primary
    public DataSource dataSource(DataSourceProperties properties) {
        String dbUrl = System.getenv("SPRING_DATASOURCE_URL");
        if (dbUrl == null || dbUrl.isBlank()) {
            dbUrl = System.getenv("DATABASE_URL");
        }

        // 1. If Render PostgreSQL URL (e.g. postgres://user:pass@host/db or postgresql://...)
        if (dbUrl != null && !dbUrl.isBlank() && (dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://"))) {
            try {
                URI uri = new URI(dbUrl.replace("jdbc:", ""));
                String host = uri.getHost();
                int port = uri.getPort() != -1 ? uri.getPort() : 5432;
                String path = uri.getPath();
                String database = path.startsWith("/") ? path.substring(1) : path;

                String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + "/" + database;
                String username = "";
                String password = "";

                if (uri.getUserInfo() != null) {
                    String[] userInfo = uri.getUserInfo().split(":");
                    username = userInfo[0];
                    if (userInfo.length > 1) {
                        password = userInfo[1];
                    }
                }

                if (System.getenv("SPRING_DATASOURCE_USERNAME") != null) {
                    username = System.getenv("SPRING_DATASOURCE_USERNAME");
                }
                if (System.getenv("SPRING_DATASOURCE_PASSWORD") != null) {
                    password = System.getenv("SPRING_DATASOURCE_PASSWORD");
                }

                return DataSourceBuilder.create()
                        .driverClassName("org.postgresql.Driver")
                        .url(jdbcUrl)
                        .username(username)
                        .password(password)
                        .build();
            } catch (Exception e) {
                System.err.println("[-] Error parsing DATABASE_URL, falling back to properties: " + e.getMessage());
            }
        }

        // 2. Default standard JDBC configuration
        String url = properties.getUrl() != null && !properties.getUrl().isBlank()
                ? properties.getUrl()
                : "jdbc:h2:file:./data/upsc_db;AUTO_SERVER=TRUE;DB_CLOSE_DELAY=-1;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE";

        String driver = url.contains("postgresql") ? "org.postgresql.Driver" : "org.h2.Driver";

        return DataSourceBuilder.create()
                .driverClassName(driver)
                .url(url)
                .username(properties.getUsername() != null ? properties.getUsername() : "sa")
                .password(properties.getPassword() != null ? properties.getPassword() : "")
                .build();
    }
}
