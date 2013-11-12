$(document).ready(function(){

	var url;
	var title;

	chrome.tabs.getSelected(null,function(tab) { 
		title = tab.title;
	  	url = tab.url;

	  	$('#title').val(title);

  	  	var length = $('#title').val().length;
  	  	if(length < 50){
  	  		length = 50;
  		}else{
  			length = length*1.1;
  		}
  	  	$('#title').attr("size", length);
	});

	$('#eintragen').click(function(){
		eintragen();
	});

	$('#loeschen').click(function(){
		chrome.extension.getBackgroundPage().loeschen();
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
		title = $('#title').val();
		chrome.extension.getBackgroundPage().add(title, url);
		window.close();
	};


	$('#title').focus();

});