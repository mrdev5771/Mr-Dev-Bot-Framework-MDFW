// anime.js — single-image version (always returns exactly 1 image)
// Usage: anime

module.exports.config = {
  name: "anime",
  version: "1.4.1",
  hasPermssion: 0,
  credits: "Mr Developer (improved) & you",
  description: "Fetch a single anime image from Nekos API (always 1 image).",
  usePrefix: true,
  commandCategory: "images",
  usages: "",
  cooldowns: 0,
  dependencies: { axios: "^1.0.0" },
};

module.exports.run = async ({ api, event }) => {
  const getModule = (name) =>
    (global && global.nodemodule && global.nodemodule[name]) || require(name);
  const axios = getModule("axios");
  const fs = require("fs");
  const path = require("path");
  const os = require("os");

  const { threadID, messageID } = event;

  // duplicate guard (per-incoming message)
  global.__anime_recent = global.__anime_recent || new Set();
  const fallbackKey = (() => {
    try {
      const sender = event.senderID || (event.sender && (event.sender.id || event.senderID)) || "nosender";
      const bodySnippet = (event.body || event.message || event.text || "").toString().slice(0, 160);
      return `${threadID || "nothread"}:${sender}:${bodySnippet}`;
    } catch {
      return `${threadID || "nothread"}:unknown`;
    }
  })();
  const recentKey = messageID ? `msg:${messageID}` : `fb:${fallbackKey}`;
  if (global.__anime_recent.has(recentKey)) {
    console.log(`[anime] duplicate invocation ignored for key=${recentKey}`);
    return;
  }
  global.__anime_recent.add(recentKey);
  setTimeout(() => global.__anime_recent.delete(recentKey), 9000);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const FILE_URL = "https://api.nekosapi.com/v4/images/random/file";
  const RANDOM_URL = "https://api.nekosapi.com/v4/images/random";

  const isValidUrl = (u) => typeof u === "string" && /^https?:\/\/\S+$/.test(u);

  // fetch JSON helper (one retry)
  const fetchJson = async (url) => {
    try {
      const res = await axios.get(url, { timeout: 15000 });
      return res && res.data ? res.data : null;
    } catch (err) {
      try {
        await sleep(200);
        const res = await axios.get(url, { timeout: 15000 });
        return res && res.data ? res.data : null;
      } catch (e) {
        console.error("[anime] fetchJson error:", e && e.message ? e.message : e);
        throw e;
      }
    }
  };

  // download a public image URL to temp file (stream)
  const downloadToTempFromUrl = async (url) => {
    const extMatch = (url || "").match(/\.([a-zA-Z0-9]{2,5})(?:\?|$)/);
    const ext = extMatch ? `.${extMatch[1]}` : ".jpg";
    const filename = path.join(os.tmpdir(), `anime_${Date.now()}_${process.pid}${ext}`);

    // create writer and ensure proper cleanup on errors
    const writer = fs.createWriteStream(filename);
    const resp = await axios.get(url, { responseType: "stream", timeout: 20000 });

    await new Promise((resolve, reject) => {
      resp.data.pipe(writer);
      let resolved = false;
      const cleanupAndReject = (err) => {
        if (resolved) return;
        resolved = true;
        try { writer.close(); } catch (e) {}
        reject(err);
      };
      resp.data.on("error", cleanupAndReject);
      writer.on("error", cleanupAndReject);
      writer.on("finish", () => {
        if (resolved) return;
        resolved = true;
        resolve();
      });
    });

    return filename;
  };

  // helper to send message using callback form and await it
  const sendMessageAwait = (messageObj, tid, mid) =>
    new Promise((resolve, reject) => {
      try {
        // api.sendMessage(message, threadID, callback, messageID)
        api.sendMessage(
          messageObj,
          tid,
          (err, info) => {
            if (err) return reject(err);
            resolve(info);
          },
          mid
        );
      } catch (e) {
        reject(e);
      }
    });

  // main: always single image
  try {
    // Try streaming /file directly (the endpoint may return binary image)
    try {
      const res = await axios.get(FILE_URL, { responseType: "stream", timeout: 20000 });

      // choose extension from content-type header if available
      const ct = (res.headers && res.headers["content-type"]) || "";
      const ext = ct.includes("webp") ? ".webp" : ct.includes("png") ? ".png" : ".jpg";
      const filename = path.join(os.tmpdir(), `anime_file_${Date.now()}${ext}`);
      const writer = fs.createWriteStream(filename);

      await new Promise((resolve, reject) => {
        res.data.pipe(writer);
        res.data.on("error", (err) => {
          try { writer.close(); } catch {}
          reject(err);
        });
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      const caption = `1. 🖼️`;
      try {
        await sendMessageAwait({ body: caption, attachment: fs.createReadStream(filename) }, threadID, messageID);
      } catch (sendErr) {
        console.error("[anime] send attachment failed (single /file):", sendErr && sendErr.message ? sendErr.message : sendErr);
        // try fallback URL if available in response (rare)
        const fallbackUrl = (res.request && res.request.res && res.request.res.responseUrl) || null;
        if (fallbackUrl && isValidUrl(fallbackUrl)) {
          try {
            await sendMessageAwait({ body: `1. 🖼️ ${fallbackUrl}` }, threadID, messageID);
          } catch {}
        } else {
          try { await sendMessageAwait({ body: "Could not send image attachment. Try again later." }, threadID, messageID); } catch {}
        }
      } finally {
        // delay delete slightly to avoid race on some hosts/OS
        setTimeout(() => {
          try { fs.unlinkSync(filename); } catch (e) {}
        }, 2500);
      }
      return;
    } catch (e) {
      console.warn("[anime] /file stream failed, falling back to /random:", e && e.message ? e.message : e);
    }

    // Fallback: get JSON from /random and take the first url
    try {
      const payload = await fetchJson(RANDOM_URL);
      // normalize first URL
      let url = null;
      if (!payload) url = null;
      else if (Array.isArray(payload) && payload.length) {
        const first = payload[0];
        if (typeof first === "string") url = first;
        else if (first && typeof first === "object") url = first.url || first.file || first.image || first.source_url || null;
      } else if (payload && typeof payload === "object") {
        url = payload.url || payload.file || payload.image || payload.source_url || null;
      } else if (typeof payload === "string") {
        url = payload;
      }

      if (!url || !isValidUrl(url)) {
        console.warn("[anime] no valid URL from /random fallback. payload:", (() => {
          try { const s = JSON.stringify(payload); return s.length > 900 ? s.slice(0, 900) + " ...TRUNC" : s; } catch { return "<non-serializable>"; }
        })());
        await sendMessageAwait({ body: "No anime image available right now (API returned nothing usable)." }, threadID, messageID);
        return;
      }

      // download and send
      let filepath = null;
      try {
        filepath = await downloadToTempFromUrl(url);
      } catch (dErr) {
        console.error("[anime] download failed for fallback URL:", dErr && dErr.message ? dErr.message : dErr);
        try {
          await sendMessageAwait({ body: `1. 🖼️ ${url}` }, threadID, messageID); // short fallback
        } catch {}
        return;
      }

      const caption2 = `1. 🖼️`;
      try {
        await sendMessageAwait({ body: caption2, attachment: fs.createReadStream(filepath) }, threadID, messageID);
      } catch (sendErr2) {
        console.error("[anime] send attachment failed (fallback):", sendErr2 && sendErr2.message ? sendErr2.message : sendErr2);
        try { await sendMessageAwait({ body: `1. 🖼️ ${url}` }, threadID, messageID); } catch {}
      } finally {
        setTimeout(() => {
          try { fs.unlinkSync(filepath); } catch (e) {}
        }, 2500);
      }

      return;
    } catch (e2) {
      console.error("[anime] fallback /random failed:", e2 && e2.message ? e2.message : e2);
      try { await sendMessageAwait({ body: "Failed to fetch anime image." }, threadID, messageID); } catch {}
      return;
    }
  } catch (finalErr) {
    console.error("[anime] unexpected error:", finalErr && finalErr.stack ? finalErr.stack : finalErr);
    try { await sendMessageAwait({ body: "Unexpected error fetching anime image." }, threadID, messageID); } catch {}
  }
};
