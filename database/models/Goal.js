const mongoose = require("mongoose");

const GoalSchema = new mongoose.Schema(
  {
    userID: {
      type: String,
      required: true,
      index: true,
    },

    goal: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "completed", "abandoned"],
      default: "active",
    },

    progress: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Goal", GoalSchema);
