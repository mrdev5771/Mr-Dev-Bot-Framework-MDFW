class ReplyManager {

    constructor() {

        this.replies = new Map();

    }

    add(data) {

        this.replies.set(data.messageID, data);

    }

    get(messageID) {

        return this.replies.get(messageID);

    }

    remove(messageID) {

        this.replies.delete(messageID);

    }

}

module.exports = new ReplyManager();