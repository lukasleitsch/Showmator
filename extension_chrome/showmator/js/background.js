/*global chrome */


var shortcut = false;


// fetches shortcut (can't be done inside message-listener because runtime ports
// get invalid somehow)
chrome.commands.getAll(function(commands) {
  $.each(commands, function(key, val) {
    if (val.name == '_execute_browser_action' && val.shortcut !== '')
      shortcut = val.shortcut;
  });
});


// delivers slug from extension to content script and opens popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.type == 'showmatorAdminRequestFromScript' && request.publicSlug == localStorage.publicSlug)
    sendResponse({
      slug:     localStorage.slug,
      shortcut: shortcut
    });

  else if (request.type == 'showmatorConfigureShortcut')
    chrome.tabs.create({url: 'chrome://extensions/configureCommands'});
});