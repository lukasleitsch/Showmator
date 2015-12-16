/*global io */
/*global chrome */

// TODO error handling (no slug found, duplicated slug on #submit-slug)
$(function() {

  // vars and functions
  // -----------------------------------------------------------------------------

  var baseUrl = 'http://localhost:63123',
      socket  = io.connect(baseUrl),

      hasShownotesClass = 'has-active-shownotes',
      noShownotesClass  = 'has-no-active-shownotes',

      $body       = $('body'),
      $slug       = $('#slug'),
      $submit     = $('#submit-slug'),
      $slugStatic = $('#slug-static'),
      $shortcut   = $('#shortcut'),
      $textOnly   = $('#text-only'),
      $blacklist  = $('#blacklist'),
      $title      = $('#title-shownotes'),
      $titleAlert = $('#title-shownotes-alert'),
      $delete     = $('#create-new'),

      noTitleText = $titleAlert.data('no-title'),

      publicSlug,


      // checks active status + inserts data if available + inserts shortcut
      init = function() {
        // TODO only bind socket.on-Event once
        socket.emit('requestStatus', {slug: localStorage.slug});
        socket.on('respondToStatus', function(data) {
          var slug;

          // if active: show extended form and replace title
          if (data.active) {
            toggleForm(true);
            $title.val(decode(data.title));
            $titleAlert.text(decode(data.title) || noTitleText);

            slug                    = localStorage.slug;
            publicSlug              = data.publicSlug;
            localStorage.publicSlug = publicSlug;

          // if new: generate slugs
          } else {
            toggleForm(false);

            slug       = randomSlug();
            publicSlug = randomSlug();

            $titleAlert.text(noTitleText);
            $title.val(''); // clear title fild after create new shownotes
          }

          // enter slug into fields
          $slug.val(slug);
          $slugStatic.text(slug);
          lastTitle = $title.val();

          // update href attributes for external links
          $('#html').prop('href', baseUrl + '/html/' + slug);
          $('#live').prop('href', baseUrl + '/live/' + publicSlug);
        });

        // insert shortcut, text-only-state and blacklist
        displayShortcut();
        $textOnly.prop('checked', !!localStorage.showTextOnly);
        if (typeof(localStorage.blacklist) != "undefined")
          $blacklist.val(localStorage.blacklist);
      },


      // renders create new form or options form
      toggleForm = function(hasShownotes) {
        $body
          .toggleClass(hasShownotesClass, hasShownotes)
          .toggleClass(noShownotesClass, !hasShownotes);
      },


      // read current shortcut and insert it as text
      displayShortcut = function() {
        chrome.commands.getAll(function(commands) {
          var hasShortcut = false;

          $.each(commands, function(key, val) {
            if (val.name == '_execute_browser_action' && val.shortcut !== '') {
              hasShortcut = true;
              $shortcut.text(val.shortcut.replace(/\+/g, ' + '));
            }
          });

          if (!hasShortcut)
            $shortcut.html('<em>' + $shortcut.data('no-shortcut') + '</em>');
        });
      },


      // helper for slug generation
      randomSlug = function() {
        return Math.random().toString(36).substring(7);
      },


      // updates title on server
      saveTitleOnServer = function() {
        socket.emit('updateShownotesTitle', {
          slug: localStorage.slug, title: $title.val()
        });
      },


      // shows saved-tooltip and manages delays + validity checks
      initSavedTooltip = function($el, callback, showDelay, placement) {
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

      decode = function(text){
        return $("<div/>").html(text).text();
      };



  // bind events
  // -----------------------------------------------------------------------------

  // submit new slug and show more options
  $submit.click(function() {
    var slug    = $.trim($slug.val()).replace(/ /g,''),
        showTooltip = function(text, allowHtml) {
          $slug.tooltip({
            title:     text,
            placement: 'bottom',
            trigger:   'manual',
            html:      !!allowHtml
          }).tooltip('show')
          .one('keyup', function() {
            $slug.tooltip('destroy');
          });
        };
    
    // if empty: tooltip
    if (!slug) {
      showTooltip($slug.data('empty'));
    
    // if invalid: tooltip
    } else if (!/^[a-zA-Z0-9]+$/g.test(slug)) {
      showTooltip($slug.data('invalid'), true);

    // if valid: send event to server, save in localStorage and show active form
    } else {
      socket.emit('createNewShownotes', {slug: slug, publicSlug: publicSlug});
      localStorage.slug = slug;
      $slugStatic.text(slug);
      localStorage.publicSlug = publicSlug;
      toggleForm(true);
      // TODO no need for status requesting, just do things for 'active shownotes'
      init();
    }
  });
  

  // trigger submit on enter
  $slug.keyup(function(e) {
    if (e.keyCode == 13)
      $submit.click();
  });


  // save title changes (only when nothing has changed after 1000ms)
  var lastTitle = '';
  $title.keyup(function() {
    var val = $(this).val();
    if (val == lastTitle)
      return;
    lastTitle = val;
    $titleAlert.text(val || noTitleText);
    initSavedTooltip($title, saveTitleOnServer);
  });


  // shortcut link (non-http doesn't work with a-tags)
  $('#link-to-shortcut-options').click(function(e) {
    e.preventDefault();
    chrome.tabs.create({url: 'chrome://extensions/configureCommands'});
  });

  // check for changed shortcut when window is activated
  $(window).focus(displayShortcut);


  // save text-only changes
  $textOnly.change(function() {
    var isChecked = $(this).is(':checked');
    if (isChecked)
      localStorage.showTextOnly = true;
    else
      localStorage.removeItem('showTextOnly');
    initSavedTooltip($textOnly, false, 200, 'top');
  });


  // save blacklist changes
  $blacklist.keyup(function() {
    if ($blacklist.val() == localStorage.blacklist)
      return;
    localStorage.blacklist = $blacklist.val();
    initSavedTooltip($blacklist);
  });


  // 'create new' button triggers new shownotes' init
  $delete.click(function(e) {
    e.preventDefault();

    if (window.confirm($delete.data('confirm'))) {
      localStorage.removeItem('slug');
      localStorage.removeItem('publicSlug');
      toggleForm(false);
      // TODO no need for status requesting, just do things for 'no active shownotes'
      init();
    }
  });

  $('#alert-link-create-new').click(function(e) {
    e.preventDefault();
    $body.animate({scrollTop: $body.outerHeight()});
  });


  // do it
  init();

  // clean old localStorage-items
  localStorage.removeItem('showTextonly'); // old: small letter 'o'
});
