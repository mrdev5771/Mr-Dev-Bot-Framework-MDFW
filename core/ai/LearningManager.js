const ProfileExtractor = require("./ProfileExtractor");
const MemoryManager = require("./MemoryManager");
const ConversationManager = require("./ConversationManager");
const EmotionManager = require("./EmotionManager");
const RelationshipManager = require("./RelationshipManager");

class LearningManager {
  static learn(userID, message, reply) {
    setImmediate(async () => {
      await Promise.allSettled([
        this.learnProfile(userID, message),

        this.learnMemory(userID, message),

        this.learnConversation(userID, message, reply),

        this.learnEmotion(userID, message),

        this.learnRelationship(userID),
      ]);
    });
  }

  // =========================
  // PROFILE
  // =========================

  static async learnProfile(userID, message) {
    try {
      await ProfileExtractor.extract(userID, message);
    } catch (err) {
      console.log("[Profile Extract Error]", err.message);
    }
  }

  // =========================
  // MEMORY
  // =========================

  static async learnMemory(userID, message) {
    try {
      await MemoryManager.remember(userID, message);
    } catch (err) {
      console.log("[Memory Save Error]", err.message);
    }
  }

  // =========================
  // CONVERSATION
  // =========================

  static async learnConversation(userID, message, reply) {
    try {
      await ConversationManager.add(userID, message, reply);
    } catch (err) {
      console.log("[Conversation Save Error]", err.message);
    }
  }

  // =========================
  // EMOTION
  // =========================

  static async learnEmotion(userID, message) {
    try {
      await EmotionManager.update(userID, message);
    } catch (err) {
      console.log("[Emotion Update Error]", err.message);
    }
  }

  // =========================
  // RELATIONSHIP
  // =========================

  static async learnRelationship(userID) {
    try {
      await RelationshipManager.update(userID);
    } catch (err) {
      console.log("[Relationship Error]", err.message);
    }
  }
}

module.exports = LearningManager;
