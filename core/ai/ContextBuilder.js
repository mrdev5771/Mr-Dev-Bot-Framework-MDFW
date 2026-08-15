const ProfileManager = require("./ProfileManager");
const MemoryRetriever = require("./MemoryRetriever");
const ConversationManager = require("./ConversationManager");
const EmotionManager = require("./EmotionManager");
const RelationshipManager = require("./RelationshipManager");
const GoalManager = require("./GoalManager");
const TimelineManager = require("./TimelineManager");
const RunningJokeManager = require("./RunningJokeManager");

class ContextBuilder {
  static async build(userID, currentMessage = "") {
    let profile = {};
    let memories = [];
    let history = [];
    let emotion = {};
    let relationship = {};
    let goals = [];
    let timeline = [];
    let runningJokes = [];

    // ============================================================
    // CONVERSATION
    // ============================================================

    try {
      history = (await ConversationManager.get(userID, 10)) || [];
    } catch (err) {
      console.log("[Conversation Load Error]", err.message);
    }

    // ============================================================
    // PROFILE
    // ============================================================

    try {
      profile = (await ProfileManager.getProfile(userID)) || {};
    } catch (err) {
      console.log("[Profile Load Error]", err.message);
    }

    // ============================================================
    // MEMORY
    // ============================================================

    try {
      memories =
        (await MemoryRetriever.retrieve(userID, currentMessage || "")) || [];
    } catch (err) {
      console.log("[Memory Load Error]", err.message);
    }

    // ============================================================
    // EMOTION
    // ============================================================

    try {
      emotion = (await EmotionManager.get(userID)) || {};
    } catch (err) {
      console.log("[Emotion Load Error]", err.message);
    }

    // ============================================================
    // RELATIONSHIP
    // ============================================================

    try {
      relationship = (await RelationshipManager.get(userID)) || {};
    } catch (err) {
      console.log("[Relationship Load Error]", err.message);
    }

    // ============================================================
    // GOALS
    // ============================================================

    try {
      if (typeof GoalManager.get === "function") {
        goals = (await GoalManager.get(userID)) || [];
      }
    } catch (err) {
      console.log("[Goal Load Error]", err.message);
    }

    // ============================================================
    // TIMELINE
    // ============================================================

    try {
      if (typeof TimelineManager.get === "function") {
        timeline = (await TimelineManager.get(userID)) || [];
      }
    } catch (err) {
      console.log("[Timeline Load Error]", err.message);
    }

    // ============================================================
    // RUNNING JOKES
    // ============================================================

    try {
      if (typeof RunningJokeManager.get === "function") {
        runningJokes = (await RunningJokeManager.get(userID)) || [];
      }
    } catch (err) {
      console.log("[Running Joke Load Error]", err.message);
    }

    // ============================================================
    // FORMAT MEMORIES
    // ============================================================

    const memoryText = Array.isArray(memories)
      ? memories
          .map((memory) => {
            if (typeof memory === "string") {
              return memory;
            }

            return memory?.memory || memory?.text || "";
          })
          .filter(Boolean)
          .join("\n")
      : String(memories || "");

    // ============================================================
    // FORMAT RECENT CHAT
    // ============================================================

    const recentChat = history.length
      ? history
          .map((chat) => `User: ${chat.userMessage}\nAI: ${chat.botReply}`)
          .join("\n\n")
      : "No previous conversation.";

    // ============================================================
    // RETURN UNIFIED CONTEXT
    // ============================================================

    return {
      userID,

      profile,

      memory: memoryText || "No memory available.",

      memories,

      emotion,

      relationship,

      goals,

      timeline,

      runningJokes,

      history,

      recentChat,
    };
  }
}

module.exports = ContextBuilder;
