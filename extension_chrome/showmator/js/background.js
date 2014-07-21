/*global chrome */

// delivers slug from extension to content script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.type == 'showmatorRequestSlugFromScript' && request.publicSlug == localStorage.publicSlug)
    sendResponse(localStorage.slug);
});