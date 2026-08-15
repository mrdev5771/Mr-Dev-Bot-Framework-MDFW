const Conversation = require("../models/Conversation");

class ConversationStore {
  // ============================================================
  // CREATE
  // ============================================================

  static async create(userID, userMessage, botReply) {
    if (!userID || !userMessage || !botReply) {
      throw new Error("ConversationStore.create(): missing required data");
    }

    return Conversation.create({
      userID: String(userID),
      userMessage: String(userMessage).trim(),
      botReply: String(botReply).trim(),
    });
  }

  // ============================================================
  // GET RECENT
  // ============================================================

  static async getRecent(userID, limit = 10) {
    if (!userID) return [];

    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);

    const conversations = await Conversation.find({
      userID: String(userID),
    })
      .sort({ createdAt: -1 })
      .limit(safeLimit)
      .lean();

    return conversations.reverse();
  }

  // ============================================================
  // GET
  // ============================================================

  static async get(userID, limit = 10) {
    return this.getRecent(userID, limit);
  }

  // ============================================================
  // CLEAR
  // ============================================================

  static async clear(userID) {
    if (!userID) return null;

    return Conversation.deleteMany({
      userID: String(userID),
    });
  }

  // ============================================================
  // COUNT
  // ============================================================

  static async count(userID) {
    if (!userID) return 0;

    return Conversation.countDocuments({
      userID: String(userID),
    });
  }
}

module.exports = ConversationStore;
