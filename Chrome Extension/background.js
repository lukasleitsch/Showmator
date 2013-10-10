if(localStorage['popup']=='true'){
	chrome.browserAction.setPopup({popup:'popup.html'});
}else{
	chrome.browserAction.setPopup({popup:''});
}

function update(){
	if(localStorage['popup']=='true'){
		chrome.browserAction.setPopup({popup:'popup.html'});
	}else{
		chrome.browserAction.setPopup({popup:''});
	}
}

chrome.browserAction.onClicked.addListener(function(tab) { chrome.tabs.getSelected(null,function(tab) {
	add(tab.title, tab.url);
});
});

function add(title, url){
	if (duplicate(url) && url != 'null') {
		if (confirm("Dieser Link ist schon in den Shownotes vorhanden. Soll er trotzdem hinzugefügt werden?")) {
			send(title, url);
		}
	}else{
		send(title, url);
	}
}

function send(title, url){
	if (typeof(localStorage['slug']) == "undefined") {
		alert('Bitte die Einstellungen setzen. Rechts Klick auf Icon und dann Optionen.')
	} else{
		var xhr = new XMLHttpRequest();
		xhr.open('POST', localStorage['address']+'add.php/', true);
		xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				var notification = webkitNotifications.createNotification(
		  			'icon48.png',  // icon url - can be relative
		  			'Link wurde gespeichert!',  // notification title 			
		  			xhr.responseText  // notification body text
				);
				notification.show();

				setTimeout(function(){
  					notification.cancel();
				}, 3000);
			}
		}
		xhr.send('s='+localStorage['slug']+'&t='+title+'&u='+url);
	};
}

var t;

function duplicate(url){
	var xhr = new XMLHttpRequest();
	xhr.open('POST', localStorage['address']+'duplicate.php/', true);
	xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if (xhr.responseText == "true") {
				t = true;
			} else if (xhr.responseText == "false") {
				t = false;
			}
		}
	}
	xhr.send('s='+localStorage['slug']+'&u='+url);

	return t;
} 