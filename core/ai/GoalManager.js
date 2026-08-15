const GoalStore = require("../../database/stores/GoalStore");

class GoalManager {
  // ============================================================
  // CREATE GOAL
  // ============================================================

  static async create(userID, goal, options = {}) {
    if (!userID) {
      throw new Error("GoalManager.create(): userID is required");
    }

    if (!goal || !String(goal).trim()) {
      return null;
    }

    return GoalStore.create({
      userID,

      goal: String(goal).trim(),

      status: options.status || "active",

      progress: options.progress ?? 0,
    });
  }

  // ============================================================
  // LEARN GOALS FROM KNOWLEDGE EXTRACTOR
  // ============================================================

  static async learn(userID, goals) {
    if (!userID) return [];

    if (!Array.isArray(goals)) {
      return [];
    }

    const created = [];

    for (const goal of goals) {
      // --------------------------------------------------------
      // Support both:
      //
      // "make the best AI assistant"
      //
      // and:
      //
      // {
      //   goal: "make the best AI assistant",
      //   status: "active",
      //   progress: 20
      // }
      // --------------------------------------------------------

      let text = "";
      let options = {};

      if (typeof goal === "string") {
        text = goal;
      } else if (goal && typeof goal === "object") {
        text = goal.goal || goal.text || "";

        options = {
          status: goal.status || "active",
          progress: typeof goal.progress === "number" ? goal.progress : 0,
        };
      }

      text = String(text).trim();

      if (!text) continue;

      // --------------------------------------------------------
      // Prevent duplicate active goals
      // --------------------------------------------------------

      const existingGoals = await GoalStore.getActive(userID, 100);

      const normalizedNew = text.toLowerCase();

      const duplicate = existingGoals.some((existing) => {
        if (!existing?.goal) return false;

        return existing.goal.trim().toLowerCase() === normalizedNew;
      });

      if (duplicate) {
        continue;
      }

      // --------------------------------------------------------
      // Create new goal
      // --------------------------------------------------------

      const newGoal = await this.create(userID, text, options);

      if (newGoal) {
        created.push(newGoal);
      }
    }

    return created;
  }

  // ============================================================
  // GET ALL GOALS
  // ============================================================

  static async get(userID, limit = 20) {
    if (!userID) return [];

    return GoalStore.get(userID, limit);
  }

  // ============================================================
  // GET ACTIVE GOALS
  // ============================================================

  static async getActive(userID, limit = 20) {
    if (!userID) return [];

    return GoalStore.getActive(userID, limit);
  }

  // ============================================================
  // COMPLETE
  // ============================================================

  static async complete(goalID) {
    if (!goalID) return null;

    return GoalStore.complete(goalID);
  }

  // ============================================================
  // UPDATE
  // ============================================================

  static async update(goalID, data = {}) {
    if (!goalID) return null;

    return GoalStore.update(goalID, data);
  }

  // ============================================================
  // DELETE
  // ============================================================

  static async delete(goalID) {
    if (!goalID) return null;

    return GoalStore.delete(goalID);
  }
}

module.exports = GoalManager;
