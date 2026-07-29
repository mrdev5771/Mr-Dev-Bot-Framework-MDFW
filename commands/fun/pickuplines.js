// pickuplines.js — fetch pickup lines from PopCat API
// Usage: pickuplines [count]
// Example: pickuplines 3

module.exports.config = {
  name: "pickuplines",
  version: "1.0.2",
  hasPermssion: 0,
  credits: "Mr Developer (improved)",
  usePrefix: true,
  description: "Fetch pickup lines from https://api.popcat.xyz/v2/pickuplines and reply with numbered lines + emojis",
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
    // Determine how many lines the user wants (1-5)
    let count = 1;
    if (Array.isArray(args) && args.length && args[0]) {
      const n = parseInt(args[0]);
      if (!Number.isNaN(n)) count = Math.min(Math.max(n, 1), 5);
    }

    const url = "https://api.popcat.xyz/v2/pickuplines";
    const response = await axios.get(url, { timeout: 15000 });
    const data = response && response.data;

    // Normalize candidates to objects: { line: string, contributor?: string }
    const candidates = [];

    // Handle the API shape you provided:
    // { error: false, message: { pickupline: "...", contributor: "..." } }
    if (data && typeof data === "object") {
      if (data.message) {
        const msg = data.message;
        if (typeof msg === "string") {
          candidates.push({ line: msg });
        } else if (Array.isArray(msg)) {
          msg.forEach((it) => {
            if (typeof it === "string") candidates.push({ line: it });
            else if (it && typeof it === "object") candidates.push({ line: it.pickupline || it.line || JSON.stringify(it), contributor: it.contributor });
          });
        } else if (msg && typeof msg === "object") {
          if (msg.pickupline) candidates.push({ line: msg.pickupline, contributor: msg.contributor });
          if (msg.pickuplines && Array.isArray(msg.pickuplines)) msg.pickuplines.forEach((it) => candidates.push({ line: typeof it === "string" ? it : it.line || JSON.stringify(it) }));
          if (msg.line && typeof msg.line === "string") candidates.push({ line: msg.line });
        }
      }

      // Top-level array
      if (Array.isArray(data)) {
        data.forEach((item) => {
          if (typeof item === "string") candidates.push({ line: item });
          else if (item && typeof item === "object") candidates.push({ line: item.pickupline || item.line || JSON.stringify(item), contributor: item.contributor });
        });
      }

      // Other common shapes
      if (data.pickuplines && Array.isArray(data.pickuplines)) data.pickuplines.forEach((it) => candidates.push({ line: typeof it === "string" ? it : it.line || JSON.stringify(it) }));
      if (data.data && Array.isArray(data.data)) data.data.forEach((it) => candidates.push({ line: typeof it === "string" ? it : it.line || JSON.stringify(it) }));
      if (data.pickupline && typeof data.pickupline === "string") candidates.push({ line: data.pickupline, contributor: data.contributor });
      if (data.line && typeof data.line === "string") candidates.push({ line: data.line });
    }

    // If API returned a raw string
    if (typeof data === "string" && candidates.length === 0) candidates.push({ line: data });

    if (!candidates || candidates.length === 0) {
      return api.sendMessage("No pickup lines received from the API.", threadID, messageID);
    }

    // Select up to `count` unique random candidates
    const chosen = [];
    const used = new Set();
    while (chosen.length < count && used.size < candidates.length) {
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      const key = `${pick.line}::${pick.contributor || ""}`;
      if (!used.has(key)) {
        used.add(key);
        chosen.push(pick);
      }
    }

    // Prepare formatted message with numbering and emojis
    const emojis = ["💘", "😉", "😍", "😏", "😘"];
    const lines = chosen.map((item, idx) => {
      const num = idx + 1;
      const emoji = emojis[idx % emojis.length];
      const contributorLine = item.contributor ? `\n— Source: ${item.contributor}` : "";
      return `${num}. ${emoji} ${item.line}${contributorLine}`;
    });

    // Corrected join (two newlines between entries)
    const msg = lines.join("\n\n");
    return api.sendMessage(msg, threadID, messageID);
  } catch (error) {
    console.error("pickuplines command error:", error);
    const errMsg = error && error.message ? `Failed to fetch pickup lines: ${error.message}` : "Failed to fetch pickup lines.";
    try {
      return api.sendMessage(errMsg, threadID, messageID);
    } catch (e) {
      console.error("Also failed to report error to thread:", e);
    }
  }
};
