# JobPortal

JobPortal là nền tảng tuyển dụng full-stack dành cho ba nhóm người dùng: **Ứng viên**, **Nhà tuyển dụng** và **Quản trị viên**. Dự án gồm frontend React, REST API Express, MySQL, xác thực JWT, phân quyền theo vai trò và bộ dữ liệu demo lớn để có thể trải nghiệm gần như toàn bộ quy trình tuyển dụng.

## Mục lục

- [Chức năng chính](#chức-năng-chính)
- [Tài khoản demo](#tài-khoản-demo)
- [Dữ liệu hiện có trong database](#dữ-liệu-hiện-có-trong-database)
- [Kiến trúc và công nghệ](#kiến-trúc-và-công-nghệ)
- [Chạy nhanh bằng Docker](#chạy-nhanh-bằng-docker)
- [Các lệnh sử dụng hằng ngày](#các-lệnh-sử-dụng-hằng-ngày)
- [Chạy trực tiếp bằng Node.js](#chạy-trực-tiếp-bằng-nodejs)
- [API chính](#api-chính)
- [Kiểm tra chất lượng](#kiểm-tra-chất-lượng)
- [Xử lý lỗi thường gặp](#xử-lý-lỗi-thường-gặp)

## Chức năng chính

### Khách chưa đăng nhập

- Xem homepage tuyển dụng responsive trên desktop, tablet và mobile.
- Tìm việc theo từ khóa, tên công ty và địa điểm.
- Lọc theo loại công việc, cấp độ kinh nghiệm và khoảng lương.
- Sắp xếp danh sách theo thời gian, lương hoặc tên vị trí.
- Duyệt danh mục nghề nghiệp và các doanh nghiệp đang tuyển.
- Xem chi tiết công việc, yêu cầu, trách nhiệm, quyền lợi và thông tin liên hệ.
- Đăng ký Candidate hoặc Employer và đăng nhập.
- Chuyển đổi giao diện sáng/tối.

### Ứng viên — `jobseeker`

Sau đăng nhập thông thường, Candidate được đưa về homepage `/` và dùng cùng giao diện tìm việc với khách. Menu tài khoản dẫn tới toàn bộ Candidate workspace.

- **Overview**: KPI, hồ sơ gần đây và việc làm gợi ý.
- **Applications**: danh sách hồ sơ đã nộp và trạng thái xử lý.
- **Saved Jobs**: công việc đã lưu theo tài khoản trên trình duyệt.
- **Recommended Jobs**: gợi ý dựa trên kỹ năng và dữ liệu việc làm.
- **Resumes**: tải lên, tải xuống, đặt mặc định và xóa CV.
- Nộp hồ sơ kèm CV và thư giới thiệu.
- Theo dõi toàn bộ pipeline từ chờ duyệt đến nhận việc.
- Rút hồ sơ ứng tuyển khi luồng nghiệp vụ cho phép.
- Xem và quản lý thông báo cá nhân.
- Khôi phục phiên bằng JWT và quay lại protected route sau đăng nhập.

### Nhà tuyển dụng — `employer`

- Dashboard tổng quan việc làm, ứng viên, hồ sơ chờ duyệt và phỏng vấn.
- Đăng tin tuyển dụng mới.
- Xem, sửa và quản lý trạng thái các tin thuộc quyền sở hữu.
- Xem ứng viên theo từng công việc và tải CV khi có quyền.
- Cập nhật trạng thái hồ sơ trong pipeline tuyển dụng.
- Quản lý danh sách ứng viên và phỏng vấn.
- Xem analytics tuyển dụng và thiết lập tài khoản doanh nghiệp.
- Nhận thông báo về hoạt động tuyển dụng.

### Quản trị viên — `admin`

- Dashboard và thống kê hệ thống.
- Quản lý toàn bộ việc làm.
- Quản lý người dùng, phân trang, vai trò và trạng thái.
- Quản lý nhà tuyển dụng và hồ sơ ứng tuyển.
- Xem báo cáo/analytics và thông báo quản trị.
- Quản lý cấu hình hệ thống theo nhóm.
- Xem audit log, hoạt động người dùng và thống kê hệ thống.
- Các thao tác nhạy cảm được bảo vệ bằng JWT và role guard.

### Bảo mật và vận hành

- Mật khẩu băm bằng `bcryptjs`.
- JWT authentication và endpoint khôi phục phiên `/api/auth/me`.
- Phân quyền Candidate/Employer/Admin ở frontend và backend.
- Rate limiting cho đăng nhập, đăng ký, API và upload.
- Kiểm tra quyền sở hữu việc làm và quyền truy cập CV.
- CORS theo danh sách origin cấu hình.
- Health check, structured logging, graceful shutdown và Prometheus metrics.
- Redis cache danh sách việc làm trong production.

## Tài khoản demo

Các tài khoản sau đã được kiểm tra trên database development hiện tại:

| Vai trò | Email | Mật khẩu | Trang sau đăng nhập |
| --- | --- | --- | --- |
| Candidate | `candidate002@scale.demo.jobportal.vn` | `Demo@123` | `/` |
| Employer | `talent01@scale.demo.jobportal.vn` | `Demo@123` | `/employer` |
| Admin | `operations@scale.demo.jobportal.vn` | `Demo@123` | `/admin` |

> Đây là tài khoản development. Seeder dùng biến `DEMO_PASSWORD` nếu được cấu hình; nếu không có, mật khẩu mặc định là `Demo@123`. Không dùng các thông tin này trong production.

## Dữ liệu hiện có trong database

### Snapshot thực tế

Số liệu dưới đây được đọc trực tiếp, chỉ-read, từ database `job_portal` đang chạy trong Docker ngày **26/11/2026**. Số lượng có thể thay đổi khi sử dụng các chức năng ghi dữ liệu.

| Bảng | Số bản ghi | Nội dung |
| --- | ---: | --- |
| `users` | 153 | Candidate, Employer và Admin |
| `jobs` | 132 | Tin tuyển dụng thuộc các Employer |
| `applications` | 618 | Hồ sơ liên kết Candidate–Job |
| `resumes` | 125 | CV PDF demo, metadata và dữ liệu file |
| `notifications` | 632 | Thông báo ứng viên/nhà tuyển dụng |
| `audit_logs` | 730 | Nhật ký nghiệp vụ và hệ thống |
| `system_settings` | 7 | Cấu hình theo nhóm |

### Phân bố người dùng

| Vai trò | Tổng | Active | Inactive | Blocked |
| --- | ---: | ---: | ---: | ---: |
| Candidate (`jobseeker`) | 127 | 122 | 4 | 1 |
| Employer | 24 | 23 | 1 | 0 |
| Admin | 2 | 2 | 0 | 0 |

### Phân bố việc làm

- Trạng thái: 118 `Published`, 10 `Draft`, 1 `Closed` và 3 bản ghi legacy ở trạng thái `active`/`inactive`/`filled`.
- Loại: 40 Full-time, 30 Part-time, 31 Contract và 31 Internship.
- Kinh nghiệm: 25 Entry Level, 28 Mid Level, 29 Senior Level, 25 Lead và 25 Manager.
- 24 Employer sở hữu ít nhất một việc làm.
- Dữ liệu việc làm hiện có trải từ tháng 09/2026 đến tháng 11/2026.

### Phân bố hồ sơ ứng tuyển

| Trạng thái | Số lượng |
| --- | ---: |
| `pending` | 69 |
| `under_review` | 70 |
| `shortlisted` | 70 |
| `interview_scheduled` | 70 |
| `interviewed` | 69 |
| `offered` | 68 |
| `accepted` | 67 |
| `rejected` | 69 |
| `withdrawn` | 66 |

Có 125 Candidate sở hữu hồ sơ ứng tuyển và 130 Job đã nhận ít nhất một hồ sơ. Tất cả 125 CV demo hiện tại đều là CV mặc định. Trong 632 thông báo có 261 chưa đọc và 371 đã đọc.

### Tính thực tế của dữ liệu demo

- Họ tên Việt Nam, số điện thoại, địa điểm, kỹ năng, học vấn và kinh nghiệm.
- Doanh nghiệp thuộc công nghệ, tài chính, thương mại điện tử, logistics và giáo dục.
- Địa điểm: Hồ Chí Minh, Hà Nội, Đà Nẵng, Cần Thơ, Hải Phòng và Remote tại Việt Nam.
- Vị trí frontend/backend/full-stack, data, DevOps/cloud, QA, product, security, mobile, AI/ML và tuyển dụng kỹ thuật.
- Kỹ năng React/TypeScript, Node.js/MySQL/Docker, Python/SQL/Power BI, AWS/Kubernetes/CI-CD, Figma/Design System và Java/Spring/Kafka.
- Mức lương VNĐ, hạn ứng tuyển, quyền lợi, yêu cầu, trách nhiệm và thông tin liên hệ.
- CV PDF, thư giới thiệu, mức lương mong muốn và thời gian có thể bắt đầu.
- Application phân bố qua toàn bộ pipeline tuyển dụng.
- Notification và audit log tham chiếu đúng dữ liệu liên quan.

Dataset lớn cơ sở được thiết kế với 1 Admin, 20 Employer, 120 Candidate, 120 Job và 5 Application cho mỗi Candidate. Database hiện tại có thêm dữ liệu từ các seed/demo trước đó nên tổng thực tế lớn hơn các con số cơ sở.

### Quan hệ giữa các bảng

```text
users (Employer) 1 ─── n jobs
users (Candidate) 1 ─── n applications n ─── 1 jobs
users             1 ─── n resumes
users             1 ─── n notifications
users             1 ─── n audit_logs (performedBy / targetUserId)
users (Admin)     1 ─── n system_settings (updatedBy)
```

Các khóa ngoại trong MySQL:

- `jobs.employerId → users.id`
- `applications.userId → users.id`
- `applications.jobId → jobs.id`
- `resumes.userId → users.id`
- `notifications.userId → users.id`
- `audit_logs.performedBy → users.id`
- `audit_logs.targetUserId → users.id`
- `system_settings.updatedBy → users.id`

## Kiến trúc và công nghệ

### Stack

- **Frontend:** React 19, React Router, Vite, Tailwind CSS, React Query, Axios, React Hook Form, Yup.
- **Backend:** Node.js, Express, Sequelize, JWT, bcrypt, Multer, Pino, Prometheus client.
- **Database:** MySQL 8.4.
- **Production cache:** Redis 7.
- **Hạ tầng:** Docker Compose, NGINX production image, Prometheus và Grafana.

### Luồng Docker development

```text
Browser
  ├── http://localhost:5173 ──> frontend (Vite/HMR)
  └── http://localhost:3001 ──> backend (Express/nodemon)
                                      │
                                      └── db:3306 (MySQL trong Docker network)
```

MySQL development **không publish cổng ra host**. Backend kết nối hostname `db`, cổng nội bộ `3306`. MySQL đang nghe tại `localhost:3306` trên host, nếu có, không phải database Docker của dự án.

### Cấu trúc thư mục

```text
job-portal/
├── src/
│   ├── components/            # UI dùng chung và theo vai trò
│   ├── context/               # Auth, jobs, applications, saved jobs, theme
│   ├── pages/                 # Public, auth, Candidate, Employer, Admin
│   └── services/              # API clients
├── backend/
│   ├── src/controllers/       # API controllers
│   ├── src/models/            # Sequelize models và associations
│   ├── src/routes/            # Express routes
│   ├── src/migrations/        # Database migrations
│   └── src/seeders/           # Seed nhỏ, demo và dataset lớn
├── docs/                      # Tài liệu dự án
├── ops/                       # Prometheus/Grafana
├── compose.yaml               # Development
├── compose.production.yaml    # Production-like local
└── design-system/MASTER.md    # Quy chuẩn UI/UX
```

## Chạy nhanh bằng Docker

### Yêu cầu

- Docker Engine hoặc Docker Desktop.
- Docker Compose v2: `docker compose`.
- Cổng host `5173` và `3001` đang trống.

### Khởi động

Nếu image đã được build:

```bash
docker compose up -d
```

Lần đầu chạy hoặc khi Dockerfile/dependency thay đổi:

```bash
docker compose up -d --build
```

Compose sẽ:

1. Tạo secret MySQL cục bộ trong Docker volume nếu chưa có.
2. Khởi động MySQL và chờ health check.
3. Chạy migration bằng service `db-init`.
4. Khởi động backend với nodemon.
5. Khởi động frontend Vite với HMR.

Compose không tự chạy seeder lớn. Dataset hiện có được giữ trong volume `mysql_data`.

### URL development

| Thành phần | URL |
| --- | --- |
| Frontend | <http://localhost:5173> |
| Backend API | <http://localhost:3001> |
| Health check | <http://localhost:3001/api/health> |
| Readiness | <http://localhost:3001/ready> |
| Metrics | <http://localhost:3001/metrics> |

### Xác nhận trạng thái

```bash
docker compose ps
docker compose logs --tail=100 backend
docker compose logs --tail=100 frontend
docker compose logs --tail=100 db
```

Ba service `db`, `backend` và `frontend` cần ở trạng thái `healthy`. Hai service khởi tạo `db-secrets-init` và `db-init` kết thúc với exit code 0 là bình thường.

## Các lệnh sử dụng hằng ngày

Khởi động:

```bash
docker compose up -d
```

Dừng nhưng giữ container và dữ liệu:

```bash
docker compose stop
```

Khởi động lại:

```bash
docker compose start
```

Restart frontend/backend:

```bash
docker compose restart frontend backend
```

Xóa container/network nhưng giữ volume:

```bash
docker compose down
```

Theo dõi log:

```bash
docker compose logs -f frontend backend
```

> Không chạy `docker compose down -v` nếu muốn giữ database. Tùy chọn `-v` xóa cả `mysql_data`.

### Kiểm tra số lượng dữ liệu chỉ-read

```bash
docker compose exec db sh -lc 'mysql -u root --password="$(cat /run/db-secrets/mysql_root_password)" -D job_portal -e "SELECT COUNT(*) AS users FROM users; SELECT COUNT(*) AS jobs FROM jobs; SELECT COUNT(*) AS applications FROM applications;"'
```

Lệnh trên chỉ chạy `SELECT`, không thay đổi dữ liệu.

### Seed dữ liệu — chỉ chạy khi thực sự cần

Database hiện tại đã có dataset lớn. Không cần seed lại để sử dụng hằng ngày.

```bash
docker compose exec backend npm run seed-large
```

`seed-large` **có ghi dữ liệu**. Dù dùng `findOrCreate` để hạn chế trùng, seeder vẫn có thể tạo hoặc cập nhật dữ liệu. Chỉ chạy trên database development được phép thay đổi.

Các seeder khác:

```bash
docker compose exec backend npm run seed
docker compose exec backend npm run seed-users
docker compose exec backend npm run seed-demo
```

Không chạy nhiều seeder liên tiếp nếu muốn giữ nguyên snapshot hiện tại.

## Chạy trực tiếp bằng Node.js

### Yêu cầu

- Node.js và npm.
- MySQL có database `job_portal`.
- `backend/.env` có `JWT_SECRET` tối thiểu 16 ký tự.

### Cài đặt

```bash
npm install
cd backend
npm install
cp .env.example .env
```

Cấu hình tối thiểu trong `backend/.env`:

```dotenv
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_local_password
DB_NAME=job_portal
PORT=3001
NODE_ENV=development
JWT_SECRET=replace_with_a_secure_secret_at_least_16_chars
FRONTEND_URL=http://localhost:5173
```

Chạy migration — thao tác này thay đổi schema:

```bash
cd backend
npm run migrate
```

Terminal backend:

```bash
cd backend
npm run dev
```

Terminal frontend:

```bash
npm run dev
```

Frontend đọc `VITE_API_URL`; giá trị development mẫu là `http://localhost:3001`.

## Production-like local

```bash
docker compose -f compose.production.yaml up -d --build --scale backend=2
```

| Thành phần | URL mặc định |
| --- | --- |
| Web qua NGINX | <http://127.0.0.1:8080> |
| Grafana | <http://127.0.0.1:3000> |
| Prometheus | <http://127.0.0.1:9090> |

Stack này bổ sung Redis, NGINX, Prometheus, Grafana, resource limits, internal networks và persistent volumes.

Dừng và giữ volume:

```bash
docker compose -f compose.production.yaml down
```

## API chính

Base URL development: `http://localhost:3001/api`.

| Nhóm | Endpoint tiêu biểu | Quyền |
| --- | --- | --- |
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` | Public/Auth |
| Jobs | `GET /jobs`, `GET /jobs/:id` | Public |
| Employer jobs | `GET /jobs/my-jobs`, `POST /jobs`, `PUT /jobs/:id` | Employer/Admin |
| Applications | `POST /applications`, `GET /applications/email/:email`, withdraw | Candidate/Auth |
| Application management | list, detail, update status | Employer/Admin |
| Resumes | list, upload, download, set default, delete | Auth |
| Notifications | list, unread count, mark read/unread, clear/delete | Auth |
| Users | list, statistics, update role/status, delete | Admin |
| Audit | logs, user activity, stats, export | Admin |
| Settings | get/update/reset | Admin |

Endpoint protected yêu cầu:

```http
Authorization: Bearer <jwt-token>
```

## Kiểm tra chất lượng

Frontend:

```bash
npm run build
npm run lint
```

Trong container:

```bash
docker compose exec frontend npm run build
docker compose exec frontend npm run lint
```

Backend:

```bash
cd backend
npm test
npm run test:ownership
npm run test:resumes
npm run test:auth
npm run test:seeker
```

> Một số backend test có thể tạo hoặc cập nhật bản ghi kiểm thử. Chỉ chạy trên database development/test được phép thay đổi.

## Xử lý lỗi thường gặp

### Frontend/backend không truy cập được

```bash
docker compose ps
docker compose logs --tail=200 frontend backend
curl -i http://localhost:3001/api/health
curl -I http://localhost:5173
```

### Backend chờ database

```bash
docker compose logs --tail=200 db db-init backend
```

Không đổi backend sang `localhost:3306` khi chạy trong container. Địa chỉ đúng là `db:3306`.

### Cổng đã được sử dụng

```bash
ss -ltnp | grep -E ':5173|:3001'
```

### Rebuild sau khi dependency hoặc Dockerfile thay đổi

```bash
docker compose up -d --build
```

### Kiểm tra volume khi không thấy dữ liệu

```bash
docker volume ls | grep job-portal
docker compose ps -a
```

Không tạo database thay thế hoặc seed lại trước khi xác định volume `mysql_data` hiện tại.

## Tài liệu liên quan

- [Thiết lập database](docs/DATABASE_SETUP.md)
- [Hướng dẫn deployment](docs/DEPLOYMENT.md)
- [Production readiness](docs/PRODUCTION_READINESS_VI.md)
- [Employer workflow](docs/EMPLOYER_WORKFLOW_GUIDE.md)
- [Design system](design-system/MASTER.md)

## Ghi chú an toàn

- Không commit `backend/.env`, JWT secret hoặc mật khẩu database.
- Docker secret nằm trong volume `mysql_secrets`.
- Backup trước khi seed, migration tùy chỉnh, restore hoặc xóa dữ liệu.
- Không dùng `docker compose down -v` nếu cần giữ dữ liệu.
- Thay thế hoặc vô hiệu hóa tài khoản demo trước khi triển khai thực tế.

## Tác giả

**HTung**
