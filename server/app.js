/*global console */
/*global require */
/*global __dirname */

// TODO FOREIGN KEY constraint failed: Insert entry without create shownotes

var express = require('express'),
    app     = express(),
    server  = require('http').createServer(app),
    io      = require('socket.io').listen(server, { log: false }),
    sqlite3 = require("sqlite3").verbose(),
    fs      = require("fs"),
    file    = "data.db";

if (!fs.existsSync(file)) {
  console.log("Creating DB file.");
  fs.openSync(file, "w");
}
server.listen(63685);

var db = new sqlite3.Database(file);


var render404 = function(res) {
      res.writeHead(404);
      res.write("Diese Shownotes existieren nicht.");
      res.end();
    };



// Socket events
// -----------------------------------------------------------------------------

io.sockets.on('connection', function(client){
  var log = function() {
        var args = [new Date().getTime(), client.id];
        for (var key in arguments)
          args.push(arguments[key]);
        console.log.apply(undefined, args);
      },
      
      db = new sqlite3.Database(file),
      
      emitError = function(err) {
        log("caught exception", err);
        client.emit("genericError");
      };

  log('connected');

  // Create tables if not present
  // TODO why on connection and not on start of server?
  db.serialize(function() {
    db.run('CREATE TABLE IF NOT EXISTS meta (slug TEXT PRIMARY KEY NOT NULL, startTime INTEGER, offset INTEGER, publicSlug TEXT, title TEXT)');
    db.run('CREATE TABLE IF NOT EXISTS data (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL, title TEXT, url TEXT, time INTEGER, isText INTEGER, FOREIGN KEY (slug) REFERENCES meta(slug))');
    // activates foreign keys in SQlite
    db.run('PRAGMA foreign_keys = ON');
  });

  // Make clients join their rooms
  client.on('connectedLiveShownotes', function(publicSlug) {
    client.publicSlug = publicSlug;
    client.join(publicSlug);
    io.sockets.in(publicSlug).emit('counter', counter(publicSlug));
    log('connectedLiveShownotes', publicSlug);
  });
  client.on('connectedHtmlExport', function(slug) {
    client.join(slug); // currently only used for titleUpdated
    log('connectedHtmlExport', slug);
  });


  // Check status of shownotes
  client.on('statusRequest', function(data) {
    db.get('SELECT * FROM meta WHERE slug = ?', data.slug, function(err, row) {
      var data = {};
      if (row) {
        data = {
          active:     true,
          publicSlug: row.publicSlug,
          title:      row.title
        };
        client.publicSlug = row.publicSlug;
      }
      client.emit('statusResponse', data);
      
      log('statusResponse', row ? client.publicSlug : 'no rows (=no slug yet)', row);
    });
  });

  // Create new shownotes
  client.on('new', function(data) {
    log('create new shownotes', data);
    db.run('INSERT INTO meta (slug, publicSlug) VALUES (? , ?)', [data.slug, data.publicSlug], function(/*err, result*/) {
      client.publicSlug = data.publicSlug;
      log('created new shownotes');
    });
  });


  // Add new entry
  client.on('linkAdded', function(data) {
    var time = new Date().getTime();

    log('add entry', data);

    db.get('SELECT * FROM data WHERE url = ? AND slug = ?', [data.url, data.slug], function(err, row) {
      if (row && !row.isText) {
        log('found duplicate', data, row);
        client.emit('duplicate', {id: row.id});
        db.close();
        return;
      }

      db.get('SELECT startTime, offset, publicSlug FROM meta WHERE slug = ?', data.slug, function(err, row) {
        if (row.startTime === null)
          db.run('UPDATE meta SET startTime = ? WHERE slug = ?', [time, data.slug]);

        db.run('INSERT INTO data (slug, title, url, time, isText) VALUES (?, ?, ?, ?, ?)', [data.slug, data.title, data.url, time, data.isText], function(err/*, result*/) {
          if (err) {
            emitError(err);
          } else {
            log('successfully added link');
            client.broadcast.to(row.publicSlug).emit('push', {
              id:     this.lastID,
              title:  data.title,
              url:    data.url,
              isText: data.isText,
              time:   time
            });
            client.emit('linkAddedSuccess');
          }
          db.close();
        });
      });
    });
  });


  // update the entry title
  client.on('entryUpdated', function(data) {
    log('update entry title');
    db.run('UPDATE data SET title = ? WHERE id = ? AND slug = ?', [data.title, data.id, data.slug], function(err, row) {
      log('updated entry title, about to find public slug', row);
      db.get('SELECT publicSlug FROM meta WHERE slug = ?', data.slug, function(err, row) {
        client.broadcast.to(row.publicSlug).emit('entryUpdatedSuccess', {title: data.title, id: data.id});
      });
    });
  });

  
  // check for duplicates when popup opens
  client.on('popupOpened', function(data) {
    client.isPopup = true;
    log('popupOpended');

    // only check if we don't have a text-only entry
    if (!data.isText) {
      db.get('SELECT id FROM data WHERE url = ? AND slug = ?', [data.url, data.slug], function(err, row) {
        if (row) {
          log('found duplicate', data, row.id);
          client.emit('duplicate', {id: row.id});
        }
      });
    }
  });


  // set title of shownotes
  client.on('titleUpdated', function(data) {
    db.run('UPDATE meta SET title = ? WHERE slug = ? AND publicSlug = ?', [data.title, data.slug, client.publicSlug], function() {
      if (this.changes === 1) {
        data.publicSlug = client.publicSlug;
        log('titleUpdated', data);
        // publicSlug for live shownotes, private slug for html shownotes
        [client.publicSlug, data.slug].forEach(function(val) {
          client.broadcast.to(val).emit('titleUpdatedSuccess', {title: data.title});
        });
      }
    });
  });


  // set time offset
  client.on('offsetUpdated', function(data) {
    db.run('UPDATE meta SET offset = ? WHERE slug = ?', [data.offset, data.slug], function() {
      log('offsetUpdated', data.offset);
    });
  });


  // delete entry
  client.on('linkDeleted', function(data) {
    db.run('DELETE FROM data WHERE id = ? AND slug = ?', [data.id, data.slug], function(/*err, result*/) {
      if (this.changes === 1) {
        var emitEvent = function() {
          io.sockets.in(data.publicSlug).emit('linkDeletedSuccess', {id: data.id});
          if (client.isPopup)
            client.emit('linkDeletedSuccess', {id: data.id});
          log('linkDeleted', data);
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
        log('no entries found for linkDeleted', data);
      }
    });
  });


  // client disconnected
  client.on('disconnect', function() {
    log('disconnect', client.isPopup ? 'no slug (popup)' : client.publicSlug);
    io.sockets.in(client.publicSlug).emit('counter', counter(client.publicSlug) - 1);
    if (!client.isPopup)
      db.close();
  });


  // Current connections of clients
  function counter(publicSlug) {
    return io.sockets.clients(publicSlug).length;
  }

});



// Routes
// -----------------------------------------------------------------------------

// search for route first, then static file
app.use(app.router);
app.use(express.static(__dirname + '/public'));


// Live-Shownotes
app.get('/live/:publicSlug', function(req, res) {
  var publicSlug = req.params.publicSlug;
  db.get('SELECT slug, title FROM meta WHERE publicSlug = ?', publicSlug, function(err, row1) {
    if (row1) {
      db.all('SELECT * FROM data WHERE slug = ? ORDER BY time DESC', row1.slug, function(err, rows) {
        res.render('live.ejs', {
          items: rows,
          publicSlug: publicSlug,
          title: row1.title
        });
      });

    } else {
      render404(res);
    }
  });
});


// Shownotes in HTML
app.get('/html/:slug', function(req, res) {
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
      render404(res);
    }
  });
});
