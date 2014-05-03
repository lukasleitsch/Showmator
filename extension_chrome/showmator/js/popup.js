/*global chrome */
/*global io */

$(function() {
  var title, url,
      
      socket = io.connect('http://localhost:63685'),

      $title       = $('#title'),
      $saveChanges = $('#save-changes'),
      $alertInfo   = $('.alert-info'),

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

    title = htmlEntities($title.val());
    if ($('#kind-text-only').is(":checked"))
      url = null;
    // TODO make change event
    socket.emit('add', {slug: localStorage.slug, title: title, url: url});
  });


  // delete entry
  $('remove-entry').click(function() {
    // TODO works with just the slug? even with non-links?
    socket.emit('delete', {slug: localStorage.slug});
  });


  // prevent duplication
  socket.on('duplicate', function(){
    $('#duplicate').html('<div class="alert alert-error">Dieser Link ist schon eingetragen!</div>');
    $('#insert').html("Trotzdem einfügen");
  });


  // Ist der Link eingetragen, meldet der Server dies und das Popup wird geschlossen und das Badget wird gesetzt
  socket.on('close', function(){
    chrome.extension.getBackgroundPage().badget("OK", "#33cc00");
    window.close();
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

  

  // get tab title and url + send link to server
  // -----------------------------------------------------------------------------
  
  chrome.tabs.getSelected(null, function(tab) {
    title = htmlEntities(tab.title);
    url   = tab.url;

    $title.val(title);

    // prevent if on blacklist
    // TODO make forEach
    // TODO control via body class
    var blacklist = localStorage.blacklist.split('\n'); // TODO works on windows?
    for (var i = 0; i < blacklist.length; i++) {
      if (url == blacklist[i]) {
        $('#badUrl').html('<div class="alert alert-error">Böse URL: Kann nicht eingetragen werden!</div>');
        $('#insert, #text, .text, #title, #duplicate, #delete').remove();
      }
    }

    // check duplicates
    // TODO necessary? better: check server-side when link is sent → react on response error
    socket.emit('check_duplicate', {slug: localStorage.slug, url: htmlEntities(url)});

    // add link
    // TODO badge on success
    socket.emit('add', {slug: localStorage.slug, title: title, url: url});
  });
});
