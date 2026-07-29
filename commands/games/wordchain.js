// wordchain.js
module.exports.config = {
  name: "wordchain",
  version: "1.1.1-tttstyle",
  hasPermssion: 0,
  credits: "You + Assistant",
  description: "Play Word Chain: reply with a word that starts with the last letter of the previous word. 'start' plays vs bot, '2p @user' for two-player.",
  usePrefix: true,
  commandCategory: "game",
  cooldowns: 5,
  usages: "start | 2p @user | continue | delete | help | debug",
};

const fs = require("fs");

// small builtin dictionary for the bot (common words)
const BOT_WORDS = [
  "apple","angle","ant","anchor","arise","amber","atlas","azure","apex",
  "beacon","banana","brave","breeze","bless","binary","bright","bubble","brick","bloom",
  "cascade","circle","charter","charm","clever","cloud","crisp","crown","copper","canvas",
  "dawn","delta","dream","drift","dynamo","dazzle","distant","druid","dolly","dust",
  "echo","ember","eagle","earth","epoch","elegant","ethos","envoy",
  "fable","frost","flame","forest","fluid","fancy","fusion","ferry","feather","forge",
  "gale","glory","garnet","galaxy","glisten","grace","grove","guild","glyph","gentle",
  "harbor","harmony","hazel","hollow","helium","hustle","horizon","hover","hope","harvest",
  "iris","ivory","ignite","island","icon","influx","ivy","indigo","ink",
  "jade","jewel","joy","jumbo","jovial","journey","jargon","jungle","justice",
  "kale","kindle","king","kudos","keen","kettle","knack","kernel",
  "lumen","lucky","lunar","lodge","legend","lilt","luxe","linen",
  "mango","mystic","myriad","matrix","meadow","merit","mingle","mist","mosaic","moment",
  "nebula","noble","nexus","nectar","nomad","novel","nova","nimbus","notion",
  "opal","orbit","ocean","onyx","oracle","origin","olive","oasis","otter",
  "pearl","prism","pulse","plush","pioneer","pixel","pine","porter","paragon",
  "quartz","quest","quiver","quiet","quail","quench","quick","quota","quirk",
  "raven","ripple","radiant","realm","river","rose","rust","riddle","roam","rocket",
  "sage","solar","serene","spark","sail","silver","sable","summit","sprint",
  "tango","tide","terra","timber","token","tulip","triumph","trove","torrent",
  "umbra","unity","utopia","ultra","urchin","unique","upgrade","usher","utility",
  "vivid","velvet","vessel","vortex","vision","valor","vine","verge","venture",
  "wisp","wander","willow","winter","wave","woven","wisdom","whisk","wonder",
  "xenon","xylem","xanadu","xray",
  "yonder","yarn","youth","yield","yummy","yearn","yellow","yodel",
  "zephyr","zenith","zeal","zodiac","zest","zone","zoom","zinger","zigzag"
];

// -------------------- Utilities --------------------
function tidyWord(raw) {
  if (!raw || typeof raw !== "string") return "";
  const lowered = raw.trim().toLowerCase();
  // match first contiguous letter sequence (unicode letters)
  const m = lowered.match(/\p{L}+/gu);
  if (!m || m.length === 0) return "";
  return m[0];
}

function lastCharOf(word) {
  if (!word) return "";
  return word[word.length - 1];
}

// pushHandleReply uses the same simple shape as ttt.js
function pushHandleReply(info) {
  // info: { name, author, messageID }
  if (!global.client) global.client = {};
  if (!Array.isArray(global.client.handleReply)) global.client.handleReply = [];
  global.client.handleReply.push(info);
}

// -------------------- Game helpers --------------------
function makeNewGame({ mode = "pve", starter = null, opponent = null, starterName = null, opponentName = null }) {
  return {
    mode, // "pve" (player vs bot) or "2p"
    starter,
    starterName: starterName || "Player",
    opponent,
    opponentName: opponentName || "Opponent",
    createdAt: Date.now(),
    lastWord: null,
    lastChar: null,
    used: new Set(),
    turn: 0, // 0 => starter, 1 => opponent (for 2p)
    botEnabled: mode === "pve",
  };
}

// find bot word starting with a char and not in used set
function findBotWord(startChar, usedSet) {
  if (!startChar) return null;
  const c = String(startChar).toLowerCase();
  const candidates = BOT_WORDS.filter(w => w && w[0] === c && !usedSet.has(w));
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// -------------------- Handlers: ttt-style --------------------
module.exports.handleReply = async function ({ event, api }) {
  try {
    const { body, threadID, messageID, senderID } = event;

    if (!global.moduleData) global.moduleData = {};
    if (!global.moduleData.wordchain) global.moduleData.wordchain = new Map();

    const data = global.moduleData.wordchain.get(threadID);
    if (!data) return; // no active game

    // normalize used set (in case state was serialized)
    if (!data.used) data.used = new Set();
    else if (!(data.used instanceof Set)) {
      try {
        if (Array.isArray(data.used)) data.used = new Set(data.used);
        else if (typeof data.used === "object" && data.used !== null)
          data.used = new Set(Object.keys(data.used));
        else data.used = new Set();
      } catch {
        data.used = new Set();
      }
    }

    // parse user's word
    const raw = String(body || "");
    const word = tidyWord(raw);
    if (!word)
      return api.sendMessage(
        "Invalid input — reply with a single word (letters only).",
        threadID,
        messageID
      );

    // enforce turn/author depending on mode
    if (data.mode === "2p") {
      const expected = data.turn === 0 ? data.starter : data.opponent;
      if (String(expected) !== String(senderID)) {
        return api.sendMessage("It's not your turn.", threadID, messageID);
      }
    } else {
      // pve: only starter may reply to keep single-player flow consistent
      if (String(senderID) !== String(data.starter)) {
        return api.sendMessage(
          "This game is single-player — only the person who started it can play.",
          threadID,
          messageID
        );
      }
    }

    // validate starting character if required
    if (data.lastChar) {
      if (word[0] !== data.lastChar) {
        return api.sendMessage(
          `Invalid word — must start with '${data.lastChar.toUpperCase()}'.`,
          threadID,
          messageID
        );
      }
    }

    // repetition check
    if (data.used.has(word)) {
      return api.sendMessage("That word has already been used. Try another one.", threadID, messageID);
    }

    // accept user's word
    data.used.add(word);
    data.lastWord = word;
    data.lastChar = lastCharOf(word);

    // --- 2P flow ---
    if (data.mode === "2p") {
      // swap turn
      data.turn = data.turn === 0 ? 1 : 0;

      const nextName = data.turn === 0 ? (data.starterName || "Player 1") : (data.opponentName || "Player 2");
      const nextAuthor = data.turn === 0 ? data.starter : data.opponent;
      const playerName = String(senderID) === String(data.starter)
        ? (data.starterName || "Player 1")
        : (data.opponentName || "Player 2");
      const nextChar = data.lastChar ? data.lastChar.toUpperCase() : "?";

      const replyText = `${playerName} played **${word}**.\nNext: ${nextName} — reply with a word that starts with '${nextChar}'.`;

      return api.sendMessage(
        replyText,
        threadID,
        (err, info) => {
          if (!err && info) {
            pushHandleReply({
              name: module.exports.config.name,
              author: nextAuthor,
              messageID: info.messageID,
            });
          }
        },
        messageID
      );
    }

    // --- PVE flow (player vs bot) ---
    const botStart = data.lastChar;
    const botWord = findBotWord(botStart, data.used);

    if (!botWord) {
      // bot cannot respond -> player wins; end game
      global.moduleData.wordchain.delete(threadID);
      return api.sendMessage(
        `You played **${word}** — I can't think of a word starting with '${(botStart || "?").toUpperCase()}'. You win! 🎉`,
        threadID,
        messageID
      );
    }

    // bot responds
    data.used.add(botWord);
    data.lastWord = botWord;
    data.lastChar = lastCharOf(botWord);

    const nextChar = data.lastChar ? data.lastChar.toUpperCase() : "?";
    const replyText = `You: **${word}**\nBot: **${botWord}**\nYour turn — reply with a word that starts with '${nextChar}'.`;

    return api.sendMessage(
      replyText,
      threadID,
      (err, info) => {
        if (!err && info) {
          // register handler for the starter (ttt-style)
          pushHandleReply({
            name: module.exports.config.name,
            author: data.starter,
            messageID: info.messageID,
          });
        }
      },
      messageID
    );
  } catch (e) {
    console.error("wordchain handleReply error:", e);
  }
};

// -------------------- Command entrypoint --------------------
module.exports.run = async function ({ event, api, args }) {
  try {
    if (!global.moduleData) global.moduleData = {};
    if (!global.moduleData.wordchain) global.moduleData.wordchain = new Map();

    const { threadID, messageID, senderID } = event;
    const dataExisting = global.moduleData.wordchain.get(threadID) || null;

    if (!args || args.length === 0) {
      return api.sendMessage("Usage: wordchain start | wordchain 2p @user | wordchain continue | wordchain delete | wordchain help | wordchain debug", threadID, messageID);
    }

    const cmd = String(args[0] || "").toLowerCase();

    if (cmd === "help") {
      const help = "Word Chain — rules:\n• Reply with a word starting with the last letter of the previous word.\n• No repeats.\nCommands:\n• wordchain start — play vs bot (bot replies automatically)\n• wordchain 2p @user — two-player mode (turns enforced)\n• wordchain continue — show current requirement\n• wordchain delete — end the game\n• wordchain debug — show internal state (dev)";
      return api.sendMessage(help, threadID, messageID);
    }

    if (cmd === "debug") {
      const exists = dataExisting ? true : false;
      // robust used count: supports Set, Array, or object-shaped legacy
      let usedCount = 0;
      if (dataExisting && dataExisting.used) {
        if (typeof dataExisting.used.size === "number") usedCount = dataExisting.used.size;
        else if (typeof dataExisting.used.length === "number") usedCount = dataExisting.used.length;
        else if (typeof dataExisting.used === "object") usedCount = Object.keys(dataExisting.used).length;
      }
      const last = dataExisting ? dataExisting.lastWord : "n/a";
      const mode = dataExisting ? dataExisting.mode : "n/a";
      const debugText = `wordchain debug:\n active: ${exists}\n mode: ${mode}\n lastWord: ${last}\n used count: ${usedCount}`;
      return api.sendMessage(debugText, threadID, messageID);
    }

    if (cmd === "delete" || cmd === "stop") {
      if (dataExisting) {
        // follow ttt.js pattern: delete game state only
        global.moduleData.wordchain.delete(threadID);
        return api.sendMessage("Word Chain stopped and removed for this chat.", threadID, messageID);
      } else {
        return api.sendMessage("No active Word Chain in this chat.", threadID, messageID);
      }
    }

    if (cmd === "continue") {
      if (!dataExisting) return api.sendMessage("No active Word Chain. Start one with: wordchain start", threadID, messageID);
      const last = dataExisting.lastWord ? `Last word: **${dataExisting.lastWord}**` : "No words yet.";
      const prompt = dataExisting.lastChar ? `${last}\nNext word must start with '${dataExisting.lastChar.toUpperCase()}'` : `${last}\nReply with the first word to begin.`;
      return api.sendMessage(prompt, threadID, (err, info) => {
        if (!err && info) {
          // register handler for the correct author (ttt style)
          const author = dataExisting.mode === "2p" ? (dataExisting.turn === 0 ? dataExisting.starter : dataExisting.opponent) : dataExisting.starter;
          pushHandleReply({ name: module.exports.config.name, author, messageID: info.messageID, });
        }
      }, messageID);
    }

    if (cmd === "start") {
      if (dataExisting) return api.sendMessage("A Word Chain is already active in this chat. Use 'wordchain continue' or 'wordchain delete' first.", threadID, messageID);
      const game = makeNewGame({ mode: "pve", starter: senderID, starterName: event.senderName });
      global.moduleData.wordchain.set(threadID, game);
      return api.sendMessage("Word Chain (vs bot) started — you go first. Reply with the first word.", threadID, (err, info) => {
        if (!err && info) {
          pushHandleReply({ name: module.exports.config.name, author: senderID, messageID: info.messageID, });
        }
      }, messageID);
    }

    if (cmd === "2p") {
      if (dataExisting) return api.sendMessage("A Word Chain is already active in this chat. Use 'wordchain continue' or 'wordchain delete' first.", threadID, messageID);
      // find mention
      const mentions = event.mentions || {};
      const mentionIds = Object.keys(mentions || {});
      let opponentId = null;
      let opponentName = null;
      if (mentionIds.length > 0) {
        opponentId = mentionIds[0];
        opponentName = mentions[opponentId];
      } else if (args[1]) {
        opponentId = args[1];
        opponentName = "Player 2";
      }
      if (!opponentId) {
        return api.sendMessage("Please mention an opponent. Usage: wordchain 2p @user", threadID, messageID);
      }
      if (String(opponentId) === String(senderID)) return api.sendMessage("You cannot challenge yourself.", threadID, messageID);
      const game = makeNewGame({ mode: "2p", starter: senderID, opponent: opponentId, starterName: event.senderName, opponentName: opponentName });
      global.moduleData.wordchain.set(threadID, game);
      const startText = `${event.senderName || "Player 1"} (P1) vs ${opponentName || "Player 2"} (P2)\nP1 goes first — reply with the first word.`;
      return api.sendMessage(startText, threadID, (err, info) => {
        if (!err && info) {
          pushHandleReply({ name: module.exports.config.name, author: senderID, messageID: info.messageID, });
        }
      }, messageID);
    }

    // unknown
    return api.sendMessage("Unknown option. Use: wordchain start | wordchain 2p @user | wordchain continue | wordchain delete | wordchain help", threadID, messageID);
  } catch (e) {
    console.error("wordchain run error:", e);
  }
};
