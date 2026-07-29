const createApi = require("../../src/api");
const ReplyManager = require("../managers/ReplyManager");

class Context {

    constructor(client, message, args, command) {

        this.client = client;
        this.message = message;
        this.command = command;

        this.args = args;

        this.guild = message.guild;
        this.channel = message.channel;
        this.member = message.member;
        this.user = message.author;

        this.prefix = client.config.prefix;

        this.api = createApi(message);

        this.event = {
            threadID: message.channel.id,
            messageID: message.id,
            senderID: message.author.id,
            body: message.content,
            author: message.author,
            channel: message.channel,
            guild: message.guild,
            member: message.member,
            message: message
        };

        // Messenger compatibility
        if (!global.client)
            global.client = {};

        if (!global.client.handleReply)
            global.client.handleReply = [];

    }

    async reply(data) {

        return this.api.sendMessage(data);

    }

    async send(data) {

        return this.api.sendMessage(data);

    }

    async react(emoji) {

        return this.message.react(emoji);

    }

}

module.exports = Context;