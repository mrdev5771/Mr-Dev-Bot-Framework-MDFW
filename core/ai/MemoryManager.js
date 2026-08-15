const MemoryStore = require("../../database/stores/MemoryStore");

class MemoryManager {
  // ============================================================
  // SAVE MEMORY
  // ============================================================

  static async remember(userID, memory, options = {}) {
    if (!userID) {
      throw new Error("MemoryManager.remember(): userID is required");
    }

    if (!memory || typeof memory !== "string" || !memory.trim()) {
      return null;
    }

    return MemoryStore.create({
      userID,

      memory: memory.trim(),

      importance: Number(options.importance ?? 1),

      tags: Array.isArray(options.tags) ? options.tags : [],

      source: options.source || "conversation",
    });
  }

  // ============================================================
  // GET MEMORY TEXT
  // ============================================================

  static async get(userID, limit = 20) {
    const memories = await MemoryStore.get(userID, limit);

    return memories.map((memory) => memory.memory);
  }

  // ============================================================
  // GET FULL MEMORY DOCUMENTS
  // ============================================================

  static async getDetailed(userID, limit = 20) {
    return MemoryStore.get(userID, limit);
  }

  // ============================================================
  // OLD API COMPATIBILITY
  // ============================================================

  static async getMemory(userID, limit = 20) {
    const memories = await this.get(userID, limit);

    if (!memories.length) {
      return "No memory available.";
    }

    return memories.join("\n");
  }

  // ============================================================
  // SEARCH
  // ============================================================

  static async search(userID, keyword) {
    if (!userID || !keyword) {
      return [];
    }

    return MemoryStore.search(userID, keyword);
  }
}

module.exports = MemoryManager;
