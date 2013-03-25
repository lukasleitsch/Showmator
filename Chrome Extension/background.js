chrome.browserAction.onClicked.addListener(function(tab) { chrome.tabs.getSelected(null,function(tab) {
   //window.open('http://sn.phasentheater.de/?t='+tab.title+'&u='+tab.url,'_newtab');
   	//chrome.tabs.create({url: 'http://sn.phasentheater.de/?t='+tab.title+'&u='+tab.url});
	//setTimeout('chrome.tabs.remove(tab.id)', 2000);
	//alert(tab.title+tab.url);
	
var xhr = new XMLHttpRequest();
xhr.open('POST', 'http://sn.phasentheater.de/add.php/', true);
xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

xhr.onreadystatechange = function() {
	if (xhr.readyState == 4) {
		//alert("Folgender Link wurde in die Shownotes eingetragen:\n\n"+xhr.responseText);
		//alert("Der Link wurde in die Shownotes eingetragen!");
		var notification = webkitNotifications.createNotification(
  			'48.png',  // icon url - can be relative
  			'Link wurde gespeichert.',  // notification title 			
  			xhr.responseText  // notification body text
		);
		notification.show();
	}
}

xhr.send('t='+tab.title+'&u='+tab.url);

	
});
});