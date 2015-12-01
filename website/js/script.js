/*global $ */
$(function(){
	function nav() {
		var page        = window.location.hash.replace('#', ''),
		    targetClass = '';

		switch(page) {
			case 'main':
				targetClass = 'show-page-main';
				break;
	    case 'guide':
	    	targetClass = 'show-page-guide';
	      break;
	    case 'support':
	      targetClass = 'show-page-support';
	      break;
	    default:
	    	break;
		}

		if (!!targetClass) {
			$('body').removeClass().addClass(targetClass);
			document.body.scrollTop = 0;
		}
	}

	$('.js-nav').click(function(e) {
		e.preventDefault();
		this.blur();
		window.location.hash = this.href.split('#')[1];
		nav();
	});

	$(window).on('popstate', nav);
	nav();
});
