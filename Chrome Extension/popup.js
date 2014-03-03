var socket = io.connect('http://localhost:63685');

$(document).ready(function(){
  var title;
  var url;

  chrome.tabs.getSelected(null,function(tab) { 
    title = tab.title;
    url = tab.url;

    $('#title').val(title);

    /* Breite des Popups anpassen */

    var length = $('#title').val().length;

    $('#title').attr("size", length*1.3);

     /* Böse URLs */

    var badurl = localStorage['badUrls'].split('\n');
    for (var i = 0; i < badurl.length; i++) {
      console.log(url+" // "+ badurl);
      if(url == badurl[i]){
        $('#badUrl').html('<div class="alert alert-error">Böse URL: Kann nicht eingetragen werden!</div>');
        $('#insert, #text, .text, #title, #dublicate').remove();  
      }
    };

    socket.emit('check_dublicate', {slug: localStorage['slug'], url: htmlEntities(url)});
  });

  

  $( "#insert" ).click(function() {

    title = htmlEntities($('#title').val());
    if($('#text').is(":checked")){
      url = null;
    }
    console.log(title+" "+url);
    socket.emit('add', {slug: localStorage['slug'], title: title, url: url});
  });

  setTimeout(function() {
    $('#insert').focus();
  }, 100);


  socket.on('dublicate', function(){
    $('#dublicate').html('<div class="alert alert-error">Dieser Link ist schon eingetragen!</div>');
    $('#insert').html("Trotzdem einfügen");
  });

  socket.on('close', function(){
   chrome.extension.getBackgroundPage().badget("OK", "#33cc00");
    window.close();
  });


  function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    // return str;
  }

});



