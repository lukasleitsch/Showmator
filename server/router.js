module.exports = (function() {
  var module = {},

  // Private
  // -----------------------------------------------------------------------------
  
  _io,
  _util,


  // return 404
  _render404 = function(res) {
    res.writeHead(404);
    res.write('Diese Shownotes existieren nicht.');
    res.end();
  },

  
  // Live shownotes site
  _initRouteForliveShownotes = function(app, db) {
    app.get('/live/:publicSlug', function(req, res) {
      var publicSlug = req.params.publicSlug;
      
      db.all('SELECT publicSlug, id, meta.title AS shownotesTitle, data.title, url, time, isText FROM meta, data WHERE meta.slug = data.slug AND publicSlug = ? ORDER BY time DESC', publicSlug, function(err, rows) {
        if (rows) {
          res.render('live.ejs', {
            items:      rows,
            publicSlug: rows[0].publicSlug,
            title:      rows[0].shownotesTitle
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
      
      db.all('SELECT startTime, offset, meta.title AS shownotesTitle, time, url, data.title, isText FROM meta, data WHERE meta.slug = data.slug AND meta.slug = ?', slug, function(err, rows) {
        if (rows) {
          res.render('html.ejs', {
            items:  rows,
            start:  rows[0].startTime,
            slug:   slug,
            offset: rows[0].offset,
            title:  rows[0].shownotesTitle
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
            time:       _util.formattedDate(row.time),
            ago:        _util.timeAgo(row.time),
            publicSlug: row.publicSlug
          });
        }, function() {
          res.send('<pre>' + JSON.stringify(result, null, 2) + '</pre>');
      });
    });
  };



  // Public
  // -----------------------------------------------------------------------------
  
  module.getSocket = function() {
    return _io;
  };


  module.init = function(db) {
    var express = require('express'),
        app     = express(),
        server  = require('http').createServer(app);

    _io   = require('socket.io').listen(server, {log: false});
    _util = require('util');

    server.listen(63123);

    // static files
    app.use(express.static('public'));

    _initRouteForliveShownotes(app, db);
    _initRouteForHtmlExport(app, db);
    _initRouteForServerStatus(app, db);

    // fluent interface
    return module;
  };


  return module;
}());
