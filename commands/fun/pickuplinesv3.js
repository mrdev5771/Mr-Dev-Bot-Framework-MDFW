// pickuplinesv3.js — fetch flirty/cheesy pickup lines from https://rizzapi.vercel.app/random
// Usage: pickuplinesv3 [count]
// Example: pickuplinesv3 3
// Supports 1..10 pickup lines. Retries, deduplication, local fallback, and minimal formatting (line only).

module.exports.config = {
  name: "pickuplinesv3",
  version: "1.0.3",
  hasPermssion: 0,
  credits: "Mr Developer (improved) & you",
  description:
    "Fetch flirty/cheesy pickup lines from https://rizzapi.vercel.app/random. Supports 1–10 lines, retries, deduplication, local fallback, and minimal formatting (line only).",
  usePrefix: true,
  commandCategory: "fun",
  usages: "[count]",
  cooldowns: 0,
  dependencies: { axios: "^1.0.0" },
};

module.exports.run = async ({ api, event, args }) => {
  const getModule = (name) =>
    (global && global.nodemodule && global.nodemodule[name]) || require(name);

  const axios = getModule("axios");
  const { threadID, messageID } = event;

  // --- Duplicate-invocation guard ---
  // Prevent sending two replies if the framework invokes this handler twice for the same incoming message.
  // We track recent messageIDs in a global Set and ignore repeats for a short window.
  global.__pickuplinesv3_recent = global.__pickuplinesv3_recent || new Set();
  if (messageID && global.__pickuplinesv3_recent.has(messageID)) {
    console.log(`[pickuplinesv3] duplicate invocation ignored for messageID=${messageID}`);
    return;
  }
  if (messageID) {
    global.__pickuplinesv3_recent.add(messageID);
    // remove after 8 seconds to free memory and allow future legitimate retries
    setTimeout(() => global.__pickuplinesv3_recent.delete(messageID), 8000);
  }

  // helpful debug log (remove or tone down in production)
  console.log(`[pickuplinesv3] invoked messageID=${messageID} threadID=${threadID}`);

  const BASE = "https://rizzapi.vercel.app/random";
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // Local fallback pickup lines (used when API fails or to fill missing unique results)
  const LOCAL_FALLBACK = [
    {
      text: "Do you know what my shirt is made of? Boyfriend material.",
      category: "Flirty",
      language: "English",
      _id: "fallback_1",
    },
    {
      text: "Are you a magician? Because whenever I look at you, everyone else disappears.",
      category: "Cheesy",
      language: "English",
      _id: "fallback_2",
    },
    {
      text: "Do you have a map? I keep getting lost in your eyes.",
      category: "Classic",
      language: "English",
      _id: "fallback_3",
    },
    {
      text: "If you were a vegetable you'd be a cute-cumber.",
      category: "Cheesy",
      language: "English",
      _id: "fallback_4",
    },
    {
      text: "Are you Wi-Fi? Because I'm feeling a connection.",
      category: "Flirty",
      language: "English",
      _id: "fallback_5",
    },
    {
      text: "If beauty were time, you'd be an eternity.",
      category: "Flirty",
      language: "English",
      _id: "fallback_6",
    },
    {
      text: "Do you have a Band-Aid? I just scraped my knee falling for you.",
      category: "Cheesy",
      language: "English",
      _id: "fallback_7",
    },
    {
      text: "Is your name Google? Because you have everything I've been searching for.",
      category: "Flirty",
      language: "English",
      _id: "fallback_8",
    },
  ];

  // Helper: fetch a single pickup line with retries
  const fetchSingle = async (attempts = 2, timeout = 15000) => {
    let lastErr = null;
    for (let i = 0; i < attempts; i++) {
      try {
        const res = await axios.get(BASE, { timeout });
        // API may return the object directly, or wrapped, or an array — handle common shapes
        if (!res || res.data == null) return null;
        const d = res.data;
        // if API returns an array, pick a random element
        if (Array.isArray(d) && d.length) return d[Math.floor(Math.random() * d.length)];
        // if wrapped like { data: {...} }
        if (d && typeof d === 'object' && d.data && (d.data.text || d.data._id)) return d.data;
        return d;
      } catch (err) {
        lastErr = err;
        if (i + 1 < attempts) await sleep(200 * (i + 1));
      }
    }
    throw lastErr;
  };

  try {
    // parse count arg (default 1), clamp 1..10
    let count = 1;
    if (Array.isArray(args) && args.length && args[0]) {
      const n = parseInt(args[0], 10);
      if (!Number.isNaN(n)) count = Math.min(Math.max(n, 1), 10);
    }

    // Launch parallel fetches (best-effort). Create closures with an explicit index to avoid capture issues.
    const tasks = [];
    const concurrencyLimit = 6; // keep some limit to avoid hammering
    for (let i = 0; i < count; i++) {
      const index = i; // freeze current index
      tasks.push(
        (async (idx) => {
          // small stagger per chunk
          if (idx % concurrencyLimit === 0 && idx > 0) await sleep(80);
          try {
            const item = await fetchSingle(2);
            return item;
          } catch (err) {
            console.error("pickuplinesv3 fetch error:", err && err.message ? err.message : err);
            return null;
          }
        })(index)
      );
    }

    const rawResults = await Promise.all(tasks);

    // Normalize and deduplicate by _id or text
    const normalized = [];
    const seen = new Set();
    for (const raw of rawResults) {
      if (!raw) continue;
      // Normalize according to expected shapes: { _id, text, category, language, ... }
      const id = raw._id != null ? String(raw._id) : (raw.id != null ? String(raw.id) : null);
      // handle nested forms (raw.data.text)
      let text = raw.text || raw.line || raw.joke || (raw.data && raw.data.text) || "";
      if (!text && typeof raw === 'string') text = raw;
      if (!text) continue; // skip empty
      text = String(text).trim();
      if (!text) continue;
      const category = raw.category || raw.type || (raw.data && raw.data.category) || "";
      const language = raw.language || (raw.data && raw.data.language) || "";

      const key = id ? `id:${id}` : `txt:${text.slice(0, 220)}`;
      if (!seen.has(key)) {
        seen.add(key);
        normalized.push({ _id: id, text, category, language });
      }
      if (normalized.length >= count) break;
    }

    // Fill from local fallback if needed (avoid duplicates)
    for (const fb of LOCAL_FALLBACK) {
      if (normalized.length >= count) break;
      const key = fb._id ? `id:${fb._id}` : `txt:${fb.text.slice(0, 220)}`;
      if (!seen.has(key)) {
        seen.add(key);
        normalized.push({ _id: fb._id, text: fb.text, category: fb.category, language: fb.language });
      }
    }

    // If still short, try sequential fills from API (best-effort)
    let attempts = 0;
    while (normalized.length < count && attempts < 8) {
      attempts++;
      try {
        const more = await fetchSingle(2).catch(() => null);
        if (!more) break;
        const id = more._id != null ? String(more._id) : (more.id != null ? String(more.id) : null);
        let text = more.text || more.line || more.joke || (more.data && more.data.text) || "";
        if (!text && typeof more === 'string') text = more;
        if (!text) continue;
        text = String(text).trim();
        const key = id ? `id:${id}` : `txt:${text.slice(0, 220)}`;
        if (!seen.has(key)) {
          seen.add(key);
          normalized.push({ _id: id, text, category: more.category || "", language: more.language || "" });
        }
      } catch {
        break;
      }
    }

    if (!normalized.length) {
      return api.sendMessage("Sorry — couldn't retrieve pickup lines right now. Try again later.", threadID, messageID);
    }

    // Format output with flirty emojis (minimal: only the pickup line)
    const emojis = ["💘", "😉", "😍", "😏", "🔥", "😘", "💫", "🥰", "😻", "💋"];
    const lines = normalized.slice(0, count).map((it, idx) => {
      const num = idx + 1;
      const emoji = emojis[idx % emojis.length];
      // Minimal: only line text
      return `${num}. ${emoji} ${it.text}`;
    });

    const msg = lines.join("\n\n");
    return api.sendMessage(msg, threadID, messageID);
  } catch (error) {
    console.error("pickuplinesv3 error:", error);
    const errMsg =
      error && error.message ? `Failed to fetch pickup lines: ${error.message}` : "Failed to fetch pickup lines.";
    try {
      return api.sendMessage(errMsg, threadID, messageID);
    } catch (e) {
      console.error("Also failed to report error to thread:", e);
    }
  }
};
