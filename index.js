const express = require("express");
const http = require("http");

//define websocket module
const WebSocket = require('ws')
//define discord.js module
const {Client, GatewayIntentBits, Partials, EmbedBuilder, ActivityType, ChannelType, Attachment} = require('discord.js');
const { channel } = require("diagnostics_channel");
//use .env file
require('dotenv').config();
//create express app instance
const app = express()
//create web server object
const server = http.createServer(app)

const client = new Client({ intents: 
    [GatewayIntentBits.Guilds,
     GatewayIntentBits.GuildVoiceStates,
     GatewayIntentBits.GuildMessages,
     GatewayIntentBits.GuildMessageReactions,
     GatewayIntentBits.GuildMembers, 
     GatewayIntentBits.GuildPresences], 
     partials: 
     [Partials.Channel, 
      Partials.Reaction,
      Partials.GuildMember,
      Partials.Channel,
      Partials.User] 
    });

      client.login(process.env.CLIENT_TOKEN);

const wss = new WebSocket.Server({server});

client.on("ready", async () => {
    //test code

console.log(client.user.username + " has logged in successfully")
console.log(`Login using this devices IP Address and port ${process.env.PORT}. \n Use '${process.env.TOKEN.toString()}' as the token to login in the app.`)
})
wss.on('connection', ws => {
   
    ws.on('message', async data => {
    if(data.toString() == process.env.TOKEN.toString()){
        ws.send("accepted")
        console.log("AUTH LOG: Token from client has been accepted")
    }else{
  //get the username for the bot
  console.log(`ACCESS LOG: ${data.toString()}`)
//send messages as bot
  if(data.toString().split(" ")[0] == process.env.TOKEN.toString()){
    const channelid = data.toString().split("channelid=")[1];
    const channel = client.channels.cache.get(channelid);
    channel.send(data.toString().split("send_message=")[1].split('channelid=')[0])
  }
//send the client username along with the amount of guilds the bot is in.
    if(data.toString().split(" ")[1] == process.env.TOKEN.toString()){
        if(data.toString().split(" ")[0] == "client_username"){
    ws.send(`bot_username ${client.user.username}`)
    ws.send(`guilds_size ${client.guilds.cache.size}`)
    }

        //get and send data about guilds the bot is in
    if(data.toString().split(" ")[0] == "guild_get"){
     client.guilds.cache.forEach(guild => {
 //console.log(`${guild.name.toString()} ${guild.memberCount}`);
     ws.send(`pfp ${client.user.avatarURL({dynamic: true, size: 256})}`)
     ws.send(`${guild.name.toString()}`);
     ws.send(`GuildIcon ${guild.iconURL({ dynamic: true })}`);
     ws.send(`MemberCount ${guild.memberCount}`);
     ws.send(`GuildID ${guild.id}`)
      })
    }
    //send the guild ids that the bot is in
if(data.toString().split(" ")[0] == "GuildID"){
    client.guilds.cache.forEach(guild => {
    ws.send(`GuildID ${guild.id}`);
    })
}
//send the channels of a specified guild
    if(data.toString().split("=")[0] == "channels_get"){
    guildid = data.toString().split("=")[1].split(" ")[0];
   ws.send(`channels_size ${client.guilds.cache.find(guild => guild.id == guildid).channels.cache.size}`)
    var channels = client.guilds.cache.find(guild => guild.id == guildid).channels.cache
    channels.forEach(channel2 => 
        {
            ws.send(`channel_name=${channel2.name}`)
            ws.send(`channel_id=${channel2.id}`)
        })
    }

    if(data.toString().split("=")[0] == "get_users"){
        selguild = data.toString().split('=')[1].split(" ")[0];
        console.log(client.guilds.cache.find(guild => guild.id == selguild).members.cache.size)
        client.guilds.cache.find(guild => guild.id == selguild).members.cache.forEach(User => {
            ws.send(`user_name_data ${User.user.username}`);
            ws.send(`user_pfp_data ${User.user.avatarURL({dynamic: true})}`);
          //  ws.send(User)
        })
    }

//get a list of messages of a channel and send it to the client
    if(data.toString().split("=")[0] == "get_messages_channel"){
        channelid = data.toString().split("=")[1].split(' ')[0]
        const channel = client.channels.cache.get(channelid);
        channel.messages.fetch({limit: 100}).then(messages => {
            ws.send(`channel_messages_size ${messages.size}`);
            //ws.send(messages)
            messages.forEach(message => {
                ws.send("user_pfp_data " +message.author.avatarURL({dynamic: true}));
                ws.send("user_name_data "+ message.author.username);
                if(message.content == ""){
                    ws.send(message.attachments.toString())
                }else{
                ws.send(message.content);
                }
            })
        })
    }
}else{
        ws.send("AUTH LOG: Token has been rejected")
        //console.log("The wrong token has been given")
}
    }
    })
})

server.listen(process.env.PORT, function () {
    console.log('Server running')})