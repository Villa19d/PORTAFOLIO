# API Contract

## Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | Public | Status check (no DB). |
| GET | `/api/projects` | Public | Published projects, ordered by `displayOrder` asc. |
| GET | `/api/projects/{slug}` | Public | Single project by slug. |
| POST | `/api/auth/login` | Public | Login to get tokens. |
| POST | `/api/auth/refresh` | Cookie | Refresh access token using HttpOnly cookie. |
| POST | `/api/auth/logout` | None | Logout. |
| POST | `/api/admin/projects` | JWT | Create project. |
| PUT | `/api/admin/projects/{id}` | JWT | Update project. |
| DELETE | `/api/admin/projects/{id}` | JWT | Delete project. |
| POST | `/api/contact` | Public (Rate limit) | Send contact message. |

## Modelo `Project`

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `slug` | string | |
| `title` | object | `{es: string, en: string}` |
| `summary` | object | `{es: string, en: string}` |
| `description` | object | `{es: string, en: string}` (markdown) |
| `techStack` | string[] | |
| `imageUrl` | string | |
| `videoUrl` | string \| null | nullable |
| `repoUrl` | string | |
| `liveUrl` | string \| null | nullable |
| `featured` | boolean | |
| `published` | boolean | |
| `displayOrder` | integer | |
| `createdAt` | string | ISO-8601 |
| `updatedAt` | string | ISO-8601 |

## Ejemplos de Request / Response

### GET `/api/health`
**Response (200 OK)**
```json
{
  "status": "ok"
}
```

### GET `/api/projects`
**Response (200 OK)**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "slug": "portfolio",
    "title": { "es": "Portafolio", "en": "Portfolio" },
    "summary": { "es": "Mi portafolio personal", "en": "My personal portfolio" },
    "description": { "es": "Detalles...", "en": "Details..." },
    "techStack": ["React", "Spring Boot"],
    "imageUrl": "https://res.cloudinary.com/...",
    "videoUrl": null,
    "repoUrl": "https://github.com/...",
    "liveUrl": "https://rodrigodvillar.com",
    "featured": true,
    "published": true,
    "displayOrder": 1,
    "createdAt": "2024-10-06T12:00:00Z",
    "updatedAt": "2024-10-06T12:00:00Z"
  }
]
```

### GET `/api/projects/{slug}`
**Response (200 OK)**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "slug": "portfolio",
  "title": { "es": "Portafolio", "en": "Portfolio" },
  "summary": { "es": "Mi portafolio personal", "en": "My personal portfolio" },
  "description": { "es": "Detalles...", "en": "Details..." },
  "techStack": ["React", "Spring Boot"],
  "imageUrl": "https://res.cloudinary.com/...",
  "videoUrl": null,
  "repoUrl": "https://github.com/...",
  "liveUrl": "https://rodrigodvillar.com",
  "featured": true,
  "published": true,
  "displayOrder": 1,
  "createdAt": "2024-10-06T12:00:00Z",
  "updatedAt": "2024-10-06T12:00:00Z"
}
```

**Response (404 Not Found)**
```json
{
  "type": "about:blank",
  "title": "Not Found",
  "status": 404,
  "detail": "Project with slug 'portfolio' not found",
  "instance": "/api/projects/portfolio"
}
```

### POST `/api/auth/login`
**Request**
```json
{
  "username": "admin",
  "password": "secretpassword"
}
```
**Response (200 OK)**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5c...",
  "expiresIn": 3600
}
```
*(Response includes `Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Lax`)*

### POST `/api/auth/refresh`
*(Request uses `refreshToken` cookie)*
**Response (200 OK)**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5c...new",
  "expiresIn": 3600
}
```

### POST `/api/auth/logout`
**Response (204 No Content)**

### POST `/api/admin/projects`
**Request**
```json
{
  "slug": "portfolio",
  "title": { "es": "Portafolio", "en": "Portfolio" },
  "summary": { "es": "Mi portafolio personal", "en": "My personal portfolio" },
  "description": { "es": "Detalles...", "en": "Details..." },
  "techStack": ["React", "Spring Boot"],
  "imageUrl": "https://res.cloudinary.com/...",
  "videoUrl": null,
  "repoUrl": "https://github.com/...",
  "liveUrl": "https://rodrigodvillar.com",
  "featured": true,
  "published": true,
  "displayOrder": 1
}
```
**Response (201 Created)**

### PUT `/api/admin/projects/{id}`
**Response (200 OK)**

### DELETE `/api/admin/projects/{id}`
**Response (204 No Content)**

### POST `/api/contact`
**Request**
```json
{
  "name": "Juan Perez",
  "email": "juan@example.com",
  "message": "Hola, me interesa tu perfil.",
  "turnstileToken": "0.XXXXXX..."
}
```
**Response (202 Accepted)**

## Errores (RFC 7807)
**Response (400 Bad Request)**
```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "Validation failed",
  "instance": "/api/contact",
  "errors": [
    {
      "field": "email",
      "message": "must be a well-formed email address"
    }
  ]
}
```
