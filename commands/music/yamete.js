const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "yamete",
  version: "1.0.3",
  hasPermssion: 0,
  credits: "VanHung, improved by ChatGPT",
  usePrefix: false,
  description: "Reply with the yamete audio when someone says 'yamete'",
  commandCategory: "music",
  usages: "noprefix",
  cooldowns: 5,
};

// global de-duplication set to avoid double replies across calls
if (!global.__yameteHandled) global.__yameteHandled = new Set();
// how long to keep an entry (ms)
const DEDUPE_TTL = 3000;

async function sendMessageSafe(api, payload, threadID, messageID = undefined) {
  // Try promise-style sendMessage first
  try {
    const maybe = api.sendMessage(payload, threadID, messageID);
    if (maybe && typeof maybe.then === "function") {
      return await maybe;
    }
  } catch (err) {
    // swallow and try callback-style below
  }

  // Try callback-style
  return await new Promise((resolve, reject) => {
    try {
      // Try signature: api.sendMessage(payload, threadID, callback, messageID)
      if (typeof messageID !== "undefined") {
        try {
          api.sendMessage(payload, threadID, (err, info) => {
            if (err) return reject(err);
            return resolve(info);
          }, messageID);
        } catch (e) {
          // Fallback to simpler callback signature (payload, threadID, cb)
          api.sendMessage(payload, threadID, (err, info) => {
            if (err) return reject(err);
            return resolve(info);
          });
        }
      } else {
        api.sendMessage(payload, threadID, (err, info) => {
          if (err) return reject(err);
          return resolve(info);
        });
      }
    } catch (e) {
      reject(e);
    }
  });
}

function dedupeKey(event) {
  // prefer messageID when available
  if (event && event.messageID) return `${event.threadID || "T"}:${String(event.messageID)}`;
  // fallback to threadID + trimmed body (may be less reliable)
  const body = (typeof event.body === "string" ? event.body.trim() : "");
  return `${event.threadID || "T"}:BODY:${body}`;
}

function alreadyHandled(event) {
  try {
    const key = dedupeKey(event);
    if (!key) return false;
    if (global.__yameteHandled.has(key)) return true;
    // mark and schedule removal
    global.__yameteHandled.add(key);
    setTimeout(() => {
      try { global.__yameteHandled.delete(key); } catch {}
    }, DEDUPE_TTL);
    return false;
  } catch (e) {
    return false; // on error be permissive
  }
}

async function handleSendAudio(api, threadID, messageID) {
  // possible filenames
  const cacheDir = path.join(__dirname, "cache");
  const candidates = ["yamete.mp3", "yamate.mp3"];
  let filePath = null;

  for (const name of candidates) {
    const p = path.join(cacheDir, name);
    if (fs.existsSync(p)) {
      filePath = p;
      break;
    }
  }

  if (!filePath) {
    const helpMsg = `🔊 Audio not found. Please put the file named "yamete.mp3" (or "yamate.mp3") in:\n${cacheDir}`;
    try {
      await sendMessageSafe(api, helpMsg, threadID, messageID);
    } catch (err) {
      console.error("[yamete] failed to send missing-file message:", err);
    }
    return;
  }

  const payload = { attachment: fs.createReadStream(filePath) };

  try {
    await sendMessageSafe(api, payload, threadID, messageID);
  } catch (err) {
    console.error("[yamete] Error sending audio:", err);
    try {
      await sendMessageSafe(api, "❌ Failed to send audio. Please try again later.", threadID, messageID);
    } catch (err2) {
      console.error("[yamete] Failed to send fallback text:", err2);
    }
  }
}

module.exports.handleEvent = async function ({ api, event, client, __GLOBAL }) {
  try {
    if (!event) return;
    const { threadID, messageID } = event;

    // avoid duplicate responses for same message
    if (alreadyHandled(event)) return;

    // body may be undefined for some system events — guard
    const body = (typeof event.body === "string" && event.body) ? event.body : "";
    if (!body) return;

    if (!body.trim().toLowerCase().startsWith("yamete")) return;

    await handleSendAudio(api, threadID, messageID);
  } catch (e) {
    console.error("[yamete] unexpected error in handleEvent:", e && e.stack ? e.stack : e);
  }
};

module.exports.run = async function ({ api, event, client, __GLOBAL }) {
  try {
    // run is used when someone triggers the command with a prefix.
    // Use the same dedupe guard so run() won't cause a duplicate reply if handleEvent also runs.
    if (!event) return;
    if (alreadyHandled(event)) return;

    const { threadID, messageID } = event;
    await handleSendAudio(api, threadID, messageID);
  } catch (e) {
    console.error("[yamete] error in run():", e && e.stack ? e.stack : e);
  }
};
