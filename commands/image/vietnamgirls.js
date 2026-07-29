/**
 * vietnamgirls.js
 *
 * Mr Dev Framework v2 compatible
 *
 * Features:
 * - Random Vietnam Girls images
 * - Supports direct image response
 * - Supports JSON URL response
 * - Safe download
 * - Cache cleanup
 * - Better error handling
 */


const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");


const CACHE_DIR =
    path.join(__dirname,"cache");


const API_URL =
    "https://api.andaraz.com/api/randomasupan/vietnam";


const API_KEY =
    process.env.VIETNAM_KEY ||
    "829cf024";





module.exports.config = {


    name:"vietnamgirls",

    version:"2.0.0",

    hasPermssion:0,

    credits:"Mr Developer",

    usePrefix:true,

    description:
    "Random Vietnam girls images",

    commandCategory:"image",

    usages:"vietnamgirls",

    cooldowns:5


};








async function downloadImage(url){


    await fs.ensureDir(CACHE_DIR);



    const file =
        path.join(
            CACHE_DIR,
            `vietnam_${Date.now()}.jpg`
        );



    const response =
        await axios.get(

            url,

            {

                responseType:"arraybuffer",

                timeout:30000,

                headers:{

                    "User-Agent":
                    "Mozilla/5.0",

                    Accept:
                    "image/*"

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

            json.data?.url ||

            json.data?.image ||

            json.data ||

            null

        );


    }

    catch{


        return null;

    }


}









async function getVietnam(){



    await fs.ensureDir(CACHE_DIR);



    const response =
        await axios.get(

            API_URL,

            {


                params:{

                    apikey:
                    API_KEY

                },


                responseType:
                "arraybuffer",



                timeout:
                20000,



                headers:{


                    Accept:
                    "*/*",


                    "User-Agent":
                    "MrDevBot/2.0"


                }


            }

        );







    const type =
        response.headers["content-type"] || "";






    // Direct image

    if(type.includes("image")){


        const file =
            path.join(

                CACHE_DIR,

                `vietnam_${Date.now()}.jpg`

            );



        await fs.writeFile(

            file,

            Buffer.from(response.data)

        );



        return file;


    }








    // JSON response

    const imageURL =
        extractImage(response.data);




    if(imageURL){


        return await downloadImage(
            imageURL
        );


    }





    console.log(
        Buffer.from(response.data)
        .toString()
    );



    throw new Error(
        "Invalid Vietnam API response"
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



let file=null;



try{



await api.sendMessage(

"🖤🍀 𝗪𝗮𝗶𝘁 𝗙𝗼𝗿 Vietnam Girls 𝗣𝗶𝗰𝘀 🍀🖤",

threadID

);





file =
    await getVietnam();







await api.sendMessage(

{

body:

`🖤🍀 𝗛𝗲𝗿𝗲 𝗜𝘀 𝗬𝗼𝘂𝗿 Vietnam Girls 𝗣𝗶𝗰𝘀

𝗖𝗿𝗲𝗱𝗶𝘁 : 𝗠𝗿 𝗗𝗲𝘃𝗲𝗹𝗼𝗽𝗲𝗿 🍀🖤`,



attachment:
fs.createReadStream(file)


},

threadID


);





}

catch(err){


console.error(

"[vietnamgirls error]",

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


setTimeout(()=>{


fs.unlink(
file,
()=>{}
);


},10000);



}



}



};