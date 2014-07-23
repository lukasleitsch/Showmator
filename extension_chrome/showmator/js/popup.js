/*global chrome */
/*global io */

$(function() {

  // vars and functions
  // -----------------------------------------------------------------------------

  var isText = false,
      title, url,

      socket = io.connect('http://localhost:63685'),

      $body   = $('body'),
      $title  = $('#title'),
      $text  = $('#text'),
      $save   = $('#save'),
      $delete = $('#delete'),

      htmlEntities = function(str) {
        // TODO why `String()`?
        return String(str)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
      },

      completeAndClose = function(statusClass) {
        $body.removeClass('on-loading').addClass(statusClass);
        setTimeout(function() {
          window.close();
        }, 2000);
      };



  // bind events
  // -----------------------------------------------------------------------------

  // add link and show loading state when submit button is clicked
  $save.click(function() {
    if (!$body.hasClass('on-duplicate') && !$body.hasClass('on-blacklist')) {
      $body.addClass('on-loading');
      socket.emit('linkAdded', {
        slug:   localStorage.slug,
        title:  $title.val() ? htmlEntities($title.val()) : htmlEntities($text.val()),
        url:    url,
        isText: isText ? 1 : 0
      });
    }
  });


  $delete.click(function() {
    $body.removeClass('on-duplicate').addClass('on-loading');
    socket.emit('linkDeleted', {
      slug:       localStorage.slug,
      publicSlug: localStorage.publicSlug,
      id:         $delete.data('id')
    });
  });


  // close popup when clicking on cancel button
  $('.btn-close').click(function() {
    window.close();
  });


  // react on enter/escape + hide alert when title is changed
  $title.keyup(function(e) {

    // on enter: save changes
    if (e.keyCode == 13) {
      if ($body.hasClass('on-duplicate'))
        $delete.click();
      else
        $save.click();
      return;

    // on escape: close popup
    } else if (e.keyCode == 27) {
      window.close();
      return;
    }
  });



  // socket events
  // -----------------------------------------------------------------------------
  
  // prevent duplication
  socket.on('duplicate', function(data) {
    $body.removeClass('on-loading').addClass('on-duplicate');
    $delete.data('id', data.id);
  });

  // show success message and close window
  socket.on('linkAddedSuccess', function() {
    if (!isText)
      completeAndClose('on-success-link');
    else
      completeAndClose('on-success-text');
  });
  socket.on('linkDeletedSuccess', function(data) {
    if (data.id == $delete.data('id'))
      completeAndClose('on-delete');
  });



  // get tab title and url + send link to server
  // -----------------------------------------------------------------------------
  
  // show warning if slug is not set
  if (typeof(localStorage.slug) == "undefined") {
    $body.addClass('on-empty-slug');
    $('#link-options').prop('href', chrome.extension.getURL("options.html"));

  // get tab data und send add-event
  } else {
    chrome.tabs.getSelected(null, function(tab) {
      title  = htmlEntities(tab.title);
      url    = tab.url;
      isText = url.split('/')[4] === localStorage.publicSlug;

      // on live-shownotes make changes for text-only entry
      if (isText) {
        $body.addClass('on-text-only');
      
      // fill input with title and prevent saving if on blacklist
      } else {
        $title.val(title);
        if (!!localStorage.blacklist) {
          localStorage.blacklist.split('\n').forEach(function(entry) {
            if (entry == url || entry + '/' == url || entry == url + '/')
              $body.addClass('on-blacklist');
          });
        }
      }

      // checks for duplicate
      socket.emit('popupOpened', {slug: localStorage.slug, url: url, isText: isText ? 1 : 0});
    });
  }
});
