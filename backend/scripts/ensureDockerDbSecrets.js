const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const targetDirectory = process.argv[2];

if (!targetDirectory) {
  throw new Error("A target directory is required");
}

fs.mkdirSync(targetDirectory, { recursive: true });

for (const fileName of [
  "mysql_root_password",
  "mysql_app_password",
  "grafana_admin_password",
]) {
  const filePath = path.join(targetDirectory, fileName);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, crypto.randomBytes(32).toString("hex"), {
      encoding: "utf8",
      mode: 0o444,
      flag: "wx",
    });
  }
}

console.log("Docker database credentials are ready.");
