const { sequelize } = require("../config/database");

const indexes = [
  {
    table: "applications",
    name: "idx_applications_job_date",
    columns: "`jobId`, `applicationDate` DESC",
  },
  {
    table: "applications",
    name: "idx_applications_email_date",
    columns: "`applicantEmail`, `applicationDate` DESC",
  },
  {
    table: "notifications",
    name: "idx_notifications_user_read_created",
    columns: "`userId`, `isRead`, `createdAt` DESC",
  },
  {
    table: "resumes",
    name: "idx_resumes_user_default_created",
    columns: "`userId`, `isDefault`, `createdAt` DESC",
  },
  {
    table: "jobs",
    name: "idx_jobs_employer_created",
    columns: "`employerId`, `createdAt` DESC",
  },
];

const indexExists = async (table, name) => {
  const [rows] = await sequelize.query(
    `SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND INDEX_NAME = :name
     LIMIT 1`,
    { replacements: { table, name } }
  );
  return rows.length > 0;
};

const up = async () => {
  for (const index of indexes) {
    if (await indexExists(index.table, index.name)) continue;
    await sequelize.query(
      `CREATE INDEX \`${index.name}\` ON \`${index.table}\` (${index.columns})`
    );
    console.log(`Created ${index.name}`);
  }
};

const down = async () => {
  for (const index of [...indexes].reverse()) {
    if (!(await indexExists(index.table, index.name))) continue;
    await sequelize.query(`DROP INDEX \`${index.name}\` ON \`${index.table}\``);
    console.log(`Dropped ${index.name}`);
  }
};

module.exports = { up, down, indexes };
