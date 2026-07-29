const fs = require("fs-extra");
const Youtube = require("youtube-search-api");
const axios = require("axios");
const { exec } = require("child_process");
const path = require("path");


const config = {

    name: "video",
    version: "2.1.0",
    hasPermssion: 0,
    credits: "MrDeveloper",
    description: "Download YouTube videos",
    usePrefix: true,
    commandCategory: "video",
    usages: "[video name]",
    cooldowns: 0

};



// ==========================
// DOWNLOAD VIDEO USING YT-DLP
// ==========================

function downloadVideoFromYoutube(link, outputPath) {

    return new Promise((resolve) => {


        const timestart = Date.now();


        const ytDlp =
            path.join(
                process.cwd(),
                "yt-dlp.exe"
            );


        const ffmpeg =
            path.join(
                process.cwd(),
                "ffmpeg.exe"
            );



        const command =

            `"${ytDlp}" ` +

            `-f "best[ext=mp4][filesize<25M]/best[ext=mp4]" ` +

            `--ffmpeg-location "${ffmpeg}" ` +

            `-o "${outputPath}" ` +

            `"${link}"`;



        console.log(command);



        exec(
            command,

            {
                maxBuffer:
                1024 * 1024 * 100
            },


            (error, stdout, stderr) => {



                if(error){

                    console.log(
                        "YT ERROR:",
                        stderr
                    );


                    return resolve(null);

                }



                resolve({

                    data: outputPath,

                    info:{
                        timestart
                    }

                });



            }


        );



    });


}






// ==========================
// HANDLE REPLY SELECTION
// ==========================

const handleReply = async ({
    api,
    event,
    handleReply
}) => {


try {



    /*
        IMPORTANT:

        If user types words,
        ignore this reply.

        This allows:
        !video new song

        while old menu exists.
    */


    if(
        !/^\d+$/.test(
            event.body.trim()
        )
    ){

        return;

    }




    const index =
        Number(event.body.trim()) - 1;




    if(
        index < 0 ||
        index >= handleReply.link.length
    ){


        return api.sendMessage(

            "❌ Invalid selection.",

            event.threadID,

            event.messageID

        );


    }




    // Remove used reply

    global.client.handleReply =

        global.client.handleReply.filter(

            item =>
            item.messageID !== handleReply.messageID

        );





    const videoURL =

        "https://youtube.com/watch?v="

        +

        handleReply.link[index];





    const videoPath =

        path.join(

            __dirname,

            "cache",

            `video-${event.senderID}.mp4`

        );





    const result =

        await downloadVideoFromYoutube(

            videoURL,

            videoPath

        );





    if(!result){


        return api.sendMessage(

            "❌ Video download failed.",

            event.threadID,

            event.messageID

        );


    }





    if(

        !fs.existsSync(videoPath)

    ){


        return api.sendMessage(

            "❌ Video file missing.",

            event.threadID,

            event.messageID

        );


    }





    if(

        fs.statSync(videoPath).size

        >

        26214400

    ){


        fs.unlinkSync(videoPath);



        return api.sendMessage(

            "⚠️ Video is larger than 25MB.",

            event.threadID,

            event.messageID

        );


    }





    api.unsendMessage(

        handleReply.messageID

    );





    return api.sendMessage(

        {

            body:

            `🎬 Video Ready\n` +

            `⚡ Processing: ` +

            `${Math.floor(

                (Date.now()

                -

                result.info.timestart)

                /1000

            )} seconds`,


            attachment:

            fs.createReadStream(

                videoPath

            )

        },


        event.threadID,


        ()=>{


            try{

                fs.unlinkSync(
                    videoPath
                );

            }

            catch(e){}



        },


        event.messageID


    );





}

catch(err){


    console.log(
        "HANDLE REPLY ERROR:",
        err
    );


    api.sendMessage(

        "❌ Error processing video.",

        event.threadID,

        event.messageID

    );


}



};









// ==========================
// MAIN COMMAND
// ==========================

const run = async ({
    api,
    event,
    args
}) => {



if(!args.length){


    return api.sendMessage(

        "❌ Enter video name.",

        event.threadID,

        event.messageID

    );


}




const keyword =
    args.join(" ");







// ==========================
// DIRECT LINK
// ==========================

if(
    args[0].startsWith("http")
){


try{


const output =

path.join(

    __dirname,

    "cache",

    `video-${event.senderID}.mp4`

);




const result =

await downloadVideoFromYoutube(

    args[0],

    output

);




if(!result){


return api.sendMessage(

"❌ Download failed.",

event.threadID,

event.messageID

);


}




return api.sendMessage(

{

body:
"🎬 Video Downloaded",

attachment:

fs.createReadStream(output)

},


event.threadID,


()=>{


try{

fs.unlinkSync(output);

}

catch(e){}



},


event.messageID


);



}

catch(err){


console.log(err);


return api.sendMessage(

"❌ Direct download error.",

event.threadID,

event.messageID

);


}


}









// ==========================
// SEARCH SYSTEM
// ==========================

try{


const data =

(

await Youtube.GetListByKeyword(

keyword,

false,

6

)

)?.items || [];




if(!data.length){


return api.sendMessage(

"❌ No results found.",

event.threadID,

event.messageID

);


}





const links =

data.map(

item => item.id

);




const thumbnails=[];




for(
let i=0;
i<data.length;
i++
){



const url =

`https://i.ytimg.com/vi/${data[i].id}/hqdefault.jpg`;



const img =

path.join(

__dirname,

"cache",

`thumb-${event.senderID}-${i}.jpg`

);




const response =

await axios.get(

url,

{

responseType:"arraybuffer"

}

);



fs.writeFileSync(

img,

Buffer.from(response.data)

);



thumbnails.push(

fs.createReadStream(img)

);



}





const body =

`🎬 Results:\n\n`

+

data.map(

(item,index)=>

`${index+1}. ${item.title}\n⏱ ${item.length?.simpleText || "N/A"}`

)

.join("\n\n")

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