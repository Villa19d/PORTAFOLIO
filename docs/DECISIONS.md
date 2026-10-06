# Registro de Decisiones de Arquitectura (ADR)

## 1. Base de Datos: Neon sobre Supabase
- **Contexto:** Se requiere una base de datos PostgreSQL para el backend del portafolio.
- **Decisión:** Se elige Neon en lugar de Supabase.
- **Consecuencia:** Menor sobrecarga (ya que el backend en Spring Boot maneja su propia lógica de autenticación y APIs), entorno serverless compatible con los recursos gratuitos, y fácil integración con contenedores Postgres para desarrollo local.

## 2. Envío de Correos: Resend por API HTTP (No SMTP)
- **Contexto:** Render gratuito bloquea los puertos SMTP estándar para evitar spam.
- **Decisión:** Se utilizará Resend a través de su API HTTP.
- **Consecuencia:** Aseguramos que el envío de correos funcione en el entorno de producción de Render sin configuraciones especiales ni problemas de bloqueo de puertos.

## 3. Almacenamiento de Imágenes: Cloudinary
- **Contexto:** El backend estará desplegado en Render usando un disco efímero (sin almacenamiento persistente).
- **Decisión:** Se utilizará Cloudinary para almacenar y servir imágenes.
- **Consecuencia:** Las imágenes no se perderán con los reinicios del servidor, y en la base de datos solo se guardarán las URLs proporcionadas por Cloudinary.

## 4. Estrategia de Despliegue: Vercel y Render (Docker)
- **Contexto:** Se requiere hospedar un frontend en React (Vite) y un backend en Spring Boot, ambos en capa gratuita.
- **Decisión:** Desplegar el frontend en Vercel y el backend en Render usando contenedores Docker.
- **Consecuencia:** Aprovechamiento óptimo de los tiers gratuitos. El frontend no se dockerizará en producción para aprovechar el CDN de Vercel.

## 5. Autenticación: JWT con Refresh en Cookie HttpOnly
- **Contexto:** Se necesita un mecanismo seguro de autenticación sin estados, previniendo ataques XSS.
- **Decisión:** Se usarán JSON Web Tokens (JWT). El *Access Token* se guardará en memoria en el frontend, y el *Refresh Token* se guardará en una cookie `HttpOnly`, `Secure` y `SameSite=Lax`.
- **Consecuencia:** Prohibición estricta de guardar tokens en localStorage, incrementando la seguridad general de la autenticación.
