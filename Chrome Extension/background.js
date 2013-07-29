chrome.browserAction.onClicked.addListener(function(tab) { chrome.tabs.getSelected(null,function(tab) {

	if (typeof(localStorage['slug']) == "undefined") {
		alert('Bitte die Einstellungen setzen.')
	} else{
		var xhr = new XMLHttpRequest();
		xhr.open('POST', 'http://showmator.phasenkasper.de/add.php/', true);
		xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				//alert("Folgender Link wurde in die Shownotes eingetragen:\n\n"+xhr.responseText);
				//alert("Der Link wurde in die Shownotes eingetragen!");
				var notification = webkitNotifications.createNotification(
		  			'icon32.png',  // icon url - can be relative
		  			'Link wurde gespeichert!',  // notification title 			
		  			xhr.responseText  // notification body text
				);
				notification.show();
			}
		}

		xhr.send('s='+localStorage['slug']+'&t='+tab.title+'&u='+tab.url);
			

			};




});
});

