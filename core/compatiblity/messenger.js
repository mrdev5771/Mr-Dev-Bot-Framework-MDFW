const Command = require("../structures/Command");

module.exports = function convert(command) {

    // Already framework format

    if (command.name)
        return new Command(command);

    // Messenger format

    if (command.config) {

        return new Command({

            ...command.config,

            config: command.config,

            run: command.run,

            handleEvent: command.handleEvent,

            handleReply: command.handleReply,

            handleReaction: command.handleReaction

        });

    }

    return null;

};