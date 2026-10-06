# Portafolio de Rodrigo Del Villar

[![Backend CI](https://github.com/OWNER/REPO/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/backend-ci.yml)
[![Frontend CI](https://github.com/OWNER/REPO/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/frontend-ci.yml)

Portafolio profesional de desarrollo Full-Stack. Construido con React (Vite) en el frontend y Spring Boot en el backend.

## Arquitectura

```mermaid
flowchart LR
    User([Usuario]) --> Vercel[Vercel (Frontend)]
    Vercel --> Render[Render (Backend Docker)]
    Render --> Neon[(Neon PostgreSQL)]
    Render --> Resend[Resend (API HTTP)]
    Vercel -.-> Cloudinary[Cloudinary]
    Render -.-> Cloudinary
```

## Stack

- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS v4, Motion, Swiper, TanStack Query, react-i18next, Lenis.
- **Backend:** Java 21, Spring Boot 3.5.x, Spring Security, JWT, Spring Data JPA, Flyway, Bucket4j.
- **Base de Datos:** PostgreSQL (Neon en producción, Docker en local).
- **Servicios Externos:** Resend (Email API), Cloudinary (Imágenes), Cloudflare Turnstile (Anti-spam).

## Cómo correr en local

Por ahora, solo se encuentra configurada la base de datos local mediante Docker.

1. Copia el archivo de variables de entorno:
   ```bash
   cp .env.example .env
   ```
2. Levanta la base de datos con Docker Compose:
   ```bash
   docker compose up -d db
   ```
