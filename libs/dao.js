'use strict';

var
  _ = require('underscore'),
  q = require('q'),
  nobatis = require('./nobatis'),
  DEF_CONFIG = {
    primaryKey: 'id',
    primaryKeyGenerated: true
  },
  _DEBUG = !!process.env['NOBATIS_DEBUG'];

function BaseDao(dataSource, config) {
  _DEBUG && console.log('create dao: ', config);

  this.dataSource = dataSource;

  config = _.defaults(config, DEF_CONFIG);

  this.table = config.table;
  this.primaryKey = config.primaryKey;
  this.primaryKeyGenerated = config.primaryKeyGenerated;
  if (_.isFunction(config.defaults)) {
    this.defaults = config.defaults;
  } else {
    this.defaults = function () {
      return config.defaults;
    };
  }
  this.queries = _.defaults(config.queries || {}, {
    select: this.table + '.select',
    insert: this.table + '.insert',
    update: this.table + '.update',
    delete: this.table + '.delete',
    selectAll: this.table + '.selectAll'
  });
};

BaseDao.prototype.createNew = function (obj) {
  _DEBUG && console.log('dao new:', obj);
  return _.defaults(obj || {}, this.defaults());
};

BaseDao.prototype.isNew = function (obj) {
  // XXX: undefined, null, 0, false, ...
  return !obj[this.primaryKey];
};

BaseDao.prototype.load = function (pk) {
  var query = this.queries.select;
  return this.dataSource.withSession(function (session) {
    _DEBUG && console.log('dao load:', pk);
    return session.selectOne(query, [ pk ]);
  });
};

BaseDao.prototype.save = function (obj) {
  var self = this;
  return this.dataSource.withSession(function (session) {
    _DEBUG && console.log('dao save insert:', obj);
    if (self.isNew(obj)) {
      var query = self.queries.insert;
      return session.insert(query, obj)
        .then(function (insertId) {
          _DEBUG && console.log('dao save insert result:', arguments);
          if (self.primaryKeyGenerated) {
            obj[self.primaryKey] = insertId;
          }
          return insertId;
          // XXX: avoid concurrency issue
          // 'cause mysql doesn't support "INSERT ... RETRUNING ..."
          //return self.load(insertId);
        });
    } else {
      var query = self.queries.update;
      _DEBUG && console.log('dao save update:', obj);
      return session.update(query, obj)
        .then(function (affectedRows) {
          _DEBUG && console.log('dao save update result:', arguments);
          return affectedRows;
          // XXX: avoid concurrency issue
          // 'cause mysql doesn't support "INSERT ... RETRUNING ..."
          //return self.load(obj[self.primaryKey]);
        });
    }
  });
};

BaseDao.prototype.destroy = function (pk) {
  var query = this.queries.delete;
  return this.dataSource.withSession(function (session) {
    _DEBUG && console.log('dao destroy:', pk);
    return session.destroy(query, [ pk ]);
  });
};

BaseDao.prototype.all = function (bounds) {
  _DEBUG && console.log('dao all:', bounds);
  var query = this.queries.selectAll;
  return this.dataSource.withSession(function (session) {
    return session.select(query, [], bounds);
  });
};

// TODO: ... support association?

// ex.
// orderDao.belongsTo('customer', 'customerId');
// orderDao.getCustomer(order, function (err, customer) { ... });
//BaseDao.prototype.belongsTo = function (foreignModel, foreignKey) {
//  var methodName = 'get' + _.capitalize(foreignModel);
//  this[methodName] = function (obj) {
//    var fk = obj[foreignKey];
//    return getDao(foreignModel).get(fk);
//  };
//};

// ex.
// supplierDao.hasOne('account', 'supplierId');
// supplierDao.getAccount(supplier, function (err, account) { ... });
//BaseDao.prototype.hasOne = function (foreignModel, foreignKey) {
//  var pkColumn = this.primaryKey;
//  var methodName = 'get' + _.capitalize(foreignModel);
//  this[methodName] = function (obj) {
//    var fk = obj[pkColumn];
//    var foreignMethodName = 'getBy' + _.capitalize(foreignKey);
//    return (getDao(foreignModel)[foreignMethodName])(fk);
//  };
//};

// ex.
// customerDao.hasMany('order', 'customerId');
// customerDao.listOrders(customer, function (err, orders) { ... });
//BaseDao.prototype.hasMany = function (foreignModel, foreignKey) {
//  var pkColumn = this.primaryKey;
//  var methodName = 'list' + _.capitalize(foreignModel) + 's';
//  this[methodName] = function (obj) {
//    var fk = obj[pkColumn];
//    var foreignMethodName = 'listBy' + _.capitalize(foreignKey);
//    return getDao(foreignModel)[foreignMethodName](fk);
//  };
//};

//BaseDao.prototype.hasOne = function (foreignTable, foreignKey) {}
//BaseDao.prototype.hasMany = function (foreignTable, foreignKey) {}
//BaseDao.prototype.hasOneThrough = function (foreignTable, foreignKey, junctionTable) {}
//BaseDao.prototype.hasManyThrough = function (foreignTable, foreignKey, junctionTable) {}
//BaseDao.prototype.hasAndBelongsToMany = function (foreignTable, foreignKey) {}

// TODO: ... with method cascading? ex. all().filter('id > 123').order('id').limit(10)
//BaseDao.prototype.find = function (filter, offset, limit, order) { }
//BaseDao.prototype.filter = function (condition) { }
//BaseDao.prototype.offset = function (offset) { }
//BaseDao.prototype.limit = function (limit) { }
//BaseDao.prototype.order = function (order) { }

/////////////////////////////////////////////////////////////////////

function createDao(dataSource, config) {
  return new BaseDao(dataSource, config);
}

/////////////////////////////////////////////////////////////////////

module.exports = {
  BaseDao: BaseDao,
  createDao: createDao
};
