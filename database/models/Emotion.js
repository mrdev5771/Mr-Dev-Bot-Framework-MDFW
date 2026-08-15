const mongoose = require("mongoose");

const EmotionSchema = new mongoose.Schema({

    userID: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    mood: {
        type: String,
        default: "Neutral"
    },

    happiness: {
        type: Number,
        default: 50
    },

    anger: {
        type: Number,
        default: 0
    },

    sadness: {
        type: Number,
        default: 0
    },

    excitement: {
        type: Number,
        default: 0
    },

    affection: {
        type: Number,
        default: 0
    },

    lastReason: {
        type: String,
        default: ""
    }

}, {
    timestamps: true
});

module.exports = mongoose.model(
    "Emotion",
    EmotionSchema
);