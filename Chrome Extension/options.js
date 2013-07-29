function sendData(){


  var startTime = $('#startTime').val();
  var slug = $('#slug').val();

  localStorage["slug"] = slug;




  var xhr = new XMLHttpRequest();
xhr.open('POST', 'http://showmator.phasenkasper.de/settings.php/', true);
xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');



xhr.onreadystatechange = function() {
  if (xhr.readyState == 4) {
      var status = document.getElementById("status");
      status.innerHTML = xhr.responseText;
      setTimeout(function() {
        status.innerHTML = "";
      }, 7000);

   
  }
}

xhr.send('slug='+slug+'&startTime='+startTime);


}

function restoreData(){

      if (typeof(localStorage['slug']) == "undefined"){
          localStorage['slug'] = randomSlug();
         $('#slug').val(localStorage['slug']);
      }else{
         $('#slug').val(localStorage['slug']);
      }



    $('#live').click(function() {
      window.location = "http://showmator.phasenkasper.de/live.php?slug="+localStorage['slug'];
    });
    $('#html').click(function() {
      window.location = "http://showmator.phasenkasper.de/html.php?slug="+localStorage['slug'];
    });
    $('#newSlug').click(function(){
      $('#slug').val(randomSlug());
    });


}

function randomSlug(){
  return Math.random().toString(36).substring(7);
}

document.addEventListener('DOMContentLoaded', restoreData);
document.querySelector('#save').addEventListener('click', sendData);