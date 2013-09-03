$(document).ready(function(){

	var url;

	chrome.tabs.getSelected(null,function(tab) { 
	  	$('#title').val(tab.title);
	  	var length = $('#title').val().length;
	  	if(length < 50){
	  		length = 50;
		}else{
			length = length*1.1;
		}
	  	$('#title').attr("size", length);
	  	url = tab.url;
	});

	$('#eintragen').click(function(){
		eintragen();
	});

	$('body').keyup(function(e) {
		if(e.keyCode == 13) {
			eintragen();
		}
	});

	function eintragen(){
		if($('#text').is(":checked")){
			url = 'null';
		}
		var title = $('#title').val();
		chrome.extension.getBackgroundPage().add(title, url);
		window.close();
	}

	$('#title').focus();

});