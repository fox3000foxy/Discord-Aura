dropZone = document.getElementById('dropZone')
function dropHandler(ev) {
  ev.preventDefault();
    for (var i = 0; i < ev.dataTransfer.files.length; i++) {
	  var file = ev.dataTransfer.files[i]
	  dropZone.style.display = "none"
	  var reader2 = new FileReader();
	  reader2.addEventListener("load", function () {
		    formData = new FormData();
			formData.append('sender', document.whForm.username.value);
			formData.append('channel', selectChannel.value);
			formData.append('file',new Uint8Array(reader2.result))
			formData.append('fileName',file.name)
			var object = {};
			formData.forEach(function(value, key){
				object[key] = value;
			});
			// console.log(reader2.result)
			var json = JSON.stringify(object);
			fetch(location.protocol+"//"+location.host+"/upload",
			{
				headers: {
					"Content-Type": "application/json"
				},
				body: json,
				method: "post"
			})
		  .then(response => {
		  JSONresp = response.json
		  // console.log(new Uint8Array(reader2.result))
		  return response.json()
		  })
		  .then(success => console.log(success)).catch(error => console.log(error));
		// console.log(reader2.result)
	  }, false);
	  if (file) {
		reader2.readAsArrayBuffer(file)
	  }
    }
}

function dragOverHandler(ev) {
	ev.preventDefault();
	dropZone.style.display = "block"
}
