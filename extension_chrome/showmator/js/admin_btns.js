/*global chrome */
/*global io */

/*global $ */

var adminBtns = (function() {

  var module = {},

  
  // Private
  // ---------------------------------------------------------------------

    // Variables
    // ---------------------------------------------------------------------

    _$hint,

    _slug,
    _isEditing  = false,
    _editedID   = 0,

    _$listContainer,
    _socket,


    // ListContainer Variables
    // ---------------------------------------------------------------------

    _$listContainerLi,
    _$listContainerLink,
    _$listContainerBtnWrap,
    _$listContainerEditIcon,
    _$listContainerDeleteIcon,
    _listContainerEntryId,


    // Handlers
    // ---------------------------------------------------------------------

    _handleMessageEvent = function(e) {
      if (e.source === window && 
        e.data.type &&
        e.data.type === 'showmatorAdminRequestFromPage')
      {
        _saveVarsForLaterAccess(e);
        _sendRequestToExtensionToReceiveSlug(e);
      }
    },

    _handleHintButtonClick = function() {
      // when closing hint: hide, destroy and never show again
      _$hint.slideUp(200, function() {
        localStorage.hideTextHint = true;
        _$hint.remove();
      });
    },

    _handleShortcutOptionsClick = function(e) {
      // link to shortcut options ('chrome://' is non-http and therefore doesn't work with a-tags)
      e.preventDefault();
      chrome.runtime.sendMessage({ type: 'showmatorConfigureShortcut' });
    },

    _handleListContainerButtonClick = function(e) {
      e.preventDefault();

      var $this = $(this);
      _setUpListContainerVars($this);

      // cancel editing on other entry if present
      if (_isEditing && _editedID > 0 && _listContainerEntryId !== _editedID) {
        _cancelOnEscape(false, true);
      }

      if ($this.hasClass('btn-edit')) {
        _editOrSave();
      }
      else {
        _deleteOrCancel();
      }
    },


    // Builders
    // ---------------------------------------------------------------------

    _buildHintHtml = function(shortcutHtml) {
      return  '<div id="add-text-hint" class="alert alert-warning alert-dismissible">' +
                '<button type="button" class="close" data-dismiss="alert"><span aria-hidden="true">&times;</span><span class="sr-only">Schließen</span></button>' +
                '<p><strong>Tipp:</strong> Um einen Texteintrag (ohne Link) hinzuzufügen, kannst du das Icon der Showmator-Erweiterung neben der Adressleiste klicken oder einen Tastatur-Shortcut' + shortcutHtml + ' verwenden. Den Shortcut kannst du <a href="chrome://extensions/configureCommands">hier</a> ändern.</p>' +
              '</div>';
    },

    _buildAdminHtml = function() {
      return  '<div class="admin-btn-wrapper">' +
                '<button class="btn btn-default btn-xs btn-edit"><span class="glyphicon glyphicon-pencil"></span></button>' +
                '<button class="btn btn-default btn-xs btn-delete"><span class="glyphicon glyphicon-trash"></span></button>' +
              '</div>';
    },


    // Helper functions
    // ---------------------------------------------------------------------

    _saveVarsForLaterAccess = function(e) {
      _$listContainer = $('#' + e.data.listContainerID);
      _socket  = io.connect(e.data.socketURL);
    },

    _sendRequestToExtensionToReceiveSlug = function(e) {
      chrome.runtime.sendMessage({
        type:       'showmatorAdminRequestFromScript',
        publicSlug: e.data.publicSlug
      }, _callbackWithReceivedSlugAndExtensionShortcut);
    },

    _callbackWithReceivedSlugAndExtensionShortcut = function(response) {
      _setUpHint(response.shortcut);
      _slug = response.slug;
      _addListContainerButtonClickHandler();
      _renderAdminButtons();
      _deliverAdminMarkupToWebpage();
    },       

    _setUpHint = function(shortcut) {
      if (!localStorage.hideTextHint) {
        _renderHintForAddingTextEntry(shortcut);
        _addHintClickListener();
      }
    },

    _renderHintForAddingTextEntry = function(shortcut) {
      var shortcutHtml = shortcut ? (' (<em>' + shortcut + '</em>') : '',
          html = _buildHintHtml(shortcutHtml);

      _$listContainer.before(html);
      _$hint = $('#add-text-hint');
    },

    _addHintClickListener = function() {
      _$hint.find('button').on('click', _handleHintButtonClick);
      _$hint.find('a').on('click', _handleShortcutOptionsClick);
    },

    _addListContainerButtonClickHandler = function() {
      _$listContainer.on('click', '.btn-edit, .btn-delete', _handleListContainerButtonClick);
    },        

    _saveOnEnter = function(e) {
      if (e.keyCode === 13) {
        e.preventDefault();
        _$listContainer.find('.editing').find('.btn-edit').click();
      }
    },

    _cancelOnEscape = function(e, forceCancel) {
      if (forceCancel || (!!e && e.which === 27)) {
        _$listContainer.find('.editing').find('.btn-delete').click();
      }
    },

    _setUpListContainerVars = function($element) {
      _$listContainerLi         = $element.closest('.entry');
      _$listContainerLink       = _$listContainerLi.find('.entry-text');
      _$listContainerBtnWrap    = $element.closest('.admin-btn-wrapper');
      _$listContainerEditIcon   = _$listContainerBtnWrap.find('.glyphicon-pencil, .glyphicon-ok');
      _$listContainerDeleteIcon = _$listContainerBtnWrap.find('.glyphicon-trash, .glyphicon-remove');
      _listContainerEntryId          = _$listContainerLi.prop('id').split('-')[1];
    },

    _toggleEditClasses = function() {
      _isEditing = !_isEditing;
      _editedID  = _isEditing ? _listContainerEntryId : 0;
      _$listContainerBtnWrap.toggleClass('editing');
      _$listContainerDeleteIcon.toggleClass('glyphicon-trash glyphicon-remove');
      _$listContainerEditIcon
        .toggleClass('glyphicon-pencil glyphicon-ok')
        .parent()
        .toggleClass('btn-default btn-primary');
    },

    _placeCursorToEnd = function(el) {
      var range = document.createRange(),
          sel   = window.getSelection(),
          node  = el.childNodes[0];

      range.setStart(node, node.length);
      // range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    },

    _enterEditMode = function() {
      var textBefore = _$listContainerLink
        .prop('contenteditable', true)
        .on('keydown.saveOnEnter', _saveOnEnter)
        .focus()
        .text();
      _$listContainerLink.data('text-before', textBefore);

      // vanilla JS because Esc on contenteditable does not work with
      // jQuery events
      document.addEventListener('keydown', _cancelOnEscape, true);

      _toggleEditClasses();

      _placeCursorToEnd(_$listContainerLink[0]);
    },

    _quitEditMode = function() {
      _$listContainerLink.prop('contenteditable', false)
        .off('keydown.saveOnEnter')
        .blur();
      document.removeEventListener('keydown', _cancelOnEscape, true);
      _toggleEditClasses();
    },

    _editOrSave = function() {
      // edit
      if (_$listContainerEditIcon.hasClass('glyphicon-pencil')) {
        _enterEditMode();
      }
      // save
      else {
        _quitEditMode();
        _socket.emit('updateEntryTitle', {
          id:     _listContainerEntryId,
          title:  _$listContainerLink.text(),
          slug:   _slug
        });
      }
    },

    _deleteOrCancel = function() {
      // delete
      // TODO text via data-attribute?
      if (_$listContainerDeleteIcon.hasClass('glyphicon-trash') && window.confirm('Wirklich löschen?')) {
        _socket.emit('deleteEntry', {
          slug: _slug,
          id:   _listContainerEntryId
        });
      }
      // cancel
      else if (_$listContainerDeleteIcon.hasClass('glyphicon-remove')) {
        _quitEditMode();
        _$listContainerLink.text(_$listContainerLink.data('text-before'));
      }
    },

    _renderAdminButtons = function() {
      _$listContainer
        .find('.entry-text')
        .after(_buildAdminHtml());
    },

    _deliverAdminMarkupToWebpage = function() {
      window.postMessage({
        type:       'showmatorAdminResponseFromScript',
        adminHtml:  _buildAdminHtml()
      }, '*');
    },

    _addEventListeners = function() {
      // Listen for request from web page.
      window.addEventListener('message', _handleMessageEvent, false);
    };

  // Public
  // ---------------------------------------------------------------------

  module.init = function() {
    _addEventListeners();
  };

  return module;
})();

adminBtns.init();