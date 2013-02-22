'use strict';

var
  _ = require('underscore'),
  q = require('q'),
  mariasql = require('mariasql'),
  nobatis = require('./nobatis'),
  DEF_CONFIG = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: ''
  },
  _DEBUG = !!process.env['NOBATIS_DEBUG'];

/////////////////////////////////////////////////////////////////////

function MariasqlSession(conn, queryMapper) {
  this.conn = conn;
  this.queryMapper = queryMapper;
}

MariasqlSession.prototype.execute = function (query, params) {
  var d = q.defer();
  var resultRows = [], resultInfo = {};
  var preparedQuery = this.conn.prepare(query);
  if (!_.isObject(params)) {
    params = [ params ];
  }
  this.conn.query(preparedQuery(params))
    .on('result', function (result) {
      //_DEBUG && console.log('*** mariasql results result:', result);
      // TODO: avoid OOM for large result set
      result
        .on('row', function (row) {
          _DEBUG && console.log('*** mariasql query row:', row);
          resultRows.push(row);
          d.notify(row);
        })
        .on('abort', function () {
          _DEBUG && console.log('*** mariasql query abort');
          d.reject('abort');
        })
        .on('error', function (err) {
          _DEBUG && console.log('*** mariasql query error:', err);
          d.reject(err);
        })
        .on('end', function (info) {
          _DEBUG && console.log('*** mariasql query end:', info);
          resultInfo = info;
        });
    })
    .on('abort', function () {
      _DEBUG && console.log('*** mariasql results abort');
      d.reject('abort');
    })
    .on('error', function (err) {
      _DEBUG && console.log('*** mariasql results error:', err);
      d.reject(err);
    })
    .on('end', function () {
      _DEBUG && console.log('*** mariasql results end');
      d.resolve({rows: resultRows, info: resultInfo});
    });
  return d.promise;
};

MariasqlSession.prototype.close = function () {
  this.conn.end();
};

MariasqlSession.prototype.commit = function () {
};

MariasqlSession.prototype.rollback = function () {
};

MariasqlSession.prototype.select = function (query, params, bounds) {
  query = this.queryMapper.get(query);
  if (bounds) {
    query += ' LIMIT ' + bounds.offset + ',' + bounds.limit;
  }
  return this.execute(query, params)
    .then(function (result) {
      _DEBUG && console.log('select result:', arguments);
      return result.rows;
    });
};

MariasqlSession.prototype.selectOne = function (query, params) {
  query = this.queryMapper.get(query);
  return this.execute(query, params)
    .then(function (result) {
      _DEBUG && console.log('selectOne result:', arguments);
      if (result.rows.length !== 1) {
        throw new nobatis.NobatisError('not a single row');
      }
      return result.rows[0];
    });
};

MariasqlSession.prototype.insert = function (query, params) {
  query = this.queryMapper.get(query);
  return this.execute(query, params)
    .then(function (result) {
      _DEBUG && console.log('insert result:', arguments);
      return result.info.insertId;
    });
};

MariasqlSession.prototype.update = function (query, params) {
  query = this.queryMapper.get(query);
  return this.execute(query, params)
    .then(function (result) {
      _DEBUG && console.log('update result:', arguments);
      return result.info.affectedRows;
    });
};

MariasqlSession.prototype.destroy = function (query, params) {
  query = this.queryMapper.get(query);
  return this.execute(query, params)
    .then(function (result) {
      _DEBUG && console.log('destroy result:', arguments);
      return result.info.affectedRows;
    });
};

/////////////////////////////////////////////////////////////////////

function MariasqlDataSource(config, queryMapper) {
  _DEBUG && console.log('*** create mariasql data source:', config)
  this.config = _.defaults(DEF_CONFIG, config);
  this.queryMapper = queryMapper;
}

MariasqlDataSource.prototype.openSession = function () {
  var conn = new mariasql();
  conn.connect(this.config);
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

MariasqlDataSource.prototype.withSession = function (callback) {
  var session = this.openSession();
  return q.fcall(callback, session)
    .fin(function () {
      session && session.close();
    });
};

/////////////////////////////////////////////////////////////////////

function createDataSource(config, queryMapper) {
  return new MariasqlDataSource(config, queryMapper);
}

/////////////////////////////////////////////////////////////////////

module.exports = {
  MariasqlSession: MariasqlSession,
  MariasqlDataSource: MariasqlDataSource,
  createDataSource: createDataSource
};
