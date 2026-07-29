module.exports = {

    name: "clientReady",

    once: true,

    async execute(client) {

        console.clear();

        console.log("");

        console.log("====================================");

        console.log(`🤖 ${client.user.tag}`);

        console.log(`🆔 ${client.user.id}`);

        console.log(`📚 Commands : ${client.commands.size}`);

        console.log(`🏠 Guilds   : ${client.guilds.cache.size}`);

        console.log("");

        console.log("Mr Dev Framework v2 Started");

        console.log("====================================");

        client.user.setActivity(

            `${client.config.prefix}help`,

            {

                type: 0

            }

        );

    }

};