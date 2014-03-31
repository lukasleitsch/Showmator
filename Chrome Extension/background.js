chrome.browserAction.setPopup({popup:'popup.html'});

// Badget für erfolgreiches Eintragen. Wird beim Icon angezeigt.
function badget(text, color){
  chrome.browserAction.setBadgeText({text: text});
  chrome.browserAction.setBadgeBackgroundColor({color: color});

  setTimeout(function(){
    chrome.browserAction.setBadgeText({text: ""});
  }, 5000)
}