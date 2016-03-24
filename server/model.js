module.exports = (function() {
  var module = {},

  // Vars
  // -----------------------------------------------------------------------------

  _FILE = 'data.db',

  _queryBuilder,


  // Private
  // -----------------------------------------------------------------------------

  _createDB = function() {
    var fs = require('fs');
    if (!fs.existsSync(_FILE)) {
      console.log('Creating DB file.');
      fs.openSync(_FILE, 'w');
    }
  },

  _createTables = function(db) {
    db.serialize(function() {
      _queryBuilder.createTable('meta')
        .createColumn('slug', 'TEXT PRIMARY KEY NOT NULL')
        .createColumn('startTime', 'INTEGER')
        .createColumn('offset', 'INTEGER')
        .createColumn('publicSlug', 'TEXT')
        .createColumn('title', 'TEXT')
        .run();
      _queryBuilder.createTable('data')
        .createColumn('id', 'INTEGER PRIMARY KEY AUTOINCREMENT')
        .createColumn('slug', 'TEXT NOT NULL')
        .createColumn('title', 'TEXT')
        .createColumn('url', 'TEXT')
        .createColumn('time', 'INTEGER')
        .createColumn('isText', 'INTEGER')
        .createForeignKey('slug', 'meta(slug)')
        .run();
      _queryBuilder.pragma('foreign_keys = ON').run();
    });
  };


  // Public
  // -----------------------------------------------------------------------------
      
  module.createShownotesEntry = function(opts) {
    _queryBuilder.insert('data')
      .value('slug', opts.slug)
      .value('title', opts.title)
      .value('url', opts.url)
      .value('time', opts.time)
      .value('isText', opts.isText)
      .run(opts.callback);
  };


  module.createNewShownotes = function(slug, publicSlug, callback) {
    _queryBuilder.insert('meta')
      .value('slug', slug)
      .value('slug', slug)
      .run(callback);
  };


  module.getShownotesForLive = function(publicSlug, callback) {
    _queryBuilder.select('publicSlug, id, meta.title AS shownotesTitle, data.title, url, time, isText')
      .from('meta, data')
      .where('meta.slug = data.slug')
      .where('publicSlug = ?', publicSlug)
      .order('time DESC')
      .getAll(function(err, rows) {
        // TODO why not use `publicSlug` from the passed arguments?
        callback(rows, rows[0].publicSlug, rows[0].shownotesTitle);
      });
  };


  module.getShownotesForExport = function(slug, callback) {
    _queryBuilder.select('startTime, offset, meta.title AS shownotesTitle, time, url, data.title, isText')
      .from('meta, data')
      .where('meta.slug = data.slug')
      .where('meta.slug = ?', slug)
      .getAll(function(err, rows) {
        callback(rows, rows[0].startTime, rows[0].offset, rows[0].shownotesTitle);
      });
  };


  module.getMetaFromSlug = function(slug, callback) {
    _queryBuilder.select()
      .from('meta')
      .where('slug = ?', slug)
      .get(callback);
  };


  module.getDuplicate = function(url, slug, callback) {
    _queryBuilder.select()
      .from('data')
      .where('url = ?', url)
      .where('slug = ?', slug)
      .get(callback);
  };


  module.updateStartTime = function(startTime, slug) {
    _queryBuilder.update('meta')
      .value('startTime', startTime)
      .where('slug = ?', slug)
      .run();
  };


  module.updateEntryTitle = function(title, id, slug, callback) {
    _queryBuilder.update('data')
      .value('title', title)
      .where('id = ?', id)
      .where('slug = ?', slug)
      .run(function() {
        module.getMetaFromSlug(slug, function(err, row) {
          callback(row.publicSlug);
        });
      });
  };


  module.updateShownotesTitle = function(title, slug, publicSlug, callback) {
    _queryBuilder.update('meta')
      .value('title', title)
      .where('slug = ?', slug)
      .where('publicSlug = ?', publicSlug)
      .run(callback);
  };


  module.updateOffset = function(offset, slug) {
    _queryBuilder.update('meta')
      .value('offset', offset)
      .where('slug = ?', slug)
      .run();
  };


  module.deleteEntry = function(id, slug, callback) {
    _queryBuilder.delete('data')
      .where('id = ?', id)
      .where('slug = ?', slug)
      .run(callback);
  };


  module.init = function() {
    // create DB file
    _createDB();

    // Create tables if not present
    var adapter = require('sqlite3').verbose(),
        db      = new adapter.Database(_FILE);

    _queryBuilder = require('./query_builder.js').init(db);
    _createTables(db);

    // fluent interface
    return module;
  };


  return module;
}());
