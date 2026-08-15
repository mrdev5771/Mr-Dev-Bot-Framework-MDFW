const RelationshipStore = require("../../database/stores/RelationshipStore");

class RelationshipManager {
  // ============================================================
  // GET
  // ============================================================

  static async get(userID) {
    if (!userID) {
      return {
        level: 1,
        title: "Stranger",
        messages: 0,
        trust: 0,
      };
    }

    return RelationshipStore.get(String(userID));
  }

  // ============================================================
  // UPDATE
  // ============================================================

  static async update(userID, data = {}) {
    if (!userID) return null;

    return RelationshipStore.update(String(userID), data);
  }

  // ============================================================
  // INCREMENT MESSAGE COUNT
  // ============================================================

  static async incrementMessages(userID) {
    if (!userID) return null;

    return RelationshipStore.incrementMessages(String(userID), 1);
  }

  // ============================================================
  // LEARN
  // ============================================================

  static async learn(userID, data = {}) {
    if (!userID || !data) return null;

    return this.update(userID, data);
  }

  // ============================================================
  // PROMPT
  // ============================================================

  static getPrompt(relationship = {}) {
    const level = Number(relationship.level ?? 1);
    const title = relationship.title || "Stranger";
    const messages = Number(relationship.messages ?? 0);
    const trust = Number(relationship.trust ?? 0);

    return `
Relationship Level: ${level}
Relationship Title: ${title}
Messages Together: ${messages}
Trust: ${trust}

Use this relationship information to determine how familiar,
comfortable, and natural the AI should be with the user.

Do not contradict the stored relationship.
Do not call the user a stranger if the stored relationship
identifies them as someone familiar.
`;
  }

  // ============================================================
  // OWNER / CREATOR
  // ============================================================

  static async setCreator(userID) {
    if (!userID) return null;

    return this.update(userID, {
      level: 100,
      title: "Creator",
      trust: 100,
    });
  }
}

module.exports = RelationshipManager;
