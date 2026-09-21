# Timezone Configuration - AG Kit

> Always use `Africa/Dar_es_Salaam` as the timezone for all services, servers, and configuration.

---

## 🌍 Global Timezone Requirement

Whenever configuring, scaffolding, or deploying any service (e.g. Docker containers, Spring Boot applications, databases, Nginx, or scheduled tasks):

1. **Environment Variables**: Always ensure the timezone is explicitly set using the `TZ` environment variable.
   ```yaml
   environment:
     - TZ=Africa/Dar_es_Salaam
   ```

2. **Application Configuration**: For Spring Boot or Node.js applications, ensure the default JVM or runtime timezone is aligned with `Africa/Dar_es_Salaam` where applicable.

3. **Database**: PostgreSQL should also have its timezone configured or inherit the container's `TZ` environment.
