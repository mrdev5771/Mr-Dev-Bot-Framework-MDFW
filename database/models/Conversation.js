const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema(
  {
    userID: {
      type: String,
      required: true,
      index: true,
    },

    userMessage: {
      type: String,
      required: true,
      trim: true,
    },

    botReply: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

ConversationSchema.index({ userID: 1, createdAt: -1 });

module.exports = mongoose.model("Conversation", ConversationSchema);
