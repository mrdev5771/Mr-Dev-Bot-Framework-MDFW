// const cooldown = require("../../utils/cooldown");
// const Context = require("../../core/structures/Context");

// module.exports = {

//     name: "messageCreate",

//     async execute(message, client) {

//         if (message.author.bot) return;

//         // ===========================
//         // Messenger handleReply
//         // ===========================

//         // ==============================
// // Messenger handleEvent Support
// // ==============================

// const EventManager = require("../../core/managers/EventManager");

// for (const command of EventManager.getAll()) {

//     try {

//       const Users = require("../../core/services/Users");

// await command.handleEvent({

//     api: require("../../src/api")(message),

//     Users,

//     event: {

//         threadID: message.channel.id,
//         messageID: message.id,
//         senderID: message.author.id,
//         body: message.content,
//         author: message.author,
//         channel: message.channel,
//         guild: message.guild,
//         member: message.member

//     },

//     client

// });

//     } catch (err) {

//         console.error(
//             `[handleEvent] ${command.name}`,
//             err
//         );

//     }

// }
//         // ===========================
//         // Prefix Commands
//         // ===========================

//         const prefix = client.config.prefix;

//         if (!message.content.startsWith(prefix))
//             return;

//         const args = message.content
//             .slice(prefix.length)
//             .trim()
//             .split(/\s+/);

//         const commandName = args.shift().toLowerCase();

//         const command = client.commands.get(commandName);

//         if (!command)
//             return;

//         const cd = cooldown(
//             message.author.id,
//             command.name,
//             command.cooldown || 3
//         );

//         if (cd)
//             return message.reply(
//                 `⏳ Wait ${cd}s`
//             );

//         const ctx = new Context(
//             client,
//             message,
//             args,
//             command
//         );

//         try {

//             if (command.config) {

//                 return await command.run({

//                     api: ctx.api,

//                     event: ctx.event,

//                     args,

//                     client

//                 });

//             }

//             return await command.run(ctx);

//         }

//         catch (err) {

//             console.error(err);

//             ctx.reply("❌ Command crashed.");

//         }

//     }

// };


// ----------------------------------------------------------------------------------

const cooldown = require("../../utils/cooldown");
const Context = require("../../core/structures/Context");
const EventManager = require("../../core/managers/EventManager");

module.exports = {

    name: "messageCreate",

    async execute(message, client) {

        if (message.author.bot)
            return;


        const api = require("../../src/api")(message);


        // ===========================
        // Handle Reply System
        // ===========================

        if (
            global.client.handleReply &&
            global.client.handleReply.length > 0
        ) {


            const replyData =
                global.client.handleReply.find(
                    r =>
                        r.author == message.author.id &&
                        r.type == "reply"
                );


            if (replyData) {


                const command =
                    client.commands.get(
                        replyData.name
                    );


                if (
                    command &&
                    command.handleReply
                ) {


                    try {


                        return await command.handleReply({

                            api,

                           event: {
    threadID: message.channel.id,
    messageID: message.id,
    senderID: message.author.id,
    body: message.content,
    author: message.author,
    channel: message.channel,
    guild: message.guild,
    member: message.member,
    message: message
},


                            handleReply:
                                replyData,


                            client

                        });


                    }

                    catch(err){

                        console.error(
                            "[handleReply Error]",
                            err
                        );


                    }


                }


            }


        }





        // ===========================
        // Handle Event System
        // ===========================


        for (
            const command of EventManager.getAll()
        ) {


            if(
                typeof command.handleEvent !== "function"
            )
                continue;



            try {


                const Users =
                    require("../../core/services/Users");



                await command.handleEvent({

                    api,


                    Users,


                    event: {


                        threadID:
                            message.channel.id,


                        messageID:
                            message.id,


                        senderID:
                            message.author.id,


                        body:
                            message.content,


                        author:
                            message.author,


                        channel:
                            message.channel,


                        guild:
                            message.guild,


                        member:
                            message.member


                    },


                    client


                });



            }


            catch(err){


                console.error(

                    `[handleEvent] ${command.name}`,

                    err

                );


            }


        }





        // ===========================
        // Prefix Commands
        // ===========================


        const prefix =
            client.config.prefix;


        if(
            !message.content.startsWith(prefix)
        )
            return;




        const args =
            message.content
            .slice(prefix.length)
            .trim()
            .split(/\s+/);



        const commandName =
            args.shift()
            .toLowerCase();



        const command =
            client.commands.get(
                commandName
            );



        if(!command)
            return;




        const cd =
            cooldown(

                message.author.id,

                command.name,

                command.cooldown || 3

            );



        if(cd){


            return message.reply(
                `⏳ Please wait ${cd}s`
            );


        }





        const ctx =
            new Context(

                client,

                message,

                args,

                command

            );





        try {



            if(command.config){


                return await command.run({

                    api:
                        ctx.api,


                    event:
                        ctx.event,


                    args,


                    client


                });


            }




            return await command.run(ctx);



        }


        catch(err){


            console.error(
                "[Command Error]",
                err
            );


            ctx.reply(
                "❌ Command crashed."
            );


        }


    }


};