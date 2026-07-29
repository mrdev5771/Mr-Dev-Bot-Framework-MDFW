const fs = require("fs-extra");
const path = require("path");

const DB_PATH = path.join(process.cwd(), "database");

fs.ensureDirSync(DB_PATH);

class Database {

    constructor(name) {

        this.file = path.join(DB_PATH, `${name}.json`);

        if (!fs.existsSync(this.file))
            fs.writeJsonSync(this.file, {}, { spaces: 2 });

    }

    read() {

        return fs.readJsonSync(this.file);

    }

    write(data) {

        fs.writeJsonSync(this.file, data, { spaces: 2 });

    }

}

module.exports = Database;