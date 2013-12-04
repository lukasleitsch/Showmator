var app = require('express')()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server);

var privatslug;
var slug;

server.listen(63123);

// Löst den Push aus.

app.post('/push', function (req, res) {

   read(privatslug);
   // io.sockets.emit('test');
   console.log("Es ist angekommen");
   res.send(200);
});

// Bei Verbindungsaufbau wird der öffentliche Slug übertragen aus diesem wird der private ermittelt und dann der Inhalt der DAtei zurückgeschickt.


io.sockets.on('connection', function (socket) {
  socket.emit('start');
  socket.on('slug', function (data) {
    
    slug = data;
    socket.join(slug);
    // console.log("Nach Raum erstellen: "+ slug);

    // console.log(data);
    fa = require('fs');
  try{
    privatslug = fa.readFileSync(__dirname + '/data/publicSlugs/'+data+'.inc', "utf8");
  } catch(e){
    // Gibt Fehlermeldung falls die Datei nicht vorhanden ist
    console.log(e);
    privatslug = null;
    io.sockets.in(slug).emit('error', "Diese Shownotes existieren nicht!");
  }
  
  // console.log(privatslug);
  read(privatslug);

  // Meldet sich ein neuer Client an, wird die Anzahl der verbunden Clients neu ermittelt

  io.sockets.in(slug).emit("counter", counter(slug));

  });

  // Meldet sich ein Client ab, wird der Couenter um eins verringert

  socket.on('disconnect', function() {
      console.log('Got disconnect!');
      io.sockets.in(slug).emit("counter", counter(slug)-1);
   });

});

// Funktion, um die Datei auszulesen.

function read(privatslug){
  var content = null;
  fs = require('fs');
  fs.readFile(__dirname + '/data/'+privatslug+'.json', 'utf8', function (err,data) {
    if (err) {
      return console.log(err);
    }
    // Meta-Teil wird entfernt, da es nicht mitübertragen werden muss
    content = JSON.parse(data);
    delete content["meta"];

    // Sendet den Inhalt an den Client
    io.sockets.in(slug).emit('ping', JSON.stringify(content));
  });

};

// Zählt die aktuellen Verbindungen mit dem aktuellen Raum

function counter(slug){
  var length = 0;
  var clients = io.sockets.clients(slug);
  // console.log(slug+"\nClients: \n"+clients);
  for (val in clients){
    length++;
  }
  return length;
};

