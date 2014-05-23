/*global io */
$(function() {
  // format time from timestamp
  var $wrap  = $('#markup-container'),
      start  = $wrap.data('start'),
      offset = $wrap.data('offset');
  $('.time').each(function() {
    var $this = $(this);
    $this.text(formatTime(parseInt($this.data('time')) - start - offset));
  });





  $('.list').hide();

  if (localStorage.getItem('time') == "false"){
    $('.time').toggle();
    $('#time').text("Zeit einblenden");
  }

  if (localStorage.getItem('target') == "false"){
    $('.target').toggle();
    $('#target').text("Target einblenden");
  }

  if (localStorage.getItem('list') == "false"){
    $('.list').toggle();
    $('#list').text("Liste ausblenden");
  }

  $('#time').click(function(){
    $('.time').toggle();

    if (localStorage.getItem('time') == 'true' || localStorage.getItem('time') == null){
      localStorage.setItem('time', false);
      $('#time').text("Zeit einblenden");
    } else {
      localStorage.setItem('time', true);
      $('#time').text("Zeit ausblenden");
    }
  });

  $('#target').click(function(){
    $('.target').toggle();

    if (localStorage.getItem('target') == 'true' || localStorage.getItem('target') == null){
      localStorage.setItem('target', false);
      $('#target').text("Target einblenden");
    } else {
      localStorage.setItem('target', true);
      $('#target').text("Target ausblenden");
    }
  });

  $('#list').click(function(){
    $('.list').toggle();

    if (localStorage.getItem('list') == 'true' || localStorage.getItem('list') == null){
      localStorage.setItem('list', false);
      $('#list').text("Liste ausblenden");
    } else {
      localStorage.setItem('list', true);
      $('#list').text("Liste einblenden");
    }
  });

  $('#submit_offset').click(function(){
    var offset_hours = $('#offset_hours').val()*3600000;
    var offset_minutes = $('#offset_minutes').val()*60000;
    var offset_seconds = $('#offset_seconds').val()*1000;
    var offset = offset_hours+offset_minutes+offset_seconds;
    window.location.assign("/html/<%=slug%>/"+offset);
  });
});
