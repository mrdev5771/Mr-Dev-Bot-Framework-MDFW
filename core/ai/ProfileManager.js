const fs = require("fs-extra");
const path = require("path");

const FILE = path.join(process.cwd(), "data/ai/profiles.json");

class ProfileManager {
  static async load() {
    await fs.ensureFile(FILE);

    let data = await fs.readJson(FILE, {});

    return data;
  }

  static async save(data) {
    await fs.writeJson(FILE, data, {
      spaces: 2,
    });
  }

  static async getProfile(userID) {
    const data = await this.load();

    return data[userID] || {};
  }

  static async update(userID, key, value) {
    const data = await this.load();

    if (!data[userID]) {
      data[userID] = {};
    }

    data[userID][key] = value;

    await this.save(data);
  }

  static async addLike(userID, value) {
    const data = await this.load();

    if (!data[userID]) {
      data[userID] = {};
    }

    if (!data[userID].likes) {
      data[userID].likes = [];
    }

    if (!data[userID].likes.includes(value)) {
      data[userID].likes.push(value);
    }

    await this.save(data);
  }
}

module.exports = ProfileManager;
