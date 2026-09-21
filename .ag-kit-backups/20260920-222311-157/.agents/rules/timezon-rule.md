---
trigger: always_on
---

# Docker Timezone Enforcement Rule

## Scope

Applies to all Dockerfiles, Docker Compose files, container configurations, and service manifests.

## Directive

Always set the default timezone for all Docker containers, services, and base images to `Africa/Dar_es_Salaam` (EAT / UTC+3).

## Requirements

1. **Docker Compose (`docker-compose.yml`)**:
   - Every service definition must include the environment variable `TZ: Africa/Dar_es_Salaam`.
   - Optionally mount `/etc/timezone` and `/etc/localtime` if container OS synchronization is required:
     ```yaml
     environment:
       - TZ=Africa/Dar_es_Salaam
     volumes:
       - /etc/timezone:/etc/timezone:ro
       - /etc/localtime:/etc/localtime:ro
     ```

2. **Dockerfiles**:
   - Set the `TZ` environment variable globally:
     ```dockerfile
     ENV TZ=Africa/Dar_es_Salaam
     ```
   - If using Debian/Ubuntu-based images requiring package installation, configure non-interactive timezone packages:
     ```dockerfile
     ENV TZ=Africa/Dar_es_Salaam
     RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo$TZ > /etc/timezone
     ```
   - For Alpine-based images:
     ```dockerfile
     ENV TZ=Africa/Dar_es_Salaam
     RUN apk add --no-cache tzdata && \
         cp /usr/share/zoneinfo/$TZ /etc/localtime && \
         echo $TZ > /etc/timezone
     ```

3. **CLI & Scripts**:
   - Always supply `-e TZ=Africa/Dar_es_Salaam` when generating `docker run` commands.
