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
                      '</div>';

      // bind edit/delete events to admin buttons
      $result.on('click', '.btn-edit, .btn-delete', function(e) {
        e.preventDefault();
        var $this = $(this),
            $li   = $this.closest('.entry'),
            $link = $li.find('.entry-text'),
            id    = $li.prop('id').split('-')[1];

        // edit/save
        if ($this.hasClass('btn-edit')) {
          var $icon = $this.find('.glyphicon'),
              saveOnEnter = function(e) {
                if (e.keyCode == 13) {
                  e.preventDefault();
                  $this.click();
                }
              };

          // save
          if ($icon.hasClass('glyphicon-ok')) {
            var title = $link
                  .prop('contenteditable', false)
                  .off('keydown.saveOnEnter')
                  .blur()
                  .text();
            socket.emit('updateEntryTitle', {id: id, title: title, slug: slug});

          // edit
          } else {
            $link.prop('contenteditable', true)
              .focus()
              .on('keydown.saveOnEnter', saveOnEnter);
          }

          // switch icons (pencil/ok), btn class (default/primary) and
          // show/hide delete btn
          $this.parent().toggleClass('editing');
          $icon.toggleClass('glyphicon-pencil glyphicon-ok');
          $this.toggleClass('btn-default btn-primary');

        // delete
        } else {
          // TODO text via data-attribute?
          if (window.confirm('Wirklich löschen?')) {
            socket.emit('deleteEntry', {
              slug: slug,
              id:   id
            });
            $this.remove();
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
