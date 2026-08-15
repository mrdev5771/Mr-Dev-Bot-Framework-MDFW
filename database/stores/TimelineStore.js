const TimelineEvent = require("../models/TimelineEvent");

class TimelineStore {
  // ============================================================
  // CREATE
  // ============================================================

  static async create(data) {
    return TimelineEvent.create(data);
  }

  // ============================================================
  // GET
  // ============================================================

  static async get(userID, limit = 20) {
    if (!userID) return [];

    return TimelineEvent.find({ userID })
      .sort({
        importance: -1,
        createdAt: -1,
      })
      .limit(limit)
      .lean();
  }

  // ============================================================
  // RECENT
  // ============================================================

  static async recent(userID, limit = 50) {
    if (!userID) return [];

    return TimelineEvent.find({ userID })
      .sort({
        createdAt: -1,
      })
      .limit(limit)
      .lean();
  }

  // ============================================================
  // CHRONOLOGICAL
  // ============================================================

  static async getChronological(userID, limit = 20) {
    if (!userID) return [];

    return TimelineEvent.find({ userID })
      .sort({
        createdAt: 1,
      })
      .limit(limit)
      .lean();
  }

  // ============================================================
  // SEARCH
  // ============================================================

  static async search(userID, keyword) {
    if (!userID || !keyword) return [];

    return TimelineEvent.find({
      userID,
      event: {
        $regex: keyword,
        $options: "i",
      },
    })
      .sort({
        importance: -1,
        createdAt: -1,
      })
      .lean();
  }

  // ============================================================
  // UPDATE
  // ============================================================

  static async update(timelineID, data = {}) {
    if (!timelineID) return null;

    return TimelineEvent.findByIdAndUpdate(
      timelineID,
      {
        $set: data,
      },
      {
        new: true,
        runValidators: true,
      },
    ).lean();
  }

  // ============================================================
  // DELETE
  // ============================================================

  static async delete(timelineID) {
    if (!timelineID) return null;

    return TimelineEvent.findByIdAndDelete(timelineID);
  }
}

module.exports = TimelineStore;
