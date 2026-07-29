/**
 * aesthetic.js
 *
 * Mr Dev Framework v2 compatible
 *
 * Features:
 * - Random aesthetic images
 * - API key support
 * - Safe download
 * - Cache cleanup
 * - Better error handling
 */

const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");


const CACHE_DIR = path.join(__dirname, "cache");

const API_URL =
    "https://api.andaraz.com/api/randomimage/aesthetic";

const API_KEY =
    process.env.AESTHETIC_KEY ||
    "a187d95d";



module.exports.config = {

    name: "aesthetic",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "Mr Developer",
    usePrefix: true,
    description: "Send aesthetic images",
    commandCategory: "image",
    usages: "aesthetic",
    cooldowns: 5

};





async function downloadImage(url){


    await fs.ensureDir(CACHE_DIR);


    const file =
        path.join(
            CACHE_DIR,
            `aesthetic_${Date.now()}.jpg`
        );


    const response =
        await axios.get(
            url,
            {
                responseType:"arraybuffer",
                timeout:20000,
                headers:{
                    "User-Agent":
                    "Mozilla/5.0"
                }
            }
        );


    await fs.writeFile(
        file,
        Buffer.from(response.data)
    );


    return file;

}





function extractImage(data){


    try{


        const text =
            Buffer.from(data)
            .toString();



        const json =
            JSON.parse(text);



        return (
            json.url ||
            json.image ||
            json.result ||
            json.data ||
            null
        );


    }
    catch{


        return null;

    }


}






async function getAesthetic(){


    const response =
        await axios.get(
            API_URL,
            {
                params:{
                    apikey:API_KEY
                },

                responseType:"arraybuffer",

                timeout:20000,

                headers:{
                    Accept:"*/*",
                    "User-Agent":
                    "MrDevBot/2.0"
                }

            }
        );



    const type =
        response.headers["content-type"] || "";



    // API directly returned image

    if(type.includes("image")){


        const file =
            path.join(
                CACHE_DIR,
                `aesthetic_${Date.now()}.jpg`
            );


        await fs.ensureDir(CACHE_DIR);


        await fs.writeFile(
            file,
            Buffer.from(response.data)
        );


        return file;


    }



    // API returned JSON

    const imageURL =
        extractImage(response.data);



    if(imageURL){

        return await downloadImage(imageURL);

    }



    throw new Error(
        "Invalid API response"
    );


}








module.exports.run = async function({

    api,
    event

}){


const threadID =
    event.threadID;


const messageID =
    event.messageID;



let file = null;



try{


    await api.sendMessage(

        "💜 𝗪𝗮𝗶𝘁 𝗙𝗼𝗿 𝗔𝗲𝘀𝘁𝗵𝗲𝘁𝗶𝗰 𝗣𝗼𝘀𝘁𝘀 / 𝗗𝗽 / 𝗤𝘂𝗼𝘁𝗲𝘀 💜",

        threadID

    );



    file =
        await getAesthetic();




    await api.sendMessage(

        {

            body:
            `💖 𝗛𝗲𝗿𝗲 𝗜𝘀 𝗬𝗼𝘂𝗿 𝗔𝗲𝘀𝘁𝗵𝗲𝘁𝗶𝗰 𝗣𝗼𝘀𝘁𝘀 / 𝗗𝗽 / 𝗤𝘂𝗼𝘁𝗲𝘀\n\n`+
            `𝗖𝗿𝗲𝗱𝗶𝘁 : 𝙈𝙧 𝘿𝙚𝙫𝙚𝙡𝙤𝙥𝙚𝙧 💖`,

            attachment:
            fs.createReadStream(file)

        },


        threadID

    );



}
catch(err){


    console.error(
        "[aesthetic error]",
        err.message
    );



    await api.sendMessage(

        "❌ Error! An error occurred. Please try again later.",

        threadID,
        messageID

    );


}



finally{


    if(file){


        setTimeout(

            ()=>{

                fs.unlink(
                    file,
                    ()=>{}

                );

            },

            10000

        );


    }


}



};