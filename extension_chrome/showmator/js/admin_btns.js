/*global chrome */

// requests slug from extension and passes it through to the web page
window.addEventListener('message', function(event) {
  // We only accept messages from ourselves
  if (event.source != window)
    return;

  if (event.data.type && event.data.type == 'showmatorRequestSlugFromPage') {
    chrome.runtime.sendMessage({
      type:       'showmatorRequestSlugFromScript',
      publicSlug: event.data.publicSlug
    }, function(response) {
      window.postMessage({
        type: 'showmatorResponseSlugFromScript',
        slug: response.slug,
        html: '<div class="admin-btn-wrapper">' +
                '<button class="btn btn-default btn-xs btn-edit"><span class="glyphicon glyphicon-pencil"></span></button>' +
                '<button class="btn btn-default btn-xs btn-delete"><span class="glyphicon glyphicon-trash"></span></button>' +
              '</div>'
      }, '*');
    });
  }
}, false);
