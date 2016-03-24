// will be set in init and needed in QueryBuilder
var _db;


// no module since we need multiple independent queries
function QueryBuilder() {

  // Vars
  // -----------------------------------------------------------------------------
  
  var _statements = [],
      _wheres     = [],
      _values     = [],
      _orders     = [],

      _keys = [],

      _columnsToCreate = [],
      _keysToCreate    = [],


  // Helpers
  // -----------------------------------------------------------------------------

  _rejectFirst = function(obj) {
    return Array.prototype.slice.call(obj, 1);
  },


  _keyAssignments = function(keys) {
    return keys.map(function(key) {return key + ' = ?';});
  },


  _placeholders = function(keys) {
    return keys.map(function() {return '?';});
  },


  // first argument: method name, other arguments: probably callbacks
  _execute = function() {
    var method = arguments[0],
        params = _setUpParams(_rejectFirst(arguments));

    // like: _db.run('SELECT * FROM table WHERE slug = ?', slug, callback)
    _db[method].apply(_db, params);
  },


  // statements, values, callbacks
  _setUpParams = function(callbacks) {
    if (_keys.length) {
      if (_statements[0] === 'UPDATE') {
        _statements.push('SET');
        _statements.push(_keyAssignments(_keys).join(', '));

      // insert
      } else {
        _statements.push('(' + _keys.join(', ') + ')');
        _statements.push('VALUES');
        _statements.push('(' + _placeholders(_keys).join(', ') + ')');
      }
    }

    if (_wheres.length) {
      _statements.push('WHERE');
      _statements.push(_wheres.join(' AND '));
    }

    if (_orders.length) {
      _statements.push('ORDER BY');
      _statements.push(_orders.join(', '));
    }

    _keysToCreate.forEach(function(keyStatement) {
      _columnsToCreate.push(keyStatement);
    });

    if (_columnsToCreate.length) {
      _statements.push('(' + _columnsToCreate.join(', ') + ')');
    }

    var params = [_statements.join(' ')];

    if (_values.length) {
      params.push(_values);
    }

    // additional arguments (probably callbacks)
    callbacks.forEach(function(callback) {
      params.push(callback);
    });

    return params;
  };


  // Public
  // -----------------------------------------------------------------------------
  
  // CRUD

  this.insert = function(table) {
    _statements.push('INSERT INTO');
    _statements.push(table);
    return this;
  };

  this.select = function(columns) {
    _statements.push('SELECT');
    _statements.push(columns || '*');
    return this;
  };

  this.update = function(table) {
    _statements.push('UPDATE');
    _statements.push(table);
    return this;
  };

  this.delete = function(table) {
    _statements.push('DELETE FROM');
    _statements.push(table);
    return this;
  };

  // modifications/data

  this.value = function(key, value) {
    _keys.push(key);
    _values.push(value);
    return this;
  };

  this.from = function(tables) {
    _statements.push('FROM');
    _statements.push(tables);
    return this;
  };

  this.where = function(condition, value) {
    _wheres.push('(' + condition + ')');
    if (value) {
      _values.push(value);
    }
    return this;
  };

  this.order = function(statement) {
    _orders.push(statement);
    return this;
  };

  // create table and misc

  this.createTable = function(tableName) {
    _statements.push('CREATE TABLE IF NOT EXISTS');
    _statements.push(tableName);
    return this;
  };

  this.createColumn = function(name, properties) {
    _columnsToCreate.push(name + ' ' + properties);
    return this;
  };

  this.createForeignKey = function(column, referenceColumn) {
    _keysToCreate.push('FOREIGN KEY (' + column + ') REFERENCES ' + referenceColumn);
    return this;
  };

  this.pragma = function(statement) {
    _statements.push('PRAGMA ' + statement);
    return this;
  };

  // methods for query firing

  this.run = function(callback) {
    _execute('run', callback);
  };

  this.getAll = function(callback) {
    _execute('all', callback);
  };

  this.get = function(callback) {
    _execute('get', callback);
  };


  return this;
}



// Exports: init for setting `_db` and start-operations (insert, select, update,
// delete, createTable, pragma)
module.exports = {
  insert: function(table) {
    return new QueryBuilder().insert(table);
  },
  select: function(columns) {
    return new QueryBuilder().select(columns);
  },
  update: function(table) {
    return new QueryBuilder().update(table);
  },
  delete: function(table) {
    return new QueryBuilder().delete(table);
  },
  createTable: function(name) {
    return new QueryBuilder().createTable(name);
  },
  pragma: function(statement) {
    return new QueryBuilder().pragma(statement);
  },
  init: function(db) {
    _db = db;
    return this;
  }
};
