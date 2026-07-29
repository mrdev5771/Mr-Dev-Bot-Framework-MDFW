class EventManager {

    constructor() {
        this.events = [];
    }

    add(command) {
        this.events.push(command);
    }

    getAll() {
        return this.events;
    }

}

module.exports = new EventManager();