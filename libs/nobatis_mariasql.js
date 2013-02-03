'use strict';

var
  nobatis = require('./nobatis'),
  mariasql = require('mariasql'),
  _DEBUG = true;//!!process.env['NOBATIS_DEBUG'];

/////////////////////////////////////////////////////////////////////

function MariasqlSession(config, conn) {
  this.config = config;
  this.conn = conn;
}

MariasqlSession.prototype.execute = function (query, params, callback) {
  // TODO: avoid OOM for large result set
  if (typeof this.config.queries === 'object' && query in this.config.queries) {
    query = this.config.queries[query].query;
  }
  console.log('execute:', query, params);
  var result = { };
  this.conn.query(query, params)
    .on('result', function (result) {
      _DEBUG && console.log('*** mariasql query result', result);
      result.rows = [];
      result
        .on('row', function (row) {
          _DEBUG && console.log('*** mariasql query result row', row);
          result.rows.push(row);
        })
        .on('error', function (err) {
          _DEBUG && console.log('*** mariasql query result error', err);
          result.error = err;
        })
        .on('end', function (info) {
          result.info = info;
          _DEBUG && console.log('*** mariasql query result end', info);
        });
    })
    .on('end', function () {
      callback(result);
      _DEBUG && console.log('*** mariasql query end');
    });
};

MariasqlSession.prototype.close = function () {
  this.conn.end();
};

MariasqlSession.prototype.commit = function () {
};

MariasqlSession.prototype.rollback = function () {
};

MariasqlSession.prototype.select = function (query, params, callback) {
  this.execute(query, params, function (result) {
    if (result.error) {
      return callback(result.error);
    }
    return callback(null, result.rows);
  });
};

MariasqlSession.prototype.selectWithBounds = function (query, params, rowBounds, callback) {
  query = +' LIMIT ' + rowBounds.offset + ' LIMIT ' + rowBounds.limit;
  this.execute(query, params, function (result) {
    if (result.error) {
      return callback(result.error);
    }
    return callback(null, result.rows);
  });
};

MariasqlSession.prototype.insert = function (query, params, callback) {
  this.execute(query, params, function (result) {
    if (result.error) {
      return callback(result.error);
    }
    return callback(null, result.info);
  });
};

MariasqlSession.prototype.update = function (query, params, callback) {
  this.execute(query, params, function (result) {
    if (result.error) {
      return callback(result.error);
    }
    return callback(null, result.info);
  });
};

MariasqlSession.prototype.destroy = function (query, params, callback) {
  this.execute(query, params, function (result) {
    if (result.error) {
      return callback(result.error);
    }
    return callback(null, result.info);
  });
};

/////////////////////////////////////////////////////////////////////

function MariasqlSessionFactory(config) {
  _DEBUG && console.log('*** create mariasql session factory:', config)
  this.config = config;
}

MariasqlSessionFactory.prototype.openSession = function () {
  var conn = new mariasql();
  conn.connect(this.config.dataSource);
  conn
    .on('connect', function () {
      _DEBUG && console.log('*** mariasql connect');
    })
    .on('error', function (err) {
      _DEBUG && console.log('*** mariasql error', err);
    })
    .on('close', function (err) {
      _DEBUG && console.log('*** mariasql close', err);
    });
  return new MariasqlSession(this.config, conn);
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

function createSessionFactory(config) {
  return new MariasqlSessionFactory(config);
}

/////////////////////////////////////////////////////////////////////

module.exports = {
  MariasqlSession:MariasqlSession,
  MariasqlSessionFactory:MariasqlSessionFactory,
  createSessionFactory:createSessionFactory
};
