require("dotenv").config();

const bcrypt = require("bcryptjs");
const { sequelize } = require("../config/database");
const User = require("../models/User");
const Job = require("../models/Job");
const Application = require("../models/Application");
const Resume = require("../models/Resume");
const Notification = require("../models/Notification");
const Audit = require("../models/Audit");
const Setting = require("../models/Setting");
const { generateResumePdf } = require("../utils/pdfGenerator");

const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "Demo@123";
const EMPLOYER_COUNT = 20;
const CANDIDATE_COUNT = 120;
const JOB_COUNT = 120;
const APPLICATIONS_PER_CANDIDATE = 5;

const firstNames = [
  "Anh", "Bảo", "Chi", "Duy", "Giang", "Hà", "Hải", "Hạnh", "Hiếu", "Hùng",
  "Khánh", "Khoa", "Lan", "Linh", "Mai", "Minh", "Nam", "Ngân", "Ngọc", "Phúc",
  "Quân", "Quang", "Sơn", "Thảo", "Trang", "Trung", "Tuấn", "Uyên", "Việt", "Yến",
];
const lastNames = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ"];
const locations = ["Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Cần Thơ", "Hải Phòng", "Remote - Việt Nam"];
const companies = [
  "Aurora Digital", "BlueRiver Finance", "CloudNova", "Delta Commerce", "EverGreen Logistics",
  "FutureWorks", "GoldenGate Systems", "Harbor Health", "Insight Data", "Jade Software",
  "Kite Labs", "Lotus Retail", "Mekong Analytics", "NextWave AI", "Orbit Technology",
  "Pacific Cyber", "Quantum Solutions", "RedSun Media", "Skyline Education", "Terra Manufacturing",
];
const jobTitles = [
  "Frontend Engineer", "Backend Engineer", "Full-stack Developer", "Data Analyst", "Data Engineer",
  "DevOps Engineer", "Cloud Engineer", "QA Automation Engineer", "Product Designer", "Product Manager",
  "Business Analyst", "Security Engineer", "Mobile Developer", "Machine Learning Engineer", "Technical Recruiter",
];
const skillGroups = [
  ["React", "TypeScript", "CSS", "REST API"],
  ["Node.js", "Express", "MySQL", "Docker"],
  ["Python", "SQL", "Power BI", "Statistics"],
  ["AWS", "Docker", "Kubernetes", "CI/CD"],
  ["Figma", "Design System", "User Research", "Prototyping"],
  ["Java", "Spring Boot", "Microservices", "Kafka"],
];
const applicationStatuses = [
  "pending", "under_review", "shortlisted", "interview_scheduled", "interviewed",
  "offered", "accepted", "rejected", "withdrawn",
];
const availabilityOptions = ["Immediate", "1-2 weeks", "2-4 weeks", "1 month notice", "2 months notice"];

const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);
const daysFromNow = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);
const candidateName = (index) => `${lastNames[index % lastNames.length]} ${firstNames[(index * 7) % firstNames.length]} ${String(index + 1).padStart(3, "0")}`;

async function findOrCreateUser(data, transaction) {
  const [user] = await User.findOrCreate({
    where: { email: data.email },
    defaults: data,
    transaction,
  });
  return user;
}

async function seedLargeDemoData() {
  await sequelize.authenticate();
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  await sequelize.transaction(async (transaction) => {
    const [admin] = await User.findOrCreate({
      where: { email: "operations@scale.demo.jobportal.vn" },
      defaults: {
        name: "Phạm Minh Operations",
        password: passwordHash,
        role: "admin",
        status: "active",
        location: "Hồ Chí Minh",
        emailVerified: true,
        subscriptionPlan: "enterprise",
      },
      transaction,
    });

    const employers = [];
    for (let index = 0; index < EMPLOYER_COUNT; index += 1) {
      const company = companies[index];
      employers.push(await findOrCreateUser({
        name: `${lastNames[index % lastNames.length]} ${firstNames[index]} - Talent Lead`,
        email: `talent${String(index + 1).padStart(2, "0")}@scale.demo.jobportal.vn`,
        password: passwordHash,
        role: "employer",
        status: "active",
        phone: `+84 28 73${String(index + 1).padStart(2, "0")} ${String(1100 + index)}`,
        location: locations[index % locations.length],
        website: `https://example.com/company-${index + 1}`,
        bio: `Đội ngũ tuyển dụng của ${company}, phụ trách tuyển nhân sự công nghệ và vận hành tại Việt Nam.`,
        employerDetails: JSON.stringify({
          company,
          industry: ["Công nghệ", "Tài chính", "Thương mại điện tử", "Logistics", "Giáo dục"][index % 5],
          companySize: ["50-100", "100-500", "500-1000", "1000-5000"][index % 4],
          headquarters: locations[index % 5],
          foundedYear: 2005 + (index % 18),
        }),
        emailVerified: true,
        subscriptionPlan: ["basic", "premium", "enterprise"][index % 3],
        subscriptionExpires: daysFromNow(90 + index * 5),
        lastLogin: daysAgo(index % 12),
      }, transaction));
    }

    const candidates = [];
    for (let index = 0; index < CANDIDATE_COUNT; index += 1) {
      const skills = skillGroups[index % skillGroups.length];
      const name = candidateName(index);
      candidates.push(await findOrCreateUser({
        name,
        email: `candidate${String(index + 1).padStart(3, "0")}@scale.demo.jobportal.vn`,
        password: passwordHash,
        role: "jobseeker",
        status: index % 47 === 0 ? "inactive" : "active",
        phone: `+84 9${String(10000000 + index).padStart(8, "0")}`,
        location: locations[index % locations.length],
        bio: `${jobTitles[index % jobTitles.length]} với ${2 + (index % 9)} năm kinh nghiệm, quan tâm đến sản phẩm có tác động thực tế.`,
        skills: JSON.stringify(skills),
        experience: JSON.stringify([{
          company: companies[(index + 3) % companies.length],
          position: jobTitles[index % jobTitles.length],
          duration: `${2 + (index % 6)} năm`,
          description: "Phát triển sản phẩm, phối hợp đa chức năng và cải thiện chất lượng vận hành.",
        }]),
        education: JSON.stringify([{
          degree: ["Cử nhân", "Kỹ sư", "Thạc sĩ"][index % 3],
          school: `Đại học Công nghệ ${1 + (index % 12)}`,
          year: 2014 + (index % 10),
        }]),
        emailVerified: true,
        subscriptionPlan: index % 10 === 0 ? "basic" : "free",
        savedJobsCount: 2 + (index % 9),
        lastLogin: daysAgo(index % 25),
      }, transaction));
    }

    const jobs = [];
    for (let index = 0; index < JOB_COUNT; index += 1) {
      const employer = employers[index % employers.length];
      const company = companies[index % companies.length];
      const title = `${jobTitles[index % jobTitles.length]} ${String(index + 1).padStart(3, "0")}`;
      const [job] = await Job.findOrCreate({
        where: { title, employerId: employer.id },
        defaults: {
          company,
          location: locations[index % locations.length],
          description: `${company} đang mở rộng đội ngũ và tìm kiếm ${title} để xây dựng sản phẩm, tối ưu vận hành và phục vụ khách hàng tại Việt Nam.`,
          requirements: `${2 + (index % 6)}+ năm kinh nghiệm; giao tiếp tốt; thành thạo ${skillGroups[index % skillGroups.length].join(", ")}.`,
          responsibilities: "Phân tích yêu cầu, triển khai giải pháp, review chất lượng và phối hợp với sản phẩm, thiết kế, vận hành.",
          education: "Tốt nghiệp đại học hoặc có kinh nghiệm thực tế tương đương.",
          benefits: "Bảo hiểm đầy đủ, ngân sách học tập, đánh giá lương định kỳ và lịch làm việc linh hoạt.",
          applicationDeadline: daysFromNow(20 + (index % 55)),
          contactEmail: employer.email,
          contactPhone: employer.phone,
          salary: `${25 + (index % 25)}.000.000 - ${40 + (index % 35)}.000.000 VNĐ/tháng`,
          type: ["Full-time", "Contract", "Part-time", "Internship"][index % 4],
          experience: ["Entry Level", "Mid Level", "Senior Level", "Lead", "Manager"][index % 5],
          skills: skillGroups[index % skillGroups.length].join(","),
          status: index % 17 === 0 ? "Draft" : "Published",
          approvalStatus: index % 17 === 0 ? "pending" : "approved",
          createdAt: daysAgo(index % 75),
          updatedAt: daysAgo(index % 20),
        },
        transaction,
      });
      jobs.push(job);

      await Audit.findOrCreate({
        where: { action: "JOB_CREATE", details: `Scale demo job created: ${title}` },
        defaults: {
          performedBy: employer.id,
          targetUserId: employer.id,
          ipAddress: "127.0.0.1",
          userAgent: "JobPortal large demo seed",
          createdAt: job.createdAt,
        },
        transaction,
      });
    }

    const resumes = [];
    for (let index = 0; index < candidates.length; index += 1) {
      const candidate = candidates[index];
      const skills = skillGroups[index % skillGroups.length];
      const fileName = `scale_demo_resume_${String(index + 1).padStart(3, "0")}.pdf`;
      const pdf = generateResumePdf({
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone,
        skills: skills.join(", "),
        experience: `${2 + (index % 9)} năm kinh nghiệm trong ${jobTitles[index % jobTitles.length]}`,
        education: `Đại học Công nghệ ${1 + (index % 12)}`,
        availability: availabilityOptions[index % availabilityOptions.length],
      });
      const [resume] = await Resume.findOrCreate({
        where: { userId: candidate.id, fileName },
        defaults: {
          originalName: `CV_${candidate.name.replace(/\s+/g, "_")}.pdf`,
          filePath: `/app/uploads/resumes/${fileName}`,
          fileSize: pdf.length,
          mimeType: "application/pdf",
          isDefault: true,
          fileData: pdf.toString("base64"),
          createdAt: daysAgo(index % 45),
        },
        transaction,
      });
      resumes.push(resume);
      await candidate.update({ resumePath: fileName }, { transaction });
    }

    let applicationTotal = 0;
    for (let candidateIndex = 0; candidateIndex < candidates.length; candidateIndex += 1) {
      const candidate = candidates[candidateIndex];
      const resume = resumes[candidateIndex];
      const skills = skillGroups[candidateIndex % skillGroups.length];
      for (let offset = 0; offset < APPLICATIONS_PER_CANDIDATE; offset += 1) {
        const job = jobs[(candidateIndex * 7 + offset * 19) % jobs.length];
        const status = applicationStatuses[(candidateIndex + offset) % applicationStatuses.length];
        const applicationDate = daysAgo((candidateIndex * 3 + offset * 5) % 90);
        const [application] = await Application.findOrCreate({
          where: { userId: candidate.id, jobId: job.id },
          defaults: {
            applicantName: candidate.name,
            applicantEmail: candidate.email,
            applicantPhone: candidate.phone,
            resumePath: resume.fileName,
            fileData: resume.fileData,
            originalResumeName: resume.originalName,
            mimeType: resume.mimeType,
            coverLetter: `Tôi quan tâm đến vị trí ${job.title} tại ${job.company} và mong muốn đóng góp kinh nghiệm thực tế vào đội ngũ.`,
            experience: `${2 + (candidateIndex % 9)} năm kinh nghiệm liên quan`,
            education: `Đại học Công nghệ ${1 + (candidateIndex % 12)}`,
            skills: skills.join(","),
            expectedSalary: `${25 + (candidateIndex % 30)}.000.000 VNĐ/tháng`,
            availability: availabilityOptions[(candidateIndex + offset) % availabilityOptions.length],
            status,
            notes: `Hồ sơ demo quy mô lớn; vòng xử lý hiện tại: ${status}.`,
            applicationDate,
            lastUpdated: daysAgo((candidateIndex + offset) % 15),
            isVerified: true,
            emailVerified: true,
            ipAddress: `10.10.${candidateIndex % 20}.${10 + offset}`,
            userAgent: "JobPortal large demo seed",
            riskScore: (candidateIndex * 3 + offset * 7) % 36,
            flagged: false,
            createdAt: applicationDate,
          },
          transaction,
        });
        applicationTotal += 1;

        await Notification.findOrCreate({
          where: { userId: candidate.id, title: `Cập nhật hồ sơ #${application.id}` },
          defaults: {
            message: `Hồ sơ cho ${job.title} tại ${job.company} đang ở trạng thái ${status}.`,
            type: "application_status",
            priority: ["offered", "accepted", "interview_scheduled"].includes(status) ? "high" : "medium",
            isRead: offset % 2 === 0,
            readAt: offset % 2 === 0 ? daysAgo(offset) : null,
            link: "/dashboard",
            metadata: { applicationId: application.id, jobId: job.id },
            createdAt: daysAgo(offset),
          },
          transaction,
        });

        await Audit.findOrCreate({
          where: { action: "APPLICATION_SUBMIT", details: `Scale demo application submitted: ${application.id}` },
          defaults: {
            performedBy: candidate.id,
            targetUserId: candidate.id,
            ipAddress: `10.10.${candidateIndex % 20}.${10 + offset}`,
            userAgent: "JobPortal large demo seed",
            createdAt: applicationDate,
          },
          transaction,
        });
      }
      await candidate.update({ applicationsCount: APPLICATIONS_PER_CANDIDATE }, { transaction });
    }

    for (let index = 0; index < employers.length; index += 1) {
      const employer = employers[index];
      const employerJobs = jobs.filter((job) => job.employerId === employer.id);
      const applications = await Application.count({
        where: { jobId: employerJobs.map((job) => job.id) },
        transaction,
      });
      await Notification.findOrCreate({
        where: { userId: employer.id, title: `Tổng hợp tuyển dụng ${companies[index]}` },
        defaults: {
          message: `${employerJobs.length} tin tuyển dụng đang quản lý và ${applications} hồ sơ ứng viên liên quan.`,
          type: "system",
          priority: "medium",
          isRead: index % 3 === 0,
          link: "/employer",
          metadata: { jobCount: employerJobs.length, applicationCount: applications },
        },
        transaction,
      });
    }

    for (const category of ["general", "email", "security", "subscriptions", "notifications", "featuredJobs", "recruitment"]) {
      await Setting.findOrCreate({
        where: { category },
        defaults: {
          value: { seeded: true, environment: "docker-development", category },
          updatedBy: admin.id,
        },
        transaction,
      });
    }

    console.log(`Prepared ${employers.length} employers, ${candidates.length} candidates, ${jobs.length} jobs and ${applicationTotal} applications.`);
  });

  const counts = {};
  for (const [name, model] of Object.entries({
    users: User,
    jobs: Job,
    applications: Application,
    resumes: Resume,
    notifications: Notification,
    audits: Audit,
    settings: Setting,
  })) {
    counts[name] = await model.count();
  }
  console.log("Large demo dataset is ready:", counts);
  await sequelize.close();
}

seedLargeDemoData().catch(async (error) => {
  console.error("Large demo seed failed:", error);
  await sequelize.close().catch(() => {});
  process.exit(1);
});
