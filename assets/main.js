var socket = io();
if(localStorage.serverList == undefined)
	localStorage.setItem('serverList',"[]")
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
function autoScrollUpdate(){
	if(messageContainer.scrollHeight - messageContainer.scrollTop == messageContainer.offsetHeight) 
	{autoscroll.checked = true}else {autoscroll.checked = false}
}

serverList = {}

socket.emit("server",JSON.parse(localStorage.getItem("serverList")))
socket.on("server",(servers)=>{
	if(serverAsked==1) return
	if(servers.length!=0) {
		servers.forEach((server)=>{
			<!-- console.log(server) -->
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
					serverId.value = parseInt(result);
					askForServerChannels(serverId.value);
					localStorage.setItem('serverId',parseInt(result));
					serverListJSON = JSON.parse(localStorage.getItem('serverList'))
					if(serverListJSON.indexOf(result)==-1)
						serverListJSON.push(result)
					localStorage.setItem('serverList',JSON.stringify(serverListJSON))
					location.reload()
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
		document.getElementById("serverMembers").innerHTML = ""
		members.forEach((member)=>{
			document.getElementById("serverMembers").innerHTML += createMessageObject(member.username,member.avatarURL,member.color,'',member.id,member.activity||'<br>',null,true,'','',statusColor(member.status))
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

setInterval(()=>{
  	if(autoscroll.checked==true)
		messageContainer.scrollTop = 100000
})

setInterval(()=>{
  	askMemberList()
},5000)

function addZero(number){
	return ('0' + number).slice(-2)
}

socket.on('channelMessages', function(data) {
	avatarChange = 1
	if(
		selectChannel.value == "" || 
		selectChannel.value != data.channelId
	) return
	messageContainer.innerHTML = ''
	data.messageArray.forEach(msg=>{
		var message = msg.content
			.replaceAll("<","&lt")
			.replaceAll(">","&gt")
			.replaceAll("&ltmention","<mention")
			.replaceAll("&gt@",">@")
			.replaceAll("&lt/mention&gt","</mention>")
		var assets = '',newMessage = '',edited = '', bot = ''
		if(msg.attachment) assets = ` <a href="${msg.attachment}" target="_blank">Voir les pièces jointes</a>`
		if(
			assets.indexOf("href")!=-1 && (
				assets.indexOf(".png")!=-1 ||
				assets.indexOf(".jpg")!=-1 ||
				assets.indexOf(".jpeg")!=-1 ||
				assets.indexOf(".gif")!=-1 ||
				assets.indexOf(".bmp")!=-1
			)
		)	
		{
			var link = assets.split('href="')[1].split('"')[0]
			assets = '<br><img src="'+link+'" class="imageAsset">'
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
		oldUser = msg.author
		messageContainer.innerHTML += createMessageObject(msg.author,msg.avatar,msg.color,formattedDate,msg.id,linkify(message) + assets,msg.messageId,!!avatarChange,bot,edited)
		avatarChange=0
  })
  	if(autoscroll.checked==false)
		messageContainer.scrollTop -= messageContainer.children[messageContainer.children.length - 1].offsetHeight + 22

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
			replacedText.indexOf(".bmp")!=-1
		)
	)
	{
		var link = replacedText.split('href="')[1].split('"')[0]
		replacedText += '<br><img src="'+link+'" class="imageAsset">'
	}
    //replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
    //replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');
    return replacedText;
}
socket.emit('serverChannels',{id:serverIdValue})
function createMessageObject(name,image,color,date,id,message,messageId=null,avatarWrapper=true,bot='',edited='',status=null){
	var avatarWrapperHTML = `
		<h2 class="header-23xsNx" aria-describedby="reply-context-894947665257824319" aria-labelledby="message-username-894947665257824319 message-timestamp-894947665257824319">
			<img src="${image}" aria-hidden="true" class="avatar-1BDn8e clickable-1bVtEA" alt=" " onclick="document.whForm.content.value+='<@${id}>'" style="
				border: 3px solid ${status||'transparent'};
			">
			<span style="padding-left: ${status==null?'8':'16'}px" id="message-username-894947665257824319" class="headerText-3Uvj1Y"><span class="username-1A8OIy desaturateUserColors-1gar-1 clickable-1bVtEA" aria-controls="popout_623" aria-expanded="false" role="button" tabindex="0" style="color: ${color};">${name}</span></span>${bot}<span class="timestamp-3ZCmNB timestampInline-yHQ6fX"><time aria-label="Aujourd’hui à 16:02" id="message-timestamp-894947665257824319" datetime="2021-10-05T14:02:30.721Z"><i class="separator-2nZzUB" aria-hidden="true"> — </i><span style='color:gray;font-size:12px'>${date}</span></time></span>
		</h2>
	`
	return `
		<div class="contents-2mQqc9">
			${avatarWrapper?avatarWrapperHTML:""}
			<div id="${messageId}" class="markup-2BOw-j messageContent-2qWWxC ${edited}" style="
				  white-space: ${status==null?'normal':'nowrap'};
				  overflow: hidden;
				  text-overflow: ellipsis;
				  width: ${status==null?'80':'60'}%;
				  padding-left: ${status==null?'8':'16'}px
				">${message}</div>
		</div>
	`
}