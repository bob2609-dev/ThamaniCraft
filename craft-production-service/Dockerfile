FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder

WORKDIR /app

# Copy the common security module
COPY craft-common-security/pom.xml craft-common-security/
COPY craft-common-security/src craft-common-security/src/
# Install it to local maven repo inside builder
RUN mvn -f craft-common-security/pom.xml clean install -DskipTests

# Copy the production service
COPY craft-production-service/pom.xml craft-production-service/
COPY craft-production-service/src craft-production-service/src/
# Build the production service
RUN mvn -f craft-production-service/pom.xml clean package -DskipTests

# Run stage
FROM eclipse-temurin:21-jre-alpine

# Set timezone
ENV TZ=Africa/Dar_es_Salaam
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone

WORKDIR /app
COPY --from=builder /app/craft-production-service/target/craft-production-service-*.jar app.jar
COPY craft-production-service/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8081
ENTRYPOINT ["/entrypoint.sh"]
