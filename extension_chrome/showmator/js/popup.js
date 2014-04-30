var socket = io.connect('http://localhost:63685');

$(document).ready(function(){
  var title;
  var url;

  // Titel und URL des aktuellen Tabs auslesen
  chrome.tabs.getSelected(null,function(tab) { 
    title = tab.title;
    url = tab.url;

    $('#title').val(title);

    /* Breite des Popups anpassen */

    var length = $('#title').val().length;

    $('#title').attr("size", length*1.2);

    if ($(window).width() < 220) {
      $('body').width(220);
    }

     /* Böse URLs */

    var badurl = localStorage['badUrls'].split('\n');
    for (var i = 0; i < badurl.length; i++) {
      console.log(url+" // "+ badurl);
      if(url == badurl[i]){
        $('#badUrl').html('<div class="alert alert-error">Böse URL: Kann nicht eingetragen werden!</div>');
        $('#insert, #text, .text, #title, #dublicate, #delete').remove();  
      }
    };

    // Dublicate überprüfen. Wird direkt ausgeführt beim öffnen des Popups

    socket.emit('check_dublicate', {slug: localStorage['slug'], url: htmlEntities(url)});
  });

  // Button zum Einfügen

  $( "#insert" ).click(function() {

    title = htmlEntities($('#title').val());
    if($('#text').is(":checked")){
      url = null;
    }
    console.log(title+" "+url);
    socket.emit('add', {slug: localStorage['slug'], title: title, url: url});
  });

  // Behebt den Bug von Chrome, dass der Focus nicht direkt auf eine Element gesetzt werden kann. 

  setTimeout(function() {
    $('#insert').focus();
  }, 100);

  // Löschen Button

  $('#delete').click(function(){
    socket.emit('delete', {slug: localStorage['slug']});
  });

  // Blendet die Meldung ein, wenn der Server meldet, dass der Link schon eingetragen wurde

  socket.on('dublicate', function(){
    $('#dublicate').html('<div class="alert alert-error">Dieser Link ist schon eingetragen!</div>');
    $('#insert').html("Trotzdem einfügen");
  });

  // Ist der Link eingetragen, meldet der Server dies und das Popup wird geschlossen und das Badget wird gesetzt

  socket.on('close', function(){
   chrome.extension.getBackgroundPage().badget("OK", "#33cc00");
    window.close();
  });

  // Sonderzeichen escapen

  function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    // return str;
  }

});



