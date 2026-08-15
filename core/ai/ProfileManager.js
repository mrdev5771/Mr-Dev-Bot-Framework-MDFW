const ProfileStore = require("../../database/stores/ProfileStore");

class ProfileManager {
  // ============================================================
  // GET PROFILE
  // ============================================================

  static async getProfile(userID) {
    const profile = await ProfileStore.get(userID);

    if (!profile) {
      return {};
    }

    return {
      facts:
        profile.facts instanceof Map
          ? Object.fromEntries(profile.facts)
          : profile.facts || {},

      interests: profile.interests || [],

      likes: profile.likes || [],

      dislikes: profile.dislikes || [],
    };
  }

  // ============================================================
  // UPDATE SINGLE VALUE
  // ============================================================

  static async update(userID, key, value) {
    const profile = await ProfileStore.get(userID);

    if (key === "facts") {
      for (const [factKey, factValue] of Object.entries(value || {})) {
        profile.facts.set(
          factKey,
          typeof factValue === "string" ? factValue : JSON.stringify(factValue),
        );
      }
    } else if (key === "interests") {
      profile.interests = Array.isArray(value) ? value : [value];
    } else if (key === "likes") {
      profile.likes = Array.isArray(value) ? value : [value];
    } else if (key === "dislikes") {
      profile.dislikes = Array.isArray(value) ? value : [value];
    } else {
      profile.facts.set(
        key,
        typeof value === "string" ? value : JSON.stringify(value),
      );
    }

    await ProfileStore.save(profile);

    return profile;
  }

  // ============================================================
  // MERGE PROFILE
  // ============================================================

  static async merge(userID, data = {}) {
    const profile = await ProfileStore.get(userID);

    // ----------------------------------------------------------
    // FACTS
    // ----------------------------------------------------------

    if (data.facts && typeof data.facts === "object") {
      for (const [key, value] of Object.entries(data.facts)) {
        if (value === undefined || value === null) continue;

        profile.facts.set(
          key,
          typeof value === "string" ? value : JSON.stringify(value),
        );
      }
    }

    // ----------------------------------------------------------
    // INTERESTS
    // ----------------------------------------------------------

    if (Array.isArray(data.interests)) {
      profile.interests = [
        ...new Set([...(profile.interests || []), ...data.interests]),
      ];
    }

    // ----------------------------------------------------------
    // LIKES
    // ----------------------------------------------------------

    if (Array.isArray(data.likes)) {
      profile.likes = [...new Set([...(profile.likes || []), ...data.likes])];
    }

    // ----------------------------------------------------------
    // DISLIKES
    // ----------------------------------------------------------

    if (Array.isArray(data.dislikes)) {
      profile.dislikes = [
        ...new Set([...(profile.dislikes || []), ...data.dislikes]),
      ];
    }

    await ProfileStore.save(profile);

    return profile;
  }

  // ============================================================
  // ADD LIKE
  // ============================================================

  static async addLike(userID, value) {
    const profile = await ProfileStore.get(userID);

    if (!profile.likes.includes(value)) {
      profile.likes.push(value);
    }

    await ProfileStore.save(profile);

    return profile;
  }

  // ============================================================
  // ADD INTEREST
  // ============================================================

  static async addInterest(userID, value) {
    const profile = await ProfileStore.get(userID);

    if (!profile.interests.includes(value)) {
      profile.interests.push(value);
    }

    await ProfileStore.save(profile);

    return profile;
  }

  // ============================================================
  // ADD DISLIKE
  // ============================================================

  static async addDislike(userID, value) {
    const profile = await ProfileStore.get(userID);

    if (!profile.dislikes.includes(value)) {
      profile.dislikes.push(value);
    }

    await ProfileStore.save(profile);

    return profile;
  }
}

module.exports = ProfileManager;
