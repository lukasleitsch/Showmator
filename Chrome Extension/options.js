function sendData(start){

  if (start == true) {
      var currentTime = true;
  }else{
      var currentTime = false;
  }



 var startTime = $('#startTime').val();
  var slug = $('#slug').val();

  localStorage["slug"] = slug;




  var xhr = new XMLHttpRequest();
xhr.open('POST', localStorage['address']+'settings.php/', true);
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

xhr.send('slug='+slug+'&currentTime='+currentTime+'&startTime='+startTime);


}

function restoreData(){

      if (typeof(localStorage['slug']) == "undefined"){
          localStorage['slug'] = randomSlug();
         $('#slug').val(localStorage['slug']);
      }else{
         $('#slug').val(localStorage['slug']);
      }



    $('#live').click(function() {
      window.location = localStorage['address']+"live.php?slug="+localStorage['slug'];
    });
    $('#html').click(function() {
      window.location = localStorage['address']+"html.php?slug="+localStorage['slug'];
    });

    if(localStorage['popup'] == 'true'){
      $('#popup').prop('checked', true);
    }

    /*DEV*/

    if (false) {
      localStorage['address'] = 'http://localhost/Showmator/Server%20Scripte/';
    } else {
      localStorage['address'] = "http://showmator.phasenkasper.de/";
    }

    /*-------*/
}

function randomSlug(){
  return Math.random().toString(36).substring(7);
}

document.addEventListener('DOMContentLoaded', restoreData);

$('#save').click(function(){
  sendData(false);
});
$('#newSlug').click(function(){
  $('#slug').val(randomSlug());
});
$('#start').click(function(){
  sendData(true);
});

$('#popup').change(function() {
        if($(this).is(":checked")) {
            localStorage['popup'] = 'true';
            chrome.extension.getBackgroundPage().update();
        }else{
            localStorage['popup'] = 'false';
            chrome.extension.getBackgroundPage().update();
        }
    });