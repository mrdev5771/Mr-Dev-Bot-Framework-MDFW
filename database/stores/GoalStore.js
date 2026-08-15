const Goal = require("../models/Goal");

class GoalStore {
  // ============================================================
  // CREATE
  // ============================================================

  static async create(data) {
    return Goal.create(data);
  }

  // ============================================================
  // GET ALL
  // ============================================================

  static async get(userID, limit = 20) {
    if (!userID) return [];

    return Goal.find({
      userID,
    })
      .sort({
        createdAt: -1,
      })
      .limit(limit)
      .lean();
  }

  // ============================================================
  // GET ACTIVE
  // ============================================================

  static async getActive(userID, limit = 20) {
    if (!userID) return [];

    return Goal.find({
      userID,
      status: "active",
    })
      .sort({
        createdAt: -1,
      })
      .limit(limit)
      .lean();
  }

  // ============================================================
  // COMPLETE
  // ============================================================

  static async complete(goalID) {
    if (!goalID) return null;

    return Goal.findByIdAndUpdate(
      goalID,
      {
        status: "completed",
        progress: 100,
      },
      {
        new: true,
      },
    ).lean();
  }

  // ============================================================
  // UPDATE
  // ============================================================

  static async update(goalID, data = {}) {
    if (!goalID) return null;

    return Goal.findByIdAndUpdate(
      goalID,
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

  static async delete(goalID) {
    if (!goalID) return null;

    return Goal.findByIdAndDelete(goalID).lean();
  }
}

module.exports = GoalStore;
