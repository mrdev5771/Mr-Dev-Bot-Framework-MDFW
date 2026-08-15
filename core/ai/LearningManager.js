const ProfileExtractor = require("./ProfileExtractor");
const ConversationManager = require("./ConversationManager");
const KnowledgeLogger = require("./brain/KnowledgeLogger");
const KnowledgeExtractor = require("./brain/KnowledgeExtractor");
const KnowledgeValidator = require("./brain/KnowledgeValidator");
const KnowledgeRouter = require("./brain/KnowledgeRouter");

class LearningManager {
  static learn(userID, message, reply) {
    setImmediate(async () => {
      // ==========================
      // Save conversation immediately
      // ==========================

      try {
        await ConversationManager.add(userID, message, reply);
      } catch (err) {
        console.log("[Conversation Save Error]", err.message);
      }

      // ==========================
      // Legacy profile extractor
      // (temporary)
      // ==========================

      try {
        await ProfileExtractor.extract(userID, message);
      } catch (err) {
        console.log("[Profile Extract Error]", err.message);
      }

      // ==========================
      // Brain
      // ==========================

      try {
        const rawKnowledge = await KnowledgeExtractor.extract(message);

        const knowledge = KnowledgeValidator.validate(rawKnowledge);

        await KnowledgeLogger.log(userID, message, knowledge);

        await KnowledgeRouter.route(userID, knowledge);

        // Debug
        console.log("\n========== KNOWLEDGE ==========");
        console.dir(knowledge, {
          depth: null,
          colors: true,
        });
        console.log("===============================\n");
      } catch (err) {
        console.log("[Knowledge Brain Error]", err.message);
      }
    });
  }
}

module.exports = LearningManager;
