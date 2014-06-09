/*global chrome */
/*global io */

$(function() {

  // vars and functions
  // -----------------------------------------------------------------------------

  var title, url,
      
      socket = io.connect('http://localhost:63685'),

      $title       = $('#title'),
      $saveChanges = $('#save-changes'),
      $alertInfo   = $('.alert-info'),
      $body        = $('body'),

      htmlEntities = function(str) {
        // TODO why `String()`?
        return String(str)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
      };



  // bind events
  // -----------------------------------------------------------------------------

  // update title
  $saveChanges.click(function() {
    if ($(this).hasClass('disabled'))
      return;

    socket.emit('linkUpdated', {
      slug:   localStorage.slug,
      title:  htmlEntities($title.val()),
      url:    url,
      isText: $('#kind-text-only').is(':checked') ? 1 : 0
    });
    window.close();
  });


  // function tp hide alert and enable update button
  var enableUpdate = function() {
    $alertInfo.slideUp();
    $saveChanges.removeClass('disabled');
  };

  // react on enter/escape + hide alert when title is changed
  $title.keyup(function(e) {

    // on enter: save changes
    if (e.keyCode == 13) {
      $saveChanges.click();
      return;

    // on escape: close popup
    } else if (e.keyCode == 27) {
      window.close();
      return;
    }

    // if title has changed: enable update
    if ($alertInfo.is(':visible') && htmlEntities($title.val()) != title)
      enableUpdate();
  });


  // enable update if mode for link/text-only changes
  $('#kind-text-only, #kind-link').one('change', enableUpdate);



  // socket events
  // -----------------------------------------------------------------------------
  
  // prevent duplication
  socket.on('duplicate', function(data) {
    $body.addClass('on-duplicate');
    if(data.title)
      $title.val(data.title);
    if (data.isText == 1)
      $('#kind-text-only').prop('checked', true);
  });

  // add link when popup closes
  addEventListener('unload', function() {
    if (!$body.hasClass('on-duplicate') && !$body.hasClass('on-blacklist')) {
      socket.emit('linkAdded', {
        slug:   localStorage.slug,
        title:  htmlEntities($title.val()),
        url:    url,
        isText: $('#kind-text-only').is(':checked') ? 1 : 0
      });
    }
  }, true);



  // get tab title and url + send link to server
  // -----------------------------------------------------------------------------
  
  // show warning if slug is not set
  if (typeof(localStorage.slug) == "undefined") {
    $body.addClass('on-empty-slug');
    $('#link-options').prop('href', chrome.extension.getURL("options.html"));

  // // get tab data und send add-event
  } else {
    chrome.tabs.getSelected(null, function(tab) {
      title = htmlEntities(tab.title);
      url   = tab.url;

      $title.val(title);

      // prevent if on blacklist
      // TODO works on windows?
      if (!!localStorage.blacklist) {
        localStorage.blacklist.split('\n').forEach(function(entry) {
            if (entry == url || entry + '/' == url || entry == url + '/')
              $body.addClass('on-blacklist');
        });
      }

      // checks for duplicate
      socket.emit('popupOpened', {slug: localStorage.slug, url: url});
    });
  }
});
