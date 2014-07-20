// TODO why not via manifest?
// chrome.browserAction.setPopup({popup:'popup.html'});

chrome.tabs.onUpdated.addListener(function(id, changeInfo, tab){
	if(changeInfo.status == "complete" && (tab.url.split('/')[4] == localStorage.publicSlug)){
		console.log(tab.url)
		chrome.tabs.executeScript(null, {file: "js/live-admin.js"});
	}
});
