// facts.js — fetch facts from PopCat API
// Usage: facts [count]
// Example: facts 3

module.exports.config = {
  name: "facts",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Mr Developer (improved)",
  description: "Fetch facts from https://api.popcat.xyz/v2/fact and reply with numbered facts + emojis",
  usePrefix: true,
  commandCategory: "fun",
  usages: "[count]",
  cooldowns: 0,
  dependencies: { axios: "^1.0.0" },
};

module.exports.run = async ({ api, event, args }) => {
  // Prefer framework-provided modules, fall back to require()
  const getModule = (name) =>
    (global && global.nodemodule && global.nodemodule[name]) || require(name);

  const axios = getModule("axios");
  const { threadID, messageID } = event;

  try {
    // Determine how many facts the user wants (1-5)
    let count = 1;
    if (Array.isArray(args) && args.length && args[0]) {
      const n = parseInt(args[0]);
      if (!Number.isNaN(n)) count = Math.min(Math.max(n, 1), 5);
    }

    const url = "https://api.popcat.xyz/v2/fact";
    const response = await axios.get(url, { timeout: 15000 });
    const data = response && response.data;

    // Normalize candidates to objects: { fact: string, contributor?: string }
    const candidates = [];

    // Handle common shapes, e.g. { error: false, message: "..." }
    if (data && typeof data === "object") {
      // If message exists
      if (data.message) {
        const msg = data.message;
        if (typeof msg === "string") candidates.push({ fact: msg });
        else if (Array.isArray(msg)) {
          msg.forEach((it) => {
            if (typeof it === "string") candidates.push({ fact: it });
            else if (it && typeof it === "object") candidates.push({ fact: it.fact || it.message || JSON.stringify(it), contributor: it.contributor });
          });
        } else if (msg && typeof msg === "object") {
          if (msg.fact) candidates.push({ fact: msg.fact, contributor: msg.contributor });
          else if (msg.message && typeof msg.message === "string") candidates.push({ fact: msg.message });
        }
      }

      // Top-level array
      if (Array.isArray(data)) {
        data.forEach((item) => {
          if (typeof item === "string") candidates.push({ fact: item });
          else if (item && typeof item === "object") candidates.push({ fact: item.fact || item.message || JSON.stringify(item), contributor: item.contributor });
        });
      }

      // Other common shapes
      if (data.fact && typeof data.fact === "string") candidates.push({ fact: data.fact, contributor: data.contributor });
      if (data.data && Array.isArray(data.data)) data.data.forEach((it) => candidates.push({ fact: typeof it === "string" ? it : it.fact || it.message || JSON.stringify(it) }));
    }

    // If API returned a raw string
    if (typeof data === "string" && candidates.length === 0) candidates.push({ fact: data });

    if (!candidates || candidates.length === 0) {
      return api.sendMessage("No facts received from the API.", threadID, messageID);
    }

    // Select up to `count` unique random candidates
    const chosen = [];
    const used = new Set();
    while (chosen.length < count && used.size < candidates.length) {
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      const key = `${pick.fact}::${pick.contributor || ""}`;
      if (!used.has(key)) {
        used.add(key);
        chosen.push(pick);
      }
    }

    // Prepare formatted message with numbering and emojis
    const emojis = ["🧠", "📚", "🤓", "🌍", "🔎"];
    const lines = chosen.map((item, idx) => {
      const num = idx + 1;
      const emoji = emojis[idx % emojis.length];
      const contributorLine = item.contributor ? `\n— Source: ${item.contributor}` : "";
      return `${num}. ${emoji} ${item.fact}${contributorLine}`;
    });

    const msg = lines.join("\n\n");
    return api.sendMessage(msg, threadID, messageID);
  } catch (error) {
    console.error("facts command error:", error);
    const errMsg = error && error.message ? `Failed to fetch facts: ${error.message}` : "Failed to fetch facts.";
    try {
      return api.sendMessage(errMsg, threadID, messageID);
    } catch (e) {
      console.error("Also failed to report error to thread:", e);
    }
  }
};
