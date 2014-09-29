$(function(){

	nav();

	$('a').click(function(){
		nav(this.hash);
	});

	$(window).on("navigate", function (event, data) {
	  var direction = data.state.direction;
	  if (direction == 'back') {
	    nav();
	  }
	  if (direction == 'forward') {
	   	nav();
	  }
	});

	function nav(hash){
		if(!hash) hash=window.location.hash;

		switch(hash) {
			case '#main':
				$('body').removeClass().addClass('show-page-main');
				// scrollTo('body');
				break;
		    case '#guide':
		    	$('body').removeClass().addClass('show-page-guide');
		    	scrollTo('.page-guide');
		        break;
		    case '#support':
		       $('body').removeClass().addClass('show-page-support');
		       scrollTo('.page-support');
		       break;
		    default:

		}
	}

	function scrollTo(hash){
		$('html, body').animate({
		    scrollTop: $(hash).offset().top
		}, 1000);
	}
});