function User(io, db, client) {

  // Vars
  // -----------------------------------------------------------------------------

  var _sanitizer,
      _util,


  // Helper
  // -----------------------------------------------------------------------------

   _emitError = function(err) {
    _util.log("genericError", err);
    client.emit("genericError");
  },


  _emitDuplicate = function(data, row) {
    _util.log('findDuplicate', data, row);
    client.emit('findDuplicate', {id: row.id});
  },


  // Client Actions
  // -----------------------------------------------------------------------------

  // Make clients join their rooms
  _connectToLiveShownotes = function(publicSlug) {
    _util.log('connectToLiveShownotes', publicSlug);
    client.publicSlug = publicSlug;
    client.join(publicSlug);
  },


  // Check status of shownotes
  _requestStatus = function(data) {
    _util.log('requestStatus', data);

    db.getMetaFromSlug(data.slug, function(err, row) {
      if (err) {
        _emitError(err);
      }

      var data = {};
      
      if (row) {
        data = {
          active:     true,
          publicSlug: row.publicSlug,
          title:      row.title
        };
        client.publicSlug = row.publicSlug;
      }

      client.emit('respondToStatus', data);
      
      _util.log('respondToStatus', row ? client.publicSlug : 'no rows (=no slug yet)', row);
    });
  },


  // Connecting to HTML-Export
  _connectToHtmlExport = function(slug) {
    _util.log('connectToHtmlExport', slug);
    client.join(slug); // currently only used for updateShownotesTitle
  },


  // Create new shownotes
  _createNewShownotes = function(data) {
    _util.log('createNewShownotes', data);

    var slug       = _sanitizer.escape(data.slug),
        publicSlug = _sanitizer.escape(data.publicSlug);
    db.createNewShownotes(slug, publicSlug, function() {
      client.publicSlug = data.publicSlug;
      _util.log('createdNewShownotes');
    });
  },


  // Add new entry
  _addLink = function(data) {
    _util.log('addLink', data);
    
    var time = new Date().getTime();

    // TODO sanitize slug right here or delete it in `updateStartTime`
    db.getDuplicate(data.url, data.slug, function(err, row) {
      if (err) {
        _emitError(err);
      }

      if (row && !row.isText) {
        _emitDuplicate(data, row);
        return;
      }

      db.getMetaFromSlug(data.slug, function(err, row) {
        if (err) {
          _emitError(err);
        }

        if (row.startTime === null) {
          var startTime = _sanitizer.escape(time),
              slug      = _sanitizer.escape(data.slug);
          db.updateStartTime(startTime, slug);
        }

        db.createShownotesEntry({
          slug:     _sanitizer.escape(data.slug),
          title:    _sanitizer.escape(data.title), 
          url:      _sanitizer.escape(data.url), 
          time:     parseInt(time), 
          isText:   !!data.isText,
          callback: function(err) { 
            if (err) {
              _emitError(err);
            
            } else {
              _util.log('addLinkSucces');
              client.broadcast.to(row.publicSlug).emit('push', {
                id:     this.lastID,
                title:  _sanitizer.escape(data.title),
                url:    data.url,
                isText: data.isText,
                time:   time
              });
              client.emit('addLinkSuccess');
            }
          }
        });
      });
    });
  },


  // Update the entry title
  _updateEntryTitle = function(data) {
    _util.log('updateEntryTitle', data);

    var title = _sanitizer.escape(data.title),
        id    = parseInt(data.id),
        slug  = _sanitizer.escape(data.slug);

    db.updateEntryTitle(title, id, slug, function(publicSlug) {
        client.broadcast.to(publicSlug).emit('updateEntryTitleSuccess', {
          title: title,
          id:    id
        });
      // });
    });
  },


  // Check for duplicates when popup opens
  _openPopup = function(data) {
    _util.log('openPopup');
    
    client.isPopup = true;

    // only check if we don't have a text-only entry
    if (!data.isText) {
      db.getDuplicate(data.url, data.slug, function(err, row) {
        if (row) {
          _emitDuplicate(data, row);
        }
      });
    }
  },


  // Set title of shownotes
  _updateShownotesTitle = function(data) {
    _util.log('updateShownotesTitle', data);
    
    var title      = _sanitizer.escape(data.title),
        slug       = _sanitizer.escape(data.slug),
        publicSlug = _sanitizer.escape(client.publicSlug);

    db.updateShownotesTitle(title, slug, publicSlug, function() {
      // TODO `this` is correct in here?
      if (this.changes === 1) {
        // TODO what is this for?
        data.publicSlug = client.publicSlug;

        // publicSlug for live shownotes, private slug for html shownotes
        [client.publicSlug, data.slug].forEach(function(val) {
          client.broadcast.to(val).emit('updateShownotesTitleSuccess', {title: title});
        });
      }
    });
  },


  // Set time offset
  _updateOffset = function(data) {
    _util.log('updateOffset', data.offset);
    db.updateOffset(parseInt(data.offset), _sanitizer.escape(data.slug));
  },


  // Delete entry
  _deleteEntry = function(data) {
    _util.log('deleteEntry', data);
    
    db.deleteEntry(parseInt(data.id), _sanitizer.escape(data.slug), function() {
      // TODO `this` is correct in here?        
      if (this.changes === 1) {
        var emitEvent = function() {
          io.in(data.publicSlug).emit('deleteEntrySuccess', {id: data.id});
          if (client.isPopup) {
            client.emit('deleteEntrySuccess', {id: data.id});
          }
          _util.log('deleteEntrySuccess', data);
        };

        if (data.publicSlug) {
          emitEvent();
        } else {
          db.getMetaFromSlug(data.slug, function(err, row) {
          // db.get('SELECT publicSlug FROM meta WHERE slug = ?', data.slug, function(err, row) {
            data.publicSlug = row.publicSlug;
            emitEvent();
          });
        }

      } else {
        _util.log('no entries found for deleteEntry', data);
      }
    });
  },


  // Client disconnected
  _disconnect = function() {
    _util.log('disconnect', client.isPopup ? 'no slug (popup)' : client.publicSlug);
  },


  // Listeners
  // -----------------------------------------------------------------------------
  
  _bindEvents = function() {
    _util.log(client.id, 'connected');

    client.on('connectToLiveShownotes', _connectToLiveShownotes);
    client.on('requestStatus', _requestStatus);
    client.on('connectToHtmlExport', _connectToHtmlExport);
    client.on('createNewShownotes', _createNewShownotes);
    client.on('addLink', _addLink);
    client.on('updateEntryTitle', _updateEntryTitle);
    client.on('openPopup', _openPopup);
    client.on('updateShownotesTitle', _updateShownotesTitle);
    client.on('updateOffset', _updateOffset);
    client.on('deleteEntry', _deleteEntry);
    client.on('disconnect', _disconnect);
  };


  // Init
  // -----------------------------------------------------------------------------
  
  _sanitizer = require('sanitizer');
  _util      = require('util');

  _bindEvents();
}


// Export
// -----------------------------------------------------------------------------

module.exports = {
  init: function(io, db) {
    return function(client) {
      new User(io, db, client);
    };
  }
};
