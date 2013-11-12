localStorage['version'] = '1.3.2';

// Umschaltung zwischen Popup und einfachem Klick

if(localStorage['popup']=='true'){
	chrome.browserAction.setPopup({popup:'popup.html'});
}else{
	chrome.browserAction.setPopup({popup:''});
}

// Wenn die Einstellung geändert wird, damit sie gleich wirksam ist

function update(){
	if(localStorage['popup']=='true'){
		chrome.browserAction.setPopup({popup:'popup.html'});
	}else{
		chrome.browserAction.setPopup({popup:''});
	}
}

// Listener an das Icon, wenn kein Popup verwendet wird

chrome.browserAction.onClicked.addListener(function(tab) { chrome.tabs.getSelected(null,function(tab) {
	add(tab.title, tab.url);
});
});

// Link und Titel werden an den Server geschickt.

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
		xhr.send('s='+localStorage['slug']+'&t='+encodeURIComponent(title)+'&u='+url+'&version='+localStorage['version']);
	};
}

// Vor dem Senden wir überprüft, ob der Link schon vorhanden ist. Wenn ja wird gefragt, ob er trotzdem eingetragen werden soll

function add(title, url){
	var xhr = new XMLHttpRequest();
	xhr.open('POST', localStorage['address']+'duplicate.php/', false);
	xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

	if(url != 'null'){	
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				if (xhr.responseText == "true") {
					if (confirm("Dieser Link ist schon in den Shownotes vorhanden. Soll er trotzdem hinzugefügt werden?")) {
						send(title, url);
					}
				} else if (xhr.responseText == "false") {
					send(title, url);
				}
			}
		}
	}else{
		send(title, url);
	}

	xhr.send('s='+localStorage['slug']+'&u='+url);
};

// Der letzte Eintrag in den Shownotes wird gelöscht. 

function loeschen(){

	var r = confirm("Soll der letzte Eintrag wirklich gelöscht werden?");
	if (r = true){

		var xhr = new XMLHttpRequest();
		xhr.open('POST', localStorage['address']+'delete.php/', false);
		xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				var notification = webkitNotifications.createNotification(
			  			'icon48.png',  // icon url - can be relative
			  			'Eintag wurde gelöscht',  // notification title 			
			  			xhr.responseText  // notification body text
					);
					notification.show();

					setTimeout(function(){
	  					notification.cancel();
					}, 3000);
			}
		}

		xhr.send('s='+localStorage['slug']);
	
	}
};

// Wandelt URLs in das richtige Format um, dass alle Zeichen übertragen werden


function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}