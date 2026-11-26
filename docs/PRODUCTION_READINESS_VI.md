# Báo cáo khả năng mở rộng, hiệu năng và mức sẵn sàng production

Ngày kiểm tra: 26/11/2026 (Asia/Ho_Chi_Minh)

## Kết luận

Hệ thống đã được nâng cấp theo kiến trúc modular monolith, có image production, NGINX, hai backend replica, Redis cache/rate limit, MySQL migration chỉ bổ sung index, Prometheus, Grafana, structured logging, health/readiness, graceful shutdown, backup/restore và k6. Luồng Docker development/hot reload vẫn hoạt động.

Chưa đủ bằng chứng để tuyên bố production-ready hoặc đưa ra số người dùng hỗ trợ. Chưa chạy load/stress/spike/soak kéo dài; TLS và hạ tầng đa host chưa được cấu hình; bộ test cũ dùng fixture tài khoản đã lỗi thời; hai dependency audit còn cảnh báo mức moderate chỉ có cách sửa breaking.

## 1. Kiến trúc đã triển khai

```text
Browser
  -> NGINX :8080 (loopback, SPA/static, compression, cache headers, security headers)
       -> backend:3001 x 2 (Express modular monolith, JWT stateless)
            -> MySQL 8.4 (system of record, pool tối đa 5/replica)
            -> Redis 7.4 (cache công khai + rate limit phân tán, AOF/noeviction)
            -> private resume cache volume; dữ liệu file chính xác vẫn có bản trong MySQL

Prometheus <- /metrics trên từng backend qua DNS discovery
Prometheus <- Redis exporter
Grafana <- Prometheus
```

- NGINX cân bằng `least_conn`, dùng Docker DNS có re-resolution khi replica thay đổi.
- MySQL, Redis và Redis exporter không publish ra host.
- Prometheus/Grafana chỉ bind `127.0.0.1`.
- `/metrics` chỉ dùng ở mạng nội bộ; NGINX trả 404 cho đường dẫn công khai này.
- JWT không có session trong bộ nhớ nên request có thể đi tới bất kỳ replica nào.
- Nhiều container trên cùng một host không phải high availability.

## 2. Công nghệ được tích hợp và lý do

- NGINX 1.27.4: phục vụ Vite build, SPA fallback, reverse proxy, compression, static caching, giới hạn upload 6 MiB và cân bằng backend.
- Redis 7.4.2 + client `redis`: cache-aside danh sách job công khai và rate limiting dùng chung giữa replica. Redis dùng AOF/everysec và `noeviction`.
- Pino/Pino HTTP: log JSON, che authorization/cookie/password/token.
- Prometheus client + Redis exporter + Prometheus 3.1 + Grafana 11.4: HTTP rate/latency/error, Node CPU/memory/event-loop, database pool, Redis và cache outcomes.
- k6 0.54: smoke/baseline/load/stress/spike/soak có threshold và workload read-only.

Không tích hợp:

- MinIO: bản ghi resume/application hiện đã giữ chính xác file dưới dạng base64 trong MySQL và download có kiểm tra quyền. Local file chỉ là cache; replica khác có thể phục hồi từ DB. Tự động migrate file sẽ tăng rủi ro và không cần cho kiểm thử single-host hiện tại. S3-compatible storage vẫn nên là bước sau khi dung lượng file tăng.
- BullMQ: repository không có AI service, email sender hoặc tác vụ nền tốn kém đang hoạt động. PDF fallback và recommendation hiện đồng bộ theo contract; đưa vào queue sẽ đổi contract mà chưa có phê duyệt. Vì vậy phase này là NOT APPLICABLE, không thêm dependency không có workload.

## 3. Database, cache và storage

### MySQL

- Pool cấu hình qua `DB_POOL_MAX`, `DB_POOL_MIN`, `DB_POOL_ACQUIRE_MS`, `DB_POOL_IDLE_MS`; production đặt 5 connection/replica.
- Với 2 replica: trần pool ứng dụng là 10, dưới `max_connections=151`; đo thực tế `Threads_connected=3` khi benchmark.
- Pagination public jobs và employer jobs được ép `page >= 1`, `1 <= limit <= 100`.
- Không phát hiện N+1 ở các listing chính: Sequelize dùng include/join hoặc hai query tập hợp. Không rewrite business query.
- Query public jobs đã dùng index `createdAt`; không thêm index job listing suy đoán.
- Migration reversible bổ sung:
  - `applications(jobId, applicationDate)`
  - `applications(applicantEmail, applicationDate)`
  - `notifications(userId, isRead, createdAt)`
  - `resumes(userId, isDefault, createdAt)`
  - `jobs(employerId, createdAt)`

Migration chỉ được chạy trên bản sao DB cô lập trong quá trình validation, không chạy vào development DB.

### Redis cache

- Chỉ cache `GET /api/jobs` công khai; key SHA-256 bao gồm toàn bộ query string nên giữ nguyên filter/page/sort.
- TTL mặc định 30 giây (`JOBS_CACHE_TTL_SECONDS`).
- Version key được tăng sau create/update/status/delete job; key cũ tự hết hạn.
- Lock ngắn 2,5 giây và polling giới hạn giúp giảm cache stampede.
- Redis lỗi thì request bypass cache và rate limiter chuyển sang local memory; core API vẫn phục vụ.
- Không cache auth, resume, application, profile, notification hoặc dữ liệu riêng tư.

### Rate limit

- API chung: mặc định 3.000 request/phút/IP.
- Login: 10 lần thất bại/15 phút, request login thành công được hoàn lại counter.
- Register: 20/giờ/IP.
- Upload/application upload: 60/giờ/IP.
- IP được hash trong key Redis; không đưa token hoặc PII vào metric.

### Resume storage

- Upload private vẫn đi qua Multer, giới hạn 5 MiB và MIME/extension validation.
- File local/named volume là cache; exact bytes được lưu ở `resumes.fileData` hoặc `applications.fileData` và có thể phục hồi ở replica khác.
- Download vẫn yêu cầu owner/admin/owning employer theo route hiện tại.
- Không migrate hoặc xóa file/volume hiện có.
- Giới hạn: blob trong MySQL làm tăng backup/replication cost; cần S3-compatible storage trước khi tăng lớn dung lượng CV hoặc chạy đa host.

## 4. Kết quả đo thực tế

Môi trường: Linux x86_64, 4 CPU, RAM 7,6 GiB, Docker 29.8.2, Compose 5.6.0, Node 20.20.1. Dataset snapshot tương đương: 132 jobs, 519 application trước khi các regression probe cô lập chạy, 153 users.

Workload k6: read-only `GET /api/jobs`, ramp 1->5 VU trong 10 giây, giữ 5 VU 30 giây, ramp down 10 giây, sleep 200 ms, cùng dataset.

| Chỉ số | Baseline dev: 1 backend, không Redis/NGINX | Optimized: NGINX + 2 backend + Redis |
|---|---:|---:|
| Requests | 997 | 999 |
| Request/s thực tế | 19,881 | 19,961 |
| Error rate | 0% | 0% |
| Average | 4,865 ms | 4,357 ms |
| p50 | 4,158 ms | 3,652 ms |
| p95 | 8,908 ms | 8,871 ms |
| p99 | 11,922 ms | 13,880 ms |
| Max | 24,146 ms | 24,483 ms |

Nhận xét: average/p50 tốt hơn, p95 gần như ngang, p99 xấu hơn nhẹ do thêm NGINX/Redis/network hop. Throughput bị pacing của script giới hạn nên không phải capacity test.

Cache probe riêng sau invalidation: 73 request, 1 miss + 72 hit, hit rate 98,63%, 0% lỗi. Với workload này chỉ miss đầu cần query DB.

Resource sample trong benchmark 5 VU:

| Service | CPU | Memory |
|---|---:|---:|
| backend-1 | 5,43% | 43,91 MiB / 512 MiB |
| backend-2 | 5,38% | 45,23 MiB / 512 MiB |
| MySQL | 0,72% | 462 MiB / 1 GiB |
| Redis | 6,45% | 4,95 MiB / 256 MiB |
| NGINX | 0,97% | 4,70 MiB / 128 MiB |

EXPLAIN trên bản sao cô lập: employer application query từ cold table-scan 6,14 ms sang warm/analyzed indexed path 0,161 ms. Đây chỉ là tín hiệu định hướng vì `ANALYZE TABLE` và buffer warming cũng ảnh hưởng; không quy toàn bộ cải thiện cho index.

Artifact:

- `docs/performance/baseline-summary.json`
- `docs/performance/optimized-summary.json`
- `docs/performance/cache-summary.json`

## 5. Functional regression và reliability validation

- PASS: production build.
- PASS: ESLint, 0 error; còn 5 warning Fast Refresh đã tồn tại ở context files.
- PASS: syntax check toàn bộ backend scripts/source.
- PASS: API role smoke với demo data: Admin, Employer, Candidate login + `/me`; public jobs; candidate applications; employer jobs/applications; admin users/statistics đều HTTP 200.
- PASS: Playwright Firefox: landing page, job detail, login page không có console error sau fix, candidate login qua NGINX/CORS và candidate dashboard render dữ liệu.
- PASS: hai backend replica phân phối 20 request theo tỷ lệ 10/10; cache được ghi ở replica này và hit ở replica kia.
- PASS: Prometheus thấy 2 backend target và Redis exporter đều `up`; Grafana health `database=ok`.
- PASS: backup gzip verify và restore vào DB tách biệt `job_portal_restore_test`.
- FAIL: bộ Node regression cũ dùng tài khoản `jane.smith@example.com`, `admin@example.com`, ... không còn trong dataset. Test seeker thất bại giống nhau ở development và isolated production copy trước khi chạy business assertions. Không tự seed/reset theo constraint.
- NOT VERIFIED: stress, spike, soak, external AI, multi-host failover, TLS và restore trên infrastructure ngoài máy local.

Audit dependency sau security lockfile update:

- Backend production: không còn high/critical; còn 2 moderate qua Sequelize/uuid, npm chỉ đề xuất downgrade Sequelize breaking.
- Frontend: còn 2 moderate qua React Router; npm chỉ đề xuất React Router 7 breaking.
- Không dùng `--force` để tránh thay đổi contract/dependency major.

## 6. Trạng thái từng phase

| Phase | Trạng thái | Ghi chú |
|---|---|---|
| 0 - Audit/baseline | PASS | Git ban đầu sạch; baseline và resource/DB evidence đã lưu |
| 1 - Production foundation | PASS | Production images, NGINX, health, graceful shutdown, private networks, headers |
| 2 - MySQL optimization | PASS | Pool, bounded pagination, EXPLAIN, migration additive/reversible trên DB cô lập |
| 3 - Redis cache/rate limit | PASS | Shared cache, invalidation, stampede lock, distributed limits, graceful fallback |
| 4 - Shared storage/horizontal scale | PASS | JWT stateless, DB-backed private resume recovery, 2 replica validated trên 1 host |
| 5 - BullMQ/async | NOT APPLICABLE | Không có workload nền/AI/email thực tế phù hợp mà không đổi contract |
| 6 - Observability/reliability | PASS | Metrics/logging/dashboard/backup/restore validated |
| 7 - Performance/regression | FAIL | k6/build/lint/role/browser pass nhưng regression suite cũ fail do stale fixtures; stress/spike/soak chưa chạy |

## 7. File đã tạo và thay đổi

Tạo mới:

- `Dockerfile.production`, `backend/Dockerfile.production`, `compose.production.yaml`
- `ops/nginx/nginx.conf`
- `ops/prometheus/prometheus.yml`
- `ops/grafana/provisioning/**`, `ops/grafana/dashboards/job-portal-overview.json`
- `backend/src/config/redis.js`, `backend/src/lib/logger.js`
- `backend/src/middleware/cache.js`, `backend/src/observability/metrics.js`
- `backend/src/migrations/add-scalability-indexes.js`
- `backend/src/scripts/run-scalability-indexes.js`
- `tests/performance/jobs.js`
- `scripts/backup-mysql.sh`, `scripts/restore-mysql-test.sh`
- `docs/performance/*.json`, tài liệu này.

Thay đổi:

- Backend startup/database: `src/index.js`, `src/config/database.js`, `.env.example`.
- Cache/rate/upload/routes: `rateLimiter.js`, job/application/resume routes, `jobController.js`.
- Index metadata/migration runner: Application/Job/Notification/Resume models và `run-all-migrations.js`.
- Docker secret generator thêm Grafana password.
- Existing test scripts nhận `API_BASE_URL` để có thể trỏ tới môi trường cô lập.
- `package.json`/lockfiles: thêm Redis/Pino/Prometheus client và áp dụng security fix trong semver hiện tại.

Không thay đổi UI/business algorithms/API response schema/auth route/authorization semantics.

## 8. Lệnh vận hành chính xác

### Development

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f backend frontend
```

Stop nhưng giữ data/volume:

```bash
docker compose down
```

Không dùng `down -v`.

### Production local

```bash
docker compose -f compose.production.yaml up -d --build --scale backend=2
docker compose -f compose.production.yaml ps
curl -fsS http://127.0.0.1:8080/api/health
```

Scale backend, không publish port backend:

```bash
docker compose -f compose.production.yaml up -d --no-deps --scale backend=3 backend
```

Stop giữ volume:

```bash
docker compose -f compose.production.yaml down
```

Web: `http://127.0.0.1:8080`; Prometheus: `http://127.0.0.1:9090`; Grafana: `http://127.0.0.1:3000` (user `admin`). Grafana password nằm trong Docker secret volume; chỉ đọc trực tiếp trên host quản trị khi cần:

```bash
docker compose -f compose.production.yaml exec -T grafana sh -c 'cat /run/db-secrets/grafana_admin_password'
```

### HTTPS cho public deployment

Đặt TLS termination ở load balancer/reverse proxy ngoài host hoặc thêm server 443 với certificate do ACME quản lý; redirect 80->443; truyền `X-Forwarded-Proto`; đặt `FRONTEND_URL=https://ten-mien`; chỉ bật HSTS sau khi HTTPS đã được kiểm chứng. Không dùng certificate tự ký cho public traffic. Không mở port MySQL/Redis/Prometheus/Grafana ra Internet.

### Performance test

```bash
docker run --rm --network host \
  -v "$PWD/tests/performance:/scripts:ro" \
  -e BASE_URL=http://127.0.0.1:8080 \
  -e PROFILE=smoke \
  grafana/k6:0.54.0 run /scripts/jobs.js
```

Thay `PROFILE` lần lượt bằng `baseline`, `load`, `stress`, `spike`, `soak`. Chỉ tăng tải ở môi trường cô lập; dừng khi error rate/latency/resource vượt threshold. Không chạy profile cao với production/AI provider.

### Build/lint/regression

```bash
npm ci
npm run build
npm run lint

cd backend
npm ci
API_BASE_URL=http://127.0.0.1:8080/api npm test
```

Lưu ý: `npm test` hiện FAIL vì fixture account cũ; cần cập nhật fixture/test setup riêng thay vì seed production data.

### Backup/restore

```bash
scripts/backup-mysql.sh ./backups
scripts/restore-mysql-test.sh ./backups/job_portal_YYYYMMDDTHHMMSSZ.sql.gz job_portal_restore_test
```

Restore script từ chối DB không kết thúc bằng `_test`/`_restore` và từ chối overwrite database đã tồn tại.

## 9. Rollback

- Dừng production bằng `docker compose -f compose.production.yaml down`; không thêm `-v`.
- Revert application/container source về phiên bản trước rồi build lại; volume DB/Redis/upload không bị xóa.
- Scale về một replica: `docker compose -f compose.production.yaml up -d --no-deps --scale backend=1 backend`.
- Redis lỗi không cần rollback app ngay: cache/rate limiter tự fallback; điều tra Redis rồi restart service.
- Rollback chỉ các index additive, sau khi kiểm tra workload:

```bash
docker compose -f compose.production.yaml run --rm db-init sh -lc \
  'export DB_PASSWORD=$(cat /run/db-secrets/mysql_app_password); npm run migrate:scalability:down'
```

- Không rollback bằng cách xóa database/volume/file upload.

## 10. Blocker, rủi ro và cải tiến hoãn lại

1. Cập nhật regression fixtures và tạo test setup tự cô lập; hiện phase 7 chưa xanh hoàn toàn.
2. Chạy load/stress/spike/soak trên staging có dataset/resource cố định; chưa có capacity number.
3. Cấu hình domain/TLS, secret manager và off-host encrypted backup trước public deployment.
4. MySQL/Redis vẫn là single instance; hai backend trên một host không chống host/DB failure.
5. Chuyển CV blob sang private S3-compatible storage khi volume lớn hoặc triển khai đa host; migration phải explicit, resumable và không xóa file cũ.
6. Chỉ thêm BullMQ khi có workload async thực tế và API contract cho job status/idempotency được phê duyệt.
7. Đánh giá breaking upgrade React Router/Sequelize để xử lý hai moderate audit warning còn lại.
8. `prom-client` đã phát cảnh báo package được thay thế; migration sang client kế nhiệm cần task riêng để tránh đổi metric contract ngoài phạm vi.
