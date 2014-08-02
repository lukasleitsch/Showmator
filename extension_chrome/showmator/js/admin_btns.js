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
    
    // callback with received slug
    }, function(slug) {

      // markup for admin buttons
      var adminHtml = '<div class="admin-btn-wrapper">' +
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


      // deliver admin markup to webpage
      window.postMessage({
        type:      'showmatorAdminResponseFromScript',
        adminHtml: adminHtml
      }, '*');
    });
  }
}, false);
