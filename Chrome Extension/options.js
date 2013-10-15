// var defaultUrl = "http://showmator-beta.phasenkasper.de/";
localStorage['address'] = "http://showmator.phasenkasper.de/";
// localStorage['address'] = "http://localhost/Showmator/Server%20Scripte/";


function sendData(start){

    if (start == true) {
        var currentTime = true;
    }else{
        var currentTime = false;
    }
    var startTime = $('#startTime').val();

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

    xhr.send('slug='+slug+'&publicSlug='+publicSlug+'&currentTime='+currentTime+'&startTime='+startTime+'&version='+localStorage['version']);
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

    // if (typeof(localStorage['address']) == "undefined"){
    //     localStorage['address'] = defaultUrl;
    // }else{
    //      $('#serverUrl').val(localStorage['address']);
    // }

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

    // $('#serverUrl').val(localStorage['address']);

}

function randomSlug(){
  return Math.random().toString(36).substring(7);
}

document.addEventListener('DOMContentLoaded', restoreData);

$('#save').click(function(){
    var time = $('#startTime').val();
    
    if(time == ''){
        alert("Es ist keine Zeit eingetragen!")
    }else{
       sendData(false); 
    }
  
});

$('#newSlug').click(function(){
    $('#slug').val(randomSlug());
    localStorage['publicSlug'] = randomSlug();
});
$('#start').click(function(){
    sendData(true);
});
$('#join').click(function(){
    sendData(false);
});
$('#saveUrl').click(function(){
    localStorage['address'] = $('#serverUrl').val();
});
$('#defaultUrl').click(function(){
    $('#serverUrl').val(defaultUrl);
    localStorage['address'] = $('#serverUrl').val();
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