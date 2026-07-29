const fs = require("fs-extra");
const path = require("path");

const FILE = path.join(process.cwd(), "data/ai/conversations.json");

class ConversationManager {
  static async load() {
    await fs.ensureFile(FILE);

    return await fs.readJson(FILE, {});
  }

  static async save(data) {
    await fs.writeJson(FILE, data, {
      spaces: 2,
    });
  }

  static async add(userID, user, ai) {
    const data = await this.load();

    if (!data[userID]) {
      data[userID] = [];
    }

    data[userID].push({
      user,

      ai,

      time: Date.now(),
    });

    // keep only last 50 chats

    if (data[userID].length > 50) {
      data[userID] = data[userID].slice(-50);
    }

    await this.save(data);
  }

  static async getRecent(userID, limit = 10) {
    const data = await this.load();

    if (!data[userID]) {
      return [];
    }

    return data[userID].slice(-limit);
  }
}

module.exports = ConversationManager;
