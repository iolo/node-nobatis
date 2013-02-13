'use strict';

var
  _ = require('underscore'),
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

BaseDao.prototype.load = function (pk, callback) {
  var selectQuery = this.queries.select;
  this.dataSource.withSession(function (session) {
    _DEBUG && console.log('dao load:', pk);
    session.selectOne(selectQuery, [ pk ], callback);
  });
};

BaseDao.prototype.save = function (obj, callback) {
  if (this.isNew(obj)) {
    var self = this, insertQuery = this.queries.insert;
    this.dataSource.withSession(function (session) {
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
    this.dataSource.withSession(function (session) {
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
  this.dataSource.withSession(function (session) {
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
  this.dataSource.withSession(function (session) {
    session.select.apply(session, args);
  });
};

// TODO: ... support association?

// ex.
// orderDao.belongsTo('customer', 'customerId');
// orderDao.getCustomer(order, function (err, customer) { ... });
//BaseDao.prototype.belongsTo = function (foreignModel, foreignKey) {
//  var methodName = 'get' + _.capitalize(foreignModel);
//  this[methodName] = function (obj, callback) {
//    var fk = obj[foreignKey];
//    getDao(foreignModel).get(fk, callback);
//  };
//};

// ex.
// supplierDao.hasOne('account', 'supplierId');
// supplierDao.getAccount(supplier, function (err, account) { ... });
//BaseDao.prototype.hasOne = function (foreignModel, foreignKey) {
//  var pkColumn = this.primaryKey;
//  var methodName = 'get' + _.capitalize(foreignModel);
//  this[methodName] = function (obj, callback) {
//    var fk = obj[pkColumn];
//    var foreignMethodName = 'getBy' + _.capitalize(foreignKey);
//    (getDao(foreignModel)[foreignMethodName])(fk, callback);
//  };
//};

// ex.
// customerDao.hasMany('order', 'customerId');
// customerDao.listOrders(customer, function (err, orders) { ... });
//BaseDao.prototype.hasMany = function (foreignModel, foreignKey) {
//  var pkColumn = this.primaryKey;
//  var methodName = 'list' + _.capitalize(foreignModel) + 's';
//  this[methodName] = function (obj, callback) {
//    var fk = obj[pkColumn];
//    var foreignMethodName = 'listBy' + _.capitalize(foreignKey);
//    getDao(foreignModel)[foreignMethodName](fk, callback);
//  };
//};

//BaseDao.prototype.hasOne = function (foreignTable, foreignKey) {}
//BaseDao.prototype.hasMany = function (foreignTable, foreignKey) {}
//BaseDao.prototype.hasOneThrough = function (foreignTable, foreignKey, junctionTable) {}
//BaseDao.prototype.hasManyThrough = function (foreignTable, foreignKey, junctionTable) {}
//BaseDao.prototype.hasAndBelongsToMany = function (foreignTable, foreignKey) {}

// TODO: ... with method cascading? ex. all().filter('id > 123').order('id').limit(10)
//BaseDao.prototype.find = function (filter, offset, limit, order, callback) { }
//BaseDao.prototype.filter = function (condition, callback) { }
//BaseDao.prototype.offset = function (offset, callback) { }
//BaseDao.prototype.limit = function (limit, callback) { }
//BaseDao.prototype.order = function (order, callback) { }

/////////////////////////////////////////////////////////////////////

function createDao(dataSource, config) {
  return new BaseDao(dataSource, config);
}

/////////////////////////////////////////////////////////////////////

module.exports = {
  BaseDao: BaseDao,
  createDao: createDao
};
