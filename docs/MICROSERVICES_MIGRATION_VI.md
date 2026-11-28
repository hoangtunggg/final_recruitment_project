# Báo cáo chuyển đổi JobPortal sang Microservices

Ngày kiểm tra: 28/11/2026. Kiến trúc mới được triển khai theo strangler pattern song song với monolith; chưa tự động cutover và không xóa MySQL/volume cũ.

## 1. Kiểm kê kiến trúc hiện hữu

Frontend React/Vite gọi các prefix `/api/auth`, `/api/users`, `/api/jobs`, `/api/resumes`, `/api/applications`, `/api/notifications`, `/api/settings`, `/api/audit`, `/api/matches`. Backend cũ là Express + Sequelize + MySQL với join trực tiếp giữa users/jobs/applications/resumes. ID là số; `JobDetailPage` từng ép `parseInt(id)`. Resume và CV application vừa có đường dẫn local vừa có base64 trong MySQL. Redis dùng cache/rate-limit; ML là FastAPI chứa đúng một Siamese BiGRU + Attention.

Dữ liệu được kiểm kê trước migration: 153 users, 132 jobs, 125 resumes, 618 applications, 632 notifications, 730 audit logs và 7 settings. Backup read-only nằm ngoài repository tại `/tmp/jobportal-pre-microservices-20261128-111220`; SHA-256 SQL là `4319b67faee3825f4d806b1bb04adee14510ff572fc63df30633e5625e30938e`, SHA-256 uploads là `61b1e6d4f70e710d9066c6ae014086c6c626cf8914c1bdee4ac33a60ba4d081c`. Không có dữ liệu/volume MySQL bị xóa hoặc ghi đè.

## 2. Kiến trúc microservices cuối cùng

NGINX gateway giữ nguyên public path. Tám runtime độc lập nằm trên internal Docker network; chỉ gateway được publish. Một PostgreSQL instance chứa tám database và tám role khác nhau. Redis Streams vận chuyển domain event. Object storage S3-compatible giữ tài liệu private. Matching dùng PostgreSQL + pgvector và artifact ML hiện hữu.

## 3. Biên và trách nhiệm service

- `identity-service`: credential, password hash, JWT, role/status.
- `user-service`: profile, JSONB skills/experience/education, settings, audit.
- `company-service`: company profile và owner.
- `job-service`: job lifecycle, tìm kiếm, employer ownership.
- `resume-service`: metadata, private object, authorized download.
- `application-service`: application lifecycle, duplicate guard, job snapshot.
- `matching-service`: quality gate, neural score hiện hữu, vector và exact retrieval.
- `notification-service`: inbox và consumer application events.

Shared package chỉ chứa logging, auth middleware, DB pool, metrics, outbox/event infrastructure; không chứa ORM model hay business rule.

## 4. Quyền sở hữu database và schema

Database tương ứng: `identity_db`, `user_db`, `company_db`, `job_db`, `resume_db`, `application_db`, `matching_db`, `notification_db`. Mỗi role chỉ sở hữu và có quyền CONNECT database của mình; quyền CONNECT mặc định của `PUBLIC` đã bị thu hồi. Connection limit là 20; pool trong service bị chặn ở 8 (matching 3). Không có foreign key xuyên database; application giữ UUID bên ngoài và immutable `job_snapshot` JSONB. Kiểm thử xác nhận `identity_service` kết nối được `identity_db` nhưng bị từ chối kết nối `job_db`.

## 5. Trạng thái MySQL sang PostgreSQL

`microservices/data-migration/migrate.js` mặc định dry-run, chỉ ghi khi có `--apply`, dùng upsert theo `legacy_id`, phát hiện email/application trùng, giữ password hash/timestamp/base64/path, và kiểm tra parity. UUIDv5 cố định theo `entity-type:legacy-id` làm reference conversion tái lập được. Script đã được apply trên PostgreSQL test cô lập và PASS parity `153/132/125/618/632/730/7`; không có duplicate email, duplicate application active, reference thiếu hoặc password hash sai. Production chưa được apply/cutover tự động; đây là chủ ý.

## 6. UUID và JSONB

Primary key mới là native UUID. JSONB dùng cho profile có cấu trúc, settings, metadata, snapshots, event payload và ML result; core fields vẫn là cột typed với NOT NULL/CHECK/UNIQUE. GIN index chỉ đặt trên trường JSONB/search cần truy vấn. Frontend không còn ép job ID thành số tại trang chi tiết.

## 7. pgvector và validation

Artifact thực tế có BiGRU 64 unit hai chiều, do đó encoder output là 128 chiều và schema dùng `vector(128)`. Embedding có `model_version_id`, content hash, owner, timestamp, invalidation. Exact cosine search được dùng trước; chưa tạo HNSW do corpus hiện tại nhỏ và chưa có benchmark recall/latency đại diện. Kiểm thử event thật xác nhận `job.updated` được consume idempotent và đặt `invalidated_at`. Truy vấn vector tổng hợp cho cosine `1.000` và `0.000` đúng kỳ vọng. Quality/readiness và `CVJD_MATCHING_ENABLED` vẫn chặn model không đạt chuẩn: `/health` trả 200 nhưng `/ready` trả 503 khi artifact chưa qua gate; cosine result mang cảnh báo experimental và không được coi là xác suất tuyển dụng.

## 8. REST và event contract

REST nội bộ có service token, request ID và timeout. Event v1 nằm tại `microservices/contracts/domain-events.v1.json`. Identity/job/resume/application ghi outbox cùng transaction business, gồm cả `user.deleted` khi admin xóa identity. Publisher dùng Redis Stream `jobportal.events.v1`; consumer có processed-event idempotency, retry counter và dead-letter stream. Notification consume application events; matching consume job/resume update/delete.

## 9. Docker

Mỗi service có Dockerfile độc lập, non-root runtime và healthcheck. `compose.microservices.yaml` là local/full base; profile `frontend` và `ml` bật thành phần tùy chọn; team/production overrides tách riêng. PostgreSQL, Redis, object storage và service không publish port. Production NGINX template hỗ trợ TLS certificate mount ngoài Git. MinIO được build từ release source chính thức đã pin vì image community prebuilt không còn được phát hành theo cách cũ.

## 10. Bảo mật và toàn vẹn

JWT được verify lại tại từng service; RBAC và ownership không dựa vào header từ client. Query đều parameterized. Resume/application giới hạn 5 MiB, chỉ PDF/DOCX, bucket private, download `no-store`. Log redact authorization/password/file data. Secret chỉ có file example; file thật bị `.gitignore`. Matching kiểm tra resume owner lần nữa sau internal REST.

## 11. Test và performance

Trạng thái phải đọc theo bảng dưới, không suy diễn thành production scalability:

| Kiểm tra | Trạng thái |
|---|---|
| JavaScript syntax, Python compile, Compose config | PASS |
| Build gateway + 7 Node service | PASS |
| PostgreSQL init: 8 DB/role + pgvector | PASS |
| Core versioned migrations và service startup | PASS |
| Unit tests service | PASS: 7/7 Node; Python contract 128 chiều PASS |
| Dependency audit production packages | PASS: 0 vulnerability ở các package/lockfile mới |
| Full S3 upload/download | PASS: upload/download private, checksum trùng khớp |
| Matching image/readiness/vector/event invalidation | PASS; model readiness 503 là quality gate đúng thiết kế |
| MySQL dry-run/apply/parity | PASS trên PostgreSQL test: 153/132/125/618/632/730/7; production NOT APPLIED |
| Cross-service reference và password hash | PASS: 0 reference thiếu, 0 hash không phải bcrypt |
| PostgreSQL least-privilege CONNECT | PASS |
| Redis outage + transactional outbox recovery | PASS: register 201, event publish sau recovery, 0 process restart |
| PostgreSQL outage/recovery | PASS: business/health 503 sau ~5 giây, hồi phục 200, 0 process restart |
| Frontend build/lint | PASS: build 216 modules; lint 0 error, 5 warning Fast Refresh có sẵn |
| Playwright critical workflows | PASS: Candidate register/CV/apply; Employer login/post job; Admin dashboard/audit; console cuối 0 error |
| Load test cục bộ giới hạn | PASS 100/100, concurrency 5: p50 66 ms, p95 167 ms, p99 378 ms, 0 lỗi |

## 12. File tạo/sửa

Tạo `microservices/` gồm shared kit, 8 service, migrations, contracts, gateway, object storage build và data migration; tạo ba Compose files; thêm Prometheus config và báo cáo này. Sửa `.gitignore`, `eslint.config.js`, `README.md`, `JobDetailPage.jsx` và `UserDashboard.jsx`. Legacy backend/compose/schema không bị xóa.

## 13. Lệnh chạy và migration

```bash
cp microservices/.env.example microservices/.env
set -a; . microservices/.env; set +a
docker compose -f compose.microservices.yaml up -d --build
docker compose -f compose.microservices.yaml --profile frontend --profile ml up -d --build
```

Gateway local mặc định là `http://127.0.0.1:8088` để không xung đột stack legacy; có thể đặt `MICROSERVICES_GATEWAY_PORT` trước khi chạy.

Chạy một service độc lập sau khi infrastructure/migration sẵn sàng:

```bash
docker compose -f compose.microservices.yaml up -d postgres redis identity-service
docker compose -f compose.microservices.yaml restart identity-service
docker compose -f compose.microservices.yaml up -d --scale job-service=2 job-service
```

Migration dữ liệu dùng hướng dẫn trong `microservices/data-migration/README.md`; luôn chạy `dry-run`, backup/checksum, rồi mới `apply` và `verify`.

## 14. Môi trường dùng chung

Team giữ secret trong secret manager hoặc file ngoài Git, dùng override:

```bash
docker compose -f compose.microservices.yaml -f compose.microservices.team.yaml --profile frontend up -d
```

Không chia sẻ JWT/service token qua chat. Chỉ gateway/frontend được mở ra LAN; database và queue vẫn internal.

## 15. Rollback

Không dừng/xóa legacy trước cutover. Nếu canary lỗi, đổi traffic gateway về backend cũ, dừng project Compose mới (không dùng `-v`), lưu PostgreSQL/object-store backup và tiếp tục MySQL. Vì migration là copy + upsert, rollback không cần ghi ngược vào MySQL. Chỉ xóa volume mới sau khi có phê duyệt và backup độc lập.

## 16. Blocker và giới hạn còn lại

- Dữ liệu đã được apply và xác minh ở môi trường test cô lập; production vẫn chưa apply/cutover và cần cửa sổ vận hành được phê duyệt.
- Company được chuẩn hóa từ chuỗi `jobs.company`; cần business owner xác nhận merge/alias.
- Base64/path legacy được bảo toàn trước, nhưng các path không còn file cần báo cáo riêng khi import object.
- Semantic cosine chưa được chứng minh quality; HNSW và enable production đều bị giữ lại.
- Application employer filtering hiện compose qua job REST từng record; cần read model event-driven trước tải lớn.
- Load test hiện chỉ là 100 request đọc ở concurrency 5 trên máy local; chưa kiểm chứng soak, peak production, autoscaling hay multi-host.
- Một số báo cáo phân tích nâng cao cần contract test bổ sung trước cutover dù các workflow Candidate/Employer/Admin chính, user deletion, application verification và audit CSV export đã PASS.
- TLS/secret manager/backup destination production cần hạ tầng thực tế, không được tự động giả định trong local Compose.
