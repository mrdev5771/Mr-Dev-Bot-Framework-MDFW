// supreme.js — Supreme text logo generator (uses popcat.xyz direct URL)
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const CACHE_DIR = path.join(__dirname, "cache");
const API_BASE = "https://api.popcat.xyz/v2/supreme";

module.exports.config = {
  name: "supreme",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "MrDeveloper",
  description: "Generate a 'Supreme' style logo from text (direct popcat.xyz)",
  usePrefix: true,
  commandCategory: "text maker",
  usages: "supreme <text>",
  cooldowns: 5,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;

  try {
    await fs.mkdirp(CACHE_DIR);

    // Prefer explicit args; fallback to replied message text; then to replied attachment URL
    let text = (args || []).join(" ").trim();

    if (!text && event.type === "message_reply" && event.messageReply) {
      // use replied message body if present
      if (typeof event.messageReply.body === "string" && event.messageReply.body.trim()) {
        text = event.messageReply.body.trim();
      } else if (Array.isArray(event.messageReply.attachments) && event.messageReply.attachments.length) {
        text = event.messageReply.attachments[0].url || "";
      }
    }

    if (!text) {
      // Non-blocking notify and return
      api.sendMessage("Please provide text. Usage: supreme <text>", threadID, (err) => {
        if (err) console.error("notify send failed:", err);
      }, messageID);
      return;
    }

    // optional: short-circuit very long texts (popcat may handle but keep reasonable)
    const MAX_LENGTH = 100;
    if (text.length > MAX_LENGTH) {
      text = text.slice(0, MAX_LENGTH);
      api.sendMessage(`Text truncated to ${MAX_LENGTH} characters for the generator.`, threadID, () => {}, messageID);
    }

    // Inform user (non-blocking)
    api.sendMessage("Generating your Supreme banner — a moment please...", threadID, (err) => {
      if (err) console.error("notify send failed:", err);
    }, messageID);

    const url = `${API_BASE}?text=${encodeURIComponent(text)}`;

    const res = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 15000,
      headers: { "User-Agent": "SupremeLogoBot/1.0", Accept: "*/*" },
    });

    const contentType =
      res.headers && res.headers["content-type"]
        ? String(res.headers["content-type"]).toLowerCase()
        : "";

    if (!contentType.startsWith("image/")) {
      let bodyText = "";
      try {
        bodyText = Buffer.from(res.data).toString("utf8");
        const parsed = JSON.parse(bodyText);
        const apiMsg = parsed.message || parsed.error || JSON.stringify(parsed);
        return api.sendMessage(`API returned non-image response: ${apiMsg}`, threadID, messageID);
      } catch (e) {
        const preview = bodyText && bodyText.length > 400 ? bodyText.slice(0, 400) + "..." : bodyText;
        return api.sendMessage(`API returned non-image response: ${preview}`, threadID, messageID);
      }
    }

    // determine extension from content-type
    const extMatch = contentType.match(/image\/(png|jpeg|jpg|gif|webp)/);
    const ext = extMatch ? (extMatch[1] === "jpeg" ? "jpg" : extMatch[1]) : "png";

    const safeName = `supreme_${Date.now()}_${Math.floor(Math.random() * 1e6)}.${ext}`;
    const tmpPath = path.join(CACHE_DIR, safeName);

    await fs.writeFile(tmpPath, Buffer.from(res.data));

    api.sendMessage(
      {
        body: `🖤🍀 Here is your Supreme banner 🍀🖤\n\nCredit: Mr Developer`,
        attachment: fs.createReadStream(tmpPath),
      },
      threadID,
      (err) => {
        // best-effort cleanup
        fs.unlink(tmpPath).catch(() => {});
        if (err) {
          console.error("sendMessage error:", err);
          return api.sendMessage("Failed to send the image. Try again later.", threadID, messageID);
        }
      },
      messageID,
    );
  } catch (err) {
    console.error("supreme error:", err);

    if (err.code === "ECONNABORTED") {
      return api.sendMessage("Request timed out — try again in a moment.", threadID, messageID);
    }
    if (err.response && err.response.status) {
      if (err.response.status === 429) {
        return api.sendMessage("API rate limit reached. Try again later.", threadID, messageID);
      }
      return api.sendMessage(`API error ${err.response.status}: ${err.response.statusText}`, threadID, messageID);
    }
    return api.sendMessage("An unexpected error occurred while generating the logo. Try again later.", threadID, messageID);
  }
};
