/*global $ */

var Nav = (function () {

    var module = {},


        // Private
        // ---------------------------------------------------------------------
        
        _currentNavClass,

        _possibleNavClasses = {
            main:    'show-page-main',
            guide:   'show-page-guide',
            support: 'show-page-support'
        },

        _setNavClass = function(newNavClass) {
            $('body').removeClass(_currentNavClass).addClass(newNavClass);
            _currentNavClass = newNavClass;
        },

        _navigate = function() {
            var page = window.location.hash.replace('#', '');
            var targetClass = _possibleNavClasses[page];
            if (!!targetClass) {
                _setNavClass(targetClass);
                document.body.scrollTop = 0;
            }
        },

        _handleClick = function(event) {
            event.preventDefault();
            event.target.blur();
            window.location.hash = this.href.split('#')[1];
            _navigate();
        },

        _bindUiActions = function() {
            $('.js-nav').click(_handleClick);
            $(window).on('popstate', _navigate);
        };


    // Public
    // -------------------------------------------------------------------------
    
    module.init = function() {
        _currentNavClass = _possibleNavClasses.main;
        _bindUiActions();
        _navigate();
    };


    return module;

})();

Nav.init();