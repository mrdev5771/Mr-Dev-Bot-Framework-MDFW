const mongoose = require("mongoose");

const MemorySchema = new mongoose.Schema(
  {
    userID: {
      type: String,
      required: true,
      index: true,
    },

    memory: {
      type: String,
      required: true,
    },

    importance: {
      type: Number,
      default: 1,
    },

    tags: {
      type: [String],
      default: [],
    },

    source: {
      type: String,
      default: "conversation",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Memory", MemorySchema);
