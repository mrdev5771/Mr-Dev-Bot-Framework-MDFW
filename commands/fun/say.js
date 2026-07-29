const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");


module.exports.config = {

    name: "say",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "MrDeveloper",
    description: "Text to speech voice message",
    usePrefix: true,
    commandCategory: "message",
    usages: "say [text]",
    cooldowns: 5

};



module.exports.run = async function({
    api,
    event,
    args
}) {


try {



    const cacheDir =
        path.join(
            __dirname,
            "cache"
        );


    await fs.ensureDir(cacheDir);



    let content =
        args.join(" ");



    if(!content){


        return api.sendMessage(

            "❌ Please enter text.",

            event.threadID,

            event.messageID

        );


    }





    // Detect language prefix

    let language =
        "en";


    const langs =
    [
        "ru",
        "en",
        "ko",
        "ja",
        "tl"
    ];



    for(const lang of langs){


        if(content.startsWith(lang+" ")){

            language = lang;

            content =
            content.slice(
                lang.length + 1
            );

            break;

        }

    }





    const filePath =

        path.join(

            cacheDir,

            `${event.threadID}_${event.senderID}.mp3`

        );





    const url =

    `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(content)}&tl=${language}&client=tw-ob`;





    const response =

        await axios.get(

            url,

            {

                responseType:
                "arraybuffer",

                headers:{

                    "User-Agent":
                    "Mozilla/5.0"

                }

            }

        );





    await fs.writeFile(

        filePath,

        Buffer.from(response.data)

    );






    return api.sendMessage(

        {

            attachment:

            fs.createReadStream(filePath)

        },


        event.threadID,


        ()=>{


            try{

                fs.unlinkSync(
                    filePath
                );

            }

            catch(e){}


        },


        event.messageID


    );




}

catch(err){


    console.log(
        "SAY ERROR:",
        err
    );


    return api.sendMessage(

        "❌ Text to speech failed.",

        event.threadID,

        event.messageID

    );


}



};