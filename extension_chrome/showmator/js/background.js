/*global chrome */

// delivers slug from extension to content script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.type == 'showmatorAdminRequestFromScript' && request.publicSlug == localStorage.publicSlug)
    sendResponse(localStorage.slug);
});