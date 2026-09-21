FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder

WORKDIR /app

# Copy the common security module
COPY craft-common-security/pom.xml craft-common-security/
COPY craft-common-security/src craft-common-security/src/
# Install it to local maven repo inside builder
RUN mvn -f craft-common-security/pom.xml clean install -DskipTests

# Copy the inventory service
COPY craft-inventory-service/pom.xml craft-inventory-service/
COPY craft-inventory-service/src craft-inventory-service/src/
# Build the inventory service
RUN mvn -f craft-inventory-service/pom.xml clean package -DskipTests

# Run stage
FROM eclipse-temurin:21-jre-alpine

# Set timezone
ENV TZ=Africa/Dar_es_Salaam
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone

WORKDIR /app
COPY --from=builder /app/craft-inventory-service/target/craft-inventory-service-*.jar app.jar
COPY craft-inventory-service/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8080
ENTRYPOINT ["/entrypoint.sh"]
