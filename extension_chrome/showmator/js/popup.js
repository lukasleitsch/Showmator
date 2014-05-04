/*global chrome */
/*global io */

$(function() {
  var title, url,
      
      socket = io.connect('http://localhost:63685'),

      $title            = $('#title'),
      $saveChanges      = $('#save-changes'),
      $alertInfo        = $('.alert-info'),
      $alertSuccessful  = $('.alert-successful'),
      $alertDublicate   = $('.alert-dublicate'),
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

    title = htmlEntities($title.val());
    if ($('#kind-text-only').is(":checked"))
      var isText = 1;
    if ($('#kind-link').is(":checked"))
      var isText = 0;
    // TODO make change event
    socket.emit('update', {slug: localStorage.slug, title: title, url: url, isText: isText});
    window.close();
  });


  // delete entry
  $('remove-entry').click(function() {
    // TODO works with just the slug? even with non-links?
    socket.emit('delete', {slug: localStorage.slug});
  });


  // prevent duplication
  socket.on('duplicate', function(data){
    $alertDublicate.addClass('alert-show');
    if(data.title)
      $title.val(data.title);
    if(data.isText == 1)
      $('#kind-text-only').prop('checked', true);
    console.log(data.isText);
  });


  // show alert-successful abd badget if server respond
  socket.on('add-successful', function(data){
    chrome.extension.getBackgroundPage().badget("OK", "#33cc00");
    $alertSuccessful.addClass('alert-show');
    if(data.title)
      $title.val(data.title);
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


  // if radio-button text change
  $('#kind-text-only, #kind-link').change(function(){
    $alertInfo.slideUp();
    $saveChanges.removeClass('disabled');
  });

  // if slug not set

  if (typeof(localStorage.slug) == "undefined") {
    $alertError.addClass('alert-show');
    $('#link-options').prop('href', chrome.extension.getURL("options.html"));
    
  };

  

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
    //socket.emit('check_duplicate', {slug: localStorage.slug, url: htmlEntities(url)});

    // add link
    // TODO badge on success
    if (typeof(localStorage.slug) != "undefined") {
      socket.emit('add', {slug: localStorage.slug, title: title, url: url, isText: 0});
      console.log("slug "+typeof(localStorage.slug));
    }
  });
});
