const MemoryManager = require("../MemoryManager");
const ProfileManager = require("../ProfileManager");
const GoalManager = require("../GoalManager");
const TimelineManager = require("../TimelineManager");
const RunningJokeManager = require("../RunningJokeManager");
const EmotionManager = require("../EmotionManager");
const RelationshipManager = require("../RelationshipManager");

class KnowledgeRouter {
  static async route(userID, knowledge) {
    if (!knowledge.learn) return;

    // =========================
    // MEMORY
    // =========================

    for (const memory of knowledge.memory) {
      await MemoryManager.remember(userID, memory.text, {
        importance: memory.importance,
        tags: memory.tags,
        category: memory.category,
        replace: memory.replace,
        source: "brain",
      });
    }

    // =========================
    // PROFILE
    // =========================

    if (Object.keys(knowledge.profile).length) {
      await ProfileManager.merge(userID, {
        facts: knowledge.profile,
      });
    }

    // =========================
    // GOALS
    // =========================

    if (knowledge.goal.length) {
      if (typeof GoalManager.learn === "function") {
        await GoalManager.learn(userID, knowledge.goal);
      }
    }

    // =========================
    // TIMELINE
    // =========================

    if (knowledge.timeline.length) {
      if (typeof TimelineManager.learn === "function") {
        await TimelineManager.learn(userID, knowledge.timeline);
      }
    }

    // =========================
    // RUNNING JOKES
    // =========================

    if (knowledge.runningJokes.length) {
      if (typeof RunningJokeManager.learn === "function") {
        await RunningJokeManager.learn(userID, knowledge.runningJokes);
      }
    }

    // =========================
    // EMOTION
    // =========================

    if (Object.keys(knowledge.emotion).length) {
      if (typeof EmotionManager.learn === "function") {
        await EmotionManager.learn(userID, knowledge.emotion);
      }
    }

    // =========================
    // RELATIONSHIP
    // =========================

    if (Object.keys(knowledge.relationship).length) {
      if (typeof RelationshipManager.learn === "function") {
        await RelationshipManager.learn(userID, knowledge.relationship);
      }
    }
  }
}

module.exports = KnowledgeRouter;
