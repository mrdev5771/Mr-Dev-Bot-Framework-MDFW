// modules/commands/phub.js
const { loadImage, createCanvas } = require("@napi-rs/canvas");
const fs = require("fs-extra");
const axios = require("axios");
const path = require("path"); // <-- FIXED

module.exports.config = {
  name: "phub",
  version: "1.1.1",
  hasPermssion: 0,
  credits: "MewMew + modified by GPT",
  usePrefix: true,
  description: "Comment on pỏnhub style (with emoji support)",
  commandCategory: "edit-img",
  usages: "phub [text]",
  cooldowns: 10,
  dependencies: { "@napi-rs/canvas": "", axios: "", "fs-extra": "" },
};

// ============ EMOJI HELPERS ============ //
function isEmojiChar(ch) {
  try {
    return /\p{Extended_Pictographic}/u.test(ch);
  } catch {
    const code = ch.codePointAt(0);
    return (code >= 0x1f300 && code <= 0x1f9ff) || (code >= 0x2600 && code <= 0x26ff);
  }
}

function splitIntoTokens(text) {
  const tokens = [];
  let buf = "";
  for (const ch of [...text]) {
    if (isEmojiChar(ch)) {
      if (buf) {
        tokens.push({ type: "text", value: buf });
        buf = "";
      }
      tokens.push({ type: "emoji", value: ch });
    } else {
      buf += ch;
    }
  }
  if (buf) tokens.push({ type: "text", value: buf });
  return tokens;
}

async function fetchEmojiImage(char, cache) {
  const cps = [...char].map((c) => c.codePointAt(0).toString(16)).join("-");
  const key = cps.toLowerCase();
  if (cache.has(key)) return cache.get(key);

  const url = `https://twemoji.maxcdn.com/v/latest/72x72/${key}.png`;
  try {
    const resp = await axios.get(url, { responseType: "arraybuffer", timeout: 15000 });
    const img = await loadImage(Buffer.from(resp.data));
    cache.set(key, img);
    return img;
  } catch {
    cache.set(key, null);
    return null;
  }
}

function wrapTokens(ctx, tokens, maxWidth, emojiSize) {
  const lines = [];
  let curLine = [];
  let curW = 0;

  const pushLine = () => {
    if (curLine.length) lines.push(curLine);
    curLine = [];
    curW = 0;
  };

  for (const t of tokens) {
    if (t.type === "emoji") {
      if (curW + emojiSize <= maxWidth || !curLine.length) {
        curLine.push({ ...t, _w: emojiSize });
        curW += emojiSize;
      } else {
        pushLine();
        curLine.push({ ...t, _w: emojiSize });
        curW += emojiSize;
      }
    } else {
      const parts = t.value.split(/(\s+)/);
      for (const part of parts) {
        if (!part) continue;
        const w = ctx.measureText(part).width;
        if (curW + w <= maxWidth || !curLine.length) {
          curLine.push({ type: "text", value: part, _w: w });
          curW += w;
        } else {
          pushLine();
          curLine.push({ type: "text", value: part, _w: w });
          curW += w;
        }
      }
    }
  }
  if (curLine.length) lines.push(curLine);
  return lines;
}

// ============ MAIN RUN ============ //
module.exports.run = async function ({ api, event, args }) {
  const { senderID, threadID, messageID } = event;
  const text = args.join(" ").trim();
  if (!text) return api.sendMessage("Please put a message", threadID, messageID);

  const avatarPath = path.join(__dirname, "cache/avt.png");
  const outPath = path.join(__dirname, "cache/phub.png");

  try {
    // Get user info
    const userInfo = await api.getUserInfo(senderID);
    const name = userInfo[senderID].name;
    const avatarUrl = userInfo[senderID].thumbSrc;

    // Download assets
    const [avatarData, baseData] = await Promise.all([
      axios.get(avatarUrl, { responseType: "arraybuffer" }),
      axios.get("https://raw.githubusercontent.com/ProCoderMew/Module-Miraiv2/main/data/phub.png", {
        responseType: "arraybuffer",
      }),
    ]);

    const avatarImg = await loadImage(Buffer.from(avatarData.data));
    const baseImg = await loadImage(Buffer.from(baseData.data));

    // Setup canvas
    const canvas = createCanvas(baseImg.width, baseImg.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);

    // Draw avatar
    ctx.drawImage(avatarImg, 30, 310, 70, 70);

    // Username
    ctx.font = "700 23px Arial";
    ctx.fillStyle = "#FF9900";
    ctx.textAlign = "start";
    ctx.fillText(name, 115, 350);

    // Prepare message text
    const emojiCache = new Map();
    let fontSize = 23;
    ctx.font = `400 ${fontSize}px Arial, sans-serif`;

    const tokens = splitIntoTokens(text);
    const emojiSize = fontSize;
    const lines = wrapTokens(ctx, tokens, 1160, emojiSize);

    const uniqueEmojis = [...new Set(tokens.filter((t) => t.type === "emoji").map((t) => t.value))];
    await Promise.all(uniqueEmojis.map((ch) => fetchEmojiImage(ch, emojiCache)));

    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "top";
    let y = 430;
    const lineH = fontSize * 1.25;

    for (const line of lines) {
      let x = 30;
      for (const frag of line) {
        if (frag.type === "text") {
          ctx.fillText(frag.value, x, y);
          x += frag._w;
        } else if (frag.type === "emoji") {
          const cps = [...frag.value].map((c) => c.codePointAt(0).toString(16)).join("-");
          const img = emojiCache.get(cps.toLowerCase());
          if (img) ctx.drawImage(img, x, y, emojiSize, emojiSize);
          else ctx.fillText(frag.value, x, y);
          x += emojiSize;
        }
      }
      y += lineH;
    }

    const outBuf = canvas.toBuffer("image/png");
    await fs.writeFile(outPath, outBuf);

    return api.sendMessage(
      { attachment: fs.createReadStream(outPath) },
      threadID,
      () => fs.unlinkSync(outPath),
      messageID
    );
  } catch (err) {
    console.error("[phub] error:", err);
    return api.sendMessage("❌ Failed to generate image.", threadID, messageID);
  } finally {
    try {
      if (fs.existsSync(avatarPath)) fs.unlinkSync(avatarPath);
    } catch {}
  }
};
