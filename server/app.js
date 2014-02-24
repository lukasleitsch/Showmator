var app = require('express')()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server);

var fs = require("fs");
var file = "data.db";
var exists = fs.existsSync(file);

if(!exists) {
  console.log("Creating DB file.");
  fs.openSync(file, "w");
}



server.listen(3000);

io.on('connection', function(client){
  console.log('Client connected ...');

  var sqlite3 = require("sqlite3").verbose();
  var db = new sqlite3.Database(file);

  client.emit('messages', {hello: 'world'});

  client.on('slug', function(data){
    console.log("Slug: "+data);
  });

  client.on('new', function(data){
    console.log(data);
    db.serialize(function() {

    db.run('INSERT INTO meta (slug) VALUES ("'+data.slug+'")', function(err, result){
      console.log(result);
      if(err && err.errno == 19){
        console.log(err);
        client.emit('status', 'Du machst bei den Shownotes mit');
      }else{
        client.emit('status', 'Neue Shownotes angelegt');
      }
      
    });

    });
  });

  client.on('add', function(data){
    console.log(data.slug);
    console.log(data.title);
    console.log(data.url);

    var time = new Date().getTime();

    db.serialize(function() {
      db.each('SELECT startTime from meta WHERE slug == "'+data.slug+'"', function(err, row) {
        if (row.startTime == null){
          db.run('UPDATE meta SET startTime = '+ time +' WHERE slug = "'+data.slug+'"');
        }
        
      });

      db.run('INSERT INTO data (slug,title,url,time) VALUES ("'+data.slug+'","'+data.title+'","'+data.url+'",'+ time +')');

      db.each("SELECT * from data", function(err, row) {
          console.log(row.slug+" "+row.title+" "+row.url);
      });
    });

    
  });


  client.on('disconnect', function(){
    console.log("Client disconnected ...");
    db.close();
  })
});

