const fs = require("fs-extra");
const path = require("path");

const FILE = path.join(process.cwd(), "database", "threads.json");

fs.ensureFileSync(FILE);

class Threads {

    load() {
        return fs.readJsonSync(FILE, { throws: false }) || {};
    }

    save(data) {
        fs.writeJsonSync(FILE, data, { spaces: 2 });
    }

    async getData(id) {

        const threads = this.load();

        if (!threads[id]) {

            threads[id] = {

                threadID: id,
                data: {}

            };

            this.save(threads);

        }

        global.data.threadData.set(id, threads[id]);

        if (!global.data.allThreadID.includes(id))
            global.data.allThreadID.push(id);

        return threads[id];

    }

    async setData(id, data) {

        const threads = this.load();

        threads[id] = data;

        this.save(threads);

        global.data.threadData.set(id, data);

    }

}

module.exports = new Threads();