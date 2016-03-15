/*global io */
/*global chrome */

// TODO error handling (no slug found, duplicated slug on #submit-slug)
var Options = (function () {

  var module = {},

  // Vars
  // -------------------------------------------------------------------------

  _BASE_URL = 'http://localhost:63123',
  _socket   = io.connect(_BASE_URL),

  _publicSlug,

  _lastTitle = '',
  _noTitleText,

  _$body,
  _$slug,
  _$submit,
  _$slugStatic,
  _$shortcut,
  _$textOnly,
  _$blacklist,
  _$title,
  _$titleAlert,
  _$delete,


  _cacheElements = function() {
    _$body       = $('body');
    _$slug       = $('#slug');
    _$submit     = $('#submit-slug');
    _$slugStatic = $('#slug-static');
    _$shortcut   = $('#shortcut');
    _$textOnly   = $('#text-only');
    _$blacklist  = $('#blacklist');
    _$title      = $('#title-shownotes');
    _$titleAlert = $('#title-shownotes-alert');
    _$delete     = $('#create-new');

    _noTitleText = _$titleAlert.data('no-title');
  },



  // Helpers
  // ---------------------------------------------------------------------------


  // helper for slug generation
  _randomSlug = function() {
    return Math.random().toString(36).substring(7);
  },

  _decode = function(text){
    return $("<div/>").html(text).text();
  },



  // Actions
  // -----------------------------------------------------------------------------
  
  // when receiving response from server: show corresponding form
  _showActiveOrNewForm = function(data) {
    var slug;

    // if active: show extended form and replace title
    if (data.active) {
      _toggleForm(true);
      _$title.val(_decode(data.title));
      _$titleAlert.text(_decode(data.title) || _noTitleText);

      slug                    = localStorage.slug;
      _publicSlug              = data.publicSlug;
      localStorage.publicSlug = _publicSlug;

    // if new: generate slugs
    } else {
      _toggleForm(false);

      slug       = _randomSlug();
      _publicSlug = _randomSlug();

      _$titleAlert.text(_noTitleText);
      _$title.val(''); // clear title fild after create new shownotes
    }

    // enter slug into fields
    _$slug.val(slug);
    _$slugStatic.text(slug);
    _lastTitle = _$title.val();

    // update href attributes for external links
    $('#html').prop('href', _BASE_URL + '/html/' + slug);
    $('#live').prop('href', _BASE_URL + '/live/' + _publicSlug);
  },


  // renders create new form or options form
  _toggleForm = function(hasShownotes) {
    var hasShownotesClass = 'has-active-shownotes',
        noShownotesClass  = 'has-no-active-shownotes';
    _$body
      .toggleClass(hasShownotesClass, hasShownotes)
      .toggleClass(noShownotesClass, !hasShownotes);
  },


  // read current shortcut and insert it as text
  _displayShortcut = function() {
    chrome.commands.getAll(function(commands) {
      var hasShortcut = false;

      $.each(commands, function(key, val) {
        if (val.name == '_execute_browser_action' && val.shortcut !== '') {
          hasShortcut = true;
          _$shortcut.text(val.shortcut.replace(/\+/g, ' + '));
        }
      });

      if (!hasShortcut)
        _$shortcut.html('<em>' + _$shortcut.data('no-shortcut') + '</em>');
    });
  },


  // shortcut link (non-http doesn't work with a-tags)
  _openShortcutDialog = function(e) {
    e.preventDefault();
    chrome.tabs.create({url: 'chrome://extensions/configureCommands'});
  },


  // scroll to delete link
  _scrollToBottom = function(e) {
    e.preventDefault();
    _$body.animate({scrollTop: _$body.outerHeight()});
  },


  // shows saved-tooltip and manages delays + validity checks
  _initSavedTooltip = function($el, callback, showDelay, placement) {
    showDelay = showDelay || 1000;

    var hideDelay = 3000,
        ts        = new Date().getTime(),
        isValid   = function() {
          return $el.data('created-ts') == ts;
        };

    // destroy current tooltip + save creation timestamp for validity check
    $el.tooltip('destroy').data('created-ts', ts);

    // if still valid after 1s delay: callback + show new tooltip
    window.setTimeout(function() {
      if (!isValid())
        return;

      if (typeof callback == 'function')
        callback();

      $el.tooltip({
        title:     '✔ Gespeichert',
        placement: placement || 'right',
        trigger:   'manual',
        container: 'body'
      }).tooltip('show');
      
      // if still valid after 2s delay: destroy tooltip
      window.setTimeout(function() {
        if (isValid())
          $el.tooltip('destroy');
      }, hideDelay);

    }, showDelay);
  },


  // show tooltip for empty or invalid slug
  _showTooltip = function(text, allowHtml) {
    _$slug.tooltip({
      title:     text,
      placement: 'bottom',
      trigger:   'manual',
      html:      !!allowHtml
    }).tooltip('show')
    .one('keyup', function() {
      _$slug.tooltip('destroy');
    });
  },


  // submit new slug and show more options
  _submitSlug = function() {
    var slug = $.trim(_$slug.val()).replace(/ /g,'');
    
    // if empty: tooltip
    if (!slug) {
      _showTooltip(_$slug.data('empty'));
    
    // if invalid: tooltip
    } else if (!/^[a-zA-Z0-9]+$/g.test(slug)) {
      _showTooltip(_$slug.data('invalid'), true);

    // if valid: send event to server, save in localStorage and show active form
    } else {
      _socket.emit('createNewShownotes', {slug: slug, publicSlug: _publicSlug});
      localStorage.slug = slug;
      _$slugStatic.text(slug);
      localStorage.publicSlug = _publicSlug;
      _toggleForm(true);
      // TODO no need for status requesting, just do things for 'active shownotes'
      module.init();
    }
  },


  // trigger submit on enter
  _triggerSubmitOnEnter = function(e) {
    if (e.keyCode == 13){
      _$submit.click();
    }
  },


  // save title changes (only when nothing has changed after 1000ms)
  _saveTitle = function() {
    var val = $(this).val();
    if (val == _lastTitle){
      return;
    }
    _lastTitle = val;
    _$titleAlert.text(val || _noTitleText);
    _initSavedTooltip(_$title, _saveTitleOnServer);
  },


  // updates title on server
  _saveTitleOnServer = function() {
    _socket.emit('updateShownotesTitle', {
      slug: localStorage.slug, title: _$title.val()
    });
  },


  // save text-only changes
  _saveTextOnlyChange = function() {
    var isChecked = $(this).is(':checked');
    if (isChecked)
      localStorage.showTextOnly = true;
    else
      localStorage.removeItem('showTextOnly');
    _initSavedTooltip(_$textOnly, false, 200, 'top');
  },


  // save blacklist changes
  _saveBlacklistChanges = function() {
    if (_$blacklist.val() == localStorage.blacklist)
      return;
    localStorage.blacklist = _$blacklist.val();
    _initSavedTooltip(_$blacklist);
  },


  // 'create new' button triggers new shownotes' init
  _deleteAndReInitShownotes = function(e) {
    e.preventDefault();

    if (window.confirm(_$delete.data('confirm'))) {
      localStorage.removeItem('slug');
      localStorage.removeItem('publicSlug');
      _toggleForm(false);
      // TODO no need for status requesting, just do things for 'no active shownotes'
      module.init();
    }
  },



  // Events
  // ---------------------------------------------------------------------------

  // bind events
  _bindEvents = function() {
    _$submit.click(_submitSlug);
    _$slug.keyup(_triggerSubmitOnEnter);
    _$title.keyup(_saveTitle);
    $('#link-to-shortcut-options').click(_openShortcutDialog);
    $(window).focus(_displayShortcut); // check for changed shortcut when window is activated
    _$textOnly.change(_saveTextOnlyChange);
    _$blacklist.keyup(_saveBlacklistChanges);
    _$delete.click(_deleteAndReInitShownotes);
    $('#alert-link-create-new').click(_scrollToBottom);
  };



  // Init
  // ---------------------------------------------------------------------------

  module.init = function() {
    _cacheElements();

    // TODO only bind socket.on-Event once
    _socket.emit('requestStatus', {slug: localStorage.slug});
    _socket.on('respondToStatus', _showActiveOrNewForm);

    // insert shortcut, text-only-state and blacklist
    _displayShortcut();
    _$textOnly.prop('checked', !!localStorage.showTextOnly);
    if (typeof(localStorage.blacklist) != "undefined") {
      _$blacklist.val(localStorage.blacklist);
    }
  
    _bindEvents();
  };



  return module;

})();



$(function() {
  Options.init();
});