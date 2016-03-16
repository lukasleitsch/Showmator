/*global chrome */
/*global io */
/*global $ */

var PopUp = (function() {

  var module = {},

  
  // Private
  // ---------------------------------------------------------------------

    // Constants
    // ---------------------------------------------------------------------

    _BASE_URL = 'http://localhost:63123',
    _ENTER     = 13,
    _ESCAPE    = 27,


      // Custom classes
      // ---------------------------------------------------------------------
    
      _BLACKLIST            = 'on-blacklist',
      _DELETE               = 'on-delete',
      _DUPLICATE            = 'on-duplicate',
      _EMPTY_SLUG           = 'on-empty-slug',
      _LOADING              = 'on-loading',
      _SUCCESS_LINK         = 'on-success-link',
      _SUCCESS_TEXT         = 'on-success-text',
      _TEXT_ONLY            = 'on-text-only',
      _TEXT_ONLY_ALLOWED    = 'on-text-only-allowed',
      _TEXT_ONLY_BLACKLIST  = 'on-text-only-blacklist',
    

      // Cusomt events
      // ---------------------------------------------------------------------
    
      _ADD_LINK             = 'addLink',
      _ADD_LINK_SUCCESS     = 'addLinkSuccess',
      _DELETE_ENTRY         = 'deleteEntry',
      _DELETE_ENTRY_SUCCESS = 'deleteEntrySuccess',
      _FIND_DUPLICATE       = 'findDuplicate',
      _OPEN_POPUP           = 'openPopup',


    // Variables
    // ---------------------------------------------------------------------

    _isText = false,
    _title,
    _url,

    _blacklist = false,
    
    _socket = io.connect(_BASE_URL),

    _$body      = $('body'),
    _$title     = $('#title'),
    _$text      = $('#text'),
    _$save      = $('#save'),
    _$delete    = $('#delete'),
    _$close     = $('.btn-close'),
    _$textOnly  = $('#text-only'),


    // Functions
    // ---------------------------------------------------------------------

    _completeAndClose = function(statusClass) {
      _$body
        .removeClass(_LOADING)
        .addClass(statusClass);
      setTimeout(_closeWindow, 2000);
    },


    // Handlers
    // ---------------------------------------------------------------------

    _handleSaveClick = function() {
      _$save.blur();
      if (!_$body.hasClass(_DUPLICATE) && !_$body.hasClass(_BLACKLIST)) {
        _addLink();
      }
    },

    _handleEndShake = function(e) {
      e.target.removeClass('shake');
    },

    _handleDeleteClick = function() {
      _$body
        .removeClass(_DUPLICATE)
        .addClass(_LOADING);

      _socket.emit(_DELETE_ENTRY, {
        slug:       localStorage.slug,
        publicSlug: localStorage.publicSlug,
        id:         _$delete.data('id')
      });
    },

    _handleKeyDown = function(e) {
      // react to enter, cmd+enter and escape 
      // on enter in link-mode: save changes
      if (!_isText && e.keyCode === _ENTER) {
        _saveChanges();      
      } else if (!_isText && e.keyCode === _ENTER && e.metaKey) {
        _$save.click();
      } else if (e.keyCode === _ESCAPE) {
        window.close();
      }
    },

    _handleTextOnlyChange = function() {
      // on text-only change: switch body class and transfer value to new field
      _isText = $(this).is(':checked');
      _$body.toggleClass(_TEXT_ONLY, _isText);
      _transferValue();
    },

    _handleFindDuplicate = function(data) {
      _$body
        .removeClass(_LOADING)
        .addClass(_DUPLICATE);

      _$delete.data('id', data.id);
    },

    _handleAddLinkSuccess = function() {
      _completeAndClose(!_isText ? _SUCCESS_LINK : _SUCCESS_TEXT);
    },

    _handleDeleteEntrySuccess = function(data) {
      if (data.id === _$delete.data('id')) {
        _completeAndClose(_DELETE);
      }
    },


    // Helper functions
    // ---------------------------------------------------------------------

    _closeWindow = function() {
      window.close();
    },

    _addLink = function() {
      var $input = _isText ? _$text : _$title,
          val    = $.trim($input.val());

      // if empty value: shake input
      if (val === '') {
        _shake($input);
        return;
      }

      _$body.addClass(_LOADING);
      _socket.emit(_ADD_LINK, {
        slug:   localStorage.slug,
        title:  val,
        url:    _isText ? false : _url,
        isText: _isText ? 1 : 0
      });
    },

    _shake = function($element) {
      $element
        .on('webkitAnimationEnd animationEnd animationend', _handleEndShake)
        .addClass('shake');
    },

    _saveChanges = function() {
      if (_$body.hasClass(_DUPLICATE)) {
        _$delete.click();
      } else {
        _$save.click();
      }
    },

    _transferValue = function() {
      var $old = _isText ? _$title : _$text,
          $new = _isText ? _$text  : _$title;
      $new.val($old.val());
    },

    _showWarning = function() {
      _$body.addClass(_EMPTY_SLUG);
      $('#link-options').prop('href', chrome.extension.getURL('options.html'));
    },

    _getTabData = function(tab) {
      _title = tab.title;
      _url   = tab.url;

      // don't save links from blacklist
      if (!!localStorage.blacklist) {
        localStorage.blacklist
          .split('\n')
          .some(_checkAgainstBlacklist);
      }

      // on live-shownotes make changes for text-only entry
      if (_url.split('/')[4] === localStorage.publicSlug) {
        _$body.addClass(_TEXT_ONLY);
        _isText = true;

      // link is on the blacklist and the option text entry in popup is activ
      } else if (_blacklist && localStorage.showTextOnly){
        _$body.addClass(_TEXT_ONLY, _TEXT_ONLY_BLACKLIST);
      
      // fill input with title and prevent saving if on blacklist
      } else {
        _$title.val(_title);

        //show blacklist overlay
        if(_blacklist && !localStorage.showTextOnly)
          _$body.addClass(_BLACKLIST);    

        // show text-only checkbox
        if (!_isText && localStorage.showTextOnly) {
          _$body.addClass(_TEXT_ONLY_ALLOWED);
        }
      }

      _blacklist = false;
    },

    _checkAgainstBlacklist = function(entry) {
      if (entry === _url || entry + '/' === _url || entry === _url + '/') {
        _blacklist = true;
        return true;
      }
    },


    // Events
    // ---------------------------------------------------------------------

    _bindEvents = function() {
      // add link/text and show loading state when submit button is clicked
      _$save.on('click', _handleSaveClick);

      // delete entry when button is clicked
      _$delete.on('click', _handleDeleteClick);

      // close popup when clicking on cancel button
      _$close.on('click', _closeWindow);

      $(window).on('keydown', _handleKeyDown);
      _$textOnly.on('change', _handleTextOnlyChange);
    },

    _setUp = function() {
      // Link to Settings
      $('.link-settings').prop('href', chrome.extension.getURL('options.html'));

      if (typeof(localStorage.slug) === 'undefined') {
        _showWarning();
      } else {
        chrome.tabs.getSelected(null, _getTabData);

        // checks for duplicate
        _socket.emit(_OPEN_POPUP, {
          slug:   localStorage.slug,
          url:    _url,
          isText: _isText ? 1 : 0
        });
      }
    },

    _bindSocketEvents = function() {
      // prevent duplication
      _socket.on(_FIND_DUPLICATE, _handleFindDuplicate);

      // show success message and close window
      _socket.on(_ADD_LINK_SUCCESS, _handleAddLinkSuccess);
      _socket.on(_DELETE_ENTRY_SUCCESS, _handleDeleteEntrySuccess);
    };


  // Public
  // ---------------------------------------------------------------------

  module.init = function() {
    _bindEvents();
    _setUp();
    _bindSocketEvents();
  };

  return module;
})();

PopUp.init();
