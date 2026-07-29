const cooldowns = new Map();

class CooldownManager {
  static check(userID, seconds = 5) {
    const now = Date.now();

    if (cooldowns.has(userID)) {
      const last = cooldowns.get(userID);

      const diff = (now - last) / 1000;

      if (diff < seconds) {
        return {
          allowed: false,
          remaining: Math.ceil(seconds - diff),
        };
      }
    }

    cooldowns.set(userID, now);

    return {
      allowed: true,
    };
  }
}

module.exports = CooldownManager;
