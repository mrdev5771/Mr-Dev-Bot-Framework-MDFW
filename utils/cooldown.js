const cooldowns = new Map();

module.exports = function(id, command, seconds = 3) {

    const key = `${id}_${command}`;

    if (!cooldowns.has(key)) {

        cooldowns.set(key, Date.now());

        return 0;

    }

    const expire = cooldowns.get(key) + seconds * 1000;

    if (Date.now() < expire) {

        return Math.ceil((expire - Date.now()) / 1000);

    }

    cooldowns.set(key, Date.now());

    return 0;

};