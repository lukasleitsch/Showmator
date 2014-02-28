var socket = io.connect('http://phasenkasper.de:63685');

$(document).ready(function(){
  var title;
  var url;

  chrome.tabs.getSelected(null,function(tab) { 
    title = tab.title;
    url = htmlEntities(tab.url);

    $('#title').val(title);

    var length = $('#title').val().length;

    $('#title').attr("size", length*1.3);

    socket.emit('check_dublicate', {slug: localStorage['slug'], url: url});
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
    $('#status').html('<div class="alert alert-error">Dieser Link ist schon eingetragen!</div>');
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



