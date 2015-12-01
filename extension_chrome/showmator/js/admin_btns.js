/*global chrome */
/*global io */


// Render admin buttons
// -----------------------------------------------------------------------------

var $result, socket;


// listen for request from web page
window.addEventListener('message', function(event) {
  if (event.source == window && event.data.type &&
        event.data.type == 'showmatorAdminRequestFromPage') {
    
    // save vars for later access
    $result = $('#' + event.data.listContainerID);
    socket  = io.connect(event.data.socketURL);

    // send request to extension to receive slug
    chrome.runtime.sendMessage({
      type:       'showmatorAdminRequestFromScript',
      publicSlug: event.data.publicSlug
    
    // callback with received slug and extension shortcut
    }, function(resp) {
      

      // render hint for adding text-entry
      if (!localStorage.hideTextHint) {
        var shortcutHtml = resp.shortcut ? (' (<em>' + resp.shortcut + '</em>)') : '',
            html = '<div id="add-text-hint" class="alert alert-warning alert-dismissible">' +
                     '<button type="button" class="close" data-dismiss="alert"><span aria-hidden="true">&times;</span><span class="sr-only">Schließen</span></button>' +
                     '<p><strong>Tipp:</strong> Um einen Texteintrag (ohne Link) hinzuzufügen, kannst du das Icon der Showmator-Erweiterung neben der Adressleiste klicken oder einen Tastatur-Shortcut' + shortcutHtml + ' verwenden. Den Shortcut kannst du <a href="chrome://extensions/configureCommands">hier</a> ändern.</p>' +
                   '</div>';

        $result.before(html);

        var $hint = $('#add-text-hint');

        // when closing hint: hide, destroy and never show again
        $hint.find('button').click(function() {
          $hint.slideUp(200, function() {
            localStorage.hideTextHint = true;
            $hint.remove();
          });
        });

        // link to shortcut options ('chrome://' is non-http and therefore
        // doesn't work with a-tags)
        $hint.find('a').click(function(e) {
          e.preventDefault();
          chrome.runtime.sendMessage({type: "showmatorConfigureShortcut"});
        });
      }


      // vars and outer functions for admin buttons
      var slug     = resp.slug,
          adminHtml = '<div class="admin-btn-wrapper">' +
                        '<button class="btn btn-default btn-xs btn-edit"><span class="glyphicon glyphicon-pencil"></span></button>' +
                        '<button class="btn btn-default btn-xs btn-delete"><span class="glyphicon glyphicon-trash"></span></button>' +
                      '</div>',
          isEditing = false,
          editedID  = 0,

          saveOnEnter = function(e) {
            if (e.keyCode == 13) {
              e.preventDefault();
              $result.find('.editing').find('.btn-edit').click();
            }
          },
          
          cancelOnEscape = function(e, forceCancel) {
            if (forceCancel || (!!e && e.which == 27))
              $result.find('.editing').find('.btn-delete').click();
          };


      // bind edit/delete events to admin buttons
      $result.on('click', '.btn-edit, .btn-delete', function(e) {
        e.preventDefault();

        var $this = $(this),

            $li         = $this.closest('.entry'),
            $link       = $li.find('.entry-text'),
            $btnWrap    = $this.closest('.admin-btn-wrapper'),
            $editIcon   = $btnWrap.find('.glyphicon-pencil, .glyphicon-ok'),
            $deleteIcon = $btnWrap.find('.glyphicon-trash, .glyphicon-remove'),
            id          = $li.prop('id').split('-')[1],

            toggleEditClasses = function() {
              isEditing = !isEditing;
              editedID  = isEditing ? id : 0;
              $btnWrap.toggleClass('editing');
              $deleteIcon.toggleClass('glyphicon-trash glyphicon-remove');
              $editIcon.toggleClass('glyphicon-pencil glyphicon-ok')
                .parent().toggleClass('btn-default btn-primary');
            },

            placeCursorToEnd = function(el) {
              var range = document.createRange(),
                  sel   = window.getSelection(),
                  node  = el.childNodes[0];

              range.setStart(node, node.length);
              // range.collapse(true);
              sel.removeAllRanges();
              sel.addRange(range);
            },

            enterEditMode = function() {
              var textBefore = $link
                .prop('contenteditable', true)
                .on('keydown.saveOnEnter', saveOnEnter)
                .focus()
                .text();
              $link.data('text-before', textBefore);

              // vanilla JS because Esc on contenteditable does not work with
              // jQuery events
              document.addEventListener('keydown', cancelOnEscape, true);

              toggleEditClasses();

              placeCursorToEnd($link[0]);
            },

            quitEditMode = function() {
              $link.prop('contenteditable', false)
                .off('keydown.saveOnEnter')
                .blur();
              document.removeEventListener('keydown', cancelOnEscape, true);
              toggleEditClasses();
            };


        // cancel editing on other entry if present
        if (isEditing && editedID > 0 && id != editedID)
          cancelOnEscape(false, true);


        // edit/save
        if ($this.hasClass('btn-edit')) {
          
          // edit
          if ($editIcon.hasClass('glyphicon-pencil')) {
            enterEditMode();

          // save
          } else {
            quitEditMode();
            socket.emit('updateEntryTitle', {
              id:    id,
              title: $link.text(),
              slug:  slug
            });
          }

        // delete/cancel
        } else {

          // delete
          // TODO text via data-attribute?
          if ($deleteIcon.hasClass('glyphicon-trash') && window.confirm('Wirklich löschen?')) {
            socket.emit('deleteEntry', {
              slug: slug,
              id:   id
            });

          // cancel
          } else if ($deleteIcon.hasClass('glyphicon-remove')) {
            quitEditMode();
            $link.text($link.data('text-before'));
          }
        }


      // render admin buttons
      }).find('.entry-text')
      .after(adminHtml);


      // deliver admin markup to webpage (so the page can add the buttons to
      // incoming links)
      window.postMessage({
        type:      'showmatorAdminResponseFromScript',
        adminHtml: adminHtml
      }, '*');
    });
  }
}, false);
