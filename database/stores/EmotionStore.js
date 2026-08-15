const Emotion = require("../models/Emotion");

class EmotionStore {
  static async get(userID) {
    let emotion = await Emotion.findOne({ userID });

    if (!emotion) {
      emotion = await Emotion.create({
        userID,
      });
    }

    return emotion;
  }

  static async save(emotion) {
    return await emotion.save();
  }
}

module.exports = EmotionStore;
