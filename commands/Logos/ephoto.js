/**
 * ephoto.js
 *
 * Mr Dev Framework v2 compatible
 *
 * Ephoto360 Logo Generator
 *
 * Features:
 * - 40+ styles
 * - Style validation
 * - JSON image URL support
 * - Direct image support
 * - Cache cleanup
 */


const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");


const CACHE_DIR = path.join(__dirname, "cache");


const API_URL =
"https://api.andaraz.com/api/ephoto360";


const API_KEY =
process.env.EPHOTO_KEY ||
"44df717c";



const styles =
require("../../data/ephotostyles");







module.exports.config = {


    name:"ephoto",

    version:"2.0.0",

    hasPermssion:0,

    credits:"Mr Developer",

    usePrefix:true,

    description:"Ephoto360 text logo generator",

    commandCategory:"logo",

    usages:"ephoto <style> <text>",

    cooldowns:5


};










function extractImage(data){


    try{


        const json =
        JSON.parse(
            Buffer.from(data).toString()
        );


        return (

            json.url ||

            json.image ||

            json.result ||

            json.data?.url ||

            json.data ||

            null

        );


    }
    catch{


        return null;

    }

}









async function downloadImage(url){


    await fs.ensureDir(CACHE_DIR);



    const file =
    path.join(

        CACHE_DIR,

        `ephoto_${Date.now()}.jpg`

    );



    const response =
    await axios.get(

        url,

        {

            responseType:"arraybuffer",

            timeout:20000,

            headers:{

                "User-Agent":
                "Mozilla/5.0",

                Accept:"image/*"

            }

        }

    );



    await fs.writeFile(

        file,

        Buffer.from(response.data)

    );



    return file;


}









async function generate(style,text){


    const response =
    await axios.get(

        `${API_URL}/${style}`,

        {

            params:{

                apikey:API_KEY,

                nama:text

            },


            responseType:"arraybuffer",


            timeout:30000,


            headers:{

                Accept:"*/*",

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

            `ephoto_${Date.now()}.jpg`

        );



        await fs.ensureDir(CACHE_DIR);



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


        return await downloadImage(imageURL);


    }







    throw new Error(
        "Invalid API response"
    );


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



        if(args.length < 2){


            return api.sendMessage(

`❌ Usage:

${module.exports.config.name} <style> <text>


Example:

ephoto galaxy Hello`,

                threadID,

                messageID

            );


        }






        const style =
        args[0].toLowerCase();



        const text =
        args.slice(1).join(" ");






        if(!styles.includes(style)){



            return api.sendMessage(

`❌ Invalid Style

Available Styles:

${styles.join(", ")}`,

                threadID,

                messageID

            );


        }







        await api.sendMessage(

"🖤🍀 𝗠𝗮𝗸𝗶𝗻𝗴 𝗬𝗼𝘂𝗿 𝗘𝗽𝗵𝗼𝘁𝗼 𝗟𝗼𝗴𝗼 🍀🖤",

            threadID

        );







        file =
        await generate(

            style,

            text

        );







        await api.sendMessage(

            {


                body:

`🖤🍀 𝗛𝗲𝗿𝗲 𝗜𝘀 𝗬𝗼𝘂𝗿 𝗘𝗽𝗵𝗼𝘁𝗼360 𝗟𝗼𝗴𝗼 🍀🖤

Style : ${style}

𝗖𝗿𝗲𝗱𝗶𝘁 : 𝗠𝗿 𝗗𝗲𝘃𝗲𝗹𝗼𝗽𝗲𝗿 </>`,



                attachment:

                fs.createReadStream(file)


            },


            threadID


        );




    }

    catch(err){


        console.error(

            "[ephoto error]",

            err.message

        );



        await api.sendMessage(

            "❌ Error generating ephoto logo. Try again later.",

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