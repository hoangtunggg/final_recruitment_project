require("dotenv").config();
const { sequelize } = require("../config/database");
const migration = require("../migrations/add-scalability-indexes");

const direction = process.argv[2] || "up";
if (!['up', 'down'].includes(direction)) {
  console.error("Usage: node src/scripts/run-scalability-indexes.js [up|down]");
  process.exit(1);
}

(async () => {
  try {
    await sequelize.authenticate();
    await migration[direction]();
    await sequelize.close();
    console.log(`Scalability index migration ${direction} completed.`);
  } catch (error) {
    console.error(`Scalability index migration ${direction} failed:`, error.message);
    try {
      await sequelize.close();
    } catch (_) {}
    process.exit(1);
  }
})();
