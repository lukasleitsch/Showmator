var app = require('express')()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server);

server.listen(3000);

io.on('connection', function(client){
  console.log('Client connected ...');

  client.emit('messages', {hello: 'world'});

  client.on('add', function(data){
    console.log(data.title);
    console.log(data.url);
  });


  client.on('disconnect', function(){
    console.log("Client disconnected ...");
  })
});

