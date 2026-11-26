require("dotenv").config();

const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { sequelize } = require("../config/database");
const User = require("../models/User");
const Job = require("../models/Job");
const Application = require("../models/Application");
const Resume = require("../models/Resume");
const Notification = require("../models/Notification");
const Setting = require("../models/Setting");
const Audit = require("../models/Audit");
const { generateResumePdf } = require("../utils/pdfGenerator");

const DEMO_PASSWORD = "Demo@123";
const now = new Date();
const daysAgo = (days, hour = 9) => {
  const value = new Date(now);
  value.setDate(value.getDate() - days);
  value.setHours(hour, 0, 0, 0);
  return value;
};
const daysFromNow = (days) => {
  const value = new Date(now);
  value.setDate(value.getDate() + days);
  value.setHours(23, 59, 59, 0);
  return value;
};

const users = [
  {
    key: "admin",
    name: "Nguyễn Minh Anh",
    email: "admin@demo.jobportal.vn",
    role: "admin",
    status: "active",
    phone: "+84 901 100 001",
    location: "Hồ Chí Minh",
    bio: "Quản trị viên nền tảng phụ trách vận hành, kiểm duyệt và báo cáo hệ thống.",
    subscriptionPlan: "enterprise",
    emailVerified: true,
    lastLogin: daysAgo(0, 8),
  },
  {
    key: "viettech",
    name: "Trần Hoàng Nam",
    email: "hr@viettech.demo.jobportal.vn",
    role: "employer",
    status: "active",
    phone: "+84 28 7300 1101",
    location: "Quận 1, Hồ Chí Minh",
    bio: "Talent Acquisition Lead tại VietTech Solutions.",
    website: "https://example.com/viettech",
    linkedin: "https://www.linkedin.com/company/viettech-demo",
    subscriptionPlan: "enterprise",
    subscriptionExpires: daysFromNow(240),
    emailVerified: true,
    lastLogin: daysAgo(0, 9),
    employerDetails: {
      company: "VietTech Solutions",
      industry: "Công nghệ phần mềm",
      companySize: "500-1000",
      website: "https://example.com/viettech",
      foundedYear: 2012,
      headquarters: "Hồ Chí Minh",
    },
  },
  {
    key: "finnova",
    name: "Lê Thu Hà",
    email: "talent@finnova.demo.jobportal.vn",
    role: "employer",
    status: "active",
    phone: "+84 24 7300 2202",
    location: "Cầu Giấy, Hà Nội",
    bio: "Recruitment Manager tại FinNova Vietnam.",
    website: "https://example.com/finnova",
    subscriptionPlan: "premium",
    subscriptionExpires: daysFromNow(90),
    emailVerified: true,
    lastLogin: daysAgo(1, 10),
    employerDetails: {
      company: "FinNova Vietnam",
      industry: "Fintech & Ngân hàng số",
      companySize: "200-500",
      website: "https://example.com/finnova",
      foundedYear: 2018,
      headquarters: "Hà Nội",
    },
  },
  {
    key: "greenlog",
    name: "Phạm Quốc Bảo",
    email: "people@greenlog.demo.jobportal.vn",
    role: "employer",
    status: "active",
    phone: "+84 236 730 3303",
    location: "Hải Châu, Đà Nẵng",
    bio: "People Operations Manager tại GreenLogistics.",
    website: "https://example.com/greenlogistics",
    subscriptionPlan: "basic",
    subscriptionExpires: daysFromNow(45),
    emailVerified: true,
    lastLogin: daysAgo(2, 14),
    employerDetails: {
      company: "GreenLogistics",
      industry: "Logistics & Chuỗi cung ứng",
      companySize: "100-200",
      website: "https://example.com/greenlogistics",
      foundedYear: 2016,
      headquarters: "Đà Nẵng",
    },
  },
  {
    key: "lotus",
    name: "Võ Ngọc Linh",
    email: "careers@lotus.demo.jobportal.vn",
    role: "employer",
    status: "inactive",
    phone: "+84 28 7300 4404",
    location: "Bình Thạnh, Hồ Chí Minh",
    bio: "HR Business Partner tại Lotus Creative Studio.",
    website: "https://example.com/lotuscreative",
    subscriptionPlan: "free",
    emailVerified: true,
    lastLogin: daysAgo(35, 11),
    employerDetails: {
      company: "Lotus Creative Studio",
      industry: "Thiết kế & Truyền thông",
      companySize: "50-100",
      website: "https://example.com/lotuscreative",
      foundedYear: 2020,
      headquarters: "Hồ Chí Minh",
    },
  },
  {
    key: "an",
    name: "Đỗ Gia An",
    email: "an.dev@demo.jobportal.vn",
    role: "jobseeker",
    status: "active",
    phone: "+84 903 210 101",
    location: "Thủ Đức, Hồ Chí Minh",
    bio: "Frontend Engineer với 4 năm kinh nghiệm xây dựng sản phẩm SaaS và thương mại điện tử.",
    website: "https://example.com/giaan",
    linkedin: "https://www.linkedin.com/in/giaan-demo",
    github: "https://github.com/giaan-demo",
    subscriptionPlan: "premium",
    emailVerified: true,
    savedJobsCount: 6,
    lastLogin: daysAgo(0, 7),
    skills: ["React", "TypeScript", "Next.js", "Tailwind CSS", "Testing Library", "REST API"],
    experience: [
      { company: "Sao Khuê Digital", position: "Frontend Engineer", duration: "2022 - nay", description: "Phát triển dashboard SaaS phục vụ hơn 20.000 người dùng." },
      { company: "BlueCommerce", position: "Junior Web Developer", duration: "2020 - 2022", description: "Xây dựng giao diện thương mại điện tử và design system." },
    ],
    education: [{ school: "Đại học Công nghệ Thông tin - ĐHQG TP.HCM", degree: "Kỹ sư Công nghệ thông tin", year: "2020" }],
  },
  {
    key: "mai",
    name: "Nguyễn Thảo Mai",
    email: "mai.data@demo.jobportal.vn",
    role: "jobseeker",
    status: "active",
    phone: "+84 912 220 202",
    location: "Cầu Giấy, Hà Nội",
    bio: "Data Analyst chuyên về phân tích sản phẩm, tài chính và trực quan hóa dữ liệu.",
    linkedin: "https://www.linkedin.com/in/thaomai-demo",
    github: "https://github.com/thaomai-demo",
    subscriptionPlan: "basic",
    emailVerified: true,
    savedJobsCount: 4,
    lastLogin: daysAgo(1, 8),
    skills: ["SQL", "Python", "Power BI", "Tableau", "A/B Testing", "Excel"],
    experience: [
      { company: "Retail Insights", position: "Data Analyst", duration: "2021 - nay", description: "Xây dựng mô hình dữ liệu và báo cáo điều hành cho 60 cửa hàng." },
    ],
    education: [{ school: "Đại học Kinh tế Quốc dân", degree: "Cử nhân Hệ thống thông tin quản lý", year: "2021" }],
  },
  {
    key: "khoa",
    name: "Trần Minh Khoa",
    email: "khoa.backend@demo.jobportal.vn",
    role: "jobseeker",
    status: "active",
    phone: "+84 905 230 303",
    location: "Hải Châu, Đà Nẵng",
    bio: "Backend Engineer tập trung vào hệ thống phân tán, hiệu năng và nền tảng cloud.",
    github: "https://github.com/minhkhoa-demo",
    subscriptionPlan: "free",
    emailVerified: true,
    savedJobsCount: 3,
    lastLogin: daysAgo(2, 19),
    skills: ["Node.js", "Java", "Spring Boot", "PostgreSQL", "Redis", "Docker", "AWS"],
    experience: [
      { company: "Cloud Nine", position: "Backend Developer", duration: "2020 - nay", description: "Thiết kế API và dịch vụ xử lý hơn 2 triệu giao dịch mỗi ngày." },
    ],
    education: [{ school: "Đại học Bách khoa Đà Nẵng", degree: "Kỹ sư Phần mềm", year: "2020" }],
  },
  {
    key: "linh",
    name: "Lâm Khánh Linh",
    email: "linh.ux@demo.jobportal.vn",
    role: "jobseeker",
    status: "active",
    phone: "+84 908 240 404",
    location: "Hồ Chí Minh",
    bio: "Product Designer có kinh nghiệm nghiên cứu người dùng và xây dựng design system đa nền tảng.",
    website: "https://example.com/khanhlinh-design",
    linkedin: "https://www.linkedin.com/in/khanhlinh-demo",
    subscriptionPlan: "free",
    emailVerified: true,
    savedJobsCount: 8,
    lastLogin: daysAgo(3, 20),
    skills: ["Figma", "User Research", "Design System", "Prototyping", "Usability Testing"],
    experience: [
      { company: "Pixel House", position: "Product Designer", duration: "2021 - nay", description: "Thiết kế trải nghiệm cho ứng dụng tài chính với 500.000 người dùng." },
    ],
    education: [{ school: "Đại học Kiến trúc TP.HCM", degree: "Cử nhân Thiết kế", year: "2021" }],
  },
  {
    key: "quang",
    name: "Bùi Nhật Quang",
    email: "quang.devops@demo.jobportal.vn",
    role: "jobseeker",
    status: "active",
    phone: "+84 904 250 505",
    location: "Hà Nội",
    bio: "DevOps Engineer với kinh nghiệm Kubernetes, CI/CD và observability.",
    github: "https://github.com/nhatquang-demo",
    subscriptionPlan: "premium",
    emailVerified: true,
    savedJobsCount: 5,
    lastLogin: daysAgo(5, 18),
    skills: ["Kubernetes", "Terraform", "AWS", "GitLab CI", "Prometheus", "Linux"],
    experience: [
      { company: "InfraWorks", position: "DevOps Engineer", duration: "2019 - nay", description: "Vận hành hạ tầng đa vùng với SLA 99,95%." },
    ],
    education: [{ school: "Học viện Công nghệ Bưu chính Viễn thông", degree: "Kỹ sư An toàn thông tin", year: "2019" }],
  },
  {
    key: "inactive",
    name: "Phan Yến Nhi",
    email: "inactive@demo.jobportal.vn",
    role: "jobseeker",
    status: "inactive",
    phone: "+84 900 260 606",
    location: "Cần Thơ",
    bio: "Tài khoản không hoạt động dùng để trải nghiệm chức năng quản trị người dùng.",
    subscriptionPlan: "free",
    emailVerified: false,
    lastLogin: daysAgo(80, 10),
    skills: ["Content Marketing", "SEO", "Google Analytics"],
  },
  {
    key: "blocked",
    name: "Demo Blocked User",
    email: "blocked@demo.jobportal.vn",
    role: "jobseeker",
    status: "blocked",
    phone: "+84 900 270 707",
    location: "Hải Phòng",
    bio: "Tài khoản bị khóa dùng để trải nghiệm bộ lọc và thao tác quản trị.",
    subscriptionPlan: "free",
    emailVerified: false,
    lastLogin: daysAgo(120, 15),
    skills: ["Data Entry"],
  },
];

const jobs = [
  { key: "fe-senior", employer: "viettech", title: "Senior Frontend Engineer (React)", company: "VietTech Solutions", location: "Quận 1, Hồ Chí Minh · Hybrid", description: "Tham gia đội ngũ Product Platform, phát triển dashboard B2B có lưu lượng lớn và cùng xây dựng design system dùng chung cho toàn công ty.", requirements: "Từ 4 năm kinh nghiệm frontend; thành thạo React, TypeScript; hiểu performance, accessibility và automated testing.", responsibilities: "Thiết kế kiến trúc frontend; review code; mentoring; phối hợp Product và Design để giao tính năng theo quý.", education: "Đại học chuyên ngành CNTT hoặc kinh nghiệm tương đương.", benefits: "Lương tháng 13; thưởng hiệu suất; bảo hiểm sức khỏe; ngân sách học tập 20 triệu/năm; hybrid 3 ngày tại văn phòng.", salary: "40.000.000 - 60.000.000 VNĐ/tháng", type: "Full-time", experience: "Senior Level", skills: "React,TypeScript,Next.js,Testing,Web Performance", status: "Published", approvalStatus: "approved", daysOld: 12, deadline: 28 },
  { key: "be-node", employer: "viettech", title: "Backend Engineer (Node.js)", company: "VietTech Solutions", location: "Hồ Chí Minh · Hybrid", description: "Xây dựng API và các dịch vụ nền tảng cho hệ sinh thái tuyển dụng và quản trị nhân sự.", requirements: "Từ 3 năm với Node.js; vững SQL, REST API, caching và message queue.", responsibilities: "Phát triển dịch vụ; tối ưu truy vấn; viết test; trực vận hành theo lịch của nhóm.", education: "CNTT, Khoa học máy tính hoặc ngành liên quan.", benefits: "MacBook; bảo hiểm mở rộng; 15 ngày phép; review lương 2 lần/năm.", salary: "35.000.000 - 50.000.000 VNĐ/tháng", type: "Full-time", experience: "Mid Level", skills: "Node.js,Express,PostgreSQL,Redis,Docker", status: "active", approvalStatus: "approved", daysOld: 8, deadline: 35 },
  { key: "qa", employer: "viettech", title: "QA Automation Engineer", company: "VietTech Solutions", location: "Hồ Chí Minh", description: "Xây dựng chiến lược kiểm thử tự động cho web, API và quy trình release liên tục.", requirements: "Có kinh nghiệm Playwright/Cypress và API testing; tư duy chất lượng sản phẩm.", responsibilities: "Thiết kế test framework; theo dõi quality metrics; phối hợp xử lý lỗi production.", education: "Cao đẳng/Đại học ngành kỹ thuật.", benefits: "Thưởng dự án; đào tạo chứng chỉ; team building hằng năm.", salary: "25.000.000 - 38.000.000 VNĐ/tháng", type: "Full-time", experience: "Mid Level", skills: "Playwright,Cypress,API Testing,JavaScript,CI/CD", status: "Draft", approvalStatus: "pending", daysOld: 2, deadline: 50 },
  { key: "data", employer: "finnova", title: "Senior Data Analyst", company: "FinNova Vietnam", location: "Cầu Giấy, Hà Nội · Hybrid", description: "Phân tích hành vi khách hàng và hiệu quả sản phẩm tài chính số, trực tiếp làm việc với Product Lead và ban điều hành.", requirements: "Từ 4 năm phân tích dữ liệu; SQL nâng cao; Power BI/Tableau; kinh nghiệm A/B testing.", responsibilities: "Xây dựng data mart; dashboard KPI; phân tích funnel và đề xuất thử nghiệm tăng trưởng.", education: "Kinh tế, Toán, Thống kê, CNTT hoặc tương đương.", benefits: "Thưởng theo hiệu quả kinh doanh; bảo hiểm cao cấp; phụ cấp ăn trưa và gửi xe.", salary: "35.000.000 - 50.000.000 VNĐ/tháng", type: "Full-time", experience: "Senior Level", skills: "SQL,Python,Power BI,A/B Testing,Statistics", status: "Published", approvalStatus: "approved", daysOld: 10, deadline: 25 },
  { key: "risk", employer: "finnova", title: "Risk Modeling Specialist", company: "FinNova Vietnam", location: "Hà Nội", description: "Phát triển mô hình chấm điểm tín dụng và giám sát rủi ro danh mục cho sản phẩm cho vay số.", requirements: "Python/R, SQL, thống kê; ưu tiên kinh nghiệm ngân hàng hoặc fintech.", responsibilities: "Xây dựng và kiểm định mô hình; theo dõi model drift; báo cáo hội đồng rủi ro.", education: "Thạc sĩ Toán tài chính, Thống kê hoặc ngành phù hợp là lợi thế.", benefits: "ESOP theo cấp bậc; khám sức khỏe; ngân sách chứng chỉ chuyên môn.", salary: "45.000.000 - 70.000.000 VNĐ/tháng", type: "Full-time", experience: "Senior Level", skills: "Python,SQL,Credit Risk,Machine Learning,Statistics", status: "Published", approvalStatus: "approved", daysOld: 18, deadline: 18 },
  { key: "intern", employer: "finnova", title: "Product Data Intern", company: "FinNova Vietnam", location: "Hà Nội · On-site", description: "Cơ hội thực tập cùng nhóm dữ liệu sản phẩm, tham gia chuẩn hóa báo cáo và phân tích hành vi cơ bản.", requirements: "Sinh viên năm cuối; SQL cơ bản; Excel tốt; giao tiếp rõ ràng.", responsibilities: "Làm sạch dữ liệu; duy trì báo cáo; hỗ trợ phân tích ad-hoc.", education: "Sinh viên Kinh tế, Thống kê, MIS hoặc CNTT.", benefits: "Trợ cấp; mentor 1-1; cơ hội trở thành nhân viên chính thức.", salary: "6.000.000 - 9.000.000 VNĐ/tháng", type: "Internship", experience: "Entry Level", skills: "SQL,Excel,Power BI,Data Cleaning", status: "Published", approvalStatus: "approved", daysOld: 5, deadline: 40 },
  { key: "devops", employer: "greenlog", title: "DevOps / Cloud Engineer", company: "GreenLogistics", location: "Đà Nẵng · Hybrid", description: "Hiện đại hóa nền tảng logistics, tự động hóa hạ tầng và cải thiện khả năng quan sát của hệ thống vận hành 24/7.", requirements: "Từ 3 năm DevOps; Kubernetes, Terraform, cloud và monitoring.", responsibilities: "Quản trị cluster; xây CI/CD; capacity planning; incident response.", education: "CNTT, Mạng máy tính hoặc kinh nghiệm tương đương.", benefits: "Làm việc hybrid; hỗ trợ chứng chỉ AWS; phụ cấp trực; bảo hiểm sức khỏe.", salary: "35.000.000 - 55.000.000 VNĐ/tháng", type: "Full-time", experience: "Senior Level", skills: "Kubernetes,Terraform,AWS,Prometheus,GitLab CI", status: "Published", approvalStatus: "approved", daysOld: 14, deadline: 22 },
  { key: "supply", employer: "greenlog", title: "Supply Chain Operations Lead", company: "GreenLogistics", location: "Đà Nẵng", description: "Dẫn dắt nhóm điều phối vận tải miền Trung và triển khai các sáng kiến tối ưu chi phí giao nhận.", requirements: "Từ 5 năm logistics, ít nhất 2 năm quản lý; mạnh về dữ liệu và cải tiến quy trình.", responsibilities: "Quản lý vận hành; theo dõi SLA; làm việc với đối tác vận tải; coaching đội ngũ.", education: "Logistics, Quản trị vận hành hoặc ngành liên quan.", benefits: "Thưởng KPI quý; bảo hiểm tai nạn; phụ cấp điện thoại và công tác.", salary: "30.000.000 - 45.000.000 VNĐ/tháng", type: "Full-time", experience: "Lead", skills: "Supply Chain,Operations,Leadership,Excel,Process Improvement", status: "Draft", approvalStatus: "pending", daysOld: 3, deadline: 30 },
  { key: "mobile-contract", employer: "greenlog", title: "React Native Developer (6-month Contract)", company: "GreenLogistics", location: "Remote tại Việt Nam", description: "Phát triển ứng dụng tài xế và tối ưu trải nghiệm theo dõi đơn hàng thời gian thực.", requirements: "Từ 2 năm React Native; hiểu native module, offline-first và push notification.", responsibilities: "Phát triển tính năng; xử lý lỗi; viết test; phối hợp backend và UX.", education: "Không bắt buộc bằng cấp nếu có portfolio phù hợp.", benefits: "Remote; giờ làm linh hoạt; gia hạn theo hiệu quả dự án.", salary: "30.000.000 - 42.000.000 VNĐ/tháng", type: "Contract", experience: "Mid Level", skills: "React Native,TypeScript,Mobile,Push Notifications", status: "Closed", approvalStatus: "approved", daysOld: 55, deadline: -2 },
  { key: "designer", employer: "lotus", title: "Product Designer", company: "Lotus Creative Studio", location: "Bình Thạnh, Hồ Chí Minh", description: "Thiết kế sản phẩm số cho khách hàng trong lĩnh vực bán lẻ, giáo dục và dịch vụ tài chính.", requirements: "Portfolio thể hiện quy trình UX; Figma tốt; có kinh nghiệm design system.", responsibilities: "Research; user flow; prototype; bàn giao và kiểm thử thiết kế cùng đội kỹ thuật.", education: "Thiết kế, HCI hoặc kinh nghiệm thực tế tương đương.", benefits: "Môi trường sáng tạo; giờ làm linh hoạt; ngân sách workshop.", salary: "25.000.000 - 38.000.000 VNĐ/tháng", type: "Full-time", experience: "Mid Level", skills: "Figma,User Research,Design System,Prototyping", status: "Published", approvalStatus: "approved", daysOld: 21, deadline: 15 },
  { key: "copywriter", employer: "lotus", title: "Senior Creative Copywriter", company: "Lotus Creative Studio", location: "Hồ Chí Minh", description: "Phát triển big idea và nội dung chiến dịch tích hợp cho các thương hiệu tiêu dùng.", requirements: "Từ 4 năm agency; portfolio tốt; khả năng trình bày ý tưởng bằng tiếng Việt và tiếng Anh.", responsibilities: "Concept; copy; pitching; hướng dẫn junior và đảm bảo tính nhất quán thương hiệu.", education: "Truyền thông, Marketing hoặc tương đương.", benefits: "Thưởng pitch; creative day; bảo hiểm; du lịch công ty.", salary: "28.000.000 - 40.000.000 VNĐ/tháng", type: "Full-time", experience: "Senior Level", skills: "Copywriting,Creative Strategy,Branding,English", status: "inactive", approvalStatus: "rejected", daysOld: 25, deadline: 12 },
  { key: "pm", employer: "viettech", title: "Technical Product Manager", company: "VietTech Solutions", location: "Hồ Chí Minh", description: "Sở hữu roadmap cho nền tảng developer productivity và phối hợp nhiều nhóm kỹ thuật.", requirements: "Từ 5 năm làm sản phẩm công nghệ; hiểu API, cloud và agile delivery.", responsibilities: "Discovery; roadmap; ưu tiên backlog; xác định success metrics; stakeholder management.", education: "Đại học; nền tảng kỹ thuật là lợi thế.", benefits: "Thưởng sản phẩm; ESOP; bảo hiểm gia đình; ngân sách hội thảo.", salary: "50.000.000 - 75.000.000 VNĐ/tháng", type: "Full-time", experience: "Manager", skills: "Product Management,Technical Strategy,Agile,API,Analytics", status: "filled", approvalStatus: "approved", daysOld: 70, deadline: -15 },
];

const applications = [
  { user: "an", job: "fe-senior", status: "shortlisted", daysOld: 7, expectedSalary: "52.000.000 VNĐ/tháng", availability: "2-4 weeks", notes: "Portfolio tốt, cần phỏng vấn sâu về kiến trúc frontend." },
  { user: "an", job: "be-node", status: "under_review", daysOld: 4, expectedSalary: "45.000.000 VNĐ/tháng", availability: "2-4 weeks", notes: "Kinh nghiệm backend chưa phải trọng tâm chính nhưng nền tảng tốt." },
  { user: "an", job: "designer", status: "rejected", daysOld: 16, expectedSalary: "35.000.000 VNĐ/tháng", availability: "1 month notice", notes: "Hồ sơ thiên về engineering, chưa phù hợp yêu cầu thiết kế." },
  { user: "mai", job: "data", status: "interview_scheduled", daysOld: 6, expectedSalary: "42.000.000 VNĐ/tháng", availability: "1 month notice", notes: "Phỏng vấn vòng chuyên môn lúc 14:00 thứ Sáu." },
  { user: "mai", job: "risk", status: "under_review", daysOld: 9, expectedSalary: "55.000.000 VNĐ/tháng", availability: "1 month notice", notes: "Chờ đánh giá bài SQL và statistics." },
  { user: "mai", job: "intern", status: "withdrawn", daysOld: 3, expectedSalary: "9.000.000 VNĐ/tháng", availability: "Immediate", notes: "Ứng viên chủ động rút vì cấp độ vị trí chưa phù hợp." },
  { user: "khoa", job: "be-node", status: "offered", daysOld: 14, expectedSalary: "48.000.000 VNĐ/tháng", availability: "2-4 weeks", notes: "Đã gửi offer, hạn phản hồi trong 5 ngày." },
  { user: "khoa", job: "devops", status: "interviewed", daysOld: 8, expectedSalary: "47.000.000 VNĐ/tháng", availability: "2-4 weeks", notes: "Hoàn thành technical interview, đang chờ calibration." },
  { user: "khoa", job: "mobile-contract", status: "rejected", daysOld: 31, expectedSalary: "40.000.000 VNĐ/tháng", availability: "1-2 weeks", notes: "Thiếu kinh nghiệm mobile production." },
  { user: "linh", job: "designer", status: "accepted", daysOld: 19, expectedSalary: "34.000.000 VNĐ/tháng", availability: "1 month notice", notes: "Ứng viên đã chấp nhận offer và dự kiến onboard đầu tháng tới." },
  { user: "linh", job: "fe-senior", status: "rejected", daysOld: 5, expectedSalary: "42.000.000 VNĐ/tháng", availability: "2-4 weeks", notes: "Không phù hợp nền tảng kỹ thuật của vị trí." },
  { user: "quang", job: "devops", status: "interview_scheduled", daysOld: 5, expectedSalary: "52.000.000 VNĐ/tháng", availability: "1 month notice", notes: "System design interview đã được xác nhận." },
  { user: "quang", job: "be-node", status: "pending", daysOld: 1, expectedSalary: "50.000.000 VNĐ/tháng", availability: "1 month notice", notes: "Hồ sơ mới, chưa sàng lọc." },
  { user: "quang", job: "pm", status: "rejected", daysOld: 40, expectedSalary: "65.000.000 VNĐ/tháng", availability: "1 month notice", notes: "Vị trí đã tuyển đủ." },
  { user: "an", job: "qa", status: "pending", daysOld: 1, expectedSalary: "36.000.000 VNĐ/tháng", availability: "2-4 weeks", notes: "Tin đang chờ duyệt; dữ liệu dùng để kiểm thử luồng quản trị." },
  { user: "khoa", job: "risk", status: "shortlisted", daysOld: 11, expectedSalary: "58.000.000 VNĐ/tháng", availability: "1 month notice", notes: "Kỹ năng Python tốt, cần đánh giá thêm kiến thức tài chính." },
  { user: "linh", job: "intern", status: "under_review", daysOld: 2, expectedSalary: "9.000.000 VNĐ/tháng", availability: "Immediate", notes: "Hồ sơ chuyển ngành, portfolio trình bày tốt." },
  { user: null, job: "intern", status: "pending", daysOld: 1, applicantName: "Hoàng Đức Long", applicantEmail: "long.student@example.com", applicantPhone: "+84 988 888 111", skills: "SQL,Excel,Python", experience: "Thực tập phân tích dữ liệu 3 tháng tại câu lạc bộ sinh viên.", education: "Sinh viên năm 4 ngành Hệ thống thông tin.", expectedSalary: "7.000.000 VNĐ/tháng", availability: "Immediate", notes: "Ứng viên khách, chưa có tài khoản." },
];

const systemSettings = {
  general: { siteName: "JobPortal Vietnam", siteDescription: "Nền tảng kết nối nhân tài và doanh nghiệp công nghệ", contactEmail: "support@jobportal.vn", maintenanceMode: false, allowRegistration: true, requireEmailVerification: false },
  email: { smtpHost: "smtp.example.com", smtpPort: 587, smtpUser: "noreply@jobportal.vn", smtpPassword: "", emailFromName: "JobPortal Vietnam", emailFromAddress: "noreply@jobportal.vn", enableEmailNotifications: true },
  security: { passwordMinLength: 8, passwordRequireUppercase: true, passwordRequireLowercase: true, passwordRequireNumbers: true, passwordRequireSpecialChars: true, sessionTimeout: 60, maxLoginAttempts: 5, enableTwoFactorAuth: false },
  subscriptions: { freePlan: { name: "Free", price: 0, jobPostings: 5, featuredJobs: 0, resumeViews: 50, duration: "30 days" }, basicPlan: { name: "Basic", price: 690000, jobPostings: 25, featuredJobs: 2, resumeViews: 500, duration: "30 days" }, premiumPlan: { name: "Premium", price: 1890000, jobPostings: 100, featuredJobs: 10, resumeViews: 2000, duration: "30 days" }, enterprisePlan: { name: "Enterprise", price: 4790000, jobPostings: "Unlimited", featuredJobs: 25, resumeViews: "Unlimited", duration: "30 days" } },
  notifications: { emailNotifications: true, pushNotifications: true, smsNotifications: false, newJobAlerts: true, applicationUpdates: true, systemAlerts: true, marketingEmails: false },
  featuredJobs: { enableFeaturedJobs: true, maxFeaturedJobs: 50, featuredJobPrice: 590000, featuredDuration: 7, autoRenewFeatured: false },
};

async function ensureUtf8Database() {
  const databaseName = sequelize.getDatabaseName();
  await sequelize.query(
    `ALTER DATABASE \`${databaseName.replace(/`/g, "``")}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  const [tables] = await sequelize.query("SHOW TABLES");
  for (const row of tables) {
    const tableName = Object.values(row)[0];
    await sequelize.query(
      `ALTER TABLE \`${String(tableName).replace(/`/g, "``")}\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  }
  await sequelize.query("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
}

async function upsertUser(data, passwordHash) {
  const payload = {
    ...data,
    password: passwordHash,
    skills: data.skills ? JSON.stringify(data.skills) : null,
    experience: data.experience ? JSON.stringify(data.experience) : null,
    education: data.education ? JSON.stringify(data.education) : null,
    employerDetails: data.employerDetails ? JSON.stringify(data.employerDetails) : null,
  };
  delete payload.key;
  const [record, created] = await User.findOrCreate({ where: { email: data.email }, defaults: { ...payload, createdAt: daysAgo(data.role === "admin" ? 240 : 180) } });
  if (!created) await record.update(payload);
  return record;
}

async function upsertJob(data, userMap) {
  const payload = {
    ...data,
    employerId: userMap[data.employer].id,
    contactEmail: userMap[data.employer].email,
    contactPhone: userMap[data.employer].phone,
    applicationDeadline: daysFromNow(data.deadline),
  };
  delete payload.key;
  delete payload.employer;
  delete payload.daysOld;
  delete payload.deadline;
  const [record, created] = await Job.findOrCreate({
    where: { title: data.title, employerId: userMap[data.employer].id },
    defaults: { ...payload, createdAt: daysAgo(data.daysOld), updatedAt: daysAgo(Math.max(data.daysOld - 2, 0)) },
  });
  if (!created) await record.update(payload);
  return record;
}

function candidateText(user) {
  const skills = JSON.parse(user.skills || "[]").join(", ");
  const experience = JSON.parse(user.experience || "[]").map((item) => `${item.position} - ${item.company} (${item.duration}): ${item.description}`).join("\n");
  const education = JSON.parse(user.education || "[]").map((item) => `${item.degree}, ${item.school} (${item.year})`).join("; ");
  return { skills, experience, education };
}

async function createResumes(userMap) {
  const uploadDir = path.resolve(__dirname, "../../uploads/resumes");
  fs.mkdirSync(uploadDir, { recursive: true });
  for (const key of ["an", "mai", "khoa", "linh", "quang"]) {
    const user = userMap[key];
    const text = candidateText(user);
    const fileName = `demo_resume_${key}.pdf`;
    const filePath = path.join(uploadDir, fileName);
    const buffer = generateResumePdf({ name: user.name, email: user.email, phone: user.phone, skills: text.skills, experience: text.experience, education: text.education, availability: "2-4 weeks" });
    fs.writeFileSync(filePath, buffer);
    const [resume, created] = await Resume.findOrCreate({
      where: { userId: user.id, fileName },
      defaults: { originalName: `CV_${user.name.replace(/\s+/g, "_")}.pdf`, filePath, fileSize: buffer.length, mimeType: "application/pdf", isDefault: true, fileData: buffer.toString("base64"), createdAt: daysAgo(30) },
    });
    if (!created) await resume.update({ filePath, fileSize: buffer.length, mimeType: "application/pdf", isDefault: true, fileData: buffer.toString("base64") });
    await user.update({ resumePath: fileName });
  }
}

async function createApplications(userMap, jobMap) {
  for (const item of applications) {
    const user = item.user ? userMap[item.user] : null;
    const job = jobMap[item.job];
    const text = user ? candidateText(user) : { skills: item.skills, experience: item.experience, education: item.education };
    const applicantName = user?.name || item.applicantName;
    const applicantEmail = user?.email || item.applicantEmail;
    const resume = user ? await Resume.findOne({ where: { userId: user.id, isDefault: true } }) : null;
    const pdf = generateResumePdf({ name: applicantName, email: applicantEmail, phone: user?.phone || item.applicantPhone, jobTitle: job.title, company: job.company, appliedDate: daysAgo(item.daysOld).toLocaleDateString("vi-VN"), skills: text.skills, experience: text.experience, education: text.education, expectedSalary: item.expectedSalary, availability: item.availability });
    const payload = {
      userId: user?.id || null,
      jobId: job.id,
      applicantName,
      applicantEmail,
      applicantPhone: user?.phone || item.applicantPhone,
      resumePath: resume?.fileName || `application_${item.job}_${item.user || "guest"}.pdf`,
      fileData: pdf.toString("base64"),
      originalResumeName: resume?.originalName || `CV_${applicantName.replace(/\s+/g, "_")}.pdf`,
      mimeType: "application/pdf",
      coverLetter: `Tôi quan tâm đến vị trí ${job.title} tại ${job.company}. Kinh nghiệm và định hướng của tôi phù hợp với các mục tiêu mà đội ngũ đang theo đuổi.`,
      experience: text.experience,
      education: text.education,
      skills: text.skills,
      expectedSalary: item.expectedSalary,
      availability: item.availability,
      status: item.status,
      notes: item.notes,
      applicationDate: daysAgo(item.daysOld),
      lastUpdated: daysAgo(Math.max(item.daysOld - 2, 0)),
      isVerified: Boolean(user),
      emailVerified: Boolean(user),
      ipAddress: item.user ? "127.0.0.1" : "203.0.113.42",
      userAgent: "Mozilla/5.0 (Demo Seed; JobPortal)",
      riskScore: item.user ? 5 : 22,
      flagged: false,
    };
    const where = user ? { userId: user.id, jobId: job.id } : { applicantEmail, jobId: job.id };
    const [record, created] = await Application.findOrCreate({ where, defaults: { ...payload, createdAt: daysAgo(item.daysOld), updatedAt: daysAgo(Math.max(item.daysOld - 2, 0)) } });
    if (!created) await record.update(payload);
  }
  for (const key of ["an", "mai", "khoa", "linh", "quang"]) {
    const count = await Application.count({ where: { userId: userMap[key].id } });
    await userMap[key].update({ applicationsCount: count });
  }
}

async function createNotifications(userMap, jobMap) {
  const items = [
    { user: "admin", title: "3 tin tuyển dụng đang chờ duyệt", message: "Có các tin mới cần được kiểm tra nội dung và phê duyệt.", type: "warning", priority: "high", isRead: false, link: "/admin/jobs", daysOld: 0 },
    { user: "admin", title: "Báo cáo tuần đã sẵn sàng", message: "Số liệu người dùng, việc làm và ứng tuyển tuần này đã được tổng hợp.", type: "system", priority: "medium", isRead: true, link: "/admin/reports", daysOld: 2 },
    { user: "viettech", title: "Ứng viên mới cho Backend Engineer", message: "Bùi Nhật Quang vừa gửi hồ sơ ứng tuyển.", type: "application_status", priority: "high", isRead: false, link: "/employer/applicants", daysOld: 1, metadata: { jobId: "be-node" } },
    { user: "viettech", title: "Tin tuyển dụng đã được phê duyệt", message: "Tin Senior Frontend Engineer (React) đang hiển thị công khai.", type: "success", priority: "medium", isRead: true, link: "/employer/jobs", daysOld: 11, metadata: { jobId: "fe-senior" } },
    { user: "finnova", title: "Lịch phỏng vấn đã được xác nhận", message: "Nguyễn Thảo Mai đã xác nhận lịch phỏng vấn Senior Data Analyst.", type: "info", priority: "high", isRead: false, link: "/employer/applicants", daysOld: 1, metadata: { jobId: "data" } },
    { user: "greenlog", title: "Tin đang chờ quản trị viên duyệt", message: "Supply Chain Operations Lead đã được gửi để kiểm duyệt.", type: "warning", priority: "medium", isRead: false, link: "/employer/jobs", daysOld: 3, metadata: { jobId: "supply" } },
    { user: "an", title: "Bạn đã vào danh sách rút gọn", message: "VietTech Solutions đã đưa hồ sơ của bạn vào shortlist cho vị trí Senior Frontend Engineer.", type: "application_status", priority: "high", isRead: false, link: "/dashboard", daysOld: 1, metadata: { jobId: "fe-senior" } },
    { user: "an", title: "Việc làm phù hợp với hồ sơ của bạn", message: "Backend Engineer (Node.js) có mức độ phù hợp cao với kỹ năng hiện tại.", type: "job_alert", priority: "medium", isRead: true, link: "/jobs", daysOld: 6, metadata: { jobId: "be-node" } },
    { user: "mai", title: "Lịch phỏng vấn Senior Data Analyst", message: "Vòng chuyên môn được lên lịch lúc 14:00 thứ Sáu. Hãy chuẩn bị sẵn portfolio phân tích.", type: "application_status", priority: "high", isRead: false, link: "/dashboard", daysOld: 1, metadata: { jobId: "data" } },
    { user: "khoa", title: "Bạn đã nhận được offer", message: "VietTech Solutions đã gửi đề nghị cho vị trí Backend Engineer (Node.js).", type: "success", priority: "high", isRead: false, link: "/dashboard", daysOld: 1, metadata: { jobId: "be-node" } },
    { user: "linh", title: "Chúc mừng bạn đã nhận việc", message: "Trạng thái Product Designer đã chuyển sang accepted.", type: "success", priority: "high", isRead: true, link: "/dashboard", daysOld: 3, metadata: { jobId: "designer" } },
    { user: "quang", title: "Lịch phỏng vấn DevOps / Cloud Engineer", message: "GreenLogistics đã mời bạn tham gia vòng system design.", type: "application_status", priority: "high", isRead: false, link: "/dashboard", daysOld: 2, metadata: { jobId: "devops" } },
  ];
  for (const item of items) {
    const payload = { userId: userMap[item.user].id, title: item.title, message: item.message, type: item.type, priority: item.priority, isRead: item.isRead, readAt: item.isRead ? daysAgo(Math.max(item.daysOld - 1, 0)) : null, link: item.link, metadata: item.metadata ? { jobId: jobMap[item.metadata.jobId].id } : null };
    await Notification.findOrCreate({ where: { userId: payload.userId, title: payload.title }, defaults: { ...payload, createdAt: daysAgo(item.daysOld) } });
  }
}

async function createSettings(admin) {
  for (const [category, value] of Object.entries(systemSettings)) {
    const [record, created] = await Setting.findOrCreate({ where: { category }, defaults: { value, updatedBy: admin.id } });
    if (!created) await record.update({ value, updatedBy: admin.id });
  }
}

async function createAudits(userMap, jobMap) {
  const entries = [
    { action: "LOGIN", actor: "admin", target: "admin", details: "Administrator signed in to review platform activity.", daysOld: 0 },
    { action: "JOB_CREATE", actor: "viettech", target: "viettech", details: `Created job \"${jobMap["fe-senior"].title}\" (ID: ${jobMap["fe-senior"].id}).`, daysOld: 12 },
    { action: "STATUS_CHANGE", actor: "admin", target: "viettech", details: `Approved job \"${jobMap["fe-senior"].title}\" after content review.`, daysOld: 11 },
    { action: "APPLICATION_SUBMIT", actor: "an", target: "an", details: `Submitted application for \"${jobMap["fe-senior"].title}\".`, daysOld: 7 },
    { action: "APPLICATION_UPDATE", actor: "viettech", target: "an", details: "Moved application from under_review to shortlisted.", daysOld: 1 },
    { action: "APPLICATION_UPDATE", actor: "finnova", target: "mai", details: "Scheduled technical interview for Senior Data Analyst.", daysOld: 1 },
    { action: "STATUS_CHANGE", actor: "admin", target: "blocked", details: "Blocked account after repeated policy violations (demo record).", daysOld: 20 },
    { action: "STATUS_CHANGE", actor: "admin", target: "inactive", details: "Marked dormant account as inactive (demo record).", daysOld: 30 },
    { action: "SETTING_UPDATE", actor: "admin", target: "admin", details: "Updated system settings categories: general, security, notifications.", daysOld: 4 },
    { action: "LOGIN", actor: "greenlog", target: "greenlog", details: "Employer signed in from a recognized device.", daysOld: 2 },
  ];
  for (const entry of entries) {
    await Audit.findOrCreate({
      where: { action: entry.action, details: entry.details },
      defaults: { performedBy: userMap[entry.actor].id, targetUserId: userMap[entry.target].id, ipAddress: "127.0.0.1", userAgent: "Mozilla/5.0 (Demo Seed; JobPortal)", createdAt: daysAgo(entry.daysOld) },
    });
  }
}

async function seedDemoData() {
  try {
    await sequelize.authenticate();
    console.log("Connected to the JobPortal database.");
    await ensureUtf8Database();
    console.log("Database character set verified as utf8mb4.");

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    const userMap = {};
    for (const data of users) userMap[data.key] = await upsertUser(data, passwordHash);

    const jobMap = {};
    for (const data of jobs) jobMap[data.key] = await upsertJob(data, userMap);

    await createResumes(userMap);
    await createApplications(userMap, jobMap);
    await createNotifications(userMap, jobMap);
    await createSettings(userMap.admin);
    await createAudits(userMap, jobMap);

    const counts = {
      users: await User.count(),
      jobs: await Job.count(),
      applications: await Application.count(),
      resumes: await Resume.count(),
      notifications: await Notification.count(),
      audits: await Audit.count(),
      settings: await Setting.count(),
    };

    console.log("\nDemo data is ready:");
    Object.entries(counts).forEach(([name, count]) => console.log(`  ${name}: ${count}`));
    console.log("\nDemo accounts (all use password Demo@123):");
    console.log("  Admin:     admin@demo.jobportal.vn");
    console.log("  Employer:  hr@viettech.demo.jobportal.vn");
    console.log("  Employer:  talent@finnova.demo.jobportal.vn");
    console.log("  Jobseeker: an.dev@demo.jobportal.vn");
    console.log("  Jobseeker: mai.data@demo.jobportal.vn");
  } catch (error) {
    console.error("Failed to seed demo data:", error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) seedDemoData();

module.exports = seedDemoData;
