const mongoose = require("mongoose");

const TimelineSchema = new mongoose.Schema(
  {
    userID: {
      type: String,
      required: true,
      index: true,
    },

    event: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      default: "conversation",
    },

    importance: {
      type: Number,
      default: 5,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("TimelineEvent", TimelineSchema);