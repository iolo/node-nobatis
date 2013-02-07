'use strict';

var
  _ = require('underscore'),
  nobatis = require('./nobatis'),
  DEF_PRIMARY_KEY = 'id',
  DEF_PRIMARY_KEY_GENERATED = true,
  DEF_PRIMARY_KEY_NEW = 0,
  _DEBUG = !!process.env['NOBATIS_DEBUG'];

function BaseDao(config) {
  _DEBUG && console.log('create dao: ', config);

  this.withSqlSessionFactory(config.sqlSessionFactory)
    .withTable(config.table)
    .withPrimaryKey(config.primaryKey, config.primaryKeyGenerated, config.primaryKeyNew)
    .withDefaults(config.defaults)
    .withQueries(config.queries);
}

BaseDao.prototype.withSqlSessionFactory = function (sqlSessionFactory) {
  if (!sqlSessionFactory) {
    throw new nobatis.NobatisError('no sqlSessionFactory specified');
  }
  this.sqlSessionFactory = sqlSessionFactory;
  return this;
};

BaseDao.prototype.withTable = function (table) {
  if (!table) {
    throw new nobatis.NobatisError('no table specified');
  }
  this.table = table;
  return this;
};

BaseDao.prototype.withPrimaryKey = function (primaryKey, primaryKeyGenerated, primaryKeyNew) {
  this.primaryKey = primaryKey || DEF_PRIMARY_KEY;
  this.primaryKeyGenerated = _.isUndefined(primaryKeyGenerated) ? DEF_PRIMARY_KEY_GENERATED : primaryKeyGenerated;
  this.primaryKeyNew = _.isUndefined(primaryKeyNew) ? DEF_PRIMARY_KEY_NEW : primaryKeyNew;
  return this;
};

BaseDao.prototype.withDefaults = function (defaults) {
  this.defaults = {};
  this.defaults[this.primaryKey] = this.primaryKeyNew;
  _.defaults(this.defaults, defaults);
  return this;
};

BaseDao.prototype.withQueries = function (queries) {
  this.queries = _.defaults(queries || {}, {
    select: this.table + '.select',
    insert: this.table + '.insert',
    update: this.table + '.update',
    delete: this.table + '.delete',
    selectAll: this.table + '.selectAll'
  });

  var queryMapper = this.sqlSessionFactory.queryMapper;
  _.each(this.queries, function (query) {
    if (query === queryMapper.get(query)) {
      throw new nobatis.NobatisError('no "' + query + '" query in sessionFactory');
    }
  });
};

BaseDao.prototype.createNew = function (obj) {
  _DEBUG && console.log('dao new:', obj);
  return _.defaults(obj || {}, this.defaults);
};

BaseDao.prototype.isNew = function (obj) {
  return obj[this.primaryKey] === this.primaryKeyNew;
};

BaseDao.prototype.load = function (pk, callback) {
  var selectQuery = this.queries.select;
  this.sqlSessionFactory.withSession(function (session) {
    _DEBUG && console.log('dao load:', pk);
    session.selectOne(selectQuery, [ pk ], callback);
  });
};

BaseDao.prototype.save = function (obj, callback) {
  if (this.isNew(obj)) {
    var self = this, insertQuery = this.queries.insert;
    this.sqlSessionFactory.withSession(function (session) {
      _DEBUG && console.log('dao save insert:', obj);
      session.insert(insertQuery, obj, function (err, affectedRows, insertId) {
        _DEBUG && console.log('dao save insert result:', arguments);
        if (err) {
          return callback(err);
        }
        if (self.primaryKeyGenerated) {
          obj[self.primaryKey] = insertId;
        }
        return callback(null, affectedRows, insertId);
        // XXX: avoid concurrency issue
        // 'cause mysql doesn't support "INSERT ... RETRUNING ..."
        //return self.load(insertId, callback);
      });
    });
  } else {
    var updateQuery = this.queries.update;
    this.sqlSessionFactory.withSession(function (session) {
      _DEBUG && console.log('dao save update:', obj);
      session.update(updateQuery, obj, function (err, affectedRows) {
        _DEBUG && console.log('dao save update result:', arguments);
        if (err) {
          return callback(err);
        }
        return callback(null, affectedRows);
        // XXX: avoid concurrency issue
        // 'cause mysql doesn't support "INSERT ... RETRUNING ..."
        //return self.load(obj[self.primaryKey], callback);
      });
    });
  }
};

BaseDao.prototype.destroy = function (pk, callback) {
  var deleteQuery = this.queries.delete;
  this.sqlSessionFactory.withSession(function (session) {
    _DEBUG && console.log('dao destroy:', pk);
    session.destroy(deleteQuery, [ pk ], callback);
  });
};

BaseDao.prototype.all = function (bounds, callback) {
  var args = [ this.queries.selectAll, [] ];
  if (arguments.length === 2) { // with 'bounds' argument
    _DEBUG && console.log('dao all bounds:', bounds);
    args.push(bounds);
    args.push(callback);
  } else { // with 'bounds' argument
    _DEBUG && console.log('dao all:');
    callback = bounds;
    args.push(callback);
  }
  this.sqlSessionFactory.withSession(function (session) {
    session.select.apply(session, args);
  });
};

// TODO: ... with method cascading? ex. all().filter('id > 123').order('id').limit(10)
//BaseDao.prototype.find = function (filter, offset, limit, order, callback) { }
//BaseDao.prototype.filter = function (condition, callback) { }
//BaseDao.prototype.skip = function (offset, callback) { }
//BaseDao.prototype.limit = function (limit, callback) { }
//BaseDao.prototype.limit = function ([offset,] limit, callback) { }
//BaseDao.prototype.order = function (order, callback) { }

/////////////////////////////////////////////////////////////////////

function createDao(config) {
  return new BaseDao(config);
}

/////////////////////////////////////////////////////////////////////

module.exports = {
  BaseDao: BaseDao,
  createDao: createDao
};
