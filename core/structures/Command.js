class Command {
    constructor(data = {}) {

        this.name =
            data.name ||
            data.config?.name ||
            null;

        this.aliases =
            data.aliases ||
            [];

        this.description =
            data.description ||
            data.config?.description ||
            "No description provided.";

        this.category =
            data.category ||
            data.config?.commandCategory ||
            "General";

        this.cooldown =
            data.cooldown ??
            data.config?.cooldowns ??
            3;

        this.ownerOnly =
            data.ownerOnly ??
            false;

        this.permissions =
            data.permissions ||
            [];

        this.usePrefix =
            data.usePrefix ??
            data.config?.usePrefix ??
            true;

        this.usages =
            data.usages ||
            data.config?.usages ||
            "";

        this.version =
            data.version ||
            data.config?.version ||
            "1.0.0";

        this.credits =
            data.credits ||
            data.config?.credits ||
            "Unknown";

        this.run =
            data.run ||
            (async () => {});

        this.handleEvent =
            data.handleEvent ||
            null;

        this.handleReply =
            data.handleReply ||
            null;

        this.handleReaction =
            data.handleReaction ||
            null;

    }
}

module.exports = Command;