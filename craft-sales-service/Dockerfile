FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder
WORKDIR /app
COPY craft-common-security/pom.xml craft-common-security/
COPY craft-common-security/src craft-common-security/src/
RUN mvn -B -f craft-common-security/pom.xml install -DskipTests
COPY craft-sales-service/pom.xml craft-sales-service/
COPY craft-sales-service/src craft-sales-service/src/
RUN mvn -B -f craft-sales-service/pom.xml package -DskipTests
FROM eclipse-temurin:21-jre-alpine
ENV TZ=Africa/Dar_es_Salaam
WORKDIR /app
COPY --from=builder /app/craft-sales-service/target/craft-sales-service-*.jar app.jar
EXPOSE 8085
ENTRYPOINT ["java", "-jar", "app.jar"]
