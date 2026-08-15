const fs = require("fs-extra");
const path = require("path");

class KnowledgeLogger {
  static LOG_DIR = path.join(__dirname, "../../../logs/brain");

  static async log(userID, message, knowledge) {
    try {
      await fs.ensureDir(this.LOG_DIR);

      const date = new Date();

      const fileName = date.toISOString().split("T")[0] + ".json";

      const file = path.join(this.LOG_DIR, fileName);

      let logs = [];

      if (await fs.pathExists(file)) {
        try {
          logs = await fs.readJson(file);
        } catch {
          logs = [];
        }
      }

      logs.push({
        timestamp: date.toISOString(),

        userID,

        message,

        knowledge,
      });

      await fs.writeJson(file, logs, {
        spaces: 2,
      });
    } catch (err) {
      console.log("[KnowledgeLogger]", err.message);
    }
  }
}

module.exports = KnowledgeLogger;
