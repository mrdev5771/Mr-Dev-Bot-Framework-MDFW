const mongoose = require("mongoose");

const RelationshipSchema = new mongoose.Schema(
  {
    userID: {
      type: String,

      required: true,

      unique: true,

      index: true,
    },

    level: {
      type: Number,

      default: 1,
    },

    title: {
      type: String,

      default: "Stranger",
    },

    messages: {
      type: Number,

      default: 0,
    },

    trust: {
      type: Number,

      default: 0,

      min: 0,

      max: 100,
    },
  },

  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Relationship", RelationshipSchema);
