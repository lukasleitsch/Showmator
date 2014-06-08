// TODO why not via manifest?
// chrome.browserAction.setPopup({popup:'popup.html'});

// Badget on icon for signalizing successful save
function badget(text, color){
  chrome.browserAction.setBadgeText({text: text});
  chrome.browserAction.setBadgeBackgroundColor({color: color});

  setTimeout(function(){
    chrome.browserAction.setBadgeText({text: ""});
  }, 5000);
}