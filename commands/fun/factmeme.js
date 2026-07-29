// alert.js — improved, robust version
const path = require("path");

module.exports.config = {
  name: "factmeme",
  version: "1.0.2",
  hasPermssion: 0,
  credits: "Mr Developer(improved)",
  description: "Generate a PopCat alert image with text",
  usePrefix:true,
  commandCategory: "image",
  usages: "text",
  cooldowns: 0,
  dependencies: { "fs-extra": "^10.0.0", axios: "^1.0.0" },
};

module.exports.run = async ({ api, event, args }) => {
  // Helper to prefer shared modules from framework, fallback to require()
  const getModule = (name) =>
    (global && global.nodemodule && global.nodemodule[name]) || require(name);

  const fs = getModule("fs-extra");
  const axios = getModule("axios");

  const { threadID, messageID } = event;
  try {
    // Prepare and validate text
    let text = Array.isArray(args) ? args.join(" ") : String(args || "");
    text = text.trim();
    if (!text) {
      return api.sendMessage(
        "Please provide text. Usage: alert <text>",
        threadID,
        messageID,
      );
    }

    // Limit text length to avoid extremely long URLs / API abuse
    const MAX_LENGTH = 120;
    if (text.length > MAX_LENGTH) {
      return api.sendMessage(
        `Text too long — please use up to ${MAX_LENGTH} characters.`,
        threadID,
        messageID,
      );
    }

    // Build URL safely
    const encoded = encodeURIComponent(text);
    const url = `https://api.popcat.xyz/v2/facts?text=${encoded}`;

    // Ensure cache directory exists
    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);

    // Create a unique filename to avoid race conditions
    const filename = `alert_${Date.now()}_${Math.floor(Math.random() * 10000)}.png`;
    const outPath = path.join(cacheDir, filename);

    // Download using axios stream with timeout
    const response = await axios({
      method: "get",
      url,
      responseType: "stream",
      timeout: 20000, // 20s timeout
      // headers: { 'User-Agent': 'YourBotName/1.0' } // optionally set
    });

    // If non-200 status, throw
    if (response.status !== 200) {
      throw new Error(`Unexpected response status: ${response.status}`);
    }

    // Pipe to file and wait for finish/error
    await new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(outPath);
      response.data.pipe(writer);
      let finished = false;
      writer.on("finish", () => {
        finished = true;
        resolve();
      });
      writer.on("error", (err) => {
        if (!finished) reject(err);
      });
      // Safety: if response stream errors
      response.data.on("error", (err) => {
        if (!finished) reject(err);
      });
    });

    // Send the file, then cleanup
    const sendCallback = (err) => {
      // Clean up file whether send succeeded or not
      try {
        if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
      } catch (e) {
        // ignore cleanup errors
      }
      if (err) {
        // notify user of failure to send
        api.sendMessage(
          "Failed to send image: " + err.message,
          threadID,
          messageID,
        );
      }
    };

    // Use same payload shape as original (empty body + attachment)
    return api.sendMessage(
      {
        body: "",
        attachment: fs.createReadStream(outPath),
      },
      threadID,
      sendCallback,
      messageID,
    );
  } catch (error) {
    // Attempt to provide helpful error message to the user
    const msg =
      error && error.message
        ? `Error creating factmeme image: ${error.message}`
        : "Unknown error creating factmeme image.";
    // try to send the error back to chat
    try {
      api.sendMessage(msg, threadID, messageID);
    } catch (e) {
      // swallow if send fails
      console.error("Failed to report error to thread:", e);
    }
    console.error("factmeme command error:", error);
  }
};
