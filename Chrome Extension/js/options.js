$(document).ready(function(){

  var socket = io.connect('http://localhost:63685');

  // Wenn der Senden-Button gedrückt wird
  $('#submit').click(function(){
    
    if(!$('#slug').val()){
      $('#status').show().html("Bitte ein Kürzel eingeben!").delay(5000).fadeOut(3000);
    } else {
      var slug = $.trim($('#slug').val());
      slug = slug.replace(/ /g,'');
      localStorage['slug'] = slug;
      localStorage['publicSlug'] = randomSlug();
      socket.emit('new', {slug: slug, publicSlug: localStorage['publicSlug']});
      $('#slug').val(localStorage['slug']);
    }
  });

  //Zeigt die Rückmeldung des Servers an
  socket.on('status', function(data){
    $('#status').show().html(data.text).delay(5000).fadeOut(3000);
    localStorage['publicSlug'] = data.publicSlug;
  });

  //Button zu den Live-Shownotes
  $('#live').click(function(){
      // console.log("Live");
      window.open("http://localhost:63685/live/"+localStorage['publicSlug']);
    });

  //Button zu den Shownotes in HTML
  $('#html').click(function(){
    window.open("http://localhost:63685/html/"+localStorage.slug);
  });

  // Bei der Eingabe die bösen URLs speichern
  $('#badUrls').keyup(function(){
    localStorage['badUrls'] = $(this).val();
    $('#status_url').show().html("Gespeichert").delay(5000).fadeOut(3000);
  });
});

//Einstellunge beim Laden wiederherstellen

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

// Zufälligen Slug erzeugen

function randomSlug(){
  return Math.random().toString(36).substring(7);
}