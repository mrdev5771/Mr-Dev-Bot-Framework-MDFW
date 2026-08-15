class DecisionManager {
  // ============================================================
  // DECIDE
  // ============================================================

  static async decide(userID, message) {
    const text = String(message || "")
      .trim()
      .toLowerCase();

    const decision = {
      intent: "conversation",
      mood: "neutral",
      action: "reply",

      roast: false,
      playful: false,
      serious: false,
      question: false,

      recall: false,
      memoryQuestion: false,

      coding: false,
      greeting: false,

      confidence: 0.5,
    };

    if (!text) {
      return decision;
    }

    // ============================================================
    // HELPER
    // ============================================================

    const containsAny = (words) => words.some((word) => text.includes(word));

    // ============================================================
    // QUESTIONS
    // ============================================================

    const questionStart =
      /^(who|what|where|when|why|how|do|does|did|can|could|would|are|is|am|will|should|have|has)\b/i;

    if (text.includes("?") || questionStart.test(text)) {
      decision.question = true;
      decision.intent = "question";
      decision.confidence = 0.8;
    }

    // ============================================================
    // MEMORY / RECALL
    // ============================================================

    const recallPhrases = [
      "do you remember",
      "did you remember",
      "can you remember",
      "remember when",
      "remember what",
      "remember that",
      "recall when",
      "recall what",
      "old conversation",
      "old conversations",
      "past conversation",
      "past conversations",
      "previous conversation",
      "previous conversations",
      "our conversation",
      "our conversations",
      "what were we talking about",
      "what did we talk about",
      "what we talked about",
      "what we were talking about",
      "who am i",
      "who am i?",
      "do you know me",
      "do you remember me",
      "what is my name",
      "what's my name",
      "whats my name",
      "my name",
    ];

    if (containsAny(recallPhrases)) {
      decision.recall = true;
      decision.memoryQuestion = true;
      decision.intent = "memory";
      decision.confidence = 0.95;
    }

    // ============================================================
    // ROAST
    // ============================================================

    const roastPhrases = [
      "roast me",
      "roast you",
      "roast him",
      "roast her",
      "roasting",
      "make fun of me",
      "make fun of you",
      "insult me",
      "insult you",
      "your shot",
      "first shot",
      "take a shot",
      "hit me",
      "come at me",
      "fire back",
      "clap back",
      "trash talk",
      "trash talking",
    ];

    if (containsAny(roastPhrases)) {
      decision.roast = true;
      decision.playful = true;

      decision.intent = "roast";
      decision.mood = "playful";
      decision.confidence = 0.95;
    }

    // ============================================================
    // CODING / TECHNICAL
    // ============================================================

    const codingWords = [
      "code",
      "coding",
      "programming",
      "programmer",
      "javascript",
      "node",
      "nodejs",
      "discord bot",
      "mongodb",
      "mongoose",
      "api",
      "database",
      "function",
      "class",
      "module",
      "bug",
      "error",
      "stack trace",
      "exception",
      "crash",
      "debug",
      "debugging",
      "framework",
      "npm",
      "package",
      "github",
      "terminal",
      "powershell",
    ];

    if (containsAny(codingWords)) {
      decision.coding = true;

      /*
       * Coding should not automatically destroy another
       * stronger intent.
       *
       * Example:
       *
       * "Do you remember that MongoDB bug?"
       *
       * This is primarily a memory question.
       */

      if (!decision.recall && !decision.roast) {
        decision.intent = "coding";
        decision.confidence = 0.9;
      }
    }

    // ============================================================
    // PLAYFUL / CASUAL
    // ============================================================

    const playfulWords = [
      "broski",
      "bro",
      "dude",
      "bruh",
      "lol",
      "lmao",
      "lmfao",
      "haha",
      "hahaha",
      "😂",
      "🤣",
      "😆",
      "joke",
      "funny",
      "crazy",
      "wild",
      "wtf",
    ];

    if (!decision.roast && containsAny(playfulWords)) {
      decision.playful = true;

      /*
       * Don't overwrite stronger intents.
       */

      if (!decision.recall && !decision.coding && !decision.question) {
        decision.intent = "casual";
        decision.mood = "playful";
        decision.confidence = 0.75;
      } else if (!decision.serious) {
        decision.mood = "playful";
      }
    }

    // ============================================================
    // SERIOUS / SUPPORT
    // ============================================================

    const seriousWords = [
      "serious",
      "seriously",
      "important",
      "help me",
      "i need help",
      "problem",
      "issue",
      "error",
      "bug",
      "urgent",
      "worried",
      "sad",
      "angry",
      "upset",
      "frustrated",
      "confused",
      "stressed",
    ];

    if (containsAny(seriousWords)) {
      decision.serious = true;

      /*
       * Serious mode overrides casual behavior,
       * but does NOT destroy a direct roast request.
       */

      if (!decision.roast) {
        decision.mood = "serious";

        if (!decision.recall && !decision.coding) {
          decision.intent = "serious";
        }

        decision.confidence = 0.85;
      }
    }

    // ============================================================
    // GREETING
    // ============================================================

    const greetings = [
      "hello",
      "hi",
      "hey",
      "yo",
      "sup",
      "wassup",
      "what's up",
      "whats up",
      "how are you",
      "how's it going",
      "how is it going",
      "how you doing",
    ];

    const startsWithGreeting = greetings.some((word) => text.startsWith(word));

    if (startsWithGreeting) {
      decision.greeting = true;

      /*
       * Greeting is only the main intent when
       * nothing more important is happening.
       */

      if (
        !decision.recall &&
        !decision.roast &&
        !decision.coding &&
        !decision.serious
      ) {
        decision.intent = "greeting";
        decision.confidence = 0.9;
      }
    }

    // ============================================================
    // FINAL INTENT PRIORITY
    // ============================================================
    /*
     * This prevents small keyword matches from destroying
     * the actual meaning of the message.
     *
     * Priority:
     *
     * ROAST
     * MEMORY
     * SERIOUS
     * CODING
     * GREETING
     * CASUAL
     * CONVERSATION
     */

    if (decision.roast) {
      decision.intent = "roast";
      decision.mood = "playful";
    } else if (decision.recall) {
      decision.intent = "memory";
    } else if (decision.serious) {
      decision.intent = "serious";
      decision.mood = "serious";
    } else if (decision.coding) {
      decision.intent = "coding";
    } else if (decision.greeting) {
      decision.intent = "greeting";
    } else if (decision.playful) {
      decision.intent = "casual";
      decision.mood = "playful";
    }

    // ============================================================
    // FINAL SAFETY AGAINST EMPTY INTENT
    // ============================================================

    if (!decision.intent) {
      decision.intent = "conversation";
    }

    return decision;
  }
}

module.exports = DecisionManager;
