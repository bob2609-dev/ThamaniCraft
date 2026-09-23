FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder
WORKDIR /app
COPY craft-common-security/pom.xml craft-common-security/
COPY craft-common-security/src craft-common-security/src/
RUN mvn -B -f craft-common-security/pom.xml install -DskipTests
COPY craft-finance-service/pom.xml craft-finance-service/
COPY craft-finance-service/src craft-finance-service/src/
RUN mvn -B -f craft-finance-service/pom.xml package -DskipTests
FROM eclipse-temurin:21-jre-alpine
ENV TZ=Africa/Dar_es_Salaam
WORKDIR /app
COPY --from=builder /app/craft-finance-service/target/craft-finance-service-*.jar app.jar
EXPOSE 8084
ENTRYPOINT ["java", "-jar", "app.jar"]
