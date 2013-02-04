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

function loadConfiguration(config) {
  // when config starts with './' or '../',
  // load as module(must be valid json format)
  if (_.isString(config) && /^\.\.?\//.test(config)) {
    try {
      config = require(config);
    } catch (e) {
      throw new NobatisError('failed to load nobatis configuration module:' + config, e);
    }
  }
  return config;
}

/////////////////////////////////////////////////////////////////////

function SqlSessionFactoryBuilder() {
}

SqlSessionFactoryBuilder.prototype.build = function (config) {
  var config = loadConfiguration.apply(this, arguments);
  var driver = config.dataSource.driver || DEF_DRIVER;
  try {
    return require('./nobatis_' + driver).createSessionFactory(config);
  } catch (e) {
    throw new NobatisError('failed to load nobatis driver module:' + driver, e);
  }
}

/////////////////////////////////////////////////////////////////////

function build(config) {
  var factoryId = config.id || DEF_FACTORY;
  var factory = factories[factoryId];
  if (!factory) {
    var builder = new SqlSessionFactoryBuilder();
    factory = builder.build.apply(builder, arguments);
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
