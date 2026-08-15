const ConversationStore = require("../../database/stores/ConversationStore");

class ConversationManager {
  // ============================================================
  // SAVE CONVERSATION
  // ============================================================

  static async add(userID, userMessage, botReply) {
    if (!userID) {
      throw new Error("ConversationManager.add(): userID is required");
    }

    if (!userMessage || !botReply) {
      throw new Error(
        "ConversationManager.add(): userMessage and botReply are required",
      );
    }

    return ConversationStore.create(userID, userMessage, botReply);
  }

  // ============================================================
  // RECENT CONVERSATION
  // ============================================================

  static async get(userID, limit = 10) {
    return ConversationStore.getRecent(userID, limit);
  }

  // ============================================================
  // COMPATIBILITY API
  // ============================================================

  static async getRecent(userID, limit = 10) {
    return this.get(userID, limit);
  }

  // ============================================================
  // CLEAR
  // ============================================================

  static async clear(userID) {
    return ConversationStore.clear(userID);
  }

  // ============================================================
  // COUNT
  // ============================================================

  static async count(userID) {
    return ConversationStore.count(userID);
  }
}

module.exports = ConversationManager;
