chrome.browserAction.setPopup({popup:'popup.html'});


function notification(title, text){
  var notification = webkitNotifications.createNotification(
        '',  // icon url - can be relative
        title,  // notification title       
        text  // notification body text
    );
    notification.show();

    setTimeout(function(){
        notification.cancel();
    }, 3000);
};

function badget(text, color){
  chrome.browserAction.setBadgeText({text: text});
  chrome.browserAction.setBadgeBackgroundColor({color: color});

  setTimeout(function(){
    chrome.browserAction.setBadgeText({text: ""});
  }, 5000)
}