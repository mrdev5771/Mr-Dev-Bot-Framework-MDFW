/**
 * commands/fun/punch.js
 *
 * Mr Dev Framework v2 compatible
 *
 * Features:
 * - punch @user
 * - punch random member
 * - custom image URL
 * - nickname support
 * - Discord mention support
 * - random captions
 */


const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");



const TEMP_DIR =
    path.join(__dirname, "..", "cache", "punch_simple");



const DEFAULT_IMAGE =
    "https://i.postimg.cc/bv3r90X3/punch.png";



const CAPTIONS = [

    "👊 {A} gave {B} a playful punch!",
    "🥊 {A} punched {B} (friendly mode activated).",
    "😂 {A} landed a meme punch on {B}!",
    "⚡ Legendary punch from {A} to {B}!",
    "🎭 Dramatic punch scene: {A} vs {B}",
    "🔥 {A} delivered a powerful friendship punch to {B}!",
    "🎮 Critical hit! {A} punched {B}!",
    "😎 {A} challenged {B} with a punch!",
    "🏆 Punch of the day: {A} -> {B}",
    "💥 Surprise punch attack by {A} on {B}!"

];



const RANDOM_CAPTIONS = [

    "😲 Random punch event! {A} attacked {B}!",
    "😂 Nobody expected it! {A} punched {B}!",
    "⚡ Wild punch appeared: {A} -> {B}",
    "🎉 Random friendship punch from {A}!",
    "🥊 Surprise! {A} caught {B} sleeping!"

];



module.exports.config = {

    name: "punch",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "Mr Dev",
    description: "Send a playful punch image",
    usePrefix: true,
    commandCategory: "fun",
    usages: "punch @user",
    cooldowns: 5

};





// ===============================
// Helpers
// ===============================



async function ensureCache(){

    await fs.ensureDir(TEMP_DIR);

}




function isURL(text){

    return /^https?:\/\//i.test(text || "");

}





function random(arr){

    return arr[
        Math.floor(Math.random()*arr.length)
    ];

}





// Discord mention finder

function getMention(event){


    try{


        // Real Discord mention

        if(
            event.message &&
            event.message.mentions &&
            event.message.mentions.users &&
            event.message.mentions.users.size
        ){

            return event.message
                .mentions
                .users
                .first();

        }



        // Backup regex

        const match =
            event.body.match(
                /<@!?(\d+)>/
            );


        if(match){

            return {
                id: match[1]
            };

        }


    }
    catch(err){

        console.log(
            "[Punch Mention Error]",
            err
        );

    }


    return null;

}





async function getName(guild,id){


    try{


        if(!guild)
            return id;



        const member =
            await guild.members.fetch(id);



        return (

            member.nickname ||

            member.user.globalName ||

            member.user.username ||

            id

        );


    }
    catch{

        return id;

    }

}





async function downloadImage(url){


    await ensureCache();



    const file =
        path.join(
            TEMP_DIR,
            `punch-${Date.now()}.jpg`
        );



    const response =
        await axios.get(
            url,
            {
                responseType:"stream",
                timeout:20000
            }
        );



    return new Promise(
        (resolve,reject)=>{


            const stream =
                fs.createWriteStream(file);



            response.data.pipe(stream);



            stream.on(
                "finish",
                ()=>resolve(file)
            );



            stream.on(
                "error",
                reject
            );


        }
    );

}





function makeCaption(a,b,isRandom){


    const list =
        isRandom
        ?
        RANDOM_CAPTIONS
        :
        CAPTIONS;



    return random(list)
        .replace("{A}",a)
        .replace("{B}",b);


}








// ===============================
// Command
// ===============================



module.exports.run = async function({

    api,
    event,
    args

}){


try{


    const message =
        event.message;



    const sender =
        event.author;



    const guild =
        event.guild;



    if(!sender)
        return;



    let target =
        getMention(event);



    let randomMode = false;





    // ===============================
    // Random member fallback
    // ===============================


    if(!target){


        try{


            if(guild){


                const members =
                    await guild.members.fetch();



                const possible =
                    members.filter(

                        m =>

                        m.id !== sender.id &&

                        !m.user.bot

                    );



                if(possible.size){


                    target =
                        possible.random();



                    randomMode=true;


                }


            }


        }
        catch(err){


            console.log(
                "[Random Punch Error]",
                err
            );


        }


    }






    if(!target){


        return api.sendMessage(

            "👊 Please mention someone to punch.",

            event.threadID

        );


    }





    const senderName =
        await getName(
            guild,
            sender.id
        );



    const targetName =
        await getName(
            guild,
            target.id
        );





    let image =
        DEFAULT_IMAGE;



    const custom =
        args.find(
            x=>isURL(x)
        );



    if(custom)
        image=custom;





    const file =
        await downloadImage(image);





    const text =
        makeCaption(

            senderName,

            targetName,

            randomMode

        );







    await api.sendMessage(

        {

            body:text,


            attachment:
                fs.createReadStream(file),



            mentions:[

                {
                    id:String(sender.id),
                    tag:senderName
                },

                {
                    id:String(target.id),
                    tag:targetName
                }

            ]

        },


        event.threadID

    );







    setTimeout(()=>{


        fs.unlink(
            file,
            ()=>{}
        );


    },10000);




}
catch(err){


    console.error(
        "[Punch Error]",
        err
    );



    return api.sendMessage(

        "❌ Punch command failed.",

        event.threadID

    );


}


};