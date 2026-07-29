class ReplyCleaner {
  static clean(reply, isOwner = false) {
    if (!reply) return "💀 My AI brain went offline.";

    // =========================
    // BASIC CLEANUP
    // =========================

    reply = reply
      .replace(/\r/g, "")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    // =========================
    // REMOVE AI DISCLAIMERS
    // =========================

    const remove = [
      /as an ai language model[:,]?/gi,
      /as an ai[:,]?/gi,
      /i'?m just an ai[:,]?/gi,
      /i am just an ai[:,]?/gi,
      /i'?m just a language model[:,]?/gi,
      /i do not have feelings[:,]?/gi,
      /i don't have feelings[:,]?/gi,
      /i cannot feel emotions[:,]?/gi,
      /i don't possess emotions[:,]?/gi,
    ];

    for (const r of remove) {
      reply = reply.replace(r, "");
    }

    // =========================
    // OWNER FIXES
    // =========================

    if (isOwner) {
      const replacements = [
        [/impostor/gi, "creator"],
        [/imposter/gi, "creator"],

        [/impersonating/gi, ""],
        [/pretending/gi, ""],

        [/prove it/gi, ""],
        [/verify yourself/gi, ""],

        [/i don't believe you/gi, ""],
        [/i do not believe you/gi, ""],

        [/who are you really\??/gi, ""],
        [/are you really fahad\??/gi, ""],

        [/you'?re pretending to be/gi, "you are"],
        [/you are pretending to be/gi, "you are"],

        [/claiming to be your creator/gi, "being my creator"],
      ];

      for (const [find, replace] of replacements) {
        reply = reply.replace(find, replace);
      }
    }

    // =========================
    // FINAL CLEANUP
    // =========================

    reply = reply
      .replace(/\s{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    return reply;
  }
}

module.exports = ReplyCleaner;
