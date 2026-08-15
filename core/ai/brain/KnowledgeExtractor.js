  const GroqManager = require("../GroqManager");
  const KnowledgePrompt = require("../prompts/KnowledgePrompt");

  class KnowledgeExtractor {
    static async extract(message, retry = 0) {
      try {
        if (retry >= 4) {
          return {
            version: 1,
            learn: false
          };
        }

        const groq = GroqManager.getClient();

        const completion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",

          messages: [
            {
              role: "system",
              content: KnowledgePrompt.build(message)
            }
          ],

          temperature: 0.2,
          top_p: 0.9,
          max_tokens: 500,
          response_format: {
            type: "json_object"
          }
        });

        GroqManager.nextKey();

        let content =
          completion?.choices?.[0]?.message?.content || "{}";

        return JSON.parse(content);

      } catch (err) {

        if (
          err?.status === 429 ||
          err?.code === "rate_limit_exceeded"
        ) {
          console.log("⚠ KnowledgeExtractor rate limited.");

          GroqManager.nextKey();

          return this.extract(message, retry + 1);
        }

        console.log("[KnowledgeExtractor]", err.message);

        return {
          version: 1,
          learn: false
        };
      }
    }
  }

  module.exports = KnowledgeExtractor;