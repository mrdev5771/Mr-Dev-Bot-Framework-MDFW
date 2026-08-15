const EmotionStore = require("../../database/stores/EmotionStore");

class EmotionManager {
  // ============================================================
  // GET USER EMOTION
  // ============================================================

  static async get(userID) {
    if (!userID) {
      return {
        mood: "Neutral",
        happiness: 50,
        anger: 0,
        sadness: 0,
        excitement: 0,
        affection: 0,
        lastReason: "",
      };
    }

    const emotion = await EmotionStore.get(userID);

    return {
      mood: emotion.mood || "Neutral",

      happiness: Number(emotion.happiness ?? 50),

      anger: Number(emotion.anger ?? 0),

      sadness: Number(emotion.sadness ?? 0),

      excitement: Number(emotion.excitement ?? 0),

      affection: Number(emotion.affection ?? 0),

      lastReason: emotion.lastReason || "",

      updatedAt: emotion.updatedAt,
    };
  }

  // ============================================================
  // PROMPT FOR AI
  // ============================================================

  static async getPrompt(userID) {
    const emotion = await this.get(userID);

    return `
Current Emotional State:

Mood:
${emotion.mood}

Happiness:
${emotion.happiness}/100

Anger:
${emotion.anger}/100

Sadness:
${emotion.sadness}/100

Excitement:
${emotion.excitement}/100

Affection:
${emotion.affection}/100

Last Reason:
${emotion.lastReason || "None"}

Behavior:

If the user's mood appears negative:
- Be supportive.
- Reduce unnecessary roasting.
- Be understanding.

If the user is happy:
- Match their energy.
- Be playful when appropriate.

If the conversation is serious:
- Stay calm and focused.

Never mention this emotion system directly.
`;
  }

  // ============================================================
  // UPDATE EMOTION
  // ============================================================

  static async update(userID, message) {
    if (!userID || !message) {
      return null;
    }

    const emotion = await EmotionStore.get(userID);

    const text = String(message).toLowerCase();

    // ==========================================================
    // HAPPY
    // ==========================================================

    if (
      text.includes("thank") ||
      text.includes("love") ||
      text.includes("happy") ||
      text.includes("good") ||
      text.includes("nice") ||
      text.includes("great") ||
      text.includes("amazing")
    ) {
      emotion.mood = "Happy";

      emotion.happiness = Math.min(Number(emotion.happiness || 0) + 10, 100);

      emotion.excitement = Math.min(Number(emotion.excitement || 0) + 5, 100);

      emotion.lastReason = "User expressed positivity";
    }

    // ==========================================================
    // SAD
    // ==========================================================

    if (
      text.includes("sad") ||
      text.includes("depressed") ||
      text.includes("bad day") ||
      text.includes("terrible") ||
      text.includes("horrible") ||
      text.includes("tired") ||
      text.includes("exhausted")
    ) {
      emotion.mood = "Sad";

      emotion.sadness = Math.min(Number(emotion.sadness || 0) + 10, 100);

      emotion.lastReason = "User expressed sadness";
    }

    // ==========================================================
    // ANGRY
    // ==========================================================

    if (
      text.includes("angry") ||
      text.includes("hate") ||
      text.includes("mad") ||
      text.includes("annoyed")
    ) {
      emotion.mood = "Angry";

      emotion.anger = Math.min(Number(emotion.anger || 0) + 10, 100);

      emotion.lastReason = "User expressed anger";
    }

    // ==========================================================
    // AFFECTION
    // ==========================================================

    if (
      text.includes("love you") ||
      text.includes("love this") ||
      text.includes("proud of you") ||
      text.includes("good job") ||
      text.includes("thanks bro") ||
      text.includes("thank you")
    ) {
      emotion.affection = Math.min(Number(emotion.affection || 0) + 10, 100);

      emotion.lastReason = "User expressed affection or appreciation";
    }

    // ==========================================================
    // EXCITEMENT
    // ==========================================================

    if (
      text.includes("wow") ||
      text.includes("let's go") ||
      text.includes("awesome") ||
      text.includes("hell yeah") ||
      text.includes("excited")
    ) {
      emotion.mood = "Excited";

      emotion.excitement = Math.min(Number(emotion.excitement || 0) + 10, 100);

      emotion.lastReason = "User expressed excitement";
    }

    // ==========================================================
    // APOLOGY
    // ==========================================================

    if (text.includes("sorry") || text.includes("my bad")) {
      emotion.mood = "Forgiving";

      emotion.affection = Math.min(Number(emotion.affection || 0) + 5, 100);

      emotion.lastReason = "User apologized";
    }

    // ==========================================================
    // SAVE
    // ==========================================================

    await EmotionStore.save(emotion);

    return {
      mood: emotion.mood,

      happiness: emotion.happiness,

      anger: emotion.anger,

      sadness: emotion.sadness,

      excitement: emotion.excitement,

      affection: emotion.affection,

      lastReason: emotion.lastReason,

      updatedAt: emotion.updatedAt,
    };
  }
}

module.exports = EmotionManager;
