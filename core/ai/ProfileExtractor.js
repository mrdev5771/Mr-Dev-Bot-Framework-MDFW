const ProfileManager = require("./ProfileManager");

class ProfileExtractor {
  static async extract(userID, message) {
    const text = message.toLowerCase();

    // =====================
    // NAME
    // =====================

    const nameMatch = message.match(/(?:my name is)\s+([a-zA-Z]+)/i);

    if (nameMatch) {
      await ProfileManager.update(
        userID,

        "name",

        nameMatch[1],
      );
    }

    // =====================
    // JOB / ROLE
    // =====================

    const developerWords = [
      "developer",
      "programmer",
      "coder",
      "coding",
      "software",
    ];

    if (developerWords.some((x) => text.includes(x))) {
      await ProfileManager.update(
        userID,

        "role",

        "Developer",
      );
    }

    // =====================
    // LANGUAGES
    // =====================

    if (text.includes("roman urdu") || text.includes("urdu")) {
      await ProfileManager.update(
        userID,

        "language",

        "Roman Urdu / Urdu",
      );
    }

    if (text.includes("english")) {
      await ProfileManager.update(
        userID,

        "language",

        "English",
      );
    }

    // =====================
    // ANIME
    // =====================

    const animeList = [
      "naruto",
      "one piece",
      "bleach",
      "attack on titan",
      "dragon ball",
      "isekai",
    ];

    for (const anime of animeList) {
      if (text.includes(anime)) {
        await ProfileManager.addLike(
          userID,

          anime,
        );
      }
    }

    // =====================
    // LIKES
    // =====================

    const likeMatch = message.match(/i like (.+)/i);

    if (likeMatch) {
      await ProfileManager.addLike(
        userID,

        likeMatch[1],
      );
    }

    // =====================
    // FAVORITES
    // =====================

    const favMatch = message.match(/my favourite is (.+)|my favorite is (.+)/i);

    if (favMatch) {
      const fav = favMatch[1] || favMatch[2];

      await ProfileManager.update(
        userID,

        "favorite",

        fav,
      );
    }

    // =====================
    // PERSONALITY HINTS
    // =====================

    if (text.includes("i love coding") || text.includes("i enjoy coding")) {
      await ProfileManager.update(
        userID,

        "interest",

        "Programming",
      );
    }
  }
}

module.exports = ProfileExtractor;
