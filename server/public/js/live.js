/*global io */
/*global console */

// TODO title-edits and deletes
// TODO on delete: check if we have more than one link left, if false: show alert-info again

var socket = io.connect('http://localhost:63685');

socket.on('connect', function () {
  socket.emit('live', $('body').data('slug'));
});

socket.on('push', function(data) {
  if ($('#auto').is(':checked') && !data.isText)
    window.open(data.url, '_blank');
  
  var markup = '<span class="time">' + data.time + '</span>';
  if (data.isText)
    markup += data.title;
  else
    markup += '<a href="' + data.url + '" target="_blank">' + data.title + '</a>';

  $('#result').prepend('<li>' + markup + '</li>');
  $('.alert-info').hide();
});

socket.on('counter', function(data) {
  $('#counter').html(data);
});

socket.on('reload', function() {
  location.reload();
});

socket.on('titleUpdatedSuccess', function(data) {
  $('#title').text(data.title);
});