const Memory = require("../../database/models/Memory");

class MemoryStore {
  static async add({
    userID,
    memory,
    importance = 1,
    tags = [],
    source = "conversation",
  }) {
    return await Memory.create({
      userID,

      memory,

      importance,

      tags,

      source,
    });
  }

  static async get(userID, limit = 20) {
    return await Memory.find({ userID })
      .sort({
        importance: -1,
        createdAt: -1,
      })
      .limit(limit)
      .lean();
  }

  static async search(userID, keyword) {
    return await Memory.find({
      userID,

      memory: {
        $regex: keyword,
        $options: "i",
      },
    }).lean();
  }

  static async delete(id) {
    return await Memory.findByIdAndDelete(id);
  }
}

module.exports = MemoryStore;
