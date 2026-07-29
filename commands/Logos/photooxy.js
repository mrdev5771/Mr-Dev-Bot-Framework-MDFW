/**
 * logo.js
 *
 * Mr Dev Framework v2
 *
 * Dynamic PhotoOxy Logo Generator
 *
 * Usage:
 *
 * <logo flaming Mr Dev
 * <logo chrome Developer
 * <logo list
 *
 */


const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const styles =
require("../../data/logoStyles");



const CACHE_DIR =
path.join(__dirname,"cache","logo");



const API =
"https://api.andaraz.com/api/photooxy";



const API_KEY =
process.env.PHOTOXY_KEY ||
"a187d95d";





module.exports.config = {

    name:"photooxy",

    version:"1.0.0",

    hasPermssion:0,

    credits:"Mr Developer",

    usePrefix:true,

    description:
    "Generate stylish logos",

    commandCategory:
    "logo maker",

    usages:
    "logo <style> <text>",

    cooldowns:5

};








async function downloadImage(url){


    await fs.ensureDir(
        CACHE_DIR
    );


    const file =
    path.join(

        CACHE_DIR,

        `logo_${Date.now()}.jpg`

    );



    const response =
    await axios.get(

        url,

        {

            responseType:
            "arraybuffer",

            timeout:20000

        }

    );



    await fs.writeFile(

        file,

        response.data

    );


    return file;


}







async function generateLogo(style,text){


    const url =

    `${API}/${style}`+

    `?nama=${encodeURIComponent(text)}`+

    `&apikey=${API_KEY}`;



    const response =

    await axios.get(

        url,

        {

            timeout:30000

        }

    );



    if(
        !response.data ||
        !response.data.status
    ){

        throw new Error(
            "API failed"
        );

    }



    const image =

    response.data.data?.url;



    if(!image){

        throw new Error(
            "No image URL received"
        );

    }



    return image;


}









function helpText(){


return `

🎨 Logo Generator

Usage:

<logo <style> <text>


Example:

<logo flaming Mr Dev


Available Styles:

${styles.join(", ")}


`;

}










module.exports.run = async function({

    api,

    event,

    args

}){


const threadID =
event.threadID;


const messageID =
event.messageID;



let file=null;



try{



    if(!args.length){


        return api.sendMessage(

            helpText(),

            threadID,

            messageID

        );

    }





    const style =
    args[0]
    .toLowerCase();





    if(style==="list"){


        return api.sendMessage(

            helpText(),

            threadID,

            messageID

        );

    }






    if(!styles.includes(style)){


        return api.sendMessage(

            `❌ Invalid logo style\n\nUse:\n<logo list`,

            threadID,

            messageID

        );

    }






    const text =

    args
    .slice(1)
    .join(" ")
    .trim();






    if(!text){


        return api.sendMessage(

            `✏️ Please provide text\n\nExample:\n<logo chrome Mr Dev`,

            threadID,

            messageID

        );

    }






    await api.sendMessage(

        "🖤🍀 𝗖𝗿𝗲𝗮𝘁𝗶𝗻𝗴 𝗬𝗼𝘂𝗿 𝗟𝗼𝗴𝗼... 𝗣𝗹𝗲𝗮𝘀𝗲 𝗪𝗮𝗶𝘁 🍀🖤",

        threadID

    );








    const imageURL =

    await generateLogo(

        style,

        text

    );





    file =

    await downloadImage(

        imageURL

    );







    await api.sendMessage(

        {

            body:

            `🎨 𝗬𝗼𝘂𝗿 ${style} 𝗟𝗼𝗴𝗼\n\n`+

            `📝 Text: ${text}\n\n`+

            `Credit: Mr Developer`,



            attachment:

            fs.createReadStream(file)

        },

        threadID,

        messageID

    );






}
catch(error){


    console.error(

        "[logo error]",

        error.message

    );



    return api.sendMessage(

        "❌ Logo generation failed. Try again later.",

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

            15000

        );


    }


}



};