/*global console */
/*global require */

// TODO FOREIGN KEY constraint failed: Insert entry without create shownotes

var Server = (function () {

  var module = {},


  // Vars
  // -------------------------------------------------------------------------

  _FILE = 'data.db',



  // Helper
  // -----------------------------------------------------------------------------
  
  _setupDB = function() {
    // create DB file
    var fs = require('fs');
    if (!fs.existsSync(_FILE)) {
      console.log('Creating DB file.');
      fs.openSync(_FILE, 'w');
    }

    // Create tables if not present
    var adapter = require('sqlite3').verbose(),
        db      = new adapter.Database(_FILE);

    db.serialize(function() {
      db.run('CREATE TABLE IF NOT EXISTS meta (slug TEXT PRIMARY KEY NOT NULL, startTime INTEGER, offset INTEGER, publicSlug TEXT, title TEXT)');
      db.run('CREATE TABLE IF NOT EXISTS data (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL, title TEXT, url TEXT, time INTEGER, isText INTEGER, FOREIGN KEY (slug) REFERENCES meta(slug))');
      db.run('PRAGMA foreign_keys = ON');
    });

    return db;
  },


  _createUserOnConnection = function(io, db) {
    var _newUser = require('./user').init(io, db);
    io.on('connection', _newUser);
  };


  // Init
  // -------------------------------------------------------------------------

  module.init = function() {
    var db = _setupDB(),
        io = require('./router').init(db).getSocket();

    _createUserOnConnection(io, db);
  };


  return module;

})();


Server.init();
