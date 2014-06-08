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
  console.log('Client connected ...');

  var db = new sqlite3.Database(file),
      emitError = function(err) {
        console.log("caught exception:", err);
        client.emit("genericError");
      };

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
    io.sockets.in(publicSlug).emit("counter", counter(publicSlug));
    console.log("connectedLiveShownotes: " + publicSlug);
  });
  client.on('connectedHtmlExport', function(slug) {
    client.join(slug);
    console.log("html: " + slug);
  });


  // Check status of shownotes
  client.on('statusRequest', function(data) {
    db.serialize(function() {
      db.get('SELECT * FROM meta WHERE slug == ?', data.slug, function(err, row) {
        var data = {};
        if (row) {
          data = {
            active:     true,
            publicSlug: row.publicSlug,
            title:      row.title
          };
        }
        client.emit('statusResponse', data);
        client.publicSlug = row.publicSlug;
        
        console.log("STATUS");
        console.log(row);
      });
    });
  });

  // Create new shownotes
  client.on('new', function(data) {
    console.log("---- Create new Shownotes ----");
    console.log(data);
    console.log("------------------------------");
    db.serialize(function() {

      db.run('INSERT INTO meta (slug, publicSlug) VALUES (? , ?)', [data.slug, data.publicSlug], function(/*err, result*/) {
        client.publicSlug = data.publicSlug;
      });
    });
  });


  // Add new entry
  client.on('linkAdded', function(data) {
    var time = new Date().getTime();

    db.serialize(function() {
      // TODO why each and not something like fetchOne?
      db.each('SELECT * from data WHERE url == ? AND slug == ?', [data.url, data.slug], function(/*err, row*/) {
        // we have duplicates, do nothing

      }, function(err, row) {
        if (row === 0) {
          console.log("---- Add entry ----");
          console.log("Slug: " + data.slug);
          console.log("Title: " + data.title);
          console.log("Url: " + data.url);
          console.log("Time: " + time);

          db.serialize(function() {
            db.each('SELECT startTime, offset, publicSlug from meta WHERE slug == ?', data.slug, function(err, row) {
              if (row.startTime === null)
                db.run('UPDATE meta SET startTime = ? WHERE slug = ?', [time, data.slug]);

              db.run('INSERT INTO data (slug, title, url, time, isText) VALUES (?, ?, ?, ?, ?)', [data.slug, data.title, data.url, time, data.isText], function(err/*, result*/) {
                if (err) {
                  emitError(err);
                } else {
                  console.log('successfully added link');
                  client.broadcast.to(row.publicSlug).emit('push', {title: data.title, url: data.url, isText: data.isText, time: time});
                }
              });
            });
          });
        }
      });
    });
  });


  // update the entry (title, link/text)
  client.on('linkUpdated', function(data) {
    db.run('UPDATE data SET title = ?, isText = ? WHERE url = ? AND slug = ?', [data.title, data.isText, data.url, data.slug]);
    // TODO implement in live shownotes
    client.broadcast.to(data.slug).emit('linkUpdated', {title: data.title, url: data.url});
  });

  
  // check for duplicates when popup opens
  client.on('popupOpened', function(data) {
    db.serialize(function() {
      var title, isText;
      // TODO why each and not something like fetchOne?
      db.each('SELECT * from data WHERE url == ? AND slug == ?', [data.url, data.slug], function(err, row) {
        title  = row.title;
        isText = row.isText;
      }, function(err, row) {
        if (row) {
          console.log('found duplicate');
          client.emit('duplicate', {title: title, isText: isText});
        }
      });
    });
  });


  // set title of shownotes
  client.on('titleUpdated', function(data) {
    db.run('UPDATE meta SET title = ? WHERE slug = ?', [data.title, data.slug], function() {
      // publicSlug for live shownotes, private slug for html shownotes
      console.log('title slugs', client.publicSlug, data.slug);
      [client.publicSlug, data.slug].forEach(function(val) {
        client.broadcast.to(val).emit('titleUpdatedSuccess', {title: data.title});
      });
      console.log("Set title", data.title);
    });
  });


  // set time offset
  client.on('offsetUpdated', function(data) {
    db.run('UPDATE meta SET offset = ? WHERE slug = ?', [data.offset, data.slug], function() {
      console.log("Set offset", data.offset);
    });
  });


  // Client disconnected
  client.on('disconnect', function() {
    console.log('Client disconnected ...', client.publicSlug);
    io.sockets.in(client.publicSlug).emit('counter', counter(client.publicSlug) - 1);
    db.close();
  });


  // delete last item
  client.on('delete', function(data) {
    db.run('DELETE FROM data WHERE id IN (SELECT id FROM (SELECT id FROM data WHERE slug = ? group by slug)x)', data.slug, function(/*err, row*/) {
      client.broadcast.to(data.slug).emit('reload');
    });
    console.log("---- Delete -----");
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

  var publicSlug = req.params.publicSlug,
      items      = [];

  db.serialize(function() {
    db.get('SELECT * FROM meta WHERE publicSlug == ?', publicSlug, function(err, row1) {
      if (row1) {
        db.each('SELECT * FROM data WHERE slug == ? ORDER BY time DESC', row1.slug, function(err, row2) {
          items.push(row2);
        }, function() {
          res.render('live.ejs', {items: items, publicSlug: publicSlug, title: row1.title});
        });

      } else {
        render404(res);
      }
    });
  });
});


// Shownotes in HTML
app.get('/html/:slug', function(req, res) {

  var slug    = req.params.slug,
      items   = [];

  db.serialize(function() {
    db.get('SELECT startTime, offset, title FROM meta WHERE slug == ?', slug, function(err1, row1) {
      if (row1) {
        db.each('SELECT * FROM data WHERE slug == ? ORDER BY time', slug, function(err2, row2) {
          items.push(row2);
        }, function() {
          res.render('html.ejs', {
            items:  items,
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
});
