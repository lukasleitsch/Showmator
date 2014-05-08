/*global chrome */
/*global io */

$(function() {

  // vars and functions
  // -----------------------------------------------------------------------------

  var title, url,
      
      socket = io.connect('http://localhost:63685'),

      $title            = $('#title'),
      $saveChanges      = $('#save-changes'),
      $alertInfo        = $('.alert-info'),
      // $alertSuccessful  = $('.alert-successful'),
      $alertDuplicate   = $('.alert-duplicate'),
      $alertError       = $('.alert-error'),

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

  // change title
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


  // delete entry
  $('remove-entry').click(function() {
    // TODO works with just the slug? even with non-links?
    socket.emit('delete', {slug: localStorage.slug});
  });


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

    // if title has changed: hide alert and enable save button
    if ($alertInfo.is(':hidden') && htmlEntities($title.val()) != title) {
      $alertInfo.slideUp();
      $saveChanges.removeClass('disabled');
    }
  });


  // hide alert if mode for link/text-only changes
  $('#kind-text-only, #kind-link').change(function() {
    $alertInfo.slideUp();
    $saveChanges.removeClass('disabled');
  });



  // socket events
  // -----------------------------------------------------------------------------
  
  // prevent duplication
  socket.on('duplicate', function(data) {
    // TODO make overlay
    $alertDuplicate.addClass('alert-show');
    if(data.title)
      $title.val(data.title);
    if (data.isText == 1)
      $('#kind-text-only').prop('checked', true);
  });


  // show badget if server sends success event
  socket.on('linkAddedSuccess', function() {
    chrome.extension.getBackgroundPage().badget("OK", "#33cc00");
  });

  socket.on('linkAddedError', function(){
    $alertError.addClass('alert-show');
    $('#link-options').prop('href', chrome.extension.getURL("options.html"));
  });
  


  // get tab title and url + send link to server
  // -----------------------------------------------------------------------------
  
  // show warning if slug is not set
  // if (typeof(localStorage.slug) == "undefined") {
  //   $alertError.addClass('alert-show');
  //   $('#link-options').prop('href', chrome.extension.getURL("options.html"));

  // // get tab data und send add-event
  // } else {
    chrome.tabs.getSelected(null, function(tab) {
      title = htmlEntities(tab.title);
      url   = tab.url;

      $title.val(title);

      // prevent if on blacklist
      // TODO make forEach
      // TODO make overlay
      var blacklist = localStorage.blacklist.split('\n'); // TODO works on windows?
      for (var i = 0; i < blacklist.length; i++) {
        if (url == blacklist[i]) {
          $('#badUrl').html('<div class="alert alert-error">Böse URL: Kann nicht eingetragen werden!</div>');
          $('#insert, #text, .text, #title, #duplicate, #delete').remove();
        }
      }

      // add link
      socket.emit('linkAdded', {slug: localStorage.slug, title: title, url: url, isText: 0});
    });
  // }
});
