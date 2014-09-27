'use strict';

var
    _ = require('lodash'),
    Q = require('q'),
    mariasql = require('mariasql'),
    nobatis = require('./nobatis'),
    DEF_CONFIG = {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: ''
    },
    debug = require('debug')('nobatis:mariasql'),
    DEBUG = debug.enabled;

/////////////////////////////////////////////////////////////////////

function MariasqlSession(conn, queryMapper) {
    this.conn = conn;
    this.queryMapper = queryMapper;
}

MariasqlSession.prototype.execute = function (query, params) {
    var d = Q.defer();
    var resultRows = [], resultInfo = {};
    var preparedQuery = this.conn.prepare(query);
    if (!_.isObject(params)) {
        params = [ params ];
    }
    this.conn.query(preparedQuery(params))
        .on('result', function (result) {
            DEBUG && debug('results result:', result);
            // TODO: avoid OOM for large result set
            result
                .on('row', function (row) {
                    DEBUG && debug('query row:', row);
                    resultRows.push(row);
                    d.notify(row);
                })
                .on('abort', function () {
                    DEBUG && debug('query abort');
                    d.reject('abort');
                })
                .on('error', function (err) {
                    DEBUG && debug('query error:', err);
                    d.reject(err);
                })
                .on('end', function (info) {
                    DEBUG && debug('query end:', info);
                    resultInfo = info;
                });
        })
        .on('abort', function () {
            DEBUG && debug('results abort');
            d.reject('abort');
        })
        .on('error', function (err) {
            DEBUG && debug('results error:', err);
            d.reject(err);
        })
        .on('end', function () {
            DEBUG && debug('results end');
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
            DEBUG && debug('select result:', arguments);
            return result.rows;
        });
};

MariasqlSession.prototype.selectOne = function (query, params) {
    query = this.queryMapper.get(query);
    return this.execute(query, params)
        .then(function (result) {
            DEBUG && debug('selectOne result:', arguments);
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
            DEBUG && debug('insert result:', arguments);
            return result.info.insertId;
        });
};

MariasqlSession.prototype.update = function (query, params) {
    query = this.queryMapper.get(query);
    return this.execute(query, params)
        .then(function (result) {
            DEBUG && debug('update result:', arguments);
            return result.info.affectedRows;
        });
};

MariasqlSession.prototype.destroy = function (query, params) {
    query = this.queryMapper.get(query);
    return this.execute(query, params)
        .then(function (result) {
            DEBUG && debug('destroy result:', arguments);
            return result.info.affectedRows;
        });
};

/////////////////////////////////////////////////////////////////////

function MariasqlDataSource(config, queryMapper) {
    DEBUG && debug('*** create mariasql data source:', config);
    this.config = _.defaults(DEF_CONFIG, config);
    this.queryMapper = queryMapper;
}

MariasqlDataSource.prototype.openSession = function () {
    var conn = new mariasql();
    conn.connect(this.config);
    conn
        .on('connect', function () {
            DEBUG && debug('*** mariasql connect');
        })
        .on('error', function (err) {
            DEBUG && debug('*** mariasql error:', err);
        })
        .on('close', function (hadError) {
            DEBUG && debug('*** mariasql close:', hadError);
        });
    return new MariasqlSession(conn, this.queryMapper);
};

MariasqlDataSource.prototype.withSession = function (callback) {
    var session = this.openSession();
    return Q.fcall(callback, session)
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
