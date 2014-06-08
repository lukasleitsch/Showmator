/*global io */
/*global chrome */

// TODO error handling (no slug found, duplicated slug on #submit-slug)
$(function() {

  // vars and functions
  // -----------------------------------------------------------------------------

  var baseUrl = 'http://localhost:63685',
      socket  = io.connect(baseUrl),

      extendedFormClass = 'has-active-shownotes',

      $body       = $('body'),
      $slug       = $('#slug'),
      $slugStatic = $('#slug-static'),
      $blacklist  = $('#blacklist'),
      $title      = $('#title-shownotes'),
      $titleAlert = $('#title-shownotes-alert'),

      noTitleText = $titleAlert.data('no-title'),

      publicSlug,


      // checks active status + inserts data if available + inserts shortcut
      init = function() {
        socket.emit('statusRequest', {slug: localStorage.slug});
        socket.on('statusResponse', function(data) {

          var slug;

          // if active: show extended form and replace title
          if (data.active) {
            $body.addClass(extendedFormClass);
            $title.val(data.title);
            $titleAlert.text(data.title || noTitleText);

            slug       = localStorage.slug;
            publicSlug = data.publicSlug;

          // if new: generate slugs
          } else {
            slug       = randomSlug();
            publicSlug = randomSlug();

            $titleAlert.text(noTitleText);

            $title.val(''); // clear title fild after create new shownotes
          }

          // enter slug into fields
          $slug.val(slug);
          $slugStatic.text(slug);

          // check blacklist
          if (typeof(localStorage.blacklist) != "undefined")
            $blacklist.val(localStorage.blacklist);

          // update href attributes for external links
          $('#html').prop('href', baseUrl + '/html/' + slug);
          $('#live').prop('href', baseUrl + '/live/' + publicSlug);
        });

        displayShortcut();
      },


      // read current shortcut and insert it as text
      displayShortcut = function() {
        chrome.commands.getAll(function(commands) {
          $.each(commands, function(key, val) {
            if (val.name == '_execute_browser_action' && val.shortcut !== '')
              $('#shortcut').text(val.shortcut);
          });
        });
      },


      // helper for slug generation
      randomSlug = function() {
        return Math.random().toString(36).substring(7);
      };



  // bind events
  // -----------------------------------------------------------------------------

  // submit new slug and show more options
  $('#submit-slug').click(function() {
    var slug = $.trim($slug.val()).replace(/ /g,'');
    
    if (!slug) {
      // TODO make tooltip
      $('#status').show().html("Bitte ein Kürzel eingeben!").delay(5000).fadeOut(3000);
    
    } else {
      // TODO make common request and wait for success response (so we can validate slug on server)
      socket.emit('new', {slug: slug, publicSlug: publicSlug});
      localStorage.slug = slug;
      $slugStatic.text(slug);
      $body.addClass(extendedFormClass);
    }
  });


  // save title changes (only when nothing has changed after 1000ms)
  var timer,
      saveDelay = 1000,
      saveTitleOnServer = function() {
        socket.emit('titleUpdated', {slug: localStorage.slug, title: $title.val()});
      };
  $title.keyup(function() {
    $titleAlert.text($(this).val());
    if (!!timer)
      clearTimeout(timer);
    timer = setTimeout(saveTitleOnServer, saveDelay);
  });


  // shortcut link (non-http doesn't work with a-tags)
  $('#link-to-shortcut-options').click(function(e) {
    e.preventDefault();
    chrome.tabs.create({url: 'chrome://extensions/configureCommands'});
  });

  // check for changed shortcut when window is activated
  $(window).focus(displayShortcut);


  // save blacklist changes
  $blacklist.keyup(function() {
    localStorage.blacklist = $(this).val();
  });


  // 'create new' button triggers new shownotes' init
  $('#create-new, #alert-link-create-new').click(function(e) {
    e.preventDefault();
    // localStorage.clear();
    localStorage.removeItem('slug');
    localStorage.removeItem('publicSlug');
    $body.removeClass(extendedFormClass);
    init();
  });


  // do it
  init();
});
