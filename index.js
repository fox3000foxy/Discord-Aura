const express = require('express')
const { Client, Intents } = require('discord.js');
const cors = require('cors')
const client = new Client();
const app = express()
const port = process.env.PORT || 3000
app.use(cors())

client.once('ready', () => {
	console.log('Ready!');
	app.listen(port, () => {
		console.log(`Example app listening at http://localhost:${port}`)
	})
});
app.get('/', (req, res) => {
  res.redirect('webhook')
})
app.get('/webhook', (req, res) => {
  res.sendFile(__dirname+'/webhook.html')
})
app.get('/webhookSend', async (req, res) => {
  // console.log(req.query)
	const channel = client.channels.cache.get(req.query.channelId);
	let webhooks = await channel.fetchWebhooks();
	// console.log([...webhooks].length)
	if([...webhooks].length == 0) {	
		await channel.createWebhook('MessageFetcherWebhook', {})
		webhooks = await channel.fetchWebhooks();
	}
	const webhook = webhooks.first();
	await webhook.send({
		content: req.query.content,
		username: req.query.username,
		avatarURL: req.query.avatar_url
	}).then(()=>{
		res.send({message:'sended hook !'})
	}).catch(e=>{
		res.send({error : e})
	});
})

app.get('/serverChannels',(req,res)=>{
	var channelsToSend = []
	if(client.guilds.cache.get(req.query.id)==null) {
		res.send({message:"No guild with id "+req.query.id+" is connected with the bot"})
		return
	}
	var channels = client.guilds.cache.get(req.query.id).channels.cache
	var keys = Array.from(channels.keys())
	keys.forEach(key=>{
		channel = channels.get(key)
		// console.log(channel.type)
		if(channel.type=='text'){
			channelsToSend.push({
				name:channel.name,
				id:channel.id,
			})			
		}
	})
	res.send(channelsToSend.sort(function(a, b){
		if(a.name < b.name) { return -1; }
		if(a.name > b.name) { return 1; }
		return 0;
	}))
})
app.get('/channelMessages',async (req,res)=>{
	client.channels.cache.get(req.query.id).messages.fetch({ limit: parseInt(req.query.limit) })
    .then(async msgs => {
      var fetchedArray = []
	  msgList = [...msgs].reverse()
	  msgList.forEach(async (msgElem,i)=>{
		  var msg = msgElem[1]
			  if(msg.attachments.first() != undefined) var attachment = msg.attachments.first().url
			  await fetchedArray.push({		  
				  author:msg.author.username,
				  timestamp: msg.createdTimestamp,
				  avatar:msg.author.displayAvatarURL(),
				  id : msg.author.id,
				  attachment: attachment || '',
				  content:msg.content
			   })
		   if(i==msgList.length-1) await res.send(fetchedArray)
	  })
    });
})
app.get('/invite', (req, res) => {
  res.redirect('https://discord.com/api/oauth2/authorize?client_id=893025754760249397&permissions=0&scope=bot')
})
// Login to Discord with your client's token
client.login("ODkzMDI1NzU0NzYwMjQ5Mzk3."+"YVVdCw.Hmt_YlY2wNpJNgFqzov1ORg8iEQ")
