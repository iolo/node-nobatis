'use strict';

var
  _ = require('underscore'),
  q = require('q'),
  DEF_DRIVER = 'mariasql',
  DEF_FACTORY = 'default',
  factories = {},
  _DEBUG = true;//!!process.env['NOBATIS_DEBUG'];

/////////////////////////////////////////////////////////////////////

function NobatisError(message, cause) {
  this.name = 'NobatisError';
  this.message = message || '';
  this.cause = cause;
}
NobatisError.prototype = Error.prototype;

/////////////////////////////////////////////////////////////////////

function RowBounds(offset, limit) {
  this.offset = offset;
  this.limit = limit;
}

/////////////////////////////////////////////////////////////////////

function SqlSessionFactoryBuilder() {
}

SqlSessionFactoryBuilder.prototype.build = function (config) {
  var driver = config.dataSource.driver || DEF_DRIVER;

  // TODO: we need xml? yaml? or something?
  _.each(config.queries, function (v, k) {
    if (_.isArray(v)) {
      // XXX: support a-query-in-multiple-lines
      config.queries[k] = v.join(' ');
    } else if (_.isObject(v)) {
      // XXX: support namespace
      _.each(v, function (vv, kk) {
        config.queries[k + '.' + kk] = vv;
      });
    }
  });
  try {
    _DEBUG && console.log('load nobatis driver module:' + driver);
    return require('./nobatis_' + driver).createSessionFactory(config);
  } catch (e) {
    throw new NobatisError('failed to load nobatis driver module:' + driver, e);
  }
}

/////////////////////////////////////////////////////////////////////

function build(config) {
  // for convenient, returns default factory as a default
  if (!config) {
    return factories[DEF_FACTORY];
  }
  var factoryId = config.id || DEF_FACTORY;
  var factory = factories[factoryId];
  if (!factory) {
    var builder = new SqlSessionFactoryBuilder();
    factory = builder.build(config);
    factories[factoryId] = factory;
  }
  return factory;
}

/////////////////////////////////////////////////////////////////////

module.exports = {
  NobatisError: NobatisError,
  RowBounds: RowBounds,
  SqlSessionFactoryBuilder: SqlSessionFactoryBuilder,
  build: build
};
