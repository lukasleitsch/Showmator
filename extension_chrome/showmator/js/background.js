/*global chrome */

/*global $ */

var Background = (function() {

  var module = {},

    
  // Private
  // ---------------------------------------------------------------------

    // Variables
    // ---------------------------------------------------------------------

    _shortcut = '',


    // Handlers
    // ---------------------------------------------------------------------

    // delivers slug from extension to content script and opens popup
    _handleMessageEvent = function(request, sender, sendResponse) {
      if (request.type === 'showmatorAdminRequestFromScript' && request.publicSlug === localStorage.publicSlug) {
        sendResponse({
          slug:     localStorage.slug,
          shortcut: _shortcut
        });
      }
      else if (request.type === 'showmatorConfigureShortcut') {
        chrome.tabs.create({url: 'chrome://extensions/configureCommands'});
      }
    },


    // Helper functions
    // ---------------------------------------------------------------------

    _fetchShortcut = function(commands) {
      $.each(commands, function(key, val) {
        if (val.name === '_execute_browser_action' && val.shortcut !== '') {
          _shortcut = val.shortcut;
        }
      });
    },

    _setUp = function() {
      chrome.commands.getAll(_fetchShortcut);
      chrome.runtime.onMessage.addListener(_handleMessageEvent);
    };

  // Public
  // ---------------------------------------------------------------------

  module.init = function() {
    _setUp();
  };

  return module;
})();

Background.init();