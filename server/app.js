var express = require('express'),
    app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server, { log: false });

server.listen(63685);

var fs = require("fs");
var file = "data.db";
var exists = fs.existsSync(file);

var slug;

if(!exists) {
  console.log("Creating DB file.");
  fs.openSync(file, "w");
}

io.sockets.on('connection', function(client){
  console.log('Client connected ...');

  var sqlite3 = require("sqlite3").verbose();
  var db = new sqlite3.Database(file);

  // Falls Tabellen noch nicht angelegt sind, werden diese erzeugt

  db.serialize(function(){
    db.run('CREATE TABLE IF NOT EXISTS meta (slug TEXT PRIMARY KEY NOT NULL, startTime INTEGER, offset INTEGER, publicSlug TEXT, title TEXT)');
    db.run('CREATE TABLE IF NOT EXISTS data (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL, title TEXT, url TEXT, time INTEGER, FOREIGN KEY (slug) REFERENCES meta(slug))');
    // Aktiviert Foreign in SQLITE
    db.run('PRAGMA foreign_keys = ON');
  });

  client.on('live', function(data){
    client.join(data);
    slug = data;
    io.sockets.in(slug).emit("counter", counter(slug));
  });


  // Check status of shownotes

  client.on('status', function(data){
    db.serialize(function() {
      db.get('SELECT * FROM meta WHERE slug == "' + data.slug + '"', function(err, row){
        if (row) {
          client.emit('shownotes-active');
        };
      });
    });
  });

  // Create new shownotes

  client.on('new', function(data){
    console.log("---- Create new Shownotes ----");
    console.log(data);
    console.log("------------------------------");
    db.serialize(function() {

      db.run('INSERT INTO meta (slug, publicSlug) VALUES ("'+data.slug+'","'+data.publicSlug+'")', function(err1, result){
        var publicSlug;
        db.get('SELECT publicSlug FROM meta WHERE slug == "'+data.slug+'"', function(err2, row){
                if(err1 && err1.errno == 19){
                  client.emit('status', {publicSlug: row.publicSlug, text: 'Du machst bei den Shownotes "'+data.slug+'" mit.'});
                }else{
                  client.emit('status', {publicSlug: row.publicSlug, text: 'Neue Shownotes "'+data.slug+'" sind angelegt. Zeit startet mit erstem Eintrag.'});
                }
        });
      });
    });
  });

  // Check for dublicate

  client.on('check_dublicate', function(data){
    console.log("--- Check dublicate ----");
    console.log(data.url);

    db.serialize(function(){
      db.each('SELECT url from data WHERE url == "'+data.url+'" AND slug == "'+data.slug+'"', function(err, row) {

      }, function(err, row){
        console.log('Doppelte Einträge: '+row);
        if(row > 0){
          client.emit('dublicate', "Dieser Link wurde schon hinzugefügt!");
        }
      });

    });
  });

  // Add new item

  client.on('add', function(data){
    var time = new Date().getTime();
    insert(data.slug, data.title, data.url, time);
    console.log("---- Add -----")
    console.log("Slug: "+slug);
    console.log(data);
    client.broadcast.to(slug).emit('push', {title: data.title, url: data.url});
  });

  // Client disconnected

  client.on('disconnect', function(){
    console.log("Client disconnected ...");
    io.sockets.in(slug).emit("counter", counter(slug)-1);
    db.close();
  });

  // delete last item

  client.on('delete', function(data){
    db.run('DELETE FROM data WHERE id IN (SELECT id FROM (SELECT id FROM data WHERE slug = "'+data.slug+'" group by slug)x)',function (err,row){
      client.broadcast.to(slug).emit('reload');
    });
    console.log("---- Delete -----");
  });


  // Funktion zum Eintragen in die Datenbank

  function insert(slug, title, url, time) {
    console.log("---- Insert function ----");
    console.log("Slug: "+slug);
    console.log("Title: "+title);
    console.log("Url: "+url);
    console.log("Time: "+time);

    db.serialize(function() {
      db.each('SELECT startTime from meta WHERE slug == "'+slug+'"', function(err, row) {
        if (row.startTime == null){
          db.run('UPDATE meta SET startTime = '+ time +' WHERE slug = "'+slug+'"');
        }
        
      });

      db.run('INSERT INTO data (slug,title,url,time) VALUES ("'+slug+'","'+title+'","'+url+'",'+ time +')');

      client.emit('close');

    });
  };


// Current connections of clients

  function counter(slug){
    var length = 0;
    var clients = io.sockets.clients(slug);
    for (val in clients){
      length++;
    }
    return length;
  };

});

/* Live-Shownotes */

app.get('/live/:publicslug', function (req, res) {

  var sqlite3 = require("sqlite3").verbose();
  var db = new sqlite3.Database(file);
  var publicslug = req.params.publicslug;

  var items = [];
  db.serialize(function(){
    db.get('SELECT slug FROM meta WHERE publicSlug == "'+publicslug+'"',function(err, row){
      if (row){
        db.each('SELECT * FROM data WHERE slug == "'+row.slug+'" ORDER BY time DESC', function(err,row){
          // console.log(row);
          items.push(row);
        },function(){
          res.render('live.ejs', {items: items, slug: publicslug});
        });
      } else {
        res.writeHead(200);
        res.write ("Diese Shownotes existieren nicht.");
        res.end();
      }
    });
  });
});

/* Shownotes in HMTL*/

app.get('/html/:slug', function (req, res) {

  var sqlite3 = require("sqlite3").verbose();
  var db = new sqlite3.Database(file);
  var slug = req.params.slug;

  var items = [];
  var startTime;

  db.serialize(function(){
    db.get('SELECT startTime,offset FROM meta WHERE slug == "'+slug+'"',function (err1, row1){
      if (row1) {
        db.each('SELECT * FROM data WHERE slug =="'+slug+'" ORDER BY time', function (err2,row2){
          items.push(row2);
        },function(){
          res.render('html.ejs', {items: items, start: row1.startTime, slug: slug, offset: row1.offset});
        });
      } else {
        res.writeHead(200);
        res.write ("Diese Shownotes existieren nicht.");
        res.end();
      }
    });
  });
});

/* Offset */

app.get('/html/:slug/:offset', function (req, res) {

  var sqlite3 = require("sqlite3").verbose();
  var db = new sqlite3.Database(file);
  var slug = req.params.slug;
  var offset = req.params.offset;

  var items = [];
  var startTime;

  db.serialize(function(){
    db.run('UPDATE meta set offset = "'+offset+'" where slug =="'+slug+'"');

    db.get('SELECT startTime,offset FROM meta WHERE slug == "'+slug+'"',function (err1, row1){
      if (row1) {
        db.each('SELECT * FROM data WHERE slug =="'+slug+'" ORDER BY time', function (err2,row2){
          items.push(row2);
        },function(){
          res.render('html.ejs', {items: items, start: row1.startTime, slug: slug, offset: row1.offset});
        });
      } else {
        res.writeHead(200);
        res.write ("Diese Shownotes existieren nicht.");
        res.end();
      }
    });
  });
});