# ThamaniCraft Memory Index

## Project Conventions
- [project] Dedicated SaaS ERP for Food & Craft Manufacturing / Bakeries / Kitchens
- [frontend] Use ReactJS (Vite + React SPA) with Ant Design v5 and Tailwind CSS (NOT Next.js)
- [backend] Java Spring Boot 3 microservices with PostgreSQL, Flyway, and RabbitMQ
- [docker] Timezone strictly enforced to Africa/Dar_es_Salaam (UTC+3)
- [docker] Dedicated ports: Nginx (8090), Postgres (5475), RabbitMQ (5675/15675), RabbitScout (3035), Client UI (3020)
- [branding] Dual-name model: permanent lowercase routing slug `name` (e.g. bakery1) and editable `display_name`
- [progress] Track implementation progress in docs/PROGRESS.md
