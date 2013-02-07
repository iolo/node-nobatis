'use strict';

var
  _ = require('underscore'),
  DEF_PRIMARY_KEY = 'id',
  DEF_PRIMARY_KEY_GENERATED = true,
  DEF_PRIMARY_KEY_NEW = 0,
  _DEBUG = !!process.env['NOBATIS_DEBUG'];

function BaseDao(sqlSessionFactory, config) {
  this.sqlSessionFactory = sqlSessionFactory;
  this.config = _.defaults(config || {}, {
    model: {},
    primaryKey: DEF_PRIMARY_KEY,
    primaryKeyGenerated: DEF_PRIMARY_KEY_GENERATED,
    primaryKeyNew: DEF_PRIMARY_KEY_NEW,
    select: config.table + '.select',
    update: config.table + '.update',
    insert: config.table + '.insert',
    delete: config.table + '.delete',
    selectAll: config.table + '.selectAll'
  });
  this.config.model[this.config.primaryKey] = this.config.primaryKeyNew;

  _DEBUG && console.log('create dao: ', config);
}

BaseDao.prototype.withTable = function (table) {
  this.config.table = table;
};

BaseDao.prototype.withModel = function (model) {
  this.config.model = _.clone(model);
};

BaseDao.prototype.withPrimaryKey = function (primaryKey, primaryKeyGenerated) {
  this.config.primaryKey = primaryKey;
  this.config.primaryKeyGenerated = !!primaryKeyGenerated;
};

BaseDao.prototype.createNew = function (obj) {
  return _.defaults(obj || {}, this.config.model);
};

BaseDao.prototype.isNew = function (obj) {
  return obj[this.config.primaryKey] === this.config.primaryKeyNew;
};

BaseDao.prototype.load = function (pk, callback) {
  var self = this;
  this.sqlSessionFactory.withSession(function (session) {
    _DEBUG && console.log('dao load:', pk);
    session.selectOne(self.config.select, [ pk ], callback);
  });
};

BaseDao.prototype.save = function (obj, callback) {
  var self = this;
  this.sqlSessionFactory.withSession(function (session) {
    _DEBUG && console.log('dao save:', obj);
    if (self.isNew(obj)) {
      _DEBUG && console.log('dao save insert:', obj);
      session.insert(self.config.insert, obj, function (err, affectedRows, insertId) {
        _DEBUG && console.log('dao save insert result:', arguments);
        if (err) {
          return callback(err);
        }
        if (self.config.primaryKeyGenerated) {
          obj[self.config.primaryKey] = insertId;
        }
        return callback(null, affectedRows, insertId);
        // XXX: avoid concurrency issue
        // 'cause mysql doesn't support "INSERT ... RETRUNING ..."
        //return self.load(insertId, callback);
      });
    } else {
      _DEBUG && console.log('dao save update:', obj);
      session.update(self.config.update, obj, function (err, affectedRows) {
        _DEBUG && console.log('dao save update result:', arguments);
        if (err) {
          return callback(err);
        }
        return callback(null, affectedRows);
        // XXX: avoid concurrency issue
        // 'cause mysql doesn't support "INSERT ... RETRUNING ..."
        //return self.load(obj[self.config.primaryKey], callback);
      });
    }
  });
};

BaseDao.prototype.destroy = function (pk, callback) {
  var self = this;
  this.sqlSessionFactory.withSession(function (session) {
    _DEBUG && console.log('dao destroy:', pk);
    session.destroy(self.config.delete, [ pk ], callback);
  });
};

BaseDao.prototype.all = function (callback) {
  var self = this;
  this.sqlSessionFactory.withSession(function (session) {
    _DEBUG && console.log('dao all:');
    session.select(self.config.selectAll, [], callback);
  });
};

BaseDao.prototype.allWithRowBounds = function (rowBounds, callback) {
  var self = this;
  this.sqlSessionFactory.withSession(function (session) {
    _DEBUG && console.log('dao allWithRowBounds:', rowBounds);
    session.selectWithRowBounds(self.config.selectAll, [], rowBounds, callback);
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

function createDao(sqlSessionFactory, config) {
  return new BaseDao(sqlSessionFactory, config);
}

/////////////////////////////////////////////////////////////////////

module.exports = {
  BaseDao: BaseDao,
  createDao: createDao
};
