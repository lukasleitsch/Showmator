// TODO FOREIGN KEY constraint failed: Insert entry without create shownotes

var Server = {
  init: function() {
    var model = require('./model').init(),
        io    = require('./router').init(model).getSocket();

    // create user on connection
    var _newUser = require('./user').init(io, model);
    io.on('connection', _newUser);
  }
};

Server.init();
