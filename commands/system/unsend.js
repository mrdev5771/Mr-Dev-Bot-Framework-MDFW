/**
 * commands/message/unsend.js
 *
 * Mr Dev Framework v2
 *
 * Delete bot messages by replying to them.
 *
 * Usage:
 * Reply to a bot message:
 * !unsend
 */


module.exports.config = {

    name: "unsend",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "Mr Dev",
    description: "Delete bot messages",
    usePrefix: true,
    commandCategory: "message",
    usages: "Reply to bot message then type unsend",
    cooldowns: 3

};



module.exports.run = async function({

    api,
    event,
    client

}) {


try {


    const message =
        event.message;



    if(!message){


        return api.sendMessage(

            "❌ Message data missing.",

            event.threadID

        );

    }




    /*
        Discord reply data
    */

    const replied =
        message.reference
        ?
        await message.channel.messages.fetch(
            message.reference.messageId
        )
        :
        null;



    if(!replied){


        return api.sendMessage(

            "❌ Reply to a bot message first.",

            event.threadID

        );

    }




    /*
        Check ownership
    */


    if(
        replied.author.id !==
        client.user.id
    ){


        return api.sendMessage(

            "❌ I can only delete my own messages.",

            event.threadID

        );

    }




    /*
        Delete message
    */


    await replied.delete();



    return;



}


catch(err){


    console.error(

        "[unsend error]",

        err

    );



    return api.sendMessage(

        "❌ I cannot delete that message.",

        event.threadID

    );


}



};