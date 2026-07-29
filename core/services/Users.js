const fs = require("fs-extra");
const path = require("path");

const FILE = path.join(process.cwd(), "database", "users.json");

fs.ensureFileSync(FILE);

class Users {

    load() {
        return fs.readJsonSync(FILE, { throws: false }) || {};
    }

    save(data) {
        fs.writeJsonSync(FILE, data, { spaces: 2 });
    }

    async getData(id) {

        const users = this.load();

        if (!users[id]) {

            users[id] = {

                userID: id,
                money: 0,
                exp: 0,
                level: 1,
                data: {}

            };

            this.save(users);

        }

        global.data.userData.set(id, users[id]);

        if (!global.data.allUserID.includes(id))
            global.data.allUserID.push(id);

        return users[id];

    }

    async setData(id, data) {

        const users = this.load();

        users[id] = data;

        this.save(users);

        global.data.userData.set(id, data);

    }

    async getNameUser(id) {

        try {

            const user = await global.client.users.fetch(id);

            return user.username;

        }

        catch {

            return "Unknown";

        }

    }

}

module.exports = new Users();