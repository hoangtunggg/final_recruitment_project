# Internal API v1

Internal calls use Docker DNS, `X-Internal-Service-Token`, `X-Request-ID`, JSON and bounded timeouts. They are not published by the gateway.

- `GET /api/auth/internal/users/:id`: identity projection for user-service.
- `PATCH /api/auth/internal/users/:id`: identity fields controlled by admin workflows.
- `GET /api/resumes/internal/:id`: private resume metadata.
- `GET /api/resumes/internal/:id/content`: base64 content for authorized matching-service processing.

The matching-service must additionally validate that the resume owner from resume-service equals the JWT subject. No service is allowed to query another service database.
