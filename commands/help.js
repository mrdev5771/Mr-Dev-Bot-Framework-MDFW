/**
 * commands/system/help.js
 *
 * Mr Dev Framework v2 compatible
 *
 * Features:
 * - <help
 * - <help command
 * - <help page
 * - Category grouping
 * - Duplicate command protection
 * - Safe message sending
 */


module.exports.config = {

    name: "help",

    version: "2.0.0",

    hasPermssion: 0,

    credits: "Mr Dev",

    description:
        "Shows bot commands list.",

    commandCategory:
        "system",

    usages:
        "[page|command]",

    cooldowns: 1,

    usePrefix:true

};





// ===============================
// Safe Send
// ===============================


async function safeSend(
    api,
    payload,
    threadID
){


    try{


        const result =
            api.sendMessage(
                payload,
                threadID
            );


        if(
            result &&
            typeof result.then === "function"
        ){

            return await result;

        }


    }
    catch(e){



        console.warn(
            "[help] Promise send failed:",
            e.message
        );


    }



    return new Promise(
        (resolve,reject)=>{


            api.sendMessage(

                payload,

                threadID,

                (err,info)=>{


                    if(err)
                        reject(err);

                    else
                        resolve(info);


                }

            );


        }
    );


}





// ===============================
// Prefix Resolver
// ===============================


function getPrefix(){


    try{


        if(global.config){


            return (

                global.config.prefix ||

                global.config.PREFIX ||

                "<"

            );


        }


    }
    catch(e){}



    return "<";


}





// ===============================
// Command Loader
// ===============================


function getCommands(){


    try{


        if(
            global.client &&
            global.client.commands
        ){

            return global.client.commands;

        }



        if(global.commands)
            return global.commands;



    }
    catch(e){}



    return new Map();


}





// ===============================
// Command
// ===============================


module.exports.run = async function({

    api,

    event,

    args


}){


const threadID =
    event.threadID;



try{


    const commandsMap =
        getCommands();



    if(!commandsMap.size){


        return safeSend(

            api,

            "⚠️ No commands loaded.",

            threadID

        );


    }



    /*
        Remove duplicate commands
    */


    const allCommands = [

        ...new Map(

            Array.from(
                commandsMap.values()
            )
            .filter(Boolean)
            .map(cmd=>[

                cmd.config?.name,

                cmd

            ])

        ).values()

    ];





    /*
        Specific command info
    */


    if(
        args &&
        args[0] &&
        !/^\d+$/.test(args[0])
    ){


        const query =
            args[0]
            .toLowerCase();



        const command =
            commandsMap.get(query);



        if(!command){


            return safeSend(

                api,

                `❌ Command "${query}" not found.`,

                threadID

            );


        }




        const prefix =
            getPrefix();



        const usage =
            command.config?.usages

            ?

            `${prefix}${command.config.name} ${command.config.usages}`

            :

            `${prefix}${command.config.name}`;




        const info = `

╭━━━〔 Command Info 〕━━━╮

🔹 Name:
${command.config.name}


📂 Category:
${command.config.commandCategory || "Other"}


⚙ Usage:
${usage}


📝 Description:
${command.config.description || "No description"}

╰━━━━━━━━━━━━━━━━━━━━╯

`;



        return safeSend(

            api,

            info,

            threadID

        );


    }





    /*
        Group commands
    */


    const categories = {};



    for(
        const cmd of allCommands
    ){


        const config =
            cmd.config || {};



        const category =
            config.commandCategory ||
            "Other";



        if(
            !categories[category]
        )
            categories[category]=[];



        categories[category]
        .push(
            config.name
        );


    }





    const lines=[];



    Object.keys(categories)

    .sort()

    .forEach(category=>{


        lines.push(
            `📁 ${category}`
        );


        lines.push(

            categories[category]

            .sort()

            .join(", ")

        );


    });





    /*
        Pagination
    */


    const perPage =
        12;



    const totalPages =
        Math.max(

            1,

            Math.ceil(
                lines.length /
                perPage
            )

        );



    let page = 1;



    if(
        args[0] &&
        /^\d+$/.test(args[0])
    ){


        page =
            Math.min(

                totalPages,

                Math.max(
                    1,
                    Number(args[0])
                )

            );


    }




    const start =
        (page-1)
        *
        perPage;



    const content =
        lines.slice(

            start,

            start+perPage

        );





    const botName =

        global.config?.botName ||

        global.config?.BOTNAME ||

        "Mr Dev";





    let output = `

⚡ ${botName}

📚 Commands:
${allCommands.length}

📄 Page:
${page}/${totalPages}


`;



    output +=
        content.join("\n\n");



    output += `


Use:
${getPrefix()}help <command>

`;




    return safeSend(

        api,

        output,

        threadID

    );



}
catch(error){



    console.error(

        "[HELP ERROR]",

        error

    );



    return safeSend(

        api,

        "❌ Help command failed.",

        threadID

    );


}



};