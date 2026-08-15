const MemoryManager = require("./MemoryManager");

class MemoryExtractor {
  // ====================================
  // MAIN
  // ====================================

  static async process(userID, message) {
    if (!message) return;

    const text = message.trim();

    if (!text) return;

    // Too short

    if (text.length < 8) return;

    const lower = text.toLowerCase();

    // ====================================
    // IGNORE CHATTER
    // ====================================

    const ignore = [

      "hi",
      "hello",
      "hey",
      "yo",
      "bro",
      "broski",
      "sup",
      "good morning",
      "good night",
      "how are you",
      "what's up",
      "lol",
      "lmao",
      "haha",
      "hehe",
      "thanks",
      "thank you",
      "ok",
      "okay",
      "yes",
      "no"

    ];

    if (ignore.some(x => lower === x))
      return;

    // ====================================
    // FAVORITES
    // ====================================

    if (
      lower.includes("favorite") ||
      lower.includes("favourite")
    ) {

      return MemoryManager.remember(

        userID,

        text,

        {
          importance: 8,
          tags: ["favorite"]
        }

      );

    }

    // ====================================
    // LIKES
    // ====================================

    if (

      lower.includes("i like") ||

      lower.includes("i love")

    ) {

      return MemoryManager.remember(

        userID,

        text,

        {

          importance: 7,

          tags: ["likes"]

        }

      );

    }

    // ====================================
    // DISLIKES
    // ====================================

    if (

      lower.includes("i hate") ||

      lower.includes("i don't like") ||

      lower.includes("i dislike")

    ) {

      return MemoryManager.remember(

        userID,

        text,

        {

          importance: 7,

          tags: ["dislikes"]

        }

      );

    }

    // ====================================
    // PERSONAL INFO
    // ====================================

    const personal = [

      "my name",

      "i am",

      "i'm",

      "my age",

      "birthday",

      "my birthday",

      "i study",

      "i work",

      "my job",

      "my college",

      "my university",

      "my school"

    ];

    if (

      personal.some(x => lower.includes(x))

    ) {

      return MemoryManager.remember(

        userID,

        text,

        {

          importance: 9,

          tags: ["profile"]

        }

      );

    }

    // ====================================
    // GOALS
    // ====================================

    if (

      lower.includes("i want") ||

      lower.includes("my goal") ||

      lower.includes("i'm trying") ||

      lower.includes("i will")

    ) {

      return MemoryManager.remember(

        userID,

        text,

        {

          importance: 8,

          tags: ["goal"]

        }

      );

    }

    // ====================================
    // PROJECTS
    // ====================================

    if (

      lower.includes("project") ||

      lower.includes("framework") ||

      lower.includes("bot")

    ) {

      return MemoryManager.remember(

        userID,

        text,

        {

          importance: 9,

          tags: ["project"]

        }

      );

    }

  }
}

module.exports = MemoryExtractor;