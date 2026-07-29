const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");


const TEMP_DIR = path.join(__dirname, "cache", "slap");
const FETCH_TIMEOUT = 20000;
const MIN_IMAGE_BYTES = 1024;


const DEFAULT_IMAGES = [
    "https://i.postimg.cc/WbyhmVg6/slap.jpg"
];


const CAPTIONS = [
    "🤜 {A} slapped {B} (friendly fire 😆)",
    "👋 {A} gave {B} a legendary slap!",
    "😂 {A} just reminded {B} who is boss!",
    "⚡ {A} delivered a powerful slap to {B}",
    "🎭 Drama scene: {A} slapped {B}",
    "🔥 Critical hit! {A} slapped {B}",
    "😈 {A} unlocked slap mode against {B}",
    "🤣 {A} bonked {B} with maximum comedy power",
    "💥 {A} vs {B}: slap battle started!",
];


module.exports.config = {

    name: "slap",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "MrDeveloper",
    description: "Slap someone with an image",
    usePrefix: true,
    commandCategory: "fun",
    usages: "slap @user",
    cooldowns: 5

};



async function ensureCache(){

    await fs.ensureDir(TEMP_DIR);

}



function isUrl(text){

    return typeof text === "string" &&
    /^https?:\/\//i.test(text);

}



function getMention(event){


    // Discord mention support

    try{


        if(
            event.message &&
            event.message.mentions &&
            event.message.mentions.users
        ){

            const user =
            event.message.mentions.users.first();


            if(user)
                return user.id;

        }


    }catch(e){}



    // fallback old style

    if(event.mentions){

        const keys =
        Object.keys(event.mentions);


        if(keys.length)
            return keys[0];

    }



    return null;

}





async function getName(event,id){


    try{


        if(
            event.message &&
            event.message.mentions
        ){

            const user =
            event.message.mentions.users.get(id);


            if(user)
                return user.username;

        }


    }catch(e){}



    return "User";

}





async function downloadImage(url){


    await ensureCache();


    const file =
    path.join(
        TEMP_DIR,
        `slap_${Date.now()}.jpg`
    );



    const response =
    await axios.get(
        url,
        {
            responseType:"stream",
            timeout:FETCH_TIMEOUT
        }
    );



    return new Promise((resolve,reject)=>{


        const writer =
        fs.createWriteStream(file);


        response.data.pipe(writer);



        writer.on(
            "finish",
            async()=>{


                const stat =
                await fs.stat(file);



                if(stat.size < MIN_IMAGE_BYTES){

                    await fs.remove(file);

                    return reject(
                        new Error("Image too small")
                    );

                }


                resolve(file);


            }
        );


        writer.on(
            "error",
            reject
        );


    });



}





function randomImage(){

    return DEFAULT_IMAGES[
        Math.floor(
            Math.random()*DEFAULT_IMAGES.length
        )
    ];

}





function randomCaption(A,B){

    let text =
    CAPTIONS[
        Math.floor(
            Math.random()*CAPTIONS.length
        )
    ];


    return text
    .replace(
        "{A}",
        A
    )
    .replace(
        "{B}",
        B
    );

}





module.exports.run = async function({
    api,
    event,
    args
}){


try{


    const sender =
    event.senderID;



    const target =
    getMention(event);



    if(!target){


        return api.sendMessage(

            "🤜 Please mention someone to slap.",

            event.threadID,

            event.messageID

        );

    }





    const senderName =
    event.author?.username ||
    "Someone";



    const targetName =
    await getName(
        event,
        target
    );





    const imageArg =
    args.find(isUrl);



    const imageUrl =
    imageArg || randomImage();




    const imagePath =
    await downloadImage(
        imageUrl
    );





    const caption =


    `<@${sender}> <@${target}>\n\n` +

    randomCaption(
        senderName,
        targetName
    );






    api.sendMessage(

        {

            body:caption,

            attachment:
            fs.createReadStream(
                imagePath
            )

        },


        event.threadID,


        ()=>{


            fs.remove(
                imagePath
            ).catch(()=>{});


        },


        event.messageID


    );



}

catch(err){


    console.log(
        "SLAP ERROR:",
        err
    );


    api.sendMessage(

        "❌ Failed to slap.",

        event.threadID,

        event.messageID

    );


}



};