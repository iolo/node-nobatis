'use strict';

var
  _ = require('underscore'),
  mariasql = require('mariasql'),
  nobatis = require('./nobatis'),
  _DEBUG = true;//!!process.env['NOBATIS_DEBUG'];

/////////////////////////////////////////////////////////////////////

function MariasqlSession(conn, queryMapper) {
  this.conn = conn;
  this.queryMapper = queryMapper;
}

MariasqlSession.prototype.execute = function (query, params, callback) {
  var resultError, resultRows, resultInfo, preparedQuery;
  preparedQuery = this.conn.prepare(query);
  this.conn.query(preparedQuery(params))
    .on('result', function (result) {
      //_DEBUG && console.log('*** mariasql query result:', result);
      // TODO: avoid OOM for large result set
      resultRows = [];
      result
        .on('row', function (row) {
          _DEBUG && console.log('*** mariasql query result row:', row);
          resultRows.push(row);
        })
        .on('error', function (err) {
          _DEBUG && console.log('*** mariasql query result error:', err);
          resultError = err;
        })
        .on('end', function (info) {
          _DEBUG && console.log('*** mariasql query result end:', info);
          resultInfo = info;
        })
        .on('abort', function () {
          _DEBUG && console.log('*** mariasql query result abort');
        });
    })
    .on('end', function () {
      _DEBUG && console.log('*** mariasql query end');
      callback(resultError, resultRows, resultInfo);
    });
};

MariasqlSession.prototype.close = function () {
  this.conn.end();
};

MariasqlSession.prototype.commit = function () {
};

MariasqlSession.prototype.rollback = function () {
};

MariasqlSession.prototype.select = function (query, params, bounds, callback) {
  query = this.queryMapper.get(query);
  if (arguments.length === 4) { // with 'bounds' argument
    query += ' LIMIT ' + bounds.offset + ',' + bounds.limit;
  } else { // without 'bounds' argument
    callback = arguments[2];
  }
  this.execute(query, params, function (err, rows, info) {
    console.log('select:', arguments);
    if (err) {
      return callback(err);
    }
    return callback(null, rows, info.numRows);
  });
};

MariasqlSession.prototype.selectOne = function (query, params, callback) {
  query = this.queryMapper.get(query);
  this.execute(query, params, function (err, rows, info) {
    console.log('select:', arguments);
    if (err) {
      return callback(err);
    }
    if (rows.length !== 1) {
      return callback(new nobatis.NobatisError('not a single row'));
    }
    return callback(null, rows[0], info.numRows);
  });
};

MariasqlSession.prototype.insert = function (query, params, callback) {
  query = this.queryMapper.get(query);
  this.execute(query, params, function (err, rows, info) {
    if (err) {
      return callback(err);
    }
    return callback(null, info.affectedRows, info.insertId);
  });
};

MariasqlSession.prototype.update = function (query, params, callback) {
  query = this.queryMapper.get(query);
  this.execute(query, params, function (err, rows, info) {
    if (err) {
      return callback(err);
    }
    return callback(null, info.affectedRows);
  });
};

MariasqlSession.prototype.destroy = function (query, params, callback) {
  query = this.queryMapper.get(query);
  this.execute(query, params, function (err, rows, info) {
    if (err) {
      return callback(err);
    }
    return callback(null, info.affectedRows);
  });
};

/////////////////////////////////////////////////////////////////////

function createMariasqlSession(conn, queryMapper) {
  return new MariasqlSession(conn, queryMapper);
}

/////////////////////////////////////////////////////////////////////

function MariasqlSessionFactory(dataSource, queryMapper) {
  _DEBUG && console.log('*** create mariasql session factory:', dataSource)
  this.dataSource = dataSource;
  this.queryMapper = queryMapper;
}

MariasqlSessionFactory.prototype.openSession = function () {
  var conn = new mariasql();
  conn.connect(this.dataSource);
  conn
    .on('connect', function () {
      _DEBUG && console.log('*** mariasql connect');
    })
    .on('error', function (err) {
      _DEBUG && console.log('*** mariasql error:', err);
    })
    .on('close', function (hadError) {
      _DEBUG && console.log('*** mariasql close:', hadError);
    });
  return new MariasqlSession(conn, this.queryMapper);
};

MariasqlSessionFactory.prototype.withSession = function (callback) {
  var session = null;
  try {
    session = this.openSession();
    callback(session);
  } finally {
    if (session) {
      session.close();
    }
  }
};

/////////////////////////////////////////////////////////////////////

function createSessionFactory(dataSource, queryMapper) {
  return new MariasqlSessionFactory(dataSource, queryMapper);
}

/////////////////////////////////////////////////////////////////////

module.exports = {
  MariasqlSession: MariasqlSession,
  createMariasqlSession: createMariasqlSession,
  MariasqlSessionFactory: MariasqlSessionFactory,
  createSessionFactory: createSessionFactory
};
