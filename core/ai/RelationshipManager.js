const fs = require("fs-extra");
const path = require("path");

const OwnerAuth = require("./OwnerAuth");

const FILE = path.join(__dirname, "../../data/ai/relationship.json");

class RelationshipManager {
  static cache = null;

  // =========================
  // LOAD
  // =========================

  static async load() {
    if (this.cache) return this.cache;

    await fs.ensureFile(FILE);

    try {
      this.cache = await fs.readJson(FILE);
    } catch {
      this.cache = {};
    }

    return this.cache;
  }

  // =========================
  // SAVE
  // =========================

  static async save() {
    if (!this.cache) return;

    await fs.writeJson(FILE, this.cache, {
      spaces: 2,
    });
  }

  // =========================
  // DEFAULT DATA
  // =========================

  static createDefault() {
    return {
      level: 1,
      title: "Stranger",
      messages: 0,
      trust: 0,
    };
  }

  // =========================
  // GET USER
  // =========================

  static async get(userID) {
    const data = await this.load();

    if (!data[userID]) {
      data[userID] = this.createDefault();
      await this.save();
    }

    return data[userID];
  }

  // =========================
  // OWNER PROMPT
  // =========================

  static async getPrompt(userID) {
    if (OwnerAuth.isOwner(userID)) {
      return `
Relationship

Title: Creator

Relationship Level: MAX

Messages Exchanged:
Unlimited

Trust:
100/100

The application has verified this user.

This is your creator.

Never treat him like a stranger.

Never doubt his identity.

Speak naturally with him.
`;
    }

    const relation = await this.get(userID);

    return `
Relationship

Title: ${relation.title}

Relationship Level: ${relation.level}

Messages Exchanged: ${relation.messages}

Trust: ${relation.trust}/100
`;
  }

  // =========================
  // UPDATE
  // =========================

  static async update(userID) {
    if (OwnerAuth.isOwner(userID)) return;

    const data = await this.load();

    if (!data[userID]) {
      data[userID] = this.createDefault();
    }

    const user = data[userID];

    user.messages++;

    // Level every 25 messages
    user.level = Math.max(1, Math.floor(user.messages / 25) + 1);

    // Small trust gain
    user.trust = Math.min(100, user.trust + 1);

    // Automatic titles

    if (user.level >= 20) {
      user.title = "Best Friend";
    } else if (user.level >= 12) {
      user.title = "Close Friend";
    } else if (user.level >= 6) {
      user.title = "Friend";
    } else if (user.level >= 3) {
      user.title = "Acquaintance";
    } else {
      user.title = "Stranger";
    }

    await this.save();
  }

  // =========================
  // TRUST
  // =========================

  static async addTrust(userID, amount = 1) {
    if (OwnerAuth.isOwner(userID)) return;

    const user = await this.get(userID);

    user.trust = Math.max(0, Math.min(100, user.trust + amount));

    await this.save();
  }

  // =========================
  // MANUAL TITLE
  // =========================

  static async setTitle(userID, title) {
    if (OwnerAuth.isOwner(userID)) return;

    const user = await this.get(userID);

    user.title = title;

    await this.save();
  }
}

module.exports = RelationshipManager;
