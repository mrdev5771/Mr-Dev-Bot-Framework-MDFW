const API = "https://api.waifu.im/images";

module.exports.config = {
  name: "animev11",
  version: "1.0.3",
  usePrefix: true,
  hasPermssion: 0,
  credits: "MrDeveloper",
  description: "Fetch a animenewv5 image from waifu.im",
  commandCategory: "images",
  usages: "animenewv5",
  cooldowns: 5,
};

module.exports.run = async function ({ api, event }) {
  const axios = require("axios");
  const fs = require("fs-extra");
  const path = require("path");

  const cacheDir = path.join(__dirname, "cache");
  await fs.ensureDir(cacheDir);

  const fileName = `waifu_${Date.now()}.jpg`;
  const filePath = path.join(cacheDir, fileName);

  try {

    // Fetch API
    const response = await axios.get(API, {
      params: {
        includedTags: "paizuri",
        isNSFW:true
      },
      timeout: 15000,
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    // Debug
    console.log(response.data);

    if (
      !response.data ||
      !Array.isArray(response.data.items) ||
      response.data.items.length === 0
    ) {
      throw new Error("No image found.");
    }

    // Get image URL
    const imageUrl = response.data.items[0].url;

    if (!imageUrl) {
      throw new Error("Image URL missing.");
    }

    // Download image
    const imageResponse = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 15000,
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    // Save image
    await fs.writeFile(filePath, Buffer.from(imageResponse.data));

    // Send message
    api.sendMessage(
      {
        body: "💖 𝘾𝙧𝙚𝙙𝙞𝙩 : 𝙈𝙧 𝘿𝙚𝙫𝙚𝙡𝙤𝙥𝙚𝙧 </> 🖤🎇",
        attachment: fs.createReadStream(filePath),
      },
      event.threadID,
      () => {
        fs.unlinkSync(filePath);
      },
      event.messageID
    );

  } catch (err) {

    console.log(err.response?.data || err);

    let errorMsg = "❌ Error: ";

    if (err.response) {
      errorMsg += `HTTP ${err.response.status}`;
    } else {
      errorMsg += err.message;
    }

    api.sendMessage(errorMsg, event.threadID, event.messageID);
  }
};