const ProfileManager = require("./ProfileManager");
const MemoryManager = require("./MemoryManager");
const ConversationManager = require("./ConversationManager");
const EmotionManager = require("./EmotionManager");

class ContextBuilder {
  static async build(userID) {
    let profile = {};
    let memory = "No memory available.";
    let history = [];
    let emotion = {};

    // =======================
    // PROFILE
    // =======================

    try {
      profile = (await ProfileManager.getProfile(userID)) || {};
    } catch (err) {
      console.log("[Profile Load Error]", err.message);
    }

    // =======================
    // MEMORY
    // =======================

    try {
      memory =
        (await MemoryManager.getMemory(userID)) || "No memory available.";
    } catch (err) {
      console.log("[Memory Load Error]", err.message);
    }

    // =======================
    // CONVERSATION
    // =======================

    try {
      history = (await ConversationManager.getRecent(userID, 3)) || [];
    } catch (err) {
      console.log("[Conversation Load Error]", err.message);
    }

    // =======================
    // EMOTION
    // =======================

    try {
      emotion = (await EmotionManager.get(userID)) || {};
    } catch (err) {
      console.log("[Emotion Load Error]", err.message);
    }

    // =======================
    // FORMAT HISTORY
    // =======================

    const recentChat = history.length
      ? history
          .map(
            (x) => `

User:

${x.user}

AI:

${x.ai}

`,
          )
          .join("\n")
      : "No previous conversation available.";

    return {
      profile,
      memory,
      emotion,
      recentChat,
      history,
    };
  }
}

module.exports = ContextBuilder;
