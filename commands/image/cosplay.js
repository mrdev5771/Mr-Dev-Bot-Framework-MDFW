/**
 * cosplay.js
 *
 * Mr Dev Framework v2 compatible
 *
 * Features:
 * - Random cosplay images
 * - Andaraz API support
 * - Safe image download
 * - Cache cleanup
 * - Better error handling
 */


const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");



const CACHE_DIR =
    path.join(__dirname, "cache");


const API_URL =
    "https://api.andaraz.com/api/randomimage/cosplay";


const API_KEY =
    process.env.COSPLAY_KEY ||
    "a187d95d";





module.exports.config = {

    name: "cosplay",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "Mr Developer",
    usePrefix: true,
    description: "Random cosplay images",
    commandCategory: "Images",
    usages: "cosplay",
    cooldowns: 5

};






async function saveImage(buffer){


    await fs.ensureDir(
        CACHE_DIR
    );


    const file =
        path.join(
            CACHE_DIR,
            `cosplay_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2)}.jpg`
        );



    await fs.writeFile(
        file,
        Buffer.from(buffer)
    );


    return file;

}







function extractImageURL(data){


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







async function getCosplayImage(){


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

                    "User-Agent":
                    "MrDevBot/2.0",

                    Accept:
                    "*/*"

                }

            }

        );




    const type =
        response.headers["content-type"] || "";





    // Direct image response

    if(type.includes("image")){


        return await saveImage(
            response.data
        );


    }






    // JSON response fallback

    const imageURL =
        extractImageURL(
            response.data
        );



    if(imageURL){


        const img =
            await axios.get(

                imageURL,

                {

                    responseType:
                    "arraybuffer",

                    timeout:
                    20000

                }

            );


        return await saveImage(
            img.data
        );


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

        "🖤🍀 𝗪𝗮𝗶𝘁 𝗙𝗼𝗿 𝐂𝐨𝐬𝐩𝐥𝐚𝐲 𝐑𝐚𝐧𝐝𝐨𝐦 𝗣𝗶𝗰𝘀 🍀🖤",

        threadID

    );





    file =
        await getCosplayImage();







    await api.sendMessage(

        {


            body:

            `🖤🍀 𝗛𝗲𝗿𝗲 𝗜𝘀 𝗬𝗼𝘂𝗿 𝐂𝐨𝐬𝐩𝐥𝐚𝐲 𝐑𝐚𝐧𝐝𝐨𝐦 𝗣𝗶𝗰𝘀\n\n`+

            `𝗖𝗿𝗲𝗱𝗶𝘁 : 𝗠𝗿 𝗗𝗲𝘃𝗲𝗹𝗼𝗽𝗲𝗿 </> 🍀🖤`,



            attachment:

            fs.createReadStream(file)


        },


        threadID


    );



}
catch(error){



    console.error(

        "[cosplay error]",

        error.message

    );



    return api.sendMessage(

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