$(function(){

	nav();

	$('a').click(function(){
		nav(this.hash);
	});

	$(window).on('popstate', function(event) {
		 nav();
	});

	function nav(hash){
		if(!hash) hash=window.location.hash;

		switch(hash) {
			case '#main':
				$('body').removeClass().addClass('show-page-main');
				$('html, body').animate({ scrollTop: 0 }, 0);
				break;
		    case '#guide':
		    	$('body').removeClass().addClass('show-page-guide');
		    	$('html, body').animate({ scrollTop: 0 }, 0);
		        break;
		    case '#support':
		       $('body').removeClass().addClass('show-page-support');
		       $('html, body').animate({ scrollTop: 0 }, 0);
		       break;
		    default:
		}
	}
});