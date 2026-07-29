// modules/commands/animev8.js
/**
 * animev8.js
 * Fetch anime wallpapers from nekos.life and send to chat.
 *
 * Usage:
 *   *animev8            -> sends one wallpaper
 *   *animev8 3          -> sends up to 3 wallpapers (max 5)
 *
 * Notes:
 * - Uses direct API: https://nekos.life/api/v2/img/wallpaper
 * - If you have the `nekos.life` package and prefer it, this file will still work.
 */

module.exports.config = {
  name: "aw",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "yours",
  usePrefix:true,
  description: "Fetch anime wallpaper(s) from nekos.life",
  commandCategory: "image",
  usages: "aw",
  cooldowns: 5,
  dependencies: {
    axios: "",
    "fs-extra": "",
    path: "",
  },
};

const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

async function fetchWallpaperUrlWithHttp() {
  const api = "https://nekos.life/api/v2/img/wallpaper";
  const res = await axios.get(api, { timeout: 15000 });
  // expect JSON { url: "..." }
  if (!res || !res.data || !res.data.url)
    throw new Error("Unexpected nekos.life response");
  return res.data.url;
}

async function fetchWallpaperUrlWithPackage() {
  // attempt to use nekos.life package if available (optional)
  try {
    // dynamic require to avoid hard dependency if user doesn't have it
    // package API: const NekosLife = require('nekos.life'); const neko = new NekosLife(); neko.sfw.wallpaper()
    const NekosLife = require("nekos.life");
    const neko = new NekosLife();
    if (neko && neko.sfw && typeof neko.sfw.wallpaper === "function") {
      const r = await neko.sfw.wallpaper();
      if (r && r.url) return r.url;
    }
  } catch (e) {
    // ignore and fallback to HTTP
  }
  throw new Error("nekos.life package not available or failed");
}

module.exports.run = async function ({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;
  // parse optional count argument
  let count = 1;
  if (args && args[0]) {
    const n = parseInt(args[0], 10);
    if (!isNaN(n) && n > 0) count = Math.min(5, n); // limit to 5
  }

  const cacheDir = path.join(__dirname, "cache", "animev8");
  await fs.ensureDir(cacheDir);

  const filesToSend = [];

  try {
    for (let i = 0; i < count; i++) {
      // try package first, then HTTP endpoint
      let url;
      try {
        url = await fetchWallpaperUrlWithPackage();
      } catch (e) {
        url = await fetchWallpaperUrlWithHttp();
      }

      if (!url) throw new Error("No wallpaper URL returned");

      // download image (arraybuffer)
      const imgResp = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 20000,
      });
      if (!imgResp || !imgResp.data || imgResp.data.byteLength === 0) {
        throw new Error("Failed to download image");
      }

      // determine extension from URL or default to .jpg
      const extMatch = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
      const ext = extMatch ? `.${extMatch[1]}` : ".jpg";
      const outName = `animev8_${Date.now()}_${i}${ext}`;
      const outPath = path.join(cacheDir, outName);

      await fs.writeFile(outPath, Buffer.from(imgResp.data));

      filesToSend.push(outPath);
    }

    // build message attachment(s)
    // many bot frameworks accept a single attachment or array; here we'll send multiple attachments in one message if count>1
    const attachments = filesToSend.map((p) => fs.createReadStream(p));

    // send
    await new Promise((resolve, reject) => {
      const msg = {
        body:
          count === 1
            ? "Here's an anime wallpaper for you 🌸"
            : `Here are ${count} anime wallpapers 🌸`,
        attachment: attachments.length === 1 ? attachments[0] : attachments,
      };
      api.sendMessage(
        msg,
        threadID,
        (err) => {
          if (err) return reject(err);
          resolve();
        },
        messageID,
      );
    });
  } catch (err) {
    console.error("[animev8] error:", err && (err.stack || err.message || err));
    // user-friendly message
    try {
      await api.sendMessage(
        "Sorry, couldn't fetch wallpaper right now. Try again later.",
        threadID,
        messageID,
      );
    } catch (e) {}
  } finally {
    // cleanup cache files we created
    try {
      for (const f of filesToSend) {
        try {
          await fs.unlink(f);
        } catch (e) {}
      }
      // optional: remove folder if empty
      try {
        const remaining = await fs.readdir(cacheDir);
        if (!remaining || remaining.length === 0) await fs.rmdir(cacheDir);
      } catch (e) {}
    } catch (e) {}
  }
};
