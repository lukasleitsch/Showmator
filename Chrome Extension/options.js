function sendData(join){

    var slug = $('#slug').val();
    localStorage["slug"] = slug;

    publicSlug = localStorage["publicSlug"];

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

    xhr.send('slug='+slug+'&publicSlug='+publicSlug+'&join='+join);
}

function restoreData(){
    if (typeof(localStorage['slug']) == "undefined"){
        localStorage['slug'] = randomSlug();
        $('#slug').val(localStorage['slug']);
    }else{
        $('#slug').val(localStorage['slug']);
    }

    if (typeof(localStorage['publicSlug']) == "undefined"){
        localStorage['publicSlug'] = randomSlug();
    }

    $('#live').click(function() {
      var url = localStorage['address']+"live.php?slug="+localStorage['publicSlug'];
      window.open(url);
    });
    $('#html').click(function() {
      window.location = localStorage['address']+"html.php?slug="+localStorage['slug'];
    });

    if(localStorage['popup'] == 'true'){
      $('#popup').prop('checked', true);
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

document.addEventListener('DOMContentLoaded', restoreData);

$(document).ready(function(){


    $('#newSlug').click(function(){
        $('#slug').val(randomSlug());
        localStorage['publicSlug'] = randomSlug();
    });
    $('#start').click(function(){
        sendData(false);
    });
    $('#join').click(function(){
        sendData(true);
    });

    $('#popup').change(function() {
        if($(this).is(":checked")) {
            localStorage['popup'] = true;
            chrome.extension.getBackgroundPage().update();
        }else{
            localStorage['popup'] = false;
            chrome.extension.getBackgroundPage().update();
            }
    });

    $('#badUrls').keyup(function(){
        localStorage['badUrls'] = $(this).val();
    });

    });