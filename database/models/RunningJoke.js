const mongoose = require("mongoose");

const RunningJokeSchema = new mongoose.Schema(
  {
    userID: {
      type: String,
      required: true,
      index: true,
    },

    joke: {
      type: String,
      required: true,
    },

    timesUsed: {
      type: Number,
      default: 1,
    },

    lastUsed: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("RunningJoke", RunningJokeSchema);
