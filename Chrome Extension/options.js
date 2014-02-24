$(document).ready(function(){

var socket = io.connect('http://localhost:3000');

$('#submit').click(function(){
  var slug = $('#slug').val();
  localStorage['slug'] = slug;
  socket.emit('new', {slug: slug});
});

socket.on('status', function(data){
  $('#status').html(data);
  // $('#status').delay(5000).html('');
})

});

document.addEventListener('DOMContentLoaded', restoreData);

function restoreData () {
  $('#slug').val(localStorage['slug']);
}