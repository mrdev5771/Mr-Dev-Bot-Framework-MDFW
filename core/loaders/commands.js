const fs = require("fs");
const path = require("path");
const EventManager = require("../managers/EventManager");

module.exports = (client) => {

    let totalCommands = 0;

    function load(folder) {

        const files = fs.readdirSync(folder);

        for (const file of files) {

            const filePath = path.join(folder, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                load(filePath);
                continue;
            }

            if (!file.endsWith(".js"))
                continue;

            delete require.cache[require.resolve(filePath)];

            const command = require(filePath);

            // Messenger compatibility
            if (command.config && command.config.name) {

                command.name = command.config.name;
                command.aliases = command.config.aliases || [];
                command.cooldown = command.config.cooldowns || 0;
                command.description = command.config.description || "";

            }

            if (!command.name) {

                console.log(`⚠ Skipped: ${file}`);
                continue;

            }

            client.commands.set(command.name.toLowerCase(), command);

            if (Array.isArray(command.aliases)) {

                for (const alias of command.aliases) {

                    client.commands.set(alias.toLowerCase(), command);

                }

            }

            // Register Messenger handleEvent
            if (typeof command.handleEvent === "function") {

                EventManager.add(command);

            }

            totalCommands++;

            console.log(`✓ Loaded: ${command.name}`);

        }

    }

    load(path.join(__dirname, "..", "..", "commands"));

    console.log(`\n📦 Loaded ${totalCommands} commands.`);
    console.log(`📨 handleEvent Commands: ${EventManager.getAll().length}\n`);

};