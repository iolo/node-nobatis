'use strict';

var
    _ = require('lodash'),
    Q = require('q'),
    nobatis = require('./nobatis'),
    DEF_CONFIG = {
        primaryKey: 'id',
        primaryKeyGenerated: true
    },
    debug = require('debug')('nobatis:dao'),
    DEBUG = debug.enabled;

function BaseDao(dataSource, config) {
    DEBUG && debug('create dao: ', config);

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
}

BaseDao.prototype.createNew = function (obj) {
    DEBUG && debug('dao new:', obj);
    return _.defaults(obj || {}, this.defaults());
};

BaseDao.prototype.isNew = function (obj) {
    // XXX: undefined, null, 0, false, ...
    var primaryKey = obj[this.primaryKey];
    return !primaryKey || primaryKey === '0';
};

BaseDao.prototype.load = function (pk) {
    var query = this.queries.select;
    return this.dataSource.withSession(function (session) {
        DEBUG && debug('dao load:', pk);
        return session.selectOne(query, [ pk ]);
    });
};

BaseDao.prototype.save = function (obj, reload) {
    var self = this;
    return this.dataSource.withSession(function (session) {
        var query;
        if (self.isNew(obj)) {
            query = self.queries.insert;
            DEBUG && debug('dao save insert:', obj);
            return session.insert(query, obj)
                .then(function (insertId) {
                    DEBUG && debug('dao save insert result:', arguments);
                    if (self.primaryKeyGenerated) {
                        obj[self.primaryKey] = insertId;
                    }
                    if (!insertId) {
                        throw new nobatis.NobatisError('save with insert error');
                    }
                    if (reload) {
                        // XXX: avoid concurrency issue
                        // 'cause mysql doesn't support "INSERT ... RETURNING ..."
                        return self.load(insertId);
                    } else {
                        return insertId;
                    }
                });
        } else {
            query = self.queries.update;
            DEBUG && debug('dao save update:', obj);
            return session.update(query, obj)
                .then(function (affectedRows) {
                    DEBUG && debug('dao save update result:', arguments);
                    if (affectedRows !== 1) {
                        throw new nobatis.NobatisError('save with update error');
                    }
                    if (reload) {
                        // XXX: avoid concurrency issue
                        // 'cause mysql doesn't support "INSERT ... RETURNING ..."
                        return self.load(obj[self.primaryKey]);
                    } else {
                        return true;
                    }
                });
        }
    });
};

BaseDao.prototype.destroy = function (pk) {
    var query = this.queries.delete;
    return this.dataSource.withSession(function (session) {
        DEBUG && debug('dao destroy:', pk);
        return session.destroy(query, [ pk ])
            .then(function (affectedRows) {
                DEBUG && debug('dao destroy result:', arguments);
                if (affectedRows !== 1) {
                    throw new nobatis.NobatisError('destroy error');
                }
                return true;
            });
    });
};

BaseDao.prototype.all = function (bounds) {
    DEBUG && debug('dao all:', bounds);
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
