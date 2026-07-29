const fs = require("fs");
const path = require("path");

module.exports = (client) => {

    let total = 0;

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

            delete require.cache[
                require.resolve(filePath)
            ];

            const event = require(filePath);

            if (!event.name)
                continue;

            if (event.once)

                client.once(

                    event.name,

                    (...args) =>

                        event.execute(...args, client)

                );

            else

                client.on(

                    event.name,

                    (...args) =>

                        event.execute(...args, client)

                );

            total++;

            console.log(`✓ ${event.name}`);

        }

    }

    load(

        path.join(client.root, "events")

    );

    console.log(`Loaded ${total} events.\n`);

};