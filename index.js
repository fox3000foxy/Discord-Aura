const express = require('express')
const { Client, Intents } = require('discord.js');
const cors = require('cors')
const client = new Client();
const app = express()
const http = require('http');
const server = http.createServer(app);
const port = process.env.PORT || 3000
const { Server } = require("socket.io");
const io = new Server(server);
app.use(cors())

client.once('ready', () => {
	console.log('Ready!');
	server.listen(port, () => {
		console.log(`Example app listening at http://localhost:${port}`)
	})
});

client.on('message',(msg)=>{sendChannelMessages({id:msg.channel.id,limit:100})})
client.on('messageDelete', function(msg){sendChannelMessages({id:msg.channel.id,limit:100})});
client.on('messageUpdate', function(msg){sendChannelMessages({id:msg.channel.id,limit:100})});

function sendChannelMessages(msg) {
	client.channels.cache.get(msg.id).messages.fetch({ limit: parseInt(msg.limit) })
		.then(async msgs => {
		  var fetchedArray = []
		  msgList = [...msgs].reverse()
		  msgList.forEach(async (msgElem,i)=>{
			  var msg = msgElem[1]
				  if(msg.attachments.first() != undefined) var attachment = msg.attachments.first().url
				  formattedMsg = msg.content
				  arrayOfMentions = [...msg.mentions.users]
				  arrayOfMentions.forEach((user,i)=>{
					  if(formattedMsg.split("<@!"+user[0]+">").length>0)
					  formattedMsg = formattedMsg.split("<@!"+user[0]+">").join(`<mention onclick="document.whForm.content.value += '${"<@!"+user[0]+">"}'">@${msg.mentions.users.get(user[0]).username}</mention>`)
					  if(formattedMsg.split("<@"+user[0]+">").length>0)
					  formattedMsg = formattedMsg.split("<@"+user[0]+">").join(`<mention onclick="document.whForm.content.value += '${"<@!"+user[0]+">"}'">@${msg.mentions.users.get(user[0]).username}</mention>`)
				  })
				  // memberColor = ""
				  // msg.guild.members.fetch(msg.author.id).then(async member => {
						// memberColor = member.displayHexColor
						  // console.log(memberColor)
						// if (memberColor == "#000000") memberColor = "#ffffff"
				  await fetchedArray.push({		  
					  author:msg.author.username,
					  timestamp: msg.createdTimestamp,
					  avatar:msg.author.displayAvatarURL(),
					  // color: memberColor,
					  id : msg.author.id,
					  messageId: msg.id,
					  bot: (msg.author.bot && msg.webhookID==null),
					  attachment: attachment || '',
					  content: formattedMsg,
					  editedTimestamp: msg.editedTimestamp,
				   })
			   if(i==msgList.length-1){
				 await io.emit('channelMessages',{messageArray:fetchedArray,channelId:msg.channel.id})
				 // console.log(msg.mentions.users)
			   } 
				  // })
		  })
		});
  }

io.on('connection', (socket) => {
  // console.log('a user connected');
  socket.on('channelMessages', sendChannelMessages);
  socket.on('serverChannels', (msg) => {
	var channelsToSend = []
	if(client.guilds.cache.get(msg.id)==null) {
		io.emit('serverChannels',{message:"No guild with id "+msg.id+" is connected with the bot"})
		return
	}
	var channels = client.guilds.cache.get(msg.id).channels.cache
	var keys = Array.from(channels.keys())
	keys.forEach(key=>{
		channel = channels.get(key)
		// console.log(channel.parent)
		if(channel.type=='text'){
			channelsToSend.push({
				name:(channel.parent!=null?channel.parent.name + ": \t":"")+channel.name,
				id:channel.id,
			})			
		}
	})
	var sortedArray = channelsToSend.sort(function(a, b){
		if(a.name < b.name) { return -1; }
		if(a.name > b.name) { return 1; }
		return 0;
	})
	// console.log(sortedArray)
	io.emit('serverChannels',{sortedArray,guildId:msg.id})
  });
  socket.on('wh', async (msg) => {
	// console.log(req.query)
	const channel = client.channels.cache.get(msg.channelId);
	let webhooks = await channel.fetchWebhooks();
	// console.log([...webhooks].length)
	if([...webhooks].length == 0) {	
		await channel.createWebhook('MessageFetcherWebhook', {})
		webhooks = await channel.fetchWebhooks();
	}
	const webhook = webhooks.first();
	await webhook.send({
		content: msg.content,
		username: msg.username,
		avatarURL: msg.avatar
	}).then(()=>{
		io.emit('wh',{message:'sended hook !'})
	}).catch(e=>{
		io.emit('wh',{error : e})
	});
  });
  socket.on('disconnect', () => {});
});

app.get('/', (req, res) => {res.sendFile(__dirname+'/webhook.html')})
app.get('/bot.png', (req, res) => {res.sendFile(__dirname+'/bot.png')})
app.get('/invite', (req, res) => {res.redirect('https://discord.com/api/oauth2/authorize?client_id=893025754760249397&permissions=8&scope=bot')})
// Login to Discord with your client's token
client.login("ODkzMDI1NzU0NzYwMjQ5Mzk3."+"YVVdCw.Hmt_YlY2wNpJNgFqzov1ORg8iEQ")
