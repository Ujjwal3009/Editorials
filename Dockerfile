# Multi-stage build for lightweight Render deployment
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY backend-spring/pom.xml .
COPY backend-spring/src ./src
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/editorial-desk-1.0.0.jar app.jar

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar", "--server.port=${PORT}"]
