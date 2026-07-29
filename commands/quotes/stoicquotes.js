// stoicquotes.js — fetch stoic quotes from https://stoic.tekloon.net/stoic-quote
// Usage: stoicquotes [count]
// Example: stoicquotes 3
// Supports 1..10 quotes. Retries on failure, deduplicates by quote text.

module.exports.config = {
  name: "stoicquotes",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Mr Developer (improved) & you",
  description:
    "Fetch stoic quotes from https://stoic.tekloon.net/stoic-quote. Supports 1–10 quotes, retries, deduplication, and clean formatting.",
  usePrefix: true,
  commandCategory: "quotes",
  usages: "[count]",
  cooldowns: 0,
  dependencies: { axios: "^1.0.0" },
};

module.exports.run = async ({ api, event, args }) => {
  const getModule = (name) =>
    (global && global.nodemodule && global.nodemodule[name]) || require(name);

  const axios = getModule("axios");
  const { threadID, messageID } = event;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const ENDPOINT = "https://stoic.tekloon.net/stoic-quote";

  // Generic fetch with retry
  const fetchJson = async (url, attempts = 2, timeout = 15000) => {
    let lastErr = null;
    for (let i = 0; i < attempts; i++) {
      try {
        const res = await axios.get(url, { timeout });
        return res && res.data ? res.data : null;
      } catch (err) {
        lastErr = err;
        if (i + 1 < attempts) await sleep(200 * (i + 1));
      }
    }
    throw lastErr;
  };

  // Normalize API response -> { quote, author, text }
  const normalize = (raw) => {
    if (!raw) return null;
    // Expected: { data: { author, quote } }
    if (raw.data && typeof raw.data === "object") {
      const q = raw.data.quote || raw.data.text || "";
      const author = raw.data.author || raw.data.source || "";
      const text = q || JSON.stringify(raw.data);
      return { quote: q, author: author, text };
    }

    // If API returned an object with quote/author directly
    if (typeof raw === "object") {
      const q = raw.quote || raw.text || "";
      const author = raw.author || raw.source || "";
      const text = q || JSON.stringify(raw);
      return { quote: q, author: author, text };
    }

    // Fallback for string response
    if (typeof raw === "string") return { quote: raw, author: "", text: raw };
    try {
      return { quote: JSON.stringify(raw), author: "", text: JSON.stringify(raw) };
    } catch {
      return null;
    }
  };

  try {
    // parse count arg (default 1), clamp to 1..10
    let count = 1;
    if (Array.isArray(args) && args.length && args[0]) {
      const n = parseInt(args[0], 10);
      if (!Number.isNaN(n)) count = Math.min(Math.max(n, 1), 10);
    }

    // If user requests 1 — single fetch; if >1 fetch in parallel (best-effort)
    const tasks = [];
    for (let i = 0; i < count; i++) {
      tasks.push(
        fetchJson(ENDPOINT, 2).catch((err) => {
          console.error("stoic fetch error:", err && err.message ? err.message : err);
          return null;
        })
      );
      // small stagger to avoid hammering
      if (i % 4 === 0 && i > 0) await sleep(100);
    }

    const rawResults = await Promise.all(tasks);
    // Normalize and deduplicate by text
    const normalized = [];
    const seen = new Set();
    for (const r of rawResults) {
      const item = normalize(r);
      if (!item) continue;
      const key = (item.text || "").slice(0, 300);
      if (!seen.has(key)) {
        seen.add(key);
        normalized.push(item);
      }
      if (normalized.length >= count) break;
    }

    // If not enough unique quotes, attempt sequential fills (best-effort)
    let attempts = 0;
    while (normalized.length < count && attempts < 8) {
      attempts++;
      try {
        const moreRaw = await fetchJson(ENDPOINT, 2).catch(() => null);
        const more = normalize(moreRaw);
        if (!more) break;
        const key = (more.text || "").slice(0, 300);
        if (!seen.has(key)) {
          seen.add(key);
          normalized.push(more);
        }
      } catch {
        break;
      }
    }

    if (!normalized.length) {
      return api.sendMessage(
        "Sorry — couldn't retrieve a stoic quote right now. Try again in a moment.",
        threadID,
        messageID
      );
    }

    // Format output
    const emojis = ["🪨", "🌿", "🕊️", "🧭", "🦉", "✨", "📜", "⚖️", "🔆", "🏺"];
    const lines = normalized.slice(0, count).map((it, idx) => {
      const num = idx + 1;
      const emoji = emojis[idx % emojis.length];
      const authorPart = it.author ? `\n— ${it.author}` : "";
      // Put the quote in quotes for readability
      const quoteText = it.quote ? `“${it.quote.trim()}”` : it.text;
      return `${num}. ${emoji} ${quoteText}${authorPart}`;
    });

    const msg = lines.join("\n\n");
    return api.sendMessage(msg, threadID, messageID);
  } catch (error) {
    console.error("stoicquotes command error:", error);
    const errMsg =
      error && error.message ? `Failed to fetch stoic quotes: ${error.message}` : "Failed to fetch stoic quotes.";
    try {
      return api.sendMessage(errMsg, threadID, messageID);
    } catch (e) {
      console.error("Also failed to report error to thread:", e);
    }
  }
};
