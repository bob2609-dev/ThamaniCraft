# SKILL-01: Infrastructure, Docker & Reverse Proxy Architecture

**Target Project:** ThamaniCraft  
**Timezone Directive:** `Africa/Dar_es_Salaam` (EAT / UTC+3)  
**Stack:** Docker Compose, Nginx, PostgreSQL, RabbitMQ, Vite React SPA, Spring Boot 3  

---

## 1. Container Topology & Port Allocations

To prevent port collisions with host services or ThamaniPoint, ThamaniCraft uses dedicated port offsets:

| Service | Internal Port | Host Port | Protocol / Purpose |
| :--- | :--- | :--- | :--- |
| **`thamanicraft-nginx`** | 80 / 443 | `8090` / `8445` | Main HTTP/HTTPS entrypoint and wildcard subdomain router |
| **`thamanicraft-client-ui`** | 80 (Nginx) / 5173 | `3020` | ReactJS (Vite) Production & Kitchen Dashboard |
| **`thamanicraft-admin-ui`** | 80 (Nginx) / 5173 | `3021` | Super Admin Platform Management Portal |
| **`thamanicraft-gateway`** | 8080 | Internal Only | Spring Cloud API Gateway / Reverse Proxy to microservices |
| **`thamanicraft-postgres`** | 5432 | `5475` | Shared Multi-Tenant Database |
| **`thamanicraft-rabbitmq`** | 5672 / 15672 | `5675` / `15675` | AMQP Event Broker & Management Dashboard |
| **`thamanicraft-rabbitscout`**| 3000 | `3035` | RabbitMQ Queue Explorer & Inspector |

---

## 2. Docker Service Banner Standard

All Docker `entrypoint.sh` scripts MUST follow the AG Kit ASCII Banner standard with centered subtitle:
```bash
#!/bin/sh
cat << "EOF"
 ████████╗██╗  ██╗ █████╗ ███╗   ███╗ █████╗ ███╗   ██╗██╗ ██████╗██████╗  █████╗ ███████╗████████╗
 ╚══██╔══╝██║  ██║██╔══██╗████╗ ████║██╔══██╗████╗  ██║██║██╔════╝██╔══██╗██╔══██╗██╔════╝╚══██╔══╝
    ██║   ███████║███████║██╔████╔██║███████║██╔██╗ ██║██║██║     ██████╔╝███████║█████╗     ██║   
    ██║   ██╔══██║██╔══██║██║╚██╔╝██║██╔══██║██║╚██╗██║██║██║     ██╔══██╗██╔══██║██╔══╝     ██║   
    ██║   ██║  ██║██║  ██║██║ ╚═╝ ██║██║  ██║██║ ╚████║██║╚██████╗██║  ██║██║  ██║██║        ██║   
    ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝        ╚═╝   
                             :: ThamaniCraft Service ::
EOF
exec "$@"
```

---

## 3. Global Timezone Configuration

Every container, Dockerfile, and Compose manifest must specify:
```yaml
environment:
  - TZ=Africa/Dar_es_Salaam
```

And in Alpine-based Dockerfiles:
```dockerfile
ENV TZ=Africa/Dar_es_Salaam
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone
```

---

## 4. Nginx Multi-Tenant Subdomain Routing

Nginx dynamically extracts the tenant slug and proxies traffic to the React SPA with `X-Tenant-ID` / `Host` headers:

```nginx
server {
    listen 80;
    server_name ~^(?<subdomain>[a-zA-Z0-9-]+)\.thamanicraft\.co\.tz$;

    location / {
        proxy_pass http://thamanicraft-client-ui:80;
        proxy_set_header Host $host;
        proxy_set_header X-Tenant-Subdomain $subdomain;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /api/ {
        proxy_pass http://thamanicraft-gateway:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Tenant-Subdomain $subdomain;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```\n