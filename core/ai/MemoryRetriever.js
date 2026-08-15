const MemoryStore = require("../../database/stores/MemoryStore");

class MemoryRetriever {
  static async retrieve(userID, message, limit = 8) {
    const memories = await MemoryStore.get(userID, 100);

    if (!memories.length) return [];

    const words = message
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2);

    const scored = [];

    for (const mem of memories) {
      let score = 0;

      const text = (mem.memory || "").toLowerCase();

      // importance matters
      score += (mem.importance || 1) * 3;

      // newer memories slightly preferred
      if (mem.createdAt) {
        const ageHours =
          (Date.now() - new Date(mem.createdAt).getTime()) / 3600000;

        score += Math.max(0, 24 - ageHours) / 8;
      }

      // keyword overlap
      for (const word of words) {
        if (text.includes(word)) score += 5;
      }

      // tag overlap
      if (Array.isArray(mem.tags)) {
        for (const tag of mem.tags) {
          if (words.includes(tag.toLowerCase())) score += 4;
        }
      }

      // category boost
      switch (mem.source) {
        case "profile":
          score += 4;
          break;

        case "goal":
          score += 3;
          break;

        case "runningJoke":
          score += 2;
          break;

        default:
          break;
      }

      if (score > 0) {
        scored.push({
          score,
          memory: mem.memory,
        });
      }
    }

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map((x) => x.memory);
  }
}

module.exports = MemoryRetriever;
