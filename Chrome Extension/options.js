$(document).ready(function(){

  var socket = io.connect('http://phasenkasper.de:63685');

  $('#submit').click(function(){
    
    if(!$('#slug').val()){
      $('#status').show().html("Bitte ein Kürzel eingeben!").delay(3000).fadeOut(3000);
    } else {
      var slug = $.trim($('#slug').val());
      slug = slug.replace(/ /g,'');
      localStorage['slug'] = slug;
      localStorage['publicSlug'] = randomSlug();
      socket.emit('new', {slug: slug, publicSlug: localStorage['publicSlug']});
      $('#slug').val(localStorage['slug']);
    }
  });

  socket.on('status', function(data){
    $('#status').show().html(data.text).delay(3000).fadeOut(3000);
    localStorage['publicSlug'] = data.publicSlug;
  });

  $('#live').click(function(){
      // console.log("Live");
      window.open("http://phasenkasper.de:63685/live/"+localStorage['publicSlug']);
    });

    $('#html').click(function(){
      window.open("http://phasenkasper.de:63685/html/"+localStorage.slug);
    });

    $('#badUrls').keyup(function(){
        localStorage['badUrls'] = $(this).val();
        $('#status_url').show().html("Gespeichert").delay(3000).fadeOut(3000);
    });
});

document.addEventListener('DOMContentLoaded', restoreData);

function restoreData () {
  if (typeof(localStorage['slug']) == "undefined"){
      localStorage['slug'] = randomSlug();
      $('#slug').val(localStorage['slug']);
  }else{
      $('#slug').val(localStorage['slug']);
  }

  if (typeof(localStorage['publicSlug']) == "undefined"){
      localStorage['publicSlug'] = randomSlug();
  }

  if (typeof(localStorage['badUrls']) == "undefined"){
      localStorage['badUrls'] = '';
  }else{
      $('#badUrls').val(localStorage['badUrls']);
  }
}

function randomSlug(){
  return Math.random().toString(36).substring(7);
}