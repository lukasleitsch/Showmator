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
  _initRouteForliveShownotes = function(app, model) {
    app.get('/live/:publicSlug', function(req, res) {
      var publicSlug = req.params.publicSlug;
      
      model.getShownotesForLive(publicSlug, function(rows, publicSlug, title) {
        if (rows) {
          res.render('live.ejs', {
            items:      rows,
            publicSlug: publicSlug,
            title:      title
          });
        } else {
          _render404(res);
        }
      });
    });
  },


  // HTML export site
  _initRouteForHtmlExport = function(app, model) {
    app.get('/html/:slug', function(req, res) {
      var slug = req.params.slug;
      
      model.getShownotesForExport(slug, function(rows, start, offset, title) {
        if (rows) {
          res.render('html.ejs', {
            items:  rows,
            start:  start,
            slug:   slug,
            offset: offset,
            title:  title
          });
        } else {
          _render404(res);
        }
      });
    });
  },


  // route for checking last added shownotes
  _initRouteForServerStatus = function(app, model) {
    app.get('/status', function(req, res) {
      var result = {lastShownotes : []};

      // TODO fix this
      model.each('SELECT time, publicSlug FROM meta, data WHERE meta.slug = data.slug ORDER BY time DESC LIMIT 3', function(err, row) {
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


  module.init = function(model) {
    var express = require('express'),
        app     = express(),
        server  = require('http').createServer(app);

    _io   = require('socket.io').listen(server, {log: false});
    _util = require('util');

    server.listen(63123);

    // static files
    app.use(express.static('public'));

    _initRouteForliveShownotes(app, model);
    _initRouteForHtmlExport(app, model);
    _initRouteForServerStatus(app, model);

    // fluent interface
    return module;
  };


  return module;
}());
