$(document).ready(function(){

  var socket = io.connect('http://localhost:3000');


  var title;
  var url;

  chrome.tabs.getSelected(null,function(tab) { 
    title = tab.title;
    url = tab.url;

    $('#title').val(title);

    var length = $('#title').val().length;
    if(length < 50){
      length = 50;
    }else{
      length = length*1.1;
    }
    $('#title').attr("size", length);
    
  });

  socket.on('messages', function(data){
    $('.output').html(data.hello);
  });

  $('.output').html("Gude");

  $( "#insert" ).click(function() {

    console.log(title+" "+url);
    socket.emit('add', {title: title, url: url});
  });

  

});



