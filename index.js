require("dotenv").config();

const fs = require("fs");
const path = require("path");

const {
    Client,
    Collection,
    GatewayIntentBits,
    Partials
} = require("discord.js");

const config = require("./config");

const client = new Client({

    intents: [

        GatewayIntentBits.Guilds,

        GatewayIntentBits.GuildMessages,

        GatewayIntentBits.GuildMembers,

        GatewayIntentBits.MessageContent

    ],

    partials: [

        Partials.Channel,

        Partials.Message

    ]

});

client.config = config;

client.commands = new Collection();
client.aliases = new Collection();

client.cooldowns = new Collection();
client.services = {};

client.services.users = require("./core/services/Users");
client.services.threads = require("./core/services/Threads");
client.services.currency = require("./core/services/Currency");

client.root = __dirname;

global.client = client;

global.data = {
    threadData: new Map(),
    userData: new Map(),

    allThreadID: [],
    allUserID: [],

    threadBanned: new Map(),
    userBanned: new Map(),

    commandBanned: new Map(),

    botID: null
};

// Loaders

require("./core/loaders/commands")(client);
require("./core/loaders/events")(client);

client.login(process.env.TOKEN);