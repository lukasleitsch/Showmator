function User(io, db, client) {

  // Vars
  // -----------------------------------------------------------------------------

  var _io,
      _db,
      _client,
      _sanitizer,
      _util,


  // Helper
  // -----------------------------------------------------------------------------

   _emitError = function(err) {
    _util.log("genericError", err);
    _client.emit("genericError");
  },


  _emitDuplicate = function(data, row) {
    _util.log('findDuplicate', data, row);
    _client.emit('findDuplicate', {id: row.id});
  },


  // Client Actions
  // -----------------------------------------------------------------------------

  // Make clients join their rooms
  _connectToLiveShownotes = function(publicSlug) {
    _util.log('connectToLiveShownotes', publicSlug);
    _client.publicSlug = publicSlug;
    _client.join(publicSlug);
  },


  // Check status of shownotes
  _requestStatus = function(data) {
    _util.log('requestStatus', data);

    db.get('SELECT * FROM meta WHERE slug = ?', data.slug, function(err, row) {
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
        _client.publicSlug = row.publicSlug;
      }

      _client.emit('respondToStatus', data);
      
      _util.log('respondToStatus', row ? _client.publicSlug : 'no rows (=no slug yet)', row);
    });
  },


  // Connecting to HTML-Export
  _connectToHtmlExport = function(slug) {
    _util.log('connectToHtmlExport', slug);
    _client.join(slug); // currently only used for updateShownotesTitle
  },


  // Create new shownotes
  _createNewShownotes = function(data) {
    _util.log('createNewShownotes', data);

    db.run('INSERT INTO meta (slug, publicSlug) VALUES (? , ?)', 
      [_sanitizer.escape(data.slug), 
      _sanitizer.escape(data.publicSlug)], function() {
      _client.publicSlug = data.publicSlug;
      _util.log('createdNewShownotes');
    });
  },


  // Add new entry
  _addLink = function(data) {
    _util.log('addLink', data);
    
    var time = new Date().getTime();

    db.get('SELECT * FROM data WHERE url = ? AND slug = ?', [data.url, data.slug], function(err, row) {
      if(err) {
        _emitError(err);
      }

      if (row && !row.isText) {
        _emitDuplicate(data, row);
        return;
      }

      db.get('SELECT startTime, offset, publicSlug FROM meta WHERE slug = ?', data.slug, function(err, row) {
        if (err) {
          _emitError(err);
        }

        if (row.startTime === null) {
          db.run('UPDATE meta SET startTime = ? WHERE slug = ?', [_sanitizer.escape(time), _sanitizer.escape(data.slug)]);
        }

        db.run('INSERT INTO data (slug, title, url, time, isText) VALUES (?, ?, ?, ?, ?)', 
          [_sanitizer.escape(data.slug), 
          _sanitizer.escape(data.title), 
          _sanitizer.escape(data.url), 
          parseInt(time), 
          !!data.isText], function(err) {
          if (err) {
            _emitError(err);
          
          } else {
            _util.log('addLinkSucces');
            _client.broadcast.to(row.publicSlug).emit('push', {
              id:     this.lastID,
              title:  _sanitizer.escape(data.title),
              url:    data.url,
              isText: data.isText,
              time:   time
            });
            _client.emit('addLinkSuccess');
          }
        });
      });
    });
  },


  // Update the entry title
  _updateEntryTitle = function(data) {
    _util.log('updateEntryTitle', data);

    db.run('UPDATE data SET title = ? WHERE id = ? AND slug = ?', 
      [_sanitizer.escape(data.title), 
      parseInt(data.id), 
      _sanitizer.escape(data.slug)], function() {
      db.get('SELECT publicSlug FROM meta WHERE slug = ?', data.slug, function(err, row) {
        _client.broadcast.to(row.publicSlug).emit('updateEntryTitleSuccess', {
          title: _sanitizer.escape(data.title),
          id:    data.id
        });
      });
    });
  },


  // Check for duplicates when popup opens
  _openPopup = function(data) {
    _util.log('openPopup');
    
    _client.isPopup = true;

    // only check if we don't have a text-only entry
    if (!data.isText) {
      db.get('SELECT id FROM data WHERE url = ? AND slug = ?', [data.url, data.slug], function(err, row) {
        if (row) {
          _emitDuplicate(data, row);
        }
      });
    }
  },


  // Set title of shownotes
  _updateShownotesTitle = function(data) {
    _util.log('updateShownotesTitle', data);
    
    db.run('UPDATE meta SET title = ? WHERE slug = ? AND publicSlug = ?', 
      [_sanitizer.escape(data.title), 
      _sanitizer.escape(data.slug), 
      _sanitizer.escape(_client.publicSlug)], function() {
      if (this.changes === 1) {
        data.publicSlug = _client.publicSlug;

        // publicSlug for live shownotes, private slug for html shownotes
        [_client.publicSlug, data.slug].forEach(function(val) {
          _client.broadcast.to(val).emit('updateShownotesTitleSuccess', {title: _sanitizer.escape(data.title)});
        });
      }
    });
  },


  // Set time offset
  _updateOffset = function(data) {
    _util.log('updateOffset', data.offset);
    db.run('UPDATE meta SET offset = ? WHERE slug = ?', [parseInt(data.offset), _sanitizer.escape(data.slug)]);
  },


  // Delete entry
  _deleteEntry = function(data) {
    _util.log('deleteEntry', data);
    
    db.run('DELETE FROM data WHERE id = ? AND slug = ?', 
      [parseInt(data.id), _sanitizer.escape(data.slug)], function() {
      if (this.changes === 1) {
        var emitEvent = function() {
          _io.in(data.publicSlug).emit('deleteEntrySuccess', {id: data.id});
          if (_client.isPopup) {
            _client.emit('deleteEntrySuccess', {id: data.id});
          }
          _util.log('deleteEntrySuccess', data);
        };

        if (data.publicSlug) {
          emitEvent();
        } else {
          db.get('SELECT publicSlug FROM meta WHERE slug = ?', data.slug, function(err, row) {
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
    _util.log('disconnect', _client.isPopup ? 'no slug (popup)' : _client.publicSlug);
  },


  // Listeners
  // -----------------------------------------------------------------------------
  
  _bindEvents = function() {
    _util.log(_client.id, 'connected');

    _client.on('connectToLiveShownotes', _connectToLiveShownotes);
    _client.on('requestStatus', _requestStatus);
    _client.on('connectToHtmlExport', _connectToHtmlExport);
    _client.on('createNewShownotes', _createNewShownotes);
    _client.on('addLink', _addLink);
    _client.on('updateEntryTitle', _updateEntryTitle);
    _client.on('openPopup', _openPopup);
    _client.on('updateShownotesTitle', _updateShownotesTitle);
    _client.on('updateOffset', _updateOffset);
    _client.on('deleteEntry', _deleteEntry);
    _client.on('disconnect', _disconnect);
  };


  // Init
  // -----------------------------------------------------------------------------
  
  _io     = io;
  _db     = db;
  _client = client;

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
