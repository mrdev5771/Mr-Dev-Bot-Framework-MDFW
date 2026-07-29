const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");


const TEMP_DIR = path.join(__dirname, "cache", "kiss");


const DEFAULT_IMAGES = [
    "https://i.postimg.cc/yNwzNc8q/Kurano-kunchi-no-Futago-Jijou-600-1402111.jpg"
];


const CAPTIONS = [
    "💋 {A} planted a kiss on {B}!",
    "😍 {A} kissed {B} — love is in the air!",
    "😚 {A} gave {B} a sweet kiss!",
    "💕 Kiss alert: {A} ❤️ {B}",
    "🥰 {A} and {B} shared a cute moment!",
    "💖 {A} sent a lovely kiss to {B}",
];


module.exports.config = {

    name:"kiss",
    version:"3.0.0",
    hasPermssion:0,
    credits:"MrDeveloper",
    description:"Send kiss image with mention",
    usePrefix:true,
    commandCategory:"fun",
    usages:"kiss @user",
    cooldowns:5

};





async function ensureCache(){

    await fs.ensureDir(TEMP_DIR);

}





function isUrl(text){

    return typeof text === "string" &&
    /^https?:\/\//i.test(text);

}





function getMention(event){


    // Discord mention system

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




    // fallback

    if(event.mentions){

        const id =
        Object.keys(event.mentions)[0];

        if(id)
            return id;

    }



    return null;

}





async function getUsername(event,id){


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



    return "Friend";

}





async function downloadImage(url){


    await ensureCache();


    const file =
    path.join(
        TEMP_DIR,
        `kiss_${Date.now()}.jpg`
    );



    const response =
    await axios.get(
        url,
        {
            responseType:"stream",
            timeout:20000
        }
    );



    return new Promise((resolve,reject)=>{


        const writer =
        fs.createWriteStream(file);


        response.data.pipe(writer);



        writer.on(
            "finish",
            ()=>resolve(file)
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


    const senderId =
    event.senderID;



    const targetId =
    getMention(event);



    if(!targetId){


        return api.sendMessage(

            "💋 Please mention someone to kiss.",

            event.threadID,

            event.messageID

        );


    }





    const senderName =
    event.author?.username ||
    "Someone";



    const targetName =
    await getUsername(
        event,
        targetId
    );





    const customImage =
    args.find(isUrl);



    const image =
    customImage ||
    randomImage();





    const file =
    await downloadImage(
        image
    );





    const caption =

    `<@${senderId}> 💋 <@${targetId}>\n\n` +

    randomCaption(
        senderName,
        targetName
    );







    api.sendMessage(

        {

            body:caption,

            attachment:
            fs.createReadStream(file)

        },


        event.threadID,


        ()=>{

            fs.remove(file)
            .catch(()=>{});

        },


        event.messageID

    );



}


catch(err){


    console.log(
        "KISS ERROR:",
        err
    );


    api.sendMessage(

        "❌ Kiss command failed.",

        event.threadID,

        event.messageID

    );


}



};