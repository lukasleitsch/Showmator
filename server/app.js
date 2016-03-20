/*global console */
/*global require */

// TODO FOREIGN KEY constraint failed: Insert entry without create shownotes

var Server = (function (){

  var module = {},


  // Vars
  // -------------------------------------------------------------------------

  _sqlite3,
  _sanitizer,

  _FILE = 'data.db',



  // Helper
  // -----------------------------------------------------------------------------
  
  _openDB = function() {
    return new _sqlite3.Database(_FILE);
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


  _formattedDate = function(date) {
    var now = (date) ? new Date(date) : new Date(),
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
      _log(client.id, 'connected');
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

  // diff between now and a time
  _timeAgo = function(time) {
    var timeBetween = new Date().getTime() - time,
        diffDays    = Math.round(timeBetween / 86400000), // days
        diffHrs     = Math.round((timeBetween % 86400000) / 3600000), // hours
        diffMins    = Math.round(((timeBetween % 86400000) % 3600000) / 60000), // minutes
        result      = '';

    if (diffDays > 0) {
      result += diffDays + ' Tag(e) ';
    }

    if (diffMins > 0) {
      result += diffHrs + ' Stunde(n) ';
    }

    return result + diffMins + ' Minute(n)';
  },


  // Client Actions
  // -----------------------------------------------------------------------------
  
  // Make clients join their rooms
  _connectToLiveShownotes = function (client, publicSlug) {
    _log('connectToLiveShownotes', publicSlug);
    client.publicSlug = publicSlug;
    client.join(publicSlug);
  },


  // Check status of shownotes
  _requestStatus = function(client, db, data) {
    _log('requestStatus', data);

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
      
      _log('respondToStatus', row ? client.publicSlug : 'no rows (=no slug yet)', row);
    });
  },


  // Connecting to HTML-Export
  _connectToHtmlExport = function(client, slug) {
    _log('connectToHtmlExport', slug);
    client.join(slug); // currently only used for updateShownotesTitle
  },


  // Create new shownotes
  _createNewShownotes = function(client, db, data) {
    _log('createNewShownotes', data);

    db.run('INSERT INTO meta (slug, publicSlug) VALUES (? , ?)', 
      [_sanitizer.escape(data.slug), 
      _sanitizer.escape(data.publicSlug)], function(/*err, result*/) {
      client.publicSlug = data.publicSlug;
      _log('createdNewShownotes');
    });
  },


  // Add new entry
  _addLink = function(client, db, data) {
    _log('addLink', data);
    
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
        });
      });
    });
  },


  // Update the entry title
  _updateEntryTitle = function(client, db, data) {
    _log('updateEntryTitle', data);

    db.run('UPDATE data SET title = ? WHERE id = ? AND slug = ?', 
      [_sanitizer.escape(data.title), 
      parseInt(data.id), 
      _sanitizer.escape(data.slug)], function(/*err, row*/) {
      db.get('SELECT publicSlug FROM meta WHERE slug = ?', data.slug, function(err, row) {
        client.broadcast.to(row.publicSlug).emit('updateEntryTitleSuccess', {title: _sanitizer.escape(data.title), id: data.id});
      });
    });
  },


  // Check for duplicates when popup opens
  _openPopup = function(client, db, data) {
    _log('openPopup');
    
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
  },


  // Set time offset
  _updateOffset = function(client, db, data) {
    _log('updateOffset', data.offset);
    db.run('UPDATE meta SET offset = ? WHERE slug = ?', [parseInt(data.offset), _sanitizer.escape(data.slug)]);
  },


  // Delete entry
  _deleteEntry = function(client, db, io, data) {
    _log('deleteEntry', data);
    
    db.run('DELETE FROM data WHERE id = ? AND slug = ?', 
      [parseInt(data.id), _sanitizer.escape(data.slug)], function(/*err, result*/) {
      if (this.changes === 1) {
        var emitEvent = function() {
          io.in(data.publicSlug).emit('deleteEntrySuccess', {id: data.id});
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
  },


  // Client disconnected
  _disconnect = function(client) {
    _log('disconnect', client.isPopup ? 'no slug (popup)' : client.publicSlug);
  },



  // Routes
  // -----------------------------------------------------------------------------

  // Live shownotes site
  _initRouteForliveShownotes = function(app, db) {
    app.get('/live/:publicSlug', function(req, res) {
      var publicSlug = req.params.publicSlug;
      
      db.all('SELECT publicSlug, id, meta.title AS shownotes_title, data.title, url, time, isText FROM meta, data WHERE meta.slug = data.slug AND publicSlug = ? ORDER BY time DESC', publicSlug, function(err, rows) {
        if (rows) {
          res.render('live.ejs', {
            items:      rows,
            publicSlug: rows[0].publicSlug,
            title:      rows[0].shownotes_title
          });
        } else {
          _render404(res);
        }
      });
    });
  },


  // HTML export site
  _initRouteForHtmlExport = function(app, db) {
    app.get('/html/:slug', function(req, res) {
      var slug = req.params.slug;
      
      db.all('SELECT startTime, offset, meta.title AS shownotes_title, time, url, data.title, isText FROM meta, data WHERE meta.slug = data.slug AND meta.slug = ?', slug, function(err, rows) {
        if (rows) {
          res.render('html.ejs', {
            items:  rows,
            start:  rows[0].startTime,
            slug:   slug,
            offset: rows[0].offset,
            title:  rows[0].shownotes_title
          });
        } else {
          _render404(res);
        }
      });
    });
  },

  // route for checking last added shownotes
  _initRouteForServerStatus = function(app, db) {
    app.get('/status', function(req, res) {
      var result = {lastShownotes : []};

      db.each('SELECT time, publicSlug FROM meta, data WHERE meta.slug = data.slug ORDER BY time DESC LIMIT 3', function(err, row) {
          result.lastShownotes.push({
            time:       _formattedDate(row.time),
            ago:        _timeAgo(row.time),
            publicSlug: row.publicSlug
          });
        }, function() {
          res.send('<pre>' + JSON.stringify(result, null, 2) + '</pre>');
      });
    });
  };



  // Init
  // -------------------------------------------------------------------------

  module.init = function() {
    var express = require('express'),
        app     = express(),
        server  = require('http').createServer(app),
        io      = require('socket.io').listen(server, {log: false});

    _sqlite3    = require("sqlite3").verbose();
    _sanitizer  = require('sanitizer');

    var db = _setupDB();
    
    server.listen(63123);

    _registerListeners(io, db);

    // routes
    app.use(express.static('public')); // static files
    _initRouteForliveShownotes(app, db);
    _initRouteForHtmlExport(app, db);
    _initRouteForServerStatus(app, db);
  };


  return module;

})();


Server.init();
