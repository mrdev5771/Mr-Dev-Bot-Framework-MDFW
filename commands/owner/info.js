/**
 * commands/owner/inf.js
 *
 * Mr Dev Framework v2
 * Bot information command
 */


const fs = require("fs-extra");
const path = require("path");
const moment = require("moment-timezone");


module.exports.config = {

    name: "inf",
    version: "2.0.0",

    hasPermssion: 0,

    usePrefix: true,

    credits: "Mr Dev",

    description:
        "Shows bot and owner information.",

    commandCategory:
        "information",

    cooldowns: 3

};





module.exports.run = async function({

    api,
    event

}){


try{


    const cacheDir =
        path.join(
            __dirname,
            "cache"
        );


    const image =
        path.join(
            cacheDir,
            "info.jpg"
        );



    await fs.ensureDir(cacheDir);



    const config =
        global.config || {};



    const botName =
        config.botName ||
        "Mr Dev Bot";



    const prefix =
        config.prefix ||
        "<";



    const now =
        moment
        .tz("Asia/Karachi")
        .format(
            "DD/MM/YYYY HH:mm:ss"
        );



    const uptime =
        process.uptime();



    const hours =
        Math.floor(
            uptime / 3600
        );


    const minutes =
        Math.floor(
            (uptime % 3600) / 60
        );


    const seconds =
        Math.floor(
            uptime % 60
        );




    const message = `

╔══════════════╗
 🖤 𝗠𝗿 𝗗𝗲𝘃 𝗕𝗼𝘁 𝗜𝗻𝗳𝗼
╚══════════════╝


🤖 Bot Name:
${botName}


⚙ Prefix:
${prefix}


👑 Owner:
Mr Developer


📌 Developer:
Robert


🌐 Facebook:
facebook.com/100023600526994


▶ YouTube:
https://www.youtube.com/@ITZFHOFFICIAL/


⏰ Date:
${now}


🔥 Uptime:
${hours}h ${minutes}m ${seconds}s


💚 Thanks for using
${botName}


`;




    const payload = {

        body: message

    };



    // Attach local image if exists

    if(await fs.pathExists(image)){


        payload.attachment =
            fs.createReadStream(image);

    }




    return api.sendMessage(

        payload,

        event.threadID

    );



}
catch(error){


    console.error(
        "[INF ERROR]",
        error
    );


    return api.sendMessage(

        "❌ Unable to load bot information.",

        event.threadID

    );


}



};