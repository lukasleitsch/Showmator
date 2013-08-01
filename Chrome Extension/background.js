chrome.browserAction.onClicked.addListener(function(tab) { chrome.tabs.getSelected(null,function(tab) {

	if (typeof(localStorage['slug']) == "undefined") {
		alert('Bitte die Einstellungen setzen. Rechts Klick auf Icon und dann Optionen.')
	} else{
		var xhr = new XMLHttpRequest();
		xhr.open('POST', localStorage['address']+'add.php/', true);
		xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				//alert("Folgender Link wurde in die Shownotes eingetragen:\n\n"+xhr.responseText);
				//alert("Der Link wurde in die Shownotes eingetragen!");
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

		xhr.send('s='+localStorage['slug']+'&t='+tab.title+'&u='+tab.url);
			

			};




});
});

