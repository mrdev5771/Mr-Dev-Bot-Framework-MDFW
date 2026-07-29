/**
 * commands/fun/hug.js
 *
 * Mr Dev Framework v2
 *
 * Features:
 * - hug @user
 * - hug (random member)
 * - custom image URL
 * - Discord mention support
 * - nickname support
 * - stable mention handling
 */

const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");


const TEMP_DIR =
    path.join(__dirname, "..", "cache", "hug_simple");


const DEFAULT_IMAGE =
    "https://i.postimg.cc/9Xq0YKXG/hug.png";



const CAPTIONS = [

    "🤗 {A} hugged {B} warmly!",
    "🫂 {A} gave {B} a big hug!",
    "💞 {A} hugged {B} — cozy vibes!",
    "😊 {A} wrapped {B} in a loving hug!",
    "🥰 {A} and {B} shared a sweet hug!",
    "💖 {A} sent a warm hug to {B}!",
    "🌈 {A} hugged {B} with good vibes!",
    "✨ Comfort hug delivered from {A} to {B}!",
    "🧸 {A} gave {B} a teddy bear level hug!",
    "🔥 Legendary hug combo: {A} + {B}!",
    "🎁 {A} gifted {B} a wholesome hug!"

];



const RANDOM_CAPTIONS = [

    "😮 Surprise hug! {A} attacked {B} with kindness!",
    "😂 {A} suddenly hugged {B}!",
    "🚀 Hug mission successful: {A} -> {B}",
    "💥 Unexpected cuddle from {A} to {B}!",
    "🎉 Random hug event activated by {A}!",
    "🫂 {A} couldn't resist hugging {B}!"

];





module.exports.config = {

    name: "hug",
    version: "3.1.0",
    hasPermssion: 0,
    credits: "Mr Dev",
    description: "Send a hug image",
    usePrefix: true,
    commandCategory: "fun",
    usages: "hug @user",
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
        Math.floor(
            Math.random() * arr.length
        )
    ];

}





// Better Discord mention resolver
async function getMentionUser(event, client){


    try{


        const message =
            event.message;



        // Normal Discord mention

        if(
            message?.mentions?.users?.size
        ){

            return message
                .mentions
                .users
                .first();

        }





        // Raw mention fallback

        const match =
            event.body?.match(
                /<@!?(\d+)>/
            );



        if(match){


            try{


                return await client.users.fetch(
                    match[1]
                );


            }
            catch{

                return {
                    id: match[1]
                };

            }


        }



    }
    catch(err){

        console.log(
            "[hug mention error]",
            err
        );

    }



    return null;

}





async function getMemberName(guild,id){


    try{


        if(!guild)
            return id;



        const member =
            await guild.members.fetch(id);



        return (

            member.nickname ||

            member.user.globalName ||

            member.user.username

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

            `hug-${Date.now()}.jpg`

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





function buildCaption(a,b,isRandom){


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
    args,
    client

}){


try{


    const sender =
        event.author;



    if(!sender)
        return;




    let target =
        await getMentionUser(
            event,
            client
        );



    let randomTarget =
        false;





    // Random member fallback

    if(!target){


        try{


            let members =
                event.guild.members.cache;



            if(!members.size){

                members =
                    await event.guild.members.fetch();

            }



            const available =

                [...members.values()]

                .filter(

                    m =>

                    m.id !== sender.id &&

                    !m.user.bot

                );





            if(available.length){



                const picked =

                    available[

                        Math.floor(

                            Math.random()
                            *
                            available.length

                        )

                    ];



                target =
                    picked.user;



                randomTarget =
                    true;


            }



        }
        catch(err){


            console.log(
                "[hug random error]",
                err
            );


        }


    }





    if(!target){


        return api.sendMessage(

            "🤗 Please mention someone to hug.",

            event.threadID

        );

    }






    const senderName =

        await getMemberName(

            event.guild,

            sender.id

        );




    const targetName =

        await getMemberName(

            event.guild,

            target.id

        );







    let image =
        DEFAULT_IMAGE;



    const customImage =

        args.find(

            x => isURL(x)

        );



    if(customImage)

        image = customImage;







    const file =

        await downloadImage(image);






    const text =

        buildCaption(

            senderName,

            targetName,

            randomTarget

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

catch(err){


    console.error(

        "[hug error]",

        err

    );



    return api.sendMessage(

        "❌ Hug command failed.",

        event.threadID

    );


}



};