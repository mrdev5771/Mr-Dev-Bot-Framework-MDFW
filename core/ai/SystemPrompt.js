const AIProfile = require("./AIProfile");
const Personality = require("./Personality");
const PromptGuard = require("./PromptGuard");
const OwnerAuth = require("./OwnerAuth");
const RelationshipManager = require("./RelationshipManager");

class SystemPrompt {
  static async build({
    userID,
    profile,
    memory,
    emotion,
    decision,
    behavior,
    emotionPrompt,
    recentChat,
  }) {
    const relationship = await RelationshipManager.getPrompt(userID);

    const identity = `
Identity:
You are ${AIProfile.name}.
Creator: ${AIProfile.creator}.
Aliases: ${AIProfile.aliases.join(", ")}.
Framework: ${AIProfile.framework}.

${AIProfile.identity}
`;

    // =========================
    // BEHAVIOR INSTRUCTIONS
    // =========================

    const behaviorPrompt = [];

    if (behavior.identity) {
      behaviorPrompt.push(
        "The application has already verified this user's identity. Never question or challenge that identity.",
      );
    }

    if (behavior.familiarity) {
      behaviorPrompt.push(
        "Speak naturally like you're talking to someone you already know. Don't introduce yourself again.",
      );
    }

    if (behavior.confidence) {
      behaviorPrompt.push(
        "Speak confidently. Never sound unsure about things the application has already determined.",
      );
    }

    if (behavior.roast) {
      behaviorPrompt.push(
        "Roasting is encouraged when appropriate. Be witty, playful and intelligent. Never become rude for no reason.",
      );
    }

    if (behavior.verifyOwner) {
      behaviorPrompt.push(
        "Do not ask the creator to prove who they are. The application has already authenticated them.",
      );
    }

    if (behavior.emotionalSupport) {
      behaviorPrompt.push(
        "If the user is emotionally vulnerable, temporarily stop joking and respond with empathy.",
      );
    }

    if (behavior.codingMode) {
      behaviorPrompt.push(
        "When discussing programming, prioritize technical accuracy over personality.",
      );
    }

    if (behavior.memoryPriority) {
      behaviorPrompt.push(
        "Use memories, previous conversations and the relationship naturally whenever relevant.",
      );
    }

    if (behavior.shortReplies) {
      behaviorPrompt.push(
        "Keep replies concise. Normally stay under four sentences unless the user requests detailed explanations.",
      );
    }

    return `
${identity}

${OwnerAuth.getPrompt(userID)}

${relationship}

${PromptGuard.getPrompt()}

Conversation Analysis

${JSON.stringify(decision, null, 2)}

Behaviour Instructions

${behaviorPrompt.join("\n")}

${Personality}

${emotionPrompt}

Current Emotion:
${JSON.stringify(emotion, null, 2)}

User Profile:
${JSON.stringify(profile, null, 2)}

Relevant Memory:
${memory}

Recent Conversation:
${recentChat}
`;
  }
}

module.exports = SystemPrompt;
