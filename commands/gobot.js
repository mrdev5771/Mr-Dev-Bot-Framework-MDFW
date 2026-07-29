const replies = require("../data/gobot/replies");
const triggers = require("../data/gobot/trigger");
const randomReplies = require("../data/gobot/randomReplies");

module.exports.config = {
  name: "gobot",
  version: "1.0.1",
  hasPermssion: 0,
  usePrefix: false,
  credits: "𝙈𝙧𝙏𝙤𝙢𝙓𝙭𝙓",
  description: "gibot",
  commandCategory: "ai",
  usages: "noprefix",
  cooldowns: 5,
};

module.exports.handleEvent = async function ({ api, event, Users }) {
  try {
    const { threadID, messageID, senderID } = event;
    const body = (event.body || "").trim();

    if (!body) return;

    const text = body.toLowerCase();
    const name = await Users.getNameUser(senderID);

    // ===========================
    // Fixed Replies
    // ===========================
    const match = replies.find(item =>
      item.triggers.some(trigger => trigger.toLowerCase() === text)
    );

    if (match) {
      return api.sendMessage(match.reply, threadID, messageID);
    }

    // ===========================
    // Random Replies
    // ===========================
    if (triggers.some(trigger => text.includes(trigger.toLowerCase()))) {
      const reply =
        randomReplies[Math.floor(Math.random() * randomReplies.length)];

      return api.sendMessage(reply, threadID, messageID);
    }

    // ===========================
    // Name Response
    // ===========================
    if (/^bot\b/i.test(body)) {
      return api.sendMessage(name, threadID, messageID);
    }

  } catch (err) {
    console.error("gobot handleEvent error:", err);
  }
};

module.exports.run = function () {};