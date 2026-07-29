class DecisionManager {
  static decide(userID, message) {
    const text = String(message || "").toLowerCase();

    const decision = {
      coding: false,
      memory: false,
      emotion: false,
      roast: false,
      greeting: false,
      ownerMention: false,
    };

    // =========================
    // CODING
    // =========================

    if (
      /(code|coding|javascript|js|node|nodejs|discord|bug|error|fix|function|class|api|json|npm|module|github|program|script)/i.test(
        text
      )
    ) {
      decision.coding = true;
    }

    // =========================
    // MEMORY
    // =========================

    if (
      /(remember|memory|recall|forgot|who am i|do you know me|our last chat|last time)/i.test(
        text
      )
    ) {
      decision.memory = true;
    }

    // =========================
    // EMOTION
    // =========================

    if (
      /(sad|depressed|anxious|stress|lonely|cry|hurt|upset|grief|tired|hopeless)/i.test(
        text
      )
    ) {
      decision.emotion = true;
    }

    // =========================
    // ROAST
    // =========================

    if (
      /(fuck|idiot|stupid|dumb|clown|kid|trash|loser|bitch|noob|crybaby|shut up|bozo)/i.test(
        text
      )
    ) {
      decision.roast = true;
    }

    // =========================
    // GREETING
    // =========================

    if (
      /^(hi|hello|hey|yo|sup|assalam|salam|good morning|good evening)/i.test(
        text
      )
    ) {
      decision.greeting = true;
    }

    // =========================
    // OWNER
    // =========================

    if (
      /(creator|owner|fahad|mr developer|mr dev)/i.test(text)
    ) {
      decision.ownerMention = true;
    }

    return decision;
  }
}

module.exports = DecisionManager;