const mongoose = require("mongoose");

const ProfileSchema = new mongoose.Schema(
  {
    userID: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Flexible profile facts.
    // Can contain:
    // "name": "Khizra Ayat"
    // "nickname": "Khizzu"
    // "music_preferences": ["Kendrick Lamar"]
    // "favorite_album": "GNX"
    // etc.
    facts: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },

    interests: {
      type: [String],
      default: [],
    },

    likes: {
      type: [String],
      default: [],
    },

    dislikes: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Profile", ProfileSchema);
