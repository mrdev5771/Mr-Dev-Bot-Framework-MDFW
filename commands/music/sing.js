const fs = require("fs-extra");
const Youtube = require("youtube-search-api");
const axios = require("axios");
const { exec } = require("child_process");
const path = require("path");


const config = {

    name: "sing",
    version: "3.0.2",
    hasPermssion: 0,
    credits: "MrDeveloper",
    description: "Search and download YouTube music",
    usePrefix: true,
    commandCategory: "music",
    usages: "[song name]",
    cooldowns: 0

};



const downloadMusicFromYoutube = (link, basePath) => {

    return new Promise((resolve) => {


        const timestart = Date.now();


        const output =
            `${basePath}.mp3`;


        const ytDlp =
            path.join(process.cwd(), "yt-dlp.exe");


        const ffmpeg =
            path.join(process.cwd(), "ffmpeg.exe");



        const command =
        `"${ytDlp}" -x --audio-format mp3 --audio-quality 0 --ffmpeg-location "${ffmpeg}" -o "${output}" "${link}"`;



        console.log(command);



        exec(

            command,

            {
                maxBuffer: 1024 * 1024 * 50
            },


            (error, stdout, stderr) => {


                if (error) {

                    console.log(
                        "yt-dlp error:",
                        error
                    );

                    console.log(stderr);

                    return resolve(null);

                }


                console.log(stdout);


                resolve({

                    data: output,

                    info: {

                        title:
                        "Downloaded Audio",

                        timestart

                    }

                });


            }

        );


    });

};





const handleReply = async ({
    api,
    event,
    handleReply
}) => {


    try {


        const index =
            parseInt(event.body) - 1;



        if (

            isNaN(index) ||

            index < 0 ||

            index >= handleReply.link.length

        ) {


            return api.sendMessage(

                "❌ Invalid selection.",

                event.threadID,

                event.messageID

            );


        }



        const basePath =
        path.join(

            __dirname,

            "cache",

            `audio-${event.senderID}`

        );



        await fs.ensureDir(
            path.dirname(basePath)
        );



        const result =
        await downloadMusicFromYoutube(

            "https://www.youtube.com/watch?v=" +
            handleReply.link[index],

            basePath

        );



        if(!result){

            return api.sendMessage(

                "❌ Download failed. Check yt-dlp/ffmpeg.",

                event.threadID,

                event.messageID

            );

        }



        if(!fs.existsSync(result.data)){


            return api.sendMessage(

                "❌ Audio file was not created.",

                event.threadID,

                event.messageID

            );


        }



        if(
            fs.statSync(result.data).size >
            26214400
        ){

            fs.unlinkSync(result.data);


            return api.sendMessage(

                "⚠️ File exceeds 25MB.",

                event.threadID,

                event.messageID

            );

        }



        api.sendMessage(

        {

            body:

            `🎵 Music Ready\n\n` +

            `⚡ Processing: ` +

            `${Math.floor(

                (Date.now() -

                result.info.timestart)

                /1000

            )}s`,



            attachment:

            fs.createReadStream(result.data)

        },


        event.threadID,


        () => {


            try{

                fs.unlinkSync(
                    result.data
                );

            }
            catch(e){}



        },


        event.messageID


        );



    }

    catch(err){


        console.log(
            "handleReply error:",
            err
        );


        api.sendMessage(

            "❌ Reply processing failed.",

            event.threadID,

            event.messageID

        );


    }


};






const run = async ({
    api,
    event,
    args
}) => {



    if(!args.length){

        return api.sendMessage(

            "❌ Enter a song name.",

            event.threadID,

            event.messageID

        );

    }




    const keyword =
    args.join(" ");



    try {



        const data =

        (

            await Youtube.GetListByKeyword(

                keyword,

                false,

                5

            )

        ).items;



        if(!data.length){

            return api.sendMessage(

                "❌ No results found.",

                event.threadID,

                event.messageID

            );

        }



        const links =
        data.map(
            x => x.id
        );



        const thumbnails = [];



        for(let i = 0; i < data.length; i++){


            const url =
            `https://i.ytimg.com/vi/${data[i].id}/hqdefault.jpg`;



            const imgPath =
            path.join(

                __dirname,

                "cache",

                `thumb-${event.senderID}-${i}.jpg`

            );



            const response =
            await axios.get(

                url,

                {
                    responseType:
                    "arraybuffer"
                }

            );



            await fs.writeFile(

                imgPath,

                Buffer.from(response.data)

            );



            thumbnails.push(

                fs.createReadStream(
                    imgPath
                )

            );


        }





        const body =

        `🎧 Results for:\n${keyword}\n\n`

        +

        data.map(

            (x,i)=>

            `${i+1}. ${x.title}\n⏱ ${x.length?.simpleText || "Unknown"}`

        ).join("\n\n")

        +

        "\n\nReply with number";





        api.sendMessage(

        {

            body,

            attachment: thumbnails

        },


        event.threadID,


        (error,info)=>{


            global.client.handleReply =
            global.client.handleReply || [];



            global.client.handleReply.push({

                type:"reply",

                name:config.name,

                messageID:
                info.messageID,

                author:
                event.senderID,

                link:links

            });



        },


        event.messageID


        );




    }

    catch(err){


        console.log(
            "Search error:",
            err
        );


        api.sendMessage(

            "❌ Search failed.",

            event.threadID,

            event.messageID

        );


    }



};





module.exports = {

    config,

    run,

    handleReply

};