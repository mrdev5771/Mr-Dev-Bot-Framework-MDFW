const ReplyManager = require("../core/managers/ReplyManager");

module.exports = function (message) {

    return {

        async sendMessage(data, threadID, callback, replyTo) {

            // Messenger compatibility
            // sendMessage(msg, threadID, messageID)
            if (typeof callback === "string" && replyTo === undefined) {

                replyTo = callback;
                callback = null;

            }

            try {

                const payload = {};

                if (typeof data === "string") {

                    payload.content = data;

                } else {

                    if (data.body)
                        payload.content = data.body;

                    if (data.attachment) {

                        payload.files = Array.isArray(data.attachment)
                            ? data.attachment
                            : [data.attachment];

                    }

                }

                if (replyTo) {

                    payload.reply = {
                        messageReference: replyTo
                    };

                }

                const sent = await message.channel.send(payload);

                // Register replies automatically later
                if (ReplyManager && ReplyManager.pending)
                    ReplyManager.pending(sent.id);

                if (typeof callback === "function") {

                    callback(null, {
                        messageID: sent.id
                    });

                }

                return {
                    messageID: sent.id
                };

            } catch (err) {

                if (typeof callback === "function")
                    callback(err);

                throw err;

            }

        },

        async unsendMessage(messageID) {

            try {

                const msg = await message.channel.messages.fetch(messageID);

                if (msg)
                    await msg.delete();

            } catch { }

        },

        async editMessage(text, messageID) {

            try {

                const msg = await message.channel.messages.fetch(messageID);

                if (msg)
                    await msg.edit(text);

            } catch { }

        },

        async setMessageReaction(emoji, messageID) {

            try {

                const msg = await message.channel.messages.fetch(messageID);

                if (msg)
                    await msg.react(emoji);

            } catch { }

        }

    };

};