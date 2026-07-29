const fs = require("fs-extra");
const path = require("path");

const FILE = path.join(__dirname, "../../data/ai/memories.json");

class MemoryManager {
  static async load() {
    await fs.ensureFile(FILE);

    try {
      return await fs.readJson(FILE);
    } catch (err) {
      return {};
    }
  }

  static async save(data) {
    await fs.writeJson(
      FILE,

      data,

      {
        spaces: 2,
      },
    );
  }

  static async getUser(userID) {
    const data = await this.load();

    if (!data[userID]) {
      data[userID] = {
        facts: [],

        preferences: [],

        events: [],

        history: [],
      };
    }

    // =========================
    // AUTO MEMORY REPAIR SYSTEM
    // =========================

    if (!Array.isArray(data[userID].facts)) {
      data[userID].facts = [];
    }

    if (!Array.isArray(data[userID].preferences)) {
      data[userID].preferences = [];
    }

    if (!Array.isArray(data[userID].events)) {
      data[userID].events = [];
    }

    if (!Array.isArray(data[userID].history)) {
      data[userID].history = [];
    }

    // =========================
    // OLD MEMORY MIGRATION
    // =========================

    data[userID].facts = data[userID].facts.map((item) => {
      if (typeof item === "string") {
        return {
          text: item,

          importance: 5,
        };
      }

      return item;
    });

    await this.save(data);

    return data[userID];
  }

  static async getMemory(userID) {
    const user = await this.getUser(userID);

    let memory = "";

    // =========================
    // FACTS
    // =========================

    if (user.facts.length) {
      memory += "Important facts about user:\n";

      user.facts

        .filter((x) => x && x.text)

        .sort((a, b) => (b.importance || 0) - (a.importance || 0))

        .slice(0, 10)

        .forEach((item) => {
          memory += `- ${item.text}\n`;
        });
    }

    // =========================
    // PREFERENCES
    // =========================

    if (user.preferences.length) {
      memory += "\nUser preferences:\n";

      user.preferences.forEach((item) => {
        memory += `- ${item}\n`;
      });
    }

    // =========================
    // EVENTS
    // =========================

    if (user.events.length) {
      memory += "\nImportant events:\n";

      user.events

        .slice(-5)

        .forEach((item) => {
          if (item.text) {
            memory += `- ${item.text}\n`;
          }
        });
    }

    if (!memory.trim()) {
      memory = "No important memories available.";
    }

    return memory;
  }

  static async addMemory(userID, type, text, importance = 5) {
    const data = await this.load();

    if (!data[userID]) {
      data[userID] = {
        facts: [],

        preferences: [],

        events: [],

        history: [],
      };
    }

    if (type === "fact") {
      const exists = data[userID].facts.some(
        (x) => x.text.toLowerCase() === text.toLowerCase(),
      );

      if (!exists) {
        data[userID].facts.push({
          text,

          importance,
        });
      }
    }

    if (type === "preference") {
      if (!data[userID].preferences.includes(text)) {
        data[userID].preferences.push(text);
      }
    }

    if (type === "event") {
      data[userID].events.push({
        text,

        importance,

        date: new Date().toISOString(),
      });
    }

    await this.save(data);
  }

  static async addHistory(userID, text) {
    const user = await this.getUser(userID);

    user.history.push(text);

    if (user.history.length > 30) {
      user.history = user.history.slice(-30);
    }

    const data = await this.load();

    data[userID] = user;

    await this.save(data);
  }

  static async remember(userID, message) {
    const lower = message.toLowerCase();

    // NAME

    if (lower.includes("my name is")) {
      let name = message

        .replace(/.*my name is/i, "")

        .trim();

      await this.addMemory(
        userID,

        "fact",

        `User name is ${name}`,

        10,
      );

      return true;
    }

    // LIKE

    if (lower.includes("i like")) {
      let thing = message

        .replace(/.*i like/i, "")

        .trim();

      await this.addMemory(
        userID,

        "fact",

        `User likes ${thing}`,

        8,
      );

      return true;
    }

    // LOVE

    if (lower.includes("i love")) {
      let thing = message

        .replace(/.*i love/i, "")

        .trim();

      await this.addMemory(
        userID,

        "fact",

        `User loves ${thing}`,

        8,
      );

      return true;
    }

    // FAVORITE

    if (lower.includes("my favourite") || lower.includes("my favorite")) {
      await this.addMemory(
        userID,

        "preference",

        message,

        7,
      );

      return true;
    }

    // BAD EVENTS

    if (
      lower.includes("today") &&
      (lower.includes("bad") ||
        lower.includes("sad") ||
        lower.includes("problem") ||
        lower.includes("issue"))
    ) {
      await this.addMemory(
        userID,

        "event",

        message,

        6,
      );

      return true;
    }

    return false;
  }
}

module.exports = MemoryManager;
