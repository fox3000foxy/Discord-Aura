const express = require('express')
const { Client, Intents, MessageAttachment, Collection } = require('discord.js');
// const emojify = require("discord-emojify");
const cors = require('cors')
const client = new Client();
const app = express()
const http = require('http');
const fs = require('fs');
const server = http.createServer(app);
const port = process.env.PORT || 3000
const { Server } = require("socket.io");
var bodyParser = require('body-parser')
const io = new Server(server);
app.use(cors())
client.once('ready', () => {
	console.log('Ready!');
	server.listen(port, () => {
		console.log(`Example app listening at http://localhost:${port}`)
	})
});

//Vous voulez savoir votre rang, faire une commande d'un bot, c'est ici :)
//Merci de ne pas taper la discut ici :smile: !
client.on('message',(msg)=>{
		if (msg.mentions.has(client.user)) {
		 if(msg.member.hasPermission("ADMINISTRATOR")){
			// console.log(msg.channel.topic)
			if(msg.content.indexOf(" get")!=-1) msg.channel.send(`L'id de votre guild est: ${msg.guild.id}.`);
			if(msg.content.indexOf(" nitro")!=-1) msg.channel.send(`https://discord-aura.herokuapp.com/nitro`);
			else if(msg.content.indexOf(" help")!=-1) msg.channel.send(`
				Pingez moi avec une de ces commandes pour les exécuter:
• **get**: Permet d'obtenir l'ID du serveur.
• **nitro**: Permet d'obtenir l'extension nitro. Cliquez sur le lien original de l'image qui va être envoyé.

Vous pouvez aussi rajouter un \\🚫 dans le nom, la catégorie ou la description de chaque salon que vous voulez cacher.
			`);
		 }
		else {msg.channel.send(`Vous n'êtes pas administrateur de votre guilde.`);}
      }
	sendChannelMessages({id:msg.channel.id,limit:100})
})
client.on('messageDelete', function(msg){sendChannelMessages({id:msg.channel.id,limit:100})});
client.on('messageUpdate', function(msg){sendChannelMessages({id:msg.channel.id,limit:100})});
process.on('uncaughtException', (err, origin) => {
	console.log(err,origin)
});

function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }
  );
}

async function sendChannelMessages(msg) {
	var emojisList = []
	// if(client.channels.cache.get(msg.id)!=undefined)
	var guilds = client.guilds.cache.map(g => g.id)
	var guildsInvites = []
	await guilds.forEach(async (id)=>{
		guild = client.guilds.cache.get(id)
		guild.fetchInvites().then((result)=>{guildsInvites.push(result)})
	})
	var topicChannel = client.channels.cache.get(msg.id).topic
	// console.log("Topic:",topicChannel)
	var inviteGuild = client.channels.cache.get(msg.id).guild.fetchInvites()
	client.channels.cache.get(msg.id).guild.emojis.cache.forEach((emoji)=>{
		emojisList.push({
			regex:"<:"+emoji.name+":"+emoji.id+">",
			replacement:emoji.url
		})
	})
	client.channels.cache.get(msg.id).messages.fetch({ limit: parseInt(msg.limit) })
		.then(async msgs => {
		  var fetchedArray = []
		  msgList = [...msgs].reverse()
		  if(msgList.length == 0) {
			io.emit('channelMessages',{messageArray:fetchedArray,channelId:msg.id,topic:topicChannel})
			return;
		  }
		  msgList.forEach(async (msgElem,i)=>{
					var msg = msgElem[1]
					var color = "#ffffff"
					var name = msg.author.username
				  if(msg.attachments.first() != undefined) var attachment = {
					name:msg.attachments.first().name,
					url:msg.attachments.first().url
				  }
				  var formattedMsg = msg.content
				  arrayOfMentions = [...msg.mentions.users]
				  arrayOfMentions.forEach((user,i)=>{
					  if(formattedMsg.split("<@!"+user[0]+">").length>0)
					  formattedMsg = formattedMsg.split("<@!"+user[0]+">").join(`<mention onclick="document.whForm.content.value += '${"<@!"+user[0]+">"}'">@${msg.mentions.users.get(user[0]).username}</mention>`)
					  if(formattedMsg.split("<@"+user[0]+">").length>0)
					  formattedMsg = formattedMsg.split("<@"+user[0]+">").join(`<mention onclick="document.whForm.content.value += '${"<@!"+user[0]+">"}'">@${msg.mentions.users.get(user[0]).username}</mention>`)
				  })
				  await msg.guild.members.fetch()
				  .then(r=>{
					  membersArray = [...r]
					  membersArray.forEach((member)=>{
						  if(member[1].user.id == msg.author.id){
							color = member[1].displayHexColor
							if(member[1].nickname != null)
							name = member[1].nickname
						  }
					  })
				  })
				  .catch(console.error);
				  var inviteLink ;
				  if(formattedMsg.indexOf("https://discord.gg/")!=-1){inviteLink = {name: "Serveur inconnu",iconUrl: "unknown.png",id:null,state: false}}
					guildsInvites.forEach((invites)=>{
							invites.forEach((invite)=>{
								if(formattedMsg.indexOf("https://discord.gg/"+invite.code)!=-1){
									inviteLink = {
										name: invite.guild.name,
										iconUrl: invite.guild.iconURL(),
										id:invite.guild.id,
										state: true
									}
								}
							})
					})
					var embed = null
					if(msg.embeds.length!=0)
					embed = {
						author:msg.embeds[0].author.name,
						avatar:msg.embeds[0].author.iconURL,
						message:msg.embeds[0].description,
						color:msg.embeds[0].color
					}
					var reference = null
			
						// if(msg.reference!=null)
						// reference = await msg.channel.messages.fetch(msg.reference.messageID).then(async (message)=>{
							// var repColor = "#ffffff";
/* 							await msg.guild.members.fetch(message.author.id).then((member)=>{
								repColor = member.displayHexColor
							}) */
							// var ref = {
								// author: message.author.username,
								// avatar: message.author.displayAvatarURL(),
								// color: repColor,
								// message: message.content
							// }
							// return ref;
						// })
					await fetchedArray.push({		  
					  author:name,
					  timestamp: msg.createdTimestamp,
					  avatar:msg.author.displayAvatarURL(),
					  id : msg.author.id,
					  messageId: msg.id,
					  bot: (msg.author.bot && msg.webhookID==null),
					  attachment: attachment || '',
					  content: formattedMsg,
					  color:color,
					  editedTimestamp: msg.editedTimestamp,
					  invite:inviteLink,
					  embed,
					  reply:msg.reference!=null?msg.reference.messageID:null
				   })
				   // console.log(msg.embeds)
			   if(i==msgList.length-1){
				// console.log(msg.channel.topic)
				 await io.emit('channelMessages',{messageArray:fetchedArray,channelId:msg.channel.id,topic:topicChannel,emojisList})
			   } 
		  })
		}).catch((e)=>{
			console.log(e)
			io.emit('channelMessages',{error:e})
		});
  }

io.on('connection', (socket) => {
  // console.log('a user connected');
  socket.on('channelMessages', sendChannelMessages);
	socket.on('server', (msgs)=>{
		var serverObjectArray = []
		msgs.forEach((msg)=>{
			var server = client.guilds.cache.get(msg)
			var serverObject = {
				name: server.name,
				iconUrl: server.iconURL(),
				id: server.id
			};
			serverObjectArray.push(serverObject)
		})
		io.emit("server",serverObjectArray)
	});
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
			if(
				channel.name.indexOf("🚫")==-1 &&
				(channel.parent == null || channel.parent.name.indexOf("🚫")==-1) &&
				(channel.topic == null || channel.topic.indexOf("🚫")==-1)
			)
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
		content: msg.content.split("@everyone").join("everyone").split("@here").join("here"),
		username: msg.username || 'Aura User',
		avatarURL: msg.avatar || 'https://discord-aura.herokuapp.com/default.png',
		allowed_mentions: {
			"parse": ["users"]
		}
	}).then(()=>{
		io.emit('wh',{message:'sended hook !'})
	}).catch(e=>{
		io.emit('wh',{error : e})
	});
  });
  socket.on('memberList', async (msg) => {
	  var memberListArray = []
	  guildList = [...client.guilds.cache]
	  await guildList.forEach(async (guild)=>{
		  if(guild[0]==msg.id){
				var members = guild[1].members.cache
				  membersArray = [...members]
				  membersArray.forEach((member)=>{
					  var member = member[1]
					  var activities = member.presence.activities
					  var activity;
					  if(activities.length!=0){
						  activity = activities[0]
						  var type = "";
						  var name;
						  // console.log(activity)
						  if(activity.type!='CUSTOM_STATUS') {
							type = "<b>"+toTitleCase(activity.type.split("ING")[0]) + "</b> "
							name = activity.name
						  }
						  else {
							  name = activity.state
						  }
					  }
					memberListArray.push({
						username: member.user.username,
						id: member.user.id,
						avatarURL: member.user.displayAvatarURL(),
						status:member.presence.status,
						activity: type+name || null,
						color: member.displayHexColor,
						role: member.roles.cache.first().name,
					})
				  })
			  }
	  })
	  io.emit("memberList",{id:msg.id,membersArray:memberListArray.sort(function(a, b){
		if(a.username < b.username) { return -1}
		if(a.username> b.username) { return 1 }
		return 0
	}).sort(function(a, b){
		if(a.color < b.color) { return -1}
		if(a.color> b.color) { return 1 }
		return 0
	})})
  });
  socket.on('disconnect', () => {});
});
app.get('/', (req, res) => {res.sendFile(__dirname+'/webhook.html')})
app.get('/bot.png', (req, res) => {res.sendFile(__dirname+'/bot.png')})
app.get('/invite', (req, res) => {res.redirect('https://discord.com/api/oauth2/authorize?client_id=894822773321510932&permissions=517007068226&scope=bot')})
app.get('/nitro', (req, res) => {
	if(req.headers["user-agent"] == "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)")
		res.sendFile(__dirname+'/nitro.png')
	else
		res.redirect("https://discord.gg/mj2g86cub4")
	})
app.get('/emojiSend', async (req, res) => {
	const channel = client.channels.cache.get(req.query.channelId);
	let webhooks = await channel.fetchWebhooks();
	// console.log([...webhooks].length)
	if([...webhooks].length == 0) {	
		await channel.createWebhook('MessageFetcherWebhook', {})
		webhooks = await channel.fetchWebhooks();
	}
	const webhook = webhooks.first();
	await webhook.send({
		content: req.query.emojiUrl,
		username: req.query.name,
		avatarURL: req.query.avatarUrl,
		allowed_mentions: {
			"parse": ["users"]
		}
	}).then(()=>{
		// res.send(JSON.stringify(req.query))
		res.send('<script>window.close()</script>')
	}).catch(e=>{
		res.send(e)
	})
})
app.use(bodyParser.json());
app.post('/upload', async function (req, res) {
	buffer = req.body.file
	arrayBuffer = Uint8Array.from(buffer.split(","))
	response = {message:'ok'}
	const attachment = new MessageAttachment(Buffer.from(arrayBuffer), req.body.fileName)
	console.log("Sender:",req.body.sender)
	var sender = "Un utilisateur d'aura";
	if(req.body.sender!='')
		sender = req.body.sender
	client.channels.cache.get(req.body.channel).send(('**'+sender+'** a envoye une piece jointe:'),attachment)
	// console.log(response)
	res.send(response);
});
app.use(express.static('./assets'))
// Login to Discord with your client's token
client.login("ODk0ODIyNzczMzIxNTEwOTMy."+"YVvmpg.puEmuZ-F8KZ9hOfjnM45LG8T0qw")