/*global chrome */
/*global io */

$(function() {

  // vars and functions
  // -----------------------------------------------------------------------------

  var isText = false,
      title, url,

      socket = io.connect('http://localhost:63123'),

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

  // add link/text and show loading state when submit button is clicked
  $save.click(function() {
    if (!$body.hasClass('on-duplicate') && !$body.hasClass('on-blacklist')) {
      var $input = isText ? $text : $title,
          val    = $.trim($input.val());
      
      // if empty value: shake input
      if (val === '') {
        $input.on('webkitAnimationEnd animationEnd animationend', function() {
          $input.removeClass('shake');
        }).addClass('shake');
        return;
      }

      $body.addClass('on-loading');
      socket.emit('addLink', {
        slug:   localStorage.slug,
        title:  htmlEntities(val),
        url:    isText ? false : url,
        isText: isText ? 1 : 0
      });
    }
  });

  // delete entry when button is clicked
  $delete.click(function() {
    $body.removeClass('on-duplicate').addClass('on-loading');
    socket.emit('deleteEntry', {
      slug:       localStorage.slug,
      publicSlug: localStorage.publicSlug,
      id:         $delete.data('id')
    });
  });


  // close popup when clicking on cancel button
  $('.btn-close').click(function() {
    window.close();
  });

  // react on enter, cmd+enter and escape 
  $(window).keydown(function(e) {
    
    // on enter in link-mode: save changes
    if (!isText && e.keyCode == 13) {
      if ($body.hasClass('on-duplicate'))
        $delete.click();
      else
        $save.click();
      // TODO necessary?
      return;
    
    // on cmd+enter in text-mode
    } else if (isText && e.keyCode == 13 && e.metaKey){
      $save.click();
      // TODO necessary?
      return;

    // close on escape (in both cases)
    } else if (e.keyCode == 27) {
      window.close();
      // TODO necessary?
      return;
    }
  });

  // on text-only change: switch body class and transfer value to new field
  $('#text-only').change(function() {
    isText = $(this).is(':checked');
    $body.toggleClass('on-text-only', isText);

    var $old = isText ? $title : $text,
        $new = isText ? $text : $title;
    $new.val($old.val());
  });

  // Link to Settings
  $('.link-settings').prop('href', chrome.extension.getURL("options.html"));


  // socket events
  // -----------------------------------------------------------------------------
  
  // prevent duplication
  socket.on('findDuplicate', function(data) {
    $body.removeClass('on-loading').addClass('on-duplicate');
    $delete.data('id', data.id);
  });

  // show success message and close window
  socket.on('addLinkSuccess', function() {
    if (!isText)
      completeAndClose('on-success-link');
    else
      completeAndClose('on-success-text');
  });
  socket.on('deleteEntrySuccess', function(data) {
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
      title = tab.title;
      url   = tab.url;
      var blacklist = false;

      // don't save links from blacklist
      if (!!localStorage.blacklist) {
        localStorage.blacklist.split('\n').forEach(function(entry) {
          if (entry == url || entry + '/' == url || entry == url + '/')
            blacklist = true;
        });
      }
      
      isText = (url.split('/')[4] === localStorage.publicSlug) || (blacklist && localStorage.showTextOnly);

      // on live-shownotes make changes for text-only entry
      if (isText) {
        $body.addClass('on-text-only');
      
      // fill input with title and prevent saving if on blacklist
      } else {
        $title.val(title);

        //show blacklist overlay
        if(blacklist && !localStorage.showTextOnly)
          $body.addClass('on-blacklist');    

        // show text-only checkbox
        if (!isText && localStorage.showTextOnly) {
          $body.addClass('on-text-only-allowed');
        }
      }

      // checks for duplicate
      socket.emit('openPopup', {slug: localStorage.slug, url: url, isText: isText ? 1 : 0});
    });
  }
});
