/*global console */
/*global require */

// TODO FOREIGN KEY constraint failed: Insert entry without create shownotes

var Server = (function (){

  var module = {},

  // Private
  // -------------------------------------------------------------------------

  _express   = require('express'),
  _app       = _express(),
  _server    = require('http').createServer(_app),
  _io        = require('socket.io').listen(_server, { log: false }),
  _sqlite3   = require("sqlite3").verbose(),
  _sanitizer = require('sanitizer'),
  _fs        = require("fs"),
  _file      = "data.db",

  _openDB = function() {
    return new _sqlite3.Database(_file);
  },

  _render404 = function(res) {
    res.writeHead(404);
    res.write("Diese Shownotes existieren nicht.");
    res.end();
  },

  _log = function() {
    var args = [_formattedDate()/*, client.id*/];
    for (var key in arguments)
      args.push(arguments[key]);
    console.log.apply(undefined, args);
  },

  _formattedDate = function() {
    var now = new Date(),
        padZero = function(num) {
          return num < 10 ? "0" + num : num;
        };
    return padZero(now.getDate()) + '.' +
           padZero(now.getMonth() + 1) + '.' +
           now.getUTCFullYear() + ' - ' +
           now.toLocaleTimeString();
  },

  _emitError = function(client, err) {
    _log("genericError", err);
    client.emit("genericError");
  },

  _emitDuplicate = function(client, data, row) {
    _log('findDuplicate', data, row);
    client.emit('findDuplicate', {id: row.id});
  },

  // Make clients join their rooms
  _connectToLiveShownotes = function (client) {
    client.on('connectToLiveShownotes', function(publicSlug) {
      _log('connectToLiveShownotes', publicSlug);
      client.publicSlug = publicSlug;
      client.join(publicSlug);
    });
  },

  // Check status of shownotes
  _requestStatus = function(client, db) {
    client.on('requestStatus', function(data) {
      _log('requestStatus', data);

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
          client.publicSlug = row.publicSlug;
        }

        client.emit('respondToStatus', data);
        
        _log('respondToStatus', row ? client.publicSlug : 'no rows (=no slug yet)', row);
      });
    });
  },

  // Connecting to HTML-Export
  _connectToHtmlExport = function(client) {
    client.on('connectToHtmlExport', function(slug) {
      _log('connectToHtmlExport', slug);
      client.join(slug); // currently only used for updateShownotesTitle
    });
  },

  // Create new shownotes
  _createNewShownotes = function(client, db) {
    client.on('createNewShownotes', function(data) {
      _log('createNewShownotes', data);

      db.run('INSERT INTO meta (slug, publicSlug) VALUES (? , ?)', 
        [_sanitizer.escape(data.slug), 
        _sanitizer.escape(data.publicSlug)], function(/*err, result*/) {
        client.publicSlug = data.publicSlug;
        _log('createdNewShownotes');
      });
    });
  },

  // Add new entry
  _addLink = function(client, db) {
    client.on('addLink', function(data) {
      _log('addLink', data);
      
      var time = new Date().getTime();

      db.get('SELECT * FROM data WHERE url = ? AND slug = ?', [data.url, data.slug], function(err, row) {
        if(err) {
          _emitError(err);
        }

        if (row && !row.isText) {
          _emitDuplicate(data, row);
          db.close();
          return;
        }

        db.get('SELECT startTime, offset, publicSlug FROM meta WHERE slug = ?', data.slug, function(err, row) {
          if(err) {
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
            !!data.isText], function(err/*, result*/) {
            if (err) {
              _emitError(err);
            
            } else {
              _log('addLinkSucces');
              client.broadcast.to(row.publicSlug).emit('push', {
                id:     this.lastID,
                title:  _sanitizer.escape(data.title),
                url:    data.url,
                isText: data.isText,
                time:   time
              });
              client.emit('addLinkSuccess');
            }

            db.close();
          });
        });
      });
    });
  },

  // Update the entry title
  _updateEntryTitle = function(client, db) {
    client.on('updateEntryTitle', function(data) {
      _log('updateEntryTitle', data);

      db.run('UPDATE data SET title = ? WHERE id = ? AND slug = ?', 
        [_sanitizer.escape(data.title), 
        parseInt(data.id), 
        _sanitizer.escape(data.slug)], function(/*err, row*/) {
        db.get('SELECT publicSlug FROM meta WHERE slug = ?', data.slug, function(err, row) {
          client.broadcast.to(row.publicSlug).emit('updateEntryTitleSuccess', {title: _sanitizer.escape(data.title), id: data.id});
        });
      });
    });
  },

  // Check for duplicates when popup opens
  _openPopup = function(client, db) {
    client.on('openPopup', function(data) {
      _log('openPopup');
      
      client.isPopup = true;

      // only check if we don't have a text-only entry
      if (!data.isText) {
        db.get('SELECT id FROM data WHERE url = ? AND slug = ?', [data.url, data.slug], function(err, row) {
          if (row) {
            _emitDuplicate(data, row);
          }
        });
      }
    });
  },

  // Set title of shownotes
  _updateShownotesTitle = function(client, db){
    client.on('updateShownotesTitle', function(data) {
      _log('updateShownotesTitle', data);
      
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
    });
  },

  // Set time offset
  _updateOffset = function(client, db) {
    client.on('updateOffset', function(data) {
      _log('updateOffset', data.offset);
      db.run('UPDATE meta SET offset = ? WHERE slug = ?', [parseInt(data.offset), _sanitizer.escape(data.slug)]);
    });
  },

  // Delete entry
  _deleteEntry = function(client, db) {
    client.on('deleteEntry', function(data) {
      _log('deleteEntry', data);
      
      db.run('DELETE FROM data WHERE id = ? AND slug = ?', 
        [parseInt(data.id), _sanitizer.escape(data.slug)], function(/*err, result*/) {
        if (this.changes === 1) {
          var emitEvent = function() {
            _io.in(data.publicSlug).emit('deleteEntrySuccess', {id: data.id});
            if (client.isPopup) {
              client.emit('deleteEntrySuccess', {id: data.id});
            }
            _log('deleteEntrySuccess', data);
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
          _log('no entries found for deleteEntry', data);
        }
      });
    });
  },

  // Client disconnected
  _disconnect = function(client, db) {
    client.on('disconnect', function() {
      _log('disconnect', client.isPopup ? 'no slug (popup)' : client.publicSlug);
      if (!client.isPopup) {
        db.close();
      }
    });    
  },

  // Live shownotes site
  _liveShownotes = function(db) {
    _app.get('/live/:publicSlug', function(req, res) {
      var publicSlug = req.params.publicSlug;
      
      db.get('SELECT slug, title FROM meta WHERE publicSlug = ?', publicSlug, function(err, row1) {
        if (row1) {
          db.all('SELECT * FROM data WHERE slug = ? ORDER BY time DESC', row1.slug, function(err, rows) {
            console.log(rows);
            res.render('live.ejs', {
              items: rows,
              publicSlug: publicSlug,
              title: row1.title
            });
          });

        } else {
          _render404(res);
        }
      });
    });
  },

  // HTML export site
  _htmlExport = function(db) {
    _app.get('/html/:slug', function(req, res) {
      var slug = req.params.slug;
      
      db.get('SELECT startTime, offset, title FROM meta WHERE slug = ?', slug, function(err1, row1) {
        if (row1) {
          db.all('SELECT * FROM data WHERE slug = ? ORDER BY time', slug, function(err2, rows) {
            res.render('html.ejs', {
              items:  rows,
              start:  row1.startTime,
              slug:   slug,
              offset: row1.offset,
              title:  row1.title
            });
          });

        } else {
          _render404(res);
        }
      });
    });
  };



  // Public
  // -------------------------------------------------------------------------

  module.init = function() {
      var db = _openDB();

      if (!_fs.existsSync(_file)) {
        console.log("Creating DB file.");
        _fs.openSync(_file, "w");
      }

      _server.listen(63123);

      // Create tables if not present
      db.serialize(function() {
        db.run('CREATE TABLE IF NOT EXISTS meta (slug TEXT PRIMARY KEY NOT NULL, startTime INTEGER, offset INTEGER, publicSlug TEXT, title TEXT)');
        db.run('CREATE TABLE IF NOT EXISTS data (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL, title TEXT, url TEXT, time INTEGER, isText INTEGER, FOREIGN KEY (slug) REFERENCES meta(slug))');
        db.run('PRAGMA foreign_keys = ON');
      });
  };

  module.on = function(){
    _io.on('connection', function(client) { 
      _log(client.id, 'connected');
      var db = _openDB();
      _connectToLiveShownotes(client);
      _requestStatus(client, db);
      _connectToHtmlExport(client);
      _createNewShownotes(client, db);
      _addLink(client, db);
      _updateEntryTitle(client, db);
      _openPopup(client, db);
      _updateShownotesTitle(client, db);
      _updateOffset(client, db);
      _deleteEntry(client, db);
      _disconnect(client, db);
    });
  };

  module.routes = function(){
    var db = _openDB();

    // Static files
    _app.use(_express.static('public'));

    _liveShownotes(db);
    _htmlExport(db);
  };

  return module;

})();

Server.init();
Server.on();
Server.routes();