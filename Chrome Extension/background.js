localStorage['address'] = "http://localhost:3000/";


chrome.browserAction.setPopup({popup:'popup.html'});

function getTitle(){
  
  return "Ich bin der Title";

}

function getUrl(){
  chrome.browserAction.onClicked.addListener(function(tab) { chrome.tabs.getSelected(null,function(tab) {
  return tab.url;
});
});
}

