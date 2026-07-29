// modules/commands/aftab.js  (fixed run implementation)
const { loadImage, createCanvas } = require("@napi-rs/canvas");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "jsins",
  version: "1.0.3",
  usePrefix: true,
  cooldowns: 10,
  commandCategory: "text maker",
};

function wrapParagraph(ctx, paragraph, maxWidth) {
  if (!paragraph) return [""];
  const words = paragraph.split(" ");
  const lines = [];
  let line = "";
  while (words.length) {
    const test = line ? `${line} ${words[0]}` : words[0];
    if (ctx.measureText(test).width <= maxWidth) {
      line = test;
      words.shift();
    } else {
      if (!line) {
        // break a very long word
        let w = words.shift();
        while (w.length > 1 && ctx.measureText(w).width > maxWidth)
          w = w.slice(0, -1);
        lines.push(w);
        if (words[0]) words[0] = words[0].slice(w.length) || words.shift();
      } else {
        lines.push(line);
        line = "";
      }
    }
  }
  if (line) lines.push(line);
  return lines;
}

function wrapText(ctx, text, maxWidth) {
  return text
    .split(/\r?\n/)
    .map((p) => wrapParagraph(ctx, p.trim(), maxWidth))
    .flat();
}

module.exports.run = async function ({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;
  const text = args.join(" ").trim();
  if (!text)
    return api.sendMessage(
      "Enter the text to put on the board.",
      threadID,
      messageID
    );

  const cache = path.join(__dirname, "cache/canvas/sins");
  await fs.ensureDir(cache);
  const out = path.join(cache, `aftab_${Date.now()}.png`);
  const templateUrl = "https://i.postimg.cc/7LRzYQXW/vllQ7lZ.png";

  // layout config (tune to template)
  const area = { x: 350, y: 180, w: 814, h: 480 };
  const FONT_FAMILY = "Sans";
  const MAX_FONT = 25;
  const MIN_FONT = 10;
  const LINE_SPACING = 1.25;

  try {
    // download template into memory (note the correct option `responseType`)
    const tpl = await axios.get(templateUrl, {
      responseType: "arraybuffer",
      timeout: 15000,
    });

    if (!tpl || !tpl.data || tpl.data.length === 0) {
      throw new Error("Template download failed or returned empty data");
    }

    // load the template image directly from buffer (no need to write it to disk first)
    const img = await loadImage(Buffer.from(tpl.data));
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // find font size where wrapped text fits in area.h
    let chosenFont = MIN_FONT;
    let lines = [];
    for (let fsz = MAX_FONT; fsz >= MIN_FONT; fsz--) {
      ctx.font = `${fsz}px ${FONT_FAMILY}`;
      lines = wrapText(ctx, text, area.w);
      const totalH = Math.ceil(fsz * LINE_SPACING) * lines.length;
      if (totalH <= area.h) {
        chosenFont = fsz;
        break;
      }
      if (fsz === MIN_FONT) chosenFont = MIN_FONT;
    }

    // set final font and possibly truncate with ellipsis
    ctx.font = `${chosenFont}px ${FONT_FAMILY}`;
    ctx.fillStyle = "#ffffff"; // <-- FIXED
    ctx.textBaseline = "top";
    const lineH = Math.ceil(chosenFont * LINE_SPACING);
    const allowed = Math.floor(area.h / lineH);
    if (lines.length > allowed) {
      lines = lines.slice(0, allowed);
      // add ellipsis to last line
      let last = lines[lines.length - 1];
      while (ctx.measureText(last + "...").width > area.w && last.length)
        last = last.slice(0, -1);
      lines[lines.length - 1] = last + (last.length ? "..." : "...");
    }

    // draw lines
    let y = area.y;
    for (const l of lines) {
      ctx.fillText(l, area.x, y);
      y += lineH;
    }

    // write final image and send
    const outBuf = canvas.toBuffer("image/png");
    await fs.writeFile(out, outBuf);
    await api.sendMessage(
      { attachment: fs.createReadStream(out) },
      threadID,
      messageID
    );
  } catch (err) {
    console.error("[sins] error:", err && (err.stack || err.message || err));
    await api.sendMessage(
      "An error occurred while generating the image. Try again later.",
      threadID,
      messageID
    );
  } finally {
    try {
      // remove output after small delay so the message system can still read it
      setTimeout(() => fs.remove(out).catch(() => {}), 5000);
    } catch (e) {
      // ignore
    }

    // OPTIONAL: if you have a cleanCache helper, keep it; otherwise remove this call
    try {
      if (typeof cleanCache === "function") {
        await cleanCache(cache, {
          prefix: "sins_",
          maxAgeMs: 5 * 1000,
          keep: 10,
        });
      }
    } catch (e) {
      // ignore
    }
  }
};
