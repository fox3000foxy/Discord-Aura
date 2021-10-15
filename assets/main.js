var socket = io();
if(localStorage.serverList == undefined) localStorage.setItem('serverList',"[]")
serverIdValue = location.href.indexOf('?id=')!=-1?location.href.split('?id=')[1]:localStorage.getItem("serverId")
first = true;
changing = 1;
selectChannel = document.getElementById("channelNames")
messageContainer = document.getElementById("messageContainer")
serverListElem = document.getElementById("serverList")
serverId = document.getElementById("serverId")
askForServerChannels= function(serverId){socket.emit('serverChannels',{id:serverId})}
askChannels = function (){socket.emit('channelMessages',{id:selectChannel.value,limit:100})}
document.whForm.username.value = localStorage.getItem("username")
document.whForm.avatar_url.value = localStorage.getItem("avatar_url")
document.getElementById('image').src=localStorage.getItem("avatar_url")
serverId.value = serverIdValue
askForServerChannels(localStorage.getItem("serverId"),true)
autoscroll = document.getElementById("autoscroll")
avatarChange = 1
serverAsked = 0
autoscrollBool = true
serverList = {}

socket.emit("server",JSON.parse(localStorage.getItem("serverList")))
socket.on("server",(servers)=>{
	if(serverAsked==1) return
	serverListElem.innerHTML = ""
	if(servers.length!=0) {
		servers.forEach((server)=>{
			var alt = server.name.match(/\b(\w)/g).join('')
			serverListElem.innerHTML += `
				<img onclick="
					serverId.value = '${server.id}'
					localStorage.setItem('serverId',serverId.value);
					localStorage.setItem('serverName',unescape('${server.name.replaceAll("'","%27")}'));
					changing = 1;
					askForServerChannels(serverId.value);
					document.getElementById('serverName').innerHTML = '<b>${server.name.replaceAll("'","&amp;#39;")}</b>';
					askMemberList()
				" class="serverIcon" ${server.iconUrl!=null?'src="'+server.iconUrl+'"':''} title="${alt}">
			`
			serverList[server.id] = server
		})
	}
	serverListElem.innerHTML += `
		<img onclick="
			promptBox('Add a Server','Type a server ID','Server ID','Confirm','Cancel',(result)=>{
				if(result != null && result !=''){
					serverListJSON = JSON.parse(localStorage.getItem('serverList'))
					if(serverListJSON.indexOf(result)==-1)
						serverListJSON.push(result)
					localStorage.setItem('serverList',JSON.stringify(serverListJSON))
					serverAsked=0;
					socket.emit('server',JSON.parse(localStorage.getItem('serverList')))
				}
			})
		" class="serverIcon" src="add.png">
	`
	serverAsked = 1
	if(localStorage.getItem("serverName"))
		document.getElementById("serverName").innerHTML = '<b>'+localStorage.getItem("serverName")+'</b>';
})

function statusColor(status){
	if(status=="online") return "lime"
	if(status=="idle") return "yellow"
	if(status=="dnd") return "red"
	if(status=="offline") return "gray"
}

function askMemberList(){
	socket.emit("memberList",{id:serverId.value})
	socket.on("memberList",(members)=>{
		if(members.id == serverId.value)
		document.getElementById("serverMembers").innerHTML = ""
		members.membersArray.forEach((member)=>{
			document.getElementById("serverMembers").innerHTML += createMessageObject(member.username,member.avatarURL,member.color=="#000000"?"white":member.color,'',member.id,member.activity||'<br>',null,true,'','',statusColor(member.status))
			// `
				// <div>
					// <img src="${member.avatarURL}" style="width:40px;height:40px;border-radius:50%;border: 2px solid green">
					// ${member.username}
				// </div><br>
			// `
		})
	})
}
askMemberList()
oldUser = null
socket.on('serverChannels', function(msg) {
	if(msg.message || changing==0) return
	changing = 0
	category = []
	actualCategory = ''
	if(msg.guildId==serverId.value) {
		selectChannel.innerHTML = ''
		msg.sortedArray.forEach(channel=>{
			if(channel.name.indexOf(": ")!=-1) 
			{ 
				if(actualCategory != channel.name.split(": ")[0]){
					actualCategory = channel.name.split(": ")[0]
					selectChannel.innerHTML += '</optgroup>'
					selectChannel.innerHTML += '<optgroup label="'+actualCategory.toUpperCase()+'">'
				}
				channel.name = channel.name.split(": ")[1]
				//category[channel.name.split(": ")[0]][channel.name] = channel.id
			}
			selectChannel.innerHTML += '<option value="'+channel.id+'">'+channel.name+'</option>'
		})
		setTimeout(()=>{
			if(first==true){
				first = false;
				selectChannel.selectedIndex = parseInt(localStorage.getItem("selectedChannel"))
				document.getElementById("channelName").innerHTML = "<b style='color:gray'># </b>"+selectChannel.selectedOptions[0].innerText
			}
			askChannels()
		},1000)
	}
});

askMemberList()
function addZero(number){
	return ('0' + number).slice(-2)
}

messages = []

socket.on('channelMessages', async function(data) {
	avatarChange = 1
	if(
		selectChannel.value == "" || 
		selectChannel.value != data.channelId
	) return
	messageContainer.innerHTML = ''
	if(data.error){
		console.error(data.error);
		return
	}
	if(location.href.indexOf("limit=")!=-1){
		limit = parseInt(location.href.split("limit=")[1])
		if(limit > 100)
			limit=100
	}
	else limit = 100
	data.messageArray = data.messageArray.reverse().slice(0,limit).reverse()
	if(data.topic==null) document.getElementById('channelTopic').innerHTML = ""
	else document.getElementById('channelTopic').innerHTML = data.topic
	await data.messageArray.forEach( (msg,counter)=>{
		messages[msg.messageId.toString()] = msg
		var message = msg.content
			.replaceAll("<","&lt")
			.replaceAll(">","&gt")
			.replaceAll("&ltmention","<mention")
			.replaceAll("&gt@",">@")
			.replaceAll("&lt/mention&gt","</mention>")
		message = sd.render(message)
		for (i=0;i<Object.keys(listOfEmoji).length;i++)
		{
			key = Object.keys(listOfEmoji)[i]
			if(message.indexOf(":"+key+":")!=-1)
				message = message.split(":"+key+":").join("<span style='font-size:18px'>&#x"+listOfEmoji[key].split("U+")[1]+";</span>")
		}
		var assets = '',newMessage = '',edited = '', bot = ''
		// if(msg.attachment) assets = ` <a href="${msg.attachment}" target="_blank">Voir les pièces jointes</a>`
		if(msg.attachment) assets = createAttachment(msg.attachment.name,msg.attachment.url)
		if(
			assets.indexOf("href")!=-1 && (
				assets.indexOf(".png")!=-1 ||
				assets.indexOf(".jpg")!=-1 ||
				assets.indexOf(".jpeg")!=-1 ||
				assets.indexOf(".gif")!=-1 ||
				assets.indexOf(".bmp")!=-1 ||
				assets.indexOf(".webp")!=-1 
			)
		)	
		{
			var link = assets.split('href="')[1].split('"')[0]
			assets = '<img src="'+link+'" class="imageAsset">'
		}
		if(msg.editedTimestamp!="0") edited = 'modified '
		if(msg.bot==true) bot = '\t<img src="bot.png">'
		var timestamp = msg.timestamp
		var date = new Date(timestamp);
		var now = new Date();
		if(date.getDate() == now.getDate() && date.getMonth() == now.getMonth() && date.getFullYear() == now.getFullYear()) days = 'Aujourd’hui'
		else if(date.getDate() == now.getDate()-1 && date.getMonth() == now.getMonth() && date.getFullYear() == now.getFullYear()) days = 'Hier'
		else days = (addZero(date.getDate())+
		  "/"+addZero((date.getMonth()+1))+
		  "/"+addZero(date.getFullYear()))
		var formattedDate = (
			days+" à "+addZero(date.getHours())+
		  ":"+addZero(date.getMinutes())
		 )
		if(oldUser!=msg.author) avatarChange=1
		if(msg.reply!=null) avatarChange=1
		oldUser = msg.author
		// messageContainer.innerHTML += createMessageObject(msg.author,msg.avatar,msg.color=="#000000"?"white":msg.color,formattedDate,msg.id,linkify(message) + assets,msg.messageId,!!avatarChange,bot,edited,null,msg.invite,data.emojisList,data.reply)
		var reply = msg.reply!=null?(Object.keys(messages).indexOf(msg.reply)?messages[msg.reply]:false):null
		messageContainer.innerHTML += createMessageObject(msg.author,msg.avatar,msg.color=="#000000"?"white":msg.color,formattedDate,msg.id,linkify(message) + assets,msg.messageId,!!avatarChange,bot,edited,null,msg.invite,data.emojisList,reply)
		if(msg.embed!=null)
		messageContainer.innerHTML += createEmbed(msg.embed.author,msg.embed.avatar,msg.embed.message,msg.embed.color?'#'+msg.embed.color.toString(16):'white')
		avatarChange=0
		messageContainer.scrollTop = messageContainer.scrollHeight * 300
  })
});
socket.on('wh', function(data) {
	if(data.error) alert("Error:\n"+data.error.message)
});
function linkify(inputText) {
    var replacedText, replacePattern1, replacePattern2, replacePattern3;
    replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
    replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');
	if(
		replacedText.indexOf("href")!=-1 && (
			replacedText.indexOf(".png")!=-1 ||
			replacedText.indexOf(".jpg")!=-1 ||
			replacedText.indexOf(".jpeg")!=-1 ||
			replacedText.indexOf(".gif")!=-1 ||
			replacedText.indexOf(".bmp")!=-1 ||
			replacedText.indexOf(".webp")!=-1
		)
	)
	{
		var link = replacedText.split('href="')[1].split('"')[0]
		if(link==inputText)
			replacedText = '<img src="'+link+'" class="imageAsset">'
		else
			replacedText += '<br><img src="'+link+'" class="imageAsset">'
	}
    //replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
    //replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');
    return replacedText;
}
socket.emit('serverChannels',{id:serverIdValue})
function createMessageObject(name,image,color,date,id,message,messageId=null,avatarWrapper=true,bot='',edited='',status=null,invite=null,emojisList=null,reply=null){
	// console.log(invite)
	// console.log(emojisList)
	// if(emojisList)
	if(emojisList!=null)
	emojisList.forEach((emoji)=>{
		// console.log(message,emoji.regex)
		emojiExpression = emoji.regex.replaceAll("<","&lt").replaceAll(">","&gt")
		size = (message == emojiExpression) ? 48 : 22
		message = message.replaceAll(emojiExpression,'<img src="'+emoji.replacement+'?size='+size+'">') 
	})
		// message = message.replace(/(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/gi,"<span style='font-family:PriceDown'>$1</span>")
		var avatarWrapperHTML = `
		<h2 class="header-23xsNx" aria-describedby="reply-context-894947665257824319" aria-labelledby="message-username-894947665257824319 message-timestamp-894947665257824319">
			<img src="${image}" aria-hidden="true" class="avatar-1BDn8e clickable-1bVtEA" alt=" " onclick="document.whForm.content.value+='<@${id}>'" style="
				border: 3px solid ${status||'transparent'};
			">
			<span style="padding-left: ${status==null?'8':'16'}px" id="message-username-894947665257824319" class="headerText-3Uvj1Y"><span class="username-1A8OIy desaturateUserColors-1gar-1 clickable-1bVtEA" aria-controls="popout_623" aria-expanded="false" role="button" tabindex="0" style="color: ${color};">${name}</span></span>${bot}<span class="timestamp-3ZCmNB timestampInline-yHQ6fX"><time aria-label="Aujourd’hui à 16:02" id="message-timestamp-894947665257824319" datetime="2021-10-05T14:02:30.721Z"><i class="separator-2nZzUB" aria-hidden="true"> — </i><span style='color:gray;font-size:12px'>${date}</span></time></span>
		</h2>
	`
	if(reply!=false && reply!=null){
	// console.log(reply.author,reply.avatar,sd.render(reply.content),reply.color)
	replyText = createReply(reply.author,reply.avatar,sd.render(reply.content),reply.color)
	}
	// else if (reply==false)
	// replyText = createReply(false,false,"Le message n'a pas pu être chargé",false)
	return `
		<div class="contents-2mQqc9">
			${reply!=null?"<br>"+replyText:''}
			${avatarWrapper?avatarWrapperHTML:""}
			<div id="${messageId}" class="markup-2BOw-j messageContent-2qWWxC" style="
				  white-space: ${status==null?'normal':'nowrap'};
				  overflow: hidden;
				  text-overflow: ellipsis;
				  width: ${status==null?'80':'60'}%;
				  padding-left: ${status==null?'8':'16'}px
				">
				<div class="${edited}">${message}</div>
				${invite!=null?createInviteObject(invite):''}
			</div>
		</div>
	`
}

function createInviteObject(invite){
	stateMessage = invite.state?"Rejoindre":"Inviter Aura"
	functionsForState = invite.state?(
		`
		serverListJSON = JSON.parse(localStorage.getItem('serverList'))
		if(serverListJSON.indexOf('${invite.id}')==-1)
			serverListJSON.push('${invite.id}')
		localStorage.setItem('serverList',JSON.stringify(serverListJSON))
		serverAsked=0;
		socket.emit('server',JSON.parse(localStorage.getItem('serverList')))
		`
	):(
		`
		window.open('invite','_blank')
		`
	)
	return `
		<div class="wrapper-35wsBm userSelectNone-Iy6XEP cursorDefault-331ZcI">
		   <h5 class="colorStandard-2KCXvj size14-e6ZScH h5-18_1nd title-3sZWYQ header-2BTCnc">Tu as été invité(e) à rejoindre un serveur</h5>
		   <div class="content-2U5lSY">
			  <div class="icon-3o6xvg guildIconImage-3qTk45 guildIcon-lQ0uiM iconSizeLarge-161qtT iconActiveLarge-2nzn9z" tabindex="0" role="button" style="background-image: url(&quot;${invite.iconUrl}&quot;);"></div>
			  <div class="flex-1xMQg5 flex-1O1GKY vertical-V37hAW flex-1O1GKY directionColumn-35P_nr justifyCenter-3D2jYp alignStretch-DpGPf3 noWrap-3jynv6 guildInfo-1STtYi" style="flex: 1 1 auto;">
				 <div class="" role="button" tabindex="0">
					<h3 class="inviteDestinationJoined-3W7Gue inviteDestination-1fAcY7 fontDisplay-1dagSA base-1x0h_U size16-1P40sf">
					   <div class="guildNameWrapper-1RQYer"><span class="guildName-2hvnt_">${invite.name}</span></div>
					</h3>
				 </div>
			  </div>
			  <button type="button" class="button-3To2tQ height20-mO2eIN button-38aScr lookFilled-1Gx00P colorGreen-29iAKY buttonSize-DbrWhv grow-q77ONN"
			  onclick="${functionsForState}">
				 <div class="contents-18-Yxp">${stateMessage}</div>
			  </button>
		   </div>
		</div>
	`
}

function createAttachment(name,url){
	return `
		<div id="message-accessories-897719792818090014" class="container-1ov-mD">
		   <div class="messageAttachment-1aDidq">
			  <div class="attachment-33OFj0 horizontal-2EEEnY flex-1O1GKY directionRow-3v3tfG alignCenter-1dQNNs embedWrapper-lXpS3L">
				 <img class="icon-1kp3fr" src="7b3a37fa249a857b0ff136db0a73f44c.svg" alt="Type de fichier joint&nbsp;: unknown" title="unknown">
				 <div class="attachmentInner-3vEpKt">
					<div class="filenameLinkWrapper-1-14c5"><a class="anchor-3Z-8Bb anchorUnderlineOnHover-2ESHQB fileNameLink-9GuxCo" href="${url}" rel="noreferrer noopener" target="_blank">${name}</a></div>
					<div class="metadata-3WGS0M size12-3R0845 height16-2Lv3qA"></div>
				 </div>
				 <a class="anchor-3Z-8Bb anchorUnderlineOnHover-2ESHQB downloadWrapper-vhAtLx" href="${url}" rel="noreferrer noopener" target="_blank">
					<svg class="downloadButton-23tKQp" aria-hidden="false" width="24" height="24" viewBox="0 0 24 24">
					   <path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M16.293 9.293L17.707 10.707L12 16.414L6.29297 10.707L7.70697 9.293L11 12.586V2H13V12.586L16.293 9.293ZM18 20V18H20V20C20 21.102 19.104 22 18 22H6C4.896 22 4 21.102 4 20V18H6V20H18Z"></path>
					</svg>
				 </a>
			  </div>
		   </div>
		</div>
	`
}
function createEmbed(name,url,message,color) {
	return `
	<div style="
				white-space: normal;
				overflow: hidden;
				text-overflow: ellipsis;
				width:80%;
				padding-left: 68px;
	">
		<div class="embedWrapper-lXpS3L embedFull-2tM8-- embed-IeVjo6 markup-2BOw-j" aria-hidden="false" style="border-color: ${color};">
		   <div class="grid-1nZz7S">
			  <div class="embedSuppressButton-1FonMn" aria-label="Supprimer toutes les intégrations" role="button" tabindex="0">
				 <svg aria-hidden="false" width="16" height="16" viewBox="0 0 24 24">
					<path fill="currentColor" d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z"></path>
				 </svg>
			  </div>
			  <div class="embedAuthor-3l5luH embedMargin-UO5XwE"><img alt="" class="embedAuthorIcon--1zR3L" src="${url}"><span class="embedAuthorName-3mnTWj">${name}</span></div>
			  <div class="embedDescription-1Cuq9a embedMargin-UO5XwE">${message}</div>
		   </div>
		</div>
	</div>
	`
}

function createReply(name,url,message,color) {
	// if(url != false)
		imgText = `
			<img alt="" src="${url}?size=16" class="replyAvatar-1K9Wmr clickable-1bVtEA">
	   `
	  // else imgText=''
	  // console.log(imgText)
	return `
	<div id="message-reply-context-898168989962887198" class="repliedMessage-VokQwo" aria-label="Fox3000 répond à Fox3000" style="margin-left:72px;margin-bottom:-6px">
		${imgText}
		<span class="desaturateUserColors-1gar-1 clickable-1bVtEA" aria-controls="popout_2734" aria-expanded="false" role="button" tabindex="0" style="color: ${color};">${name!=false?name:''}</span>
	   <div class="repliedTextPreview-2NBljf clickable-1bVtEA" role="button" tabindex="0"><span class="repliedTextContent-1R3vnK markup-2BOw-j" style="margin-left:5px">${message}</span></div>
	</div>
	`
	   // <svg class="repliedTextContentIcon-1ivTae" aria-hidden="false" width="24" height="24" viewBox="0 0 24 24">
		  // <path fill-rule="evenodd" clip-rule="evenodd" d="M6 2C3.79086 2 2 3.79086 2 6V18C2 20.2091 3.79086 22 6 22H18C20.2091 22 22 20.2091 22 18V6C22 3.79086 20.2091 2 18 2H6ZM10 8C10 6.8952 9.1032 6 8 6C6.8944 6 6 6.8952 6 8C6 9.1056 6.8944 10 8 10C9.1032 10 10 9.1056 10 8ZM9 14L6 18H18L15 11L11 16L9 14Z" fill="currentColor"></path>
	   // </svg>
}

function Slimdown() {
  // Rules
  this.rules =  [
    {regex: /(\*\*)(.*?)\1/g, replacement: '<strong>$2</strong>'},
    {regex: /(_)(.*?!\s)(_)\1/g, replacement: '<u>$2</u>'},
    {regex: /(\*)(.*?!\s)(\*)\1/g, replacement: '<u>$2</u>'},
    {regex: /(\~\~)(.*?)(\~\~)/g, replacement: '<del>$2</del>'},
    {regex: /^`{3}([\S]+)?\n([\s\S]+)\n`{3}/g, replacement: `<code class="scrollbarGhostHairline-1mSOM1 scrollbar-3dvm_9 hljs">$2</code>`},
	{regex: /^`{3}([\S]+)?\s([\s\S]+)`{3}/g, replacement: `<code class="scrollbarGhostHairline-1mSOM1 scrollbar-3dvm_9 hljs">$2</code>`},
    {regex: /`(.*?)`/g, replacement: '<code class="inline">$1</code>'},                            
  ];
  // Add a rule.
  this.addRule = function (regex, replacement) {regex.global = true;regex.multiline = false;this.rules.push({regex: regex, replacement: replacement});};
  // Render some Markdown into HTML.
  this.render = function (text) {this.rules.forEach(function (rule) {text = text.replace(rule.regex, rule.replacement);});return text.trim();};
  function para (text, line) {debugger;var trimmed = line.trim();if (/^<\/?(ul|ol|li|h|p|bl)/i.test(trimmed)) {return '\n' + line + '\n';}return '\n<p>' + trimmed + '</p>\n';}
  function ulList (text, item) {return '\n<ul>\n\t<li>' + item.trim() + '</li>\n</ul>';}
  function olList (text, item) {return '\n<ol>\n\t<li>' + item.trim() + '</li>\n</ol>';}
  function blockquote (text, tmp, item) {return '\n<blockquote>' + item.trim() + '</blockquote>';}
  function header (text, chars, content) {var level = chars.length;return '<h' + level + '>' + content.trim() + '</h' + level + '>';}
}

var sd = new Slimdown();

messageContainer.onclick = (e)=>{document.whForm.content.focus()}
document.getElementById('serverMembers').onclick = (e)=>{document.whForm.content.focus()}