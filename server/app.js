/*global console */
/*global require */

// TODO FOREIGN KEY constraint failed: Insert entry without create shownotes

var Server = (function () {

  var module = {},


  // Vars
  // -------------------------------------------------------------------------

  _sqlite3,
  _sanitizer,
  _util,

  _FILE = 'data.db',



  // Helper
  // -----------------------------------------------------------------------------
  
  _openDB = function() {
    return new _sqlite3.Database(_FILE);
  },


  _emitError = function(client, err) {
    _util.log("genericError", err);
    client.emit("genericError");
  },


  _emitDuplicate = function(client, data, row) {
    _util.log('findDuplicate', data, row);
    client.emit('findDuplicate', {id: row.id});
  },


  _setupDB = function() {
    // create DB file
    var fs = require('fs');
    if (!fs.existsSync(_FILE)) {
      console.log('Creating DB file.');
      fs.openSync(_FILE, 'w');
    }

    // Create tables if not present
    var db = _openDB();
    db.serialize(function() {
      db.run('CREATE TABLE IF NOT EXISTS meta (slug TEXT PRIMARY KEY NOT NULL, startTime INTEGER, offset INTEGER, publicSlug TEXT, title TEXT)');
      db.run('CREATE TABLE IF NOT EXISTS data (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL, title TEXT, url TEXT, time INTEGER, isText INTEGER, FOREIGN KEY (slug) REFERENCES meta(slug))');
      db.run('PRAGMA foreign_keys = ON');
    });

    return db;
  },


  _registerListeners = function(io, db) {
    io.on('connection', function(client) { 
      _util.log(client.id, 'connected');
      // var db = _openDB();

      client.on('connectToLiveShownotes', function(publicSlug) {
        _connectToLiveShownotes(client, publicSlug);
      });
      client.on('requestStatus', function(data) {
        _requestStatus(client, db, data);
      });
      client.on('connectToHtmlExport', function(slug) {
        _connectToHtmlExport(client, slug);
      });
      client.on('createNewShownotes', function(data) {
        _createNewShownotes(client, db, data);
      });
      client.on('addLink', function(data) {
        _addLink(client, db, data);
      });
      client.on('updateEntryTitle', function(data) {
        _updateEntryTitle(client, db, data);
      });
      client.on('openPopup', function(data) {
        _openPopup(client, db, data);
      });
      client.on('updateShownotesTitle', function(data) {
        _updateShownotesTitle(client, db, data);
      });
      client.on('updateOffset', function(data) {
        _updateOffset(client, db, data);
      });
      client.on('deleteEntry', function(data) {
        _deleteEntry(client, db, io, data);
      });
      client.on('disconnect', function() {
        _disconnect(client);
      });
    });
  },


  // Client Actions
  // -----------------------------------------------------------------------------
  
  // Make clients join their rooms
  _connectToLiveShownotes = function (client, publicSlug) {
    _util.log('connectToLiveShownotes', publicSlug);
    client.publicSlug = publicSlug;
    client.join(publicSlug);
  },


  // Check status of shownotes
  _requestStatus = function(client, db, data) {
    _util.log('requestStatus', data);

    db.get('SELECT * FROM meta WHERE slug = ?', data.slug, function(err, row) {
      if (err) {
        _emitError(client, err);
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
  _connectToHtmlExport = function(client, slug) {
    _util.log('connectToHtmlExport', slug);
    client.join(slug); // currently only used for updateShownotesTitle
  },


  // Create new shownotes
  _createNewShownotes = function(client, db, data) {
    _util.log('createNewShownotes', data);

    db.run('INSERT INTO meta (slug, publicSlug) VALUES (? , ?)', 
      [_sanitizer.escape(data.slug), 
      _sanitizer.escape(data.publicSlug)], function(/*err, result*/) {
      client.publicSlug = data.publicSlug;
      _util.log('createdNewShownotes');
    });
  },


  // Add new entry
  _addLink = function(client, db, data) {
    _util.log('addLink', data);
    
    var time = new Date().getTime();

    db.get('SELECT * FROM data WHERE url = ? AND slug = ?', [data.url, data.slug], function(err, row) {
      if(err) {
        _emitError(client, err);
      }

      if (row && !row.isText) {
        _emitDuplicate(client, data, row);
        return;
      }

      db.get('SELECT startTime, offset, publicSlug FROM meta WHERE slug = ?', data.slug, function(err, row) {
        if(err) {
          _emitError(client, err);
        }

        if (row.startTime === null) {
          db.run('UPDATE meta SET startTime = ? WHERE slug = ?', [_sanitizer.escape(time), _sanitizer.escape(data.slug)]);
        }

        db.run('INSERT INTO data (slug, title, url, time, isText) VALUES (?, ?, ?, ?, ?)', 
          [_sanitizer.escape(data.slug), 
          _sanitizer.escape(data.title), 
          _sanitizer.escape(data.url), 
          parseInt(time), 
          !!data.isText], function(err/*, result*/) {
          if (err) {
            _emitError(client, err);
          
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
        });
      });
    });
  },


  // Update the entry title
  _updateEntryTitle = function(client, db, data) {
    _util.log('updateEntryTitle', data);

    db.run('UPDATE data SET title = ? WHERE id = ? AND slug = ?', 
      [_sanitizer.escape(data.title), 
      parseInt(data.id), 
      _sanitizer.escape(data.slug)], function(/*err, row*/) {
      db.get('SELECT publicSlug FROM meta WHERE slug = ?', data.slug, function(err, row) {
        client.broadcast.to(row.publicSlug).emit('updateEntryTitleSuccess', {
          title: _sanitizer.escape(data.title),
          id:    data.id
        });
      });
    });
  },


  // Check for duplicates when popup opens
  _openPopup = function(client, db, data) {
    _util.log('openPopup');
    
    client.isPopup = true;

    // only check if we don't have a text-only entry
    if (!data.isText) {
      db.get('SELECT id FROM data WHERE url = ? AND slug = ?', [data.url, data.slug], function(err, row) {
        if (row) {
          _emitDuplicate(client, data, row);
        }
      });
    }
  },


  // Set title of shownotes
  _updateShownotesTitle = function(client, db, data) {
    _util.log('updateShownotesTitle', data);
    
    db.run('UPDATE meta SET title = ? WHERE slug = ? AND publicSlug = ?', 
      [_sanitizer.escape(data.title), 
      _sanitizer.escape(data.slug), 
      _sanitizer.escape(client.publicSlug)], function() {
      if (this.changes === 1) {
        data.publicSlug = client.publicSlug;

        // publicSlug for live shownotes, private slug for html shownotes
        [client.publicSlug, data.slug].forEach(function(val) {
          client.broadcast.to(val).emit('updateShownotesTitleSuccess', {title: _sanitizer.escape(data.title)});
        });
      }
    });
  },


  // Set time offset
  _updateOffset = function(client, db, data) {
    _util.log('updateOffset', data.offset);
    db.run('UPDATE meta SET offset = ? WHERE slug = ?', [parseInt(data.offset), _sanitizer.escape(data.slug)]);
  },


  // Delete entry
  _deleteEntry = function(client, db, io, data) {
    _util.log('deleteEntry', data);
    
    db.run('DELETE FROM data WHERE id = ? AND slug = ?', 
      [parseInt(data.id), _sanitizer.escape(data.slug)], function(/*err, result*/) {
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
  _disconnect = function(client) {
    _util.log('disconnect', client.isPopup ? 'no slug (popup)' : client.publicSlug);
  };



  // Init
  // -------------------------------------------------------------------------

  module.init = function() {
    _sqlite3    = require('sqlite3').verbose();
    _sanitizer  = require('sanitizer');
    _util       = require('util');

    var db = _setupDB(),
        io = require('./router').init(db).getSocket();

    _registerListeners(io, db);
  };


  return module;

})();


Server.init();
