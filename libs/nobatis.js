'use strict';

var
  _ = require('underscore'),
  _DEBUG = true;//!!process.env['NOBATIS_DEBUG'];

/////////////////////////////////////////////////////////////////////

function NobatisError(message) {
  Error.apply(this, arguments);
}
NobatisError.prototype = new Error();
NobatisError.prototype.constructor = NobatisError;
NobatisError.prototype.constructor = 'NobatisError';

/////////////////////////////////////////////////////////////////////

function RowBounds(offset, limit) {
  this.offset = offset;
  this.limit = limit;
}

/////////////////////////////////////////////////////////////////////

// TODO: need cleanup!
function loadConfiguration(config, env, props) {
  // load as module(must be valid json format) when config starts with './' or '../',
  if (typeof defaults === 'string' && /^\.\.?\//.test(config)) {
    config = require(config);
  }
  // TODO: environment configurations
  if (typeof env === 'string') {
  }
  // override config with props
  if (typeof props === 'object') {
    config = _.defaults(props, config);
  }
  return config;
}

/////////////////////////////////////////////////////////////////////

function SqlSessionFactoryBuilder() {
}

SqlSessionFactoryBuilder.prototype.build = function () {
  var config = loadConfiguration.apply(this, arguments);
  if (typeof config.dataSource !== 'object') {
    throw 'invalid config file: no "dataSource"!';
  }
  try {
    return require('./nobatis_' + config.dataSource.driver).createSessionFactory(config);
  } catch (e) {
    throw new NobatisError('bad or missing factory type:' + config.dataSource.driver, e);
  }
}

/////////////////////////////////////////////////////////////////////

function build() {
  var builder = new SqlSessionFactoryBuilder();
  return builder.build.apply(builder, arguments);
}

/////////////////////////////////////////////////////////////////////

module.exports = {
  NobatisError:NobatisError,
  RowBounds:RowBounds,
  SqlSessionFactoryBuilder:SqlSessionFactoryBuilder,
  build:build
};
