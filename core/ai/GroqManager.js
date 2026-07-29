const Groq = require("groq-sdk");

const keys = [
  process.env.GROQ_API_KEY_1,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
  process.env.GROQ_API_KEY_4,
].filter(Boolean);

let current = 0;

class GroqManager {
  static getClient() {
    return new Groq({
      apiKey: keys[current],
    });
  }

  static nextKey() {
    current++;

    if (current >= keys.length) current = 0;

    console.log(`🔄 Switched to Groq Key #${current + 1}`);
  }

  static currentKey() {
    return current + 1;
  }
}

module.exports = GroqManager;
