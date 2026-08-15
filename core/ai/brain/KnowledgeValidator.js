class KnowledgeValidator {
  static validate(data) {
    const result = {
      version: 1,
      learn: false,
      confidence: 0,

      memory: [],
      profile: {},
      goal: [],
      timeline: [],
      runningJokes: [],
      emotion: {},
      relationship: {},
    };

    if (!data || typeof data !== "object") {
      return result;
    }

    result.learn = Boolean(data.learn);
    result.confidence =
      typeof data.confidence === "number"
        ? Math.max(0, Math.min(1, data.confidence))
        : 0;

    if (!result.learn) return result;

    // =========================
    // MEMORY
    // =========================

    if (Array.isArray(data.memory)) {
      result.memory = data.memory
        .filter(
          (m) => m && typeof m.text === "string" && m.text.trim().length > 0,
        )
        .map((m) => ({
          text: m.text.trim(),

          importance:
            typeof m.importance === "number"
              ? Math.max(1, Math.min(10, m.importance))
              : 5,

          tags: Array.isArray(m.tags)
            ? m.tags.filter((x) => typeof x === "string")
            : [],

          category: typeof m.category === "string" ? m.category : "general",

          replace: Boolean(m.replace),
        }));
    }

    // =========================
    // PROFILE
    // =========================

    if (
      data.profile &&
      typeof data.profile === "object" &&
      !Array.isArray(data.profile)
    ) {
      result.profile = data.profile;
    }

    // =========================
    // GOALS
    // =========================

    if (Array.isArray(data.goal)) {
      result.goal = data.goal;
    }

    // =========================
    // TIMELINE
    // =========================

    if (Array.isArray(data.timeline)) {
      result.timeline = data.timeline;
    }

    // =========================
    // RUNNING JOKES
    // =========================

    if (Array.isArray(data.runningJokes)) {
      result.runningJokes = data.runningJokes;
    }

    // =========================
    // EMOTION
    // =========================

    if (
      data.emotion &&
      typeof data.emotion === "object" &&
      !Array.isArray(data.emotion)
    ) {
      result.emotion = data.emotion;
    }

    // =========================
    // RELATIONSHIP
    // =========================

    if (
      data.relationship &&
      typeof data.relationship === "object" &&
      !Array.isArray(data.relationship)
    ) {
      result.relationship = data.relationship;
    }

    return result;
  }
}

module.exports = KnowledgeValidator;
