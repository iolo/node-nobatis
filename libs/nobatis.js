'use strict';

var
  _ = require('underscore'),
  q = require('q'),
  DEF_DRIVER = 'mariasql',
  DEF_DATA_SOURCE = 'default',
  dataSources = {},
  _DEBUG = !!process.env['NOBATIS_DEBUG'];

/////////////////////////////////////////////////////////////////////

function NobatisError(message, cause) {
  this.name = 'NobatisError';
  this.message = message || '';
  this.cause = cause;
}
NobatisError.prototype = Error.prototype;

/////////////////////////////////////////////////////////////////////

function QueryMapper(queries) {
  _DEBUG && console.log('create query loader:', queries);
  var queryMap = {};
  // TODO: we need xml? yaml? or something?
  _.each(queries, function (v, k) {
    if (_.isArray(v)) {
      // XXX: support a-query-in-multiple-lines
      queryMap[k] = v.join(' ');
    } else if (_.isObject(v)) {
      // XXX: support namespace
      _.each(v, function (vv, kk) {
        queryMap[k + '.' + kk] = vv;
      });
    } else if (_.isString(v)) {
      queryMap[k] = v;
    } else {
      throw new NobatisError('invalid query "' + k + '"');
    }
  });
  this.queryMap = queryMap;
}

QueryMapper.prototype.get = function (query) {
  return this.queryMap[query] || query;
};

QueryMapper.prototype.contains = function (query) {
  return query in this.queryMap;
};

/////////////////////////////////////////////////////////////////////

function createQueryMapper(queries) {
  return new QueryMapper(queries);
}

function createDataSource(config) {
  if (!config) {
    _DEBUG && console.log('use default data source');
    return dataSources[DEF_DATA_SOURCE];
  }
  var dataSourceId = config.id || DEF_DATA_SOURCE;
  var dataSource = dataSources[dataSourceId];
  if (!dataSource) {
    _DEBUG && console.log('create data source:', dataSourceId);
    var dataSourceConfig = config.dataSource || {};
    var driver = dataSourceConfig.driver || DEF_DRIVER;
    var dataSourceModule;
    try {
      _DEBUG && console.log('load nobatis driver module:', driver);
      dataSourceModule = require('./nobatis_' + driver);
    } catch (e) {
      _DEBUG && console.error(e);
      throw new NobatisError('failed to load nobatis driver module:' + driver, e);
    }
    var queryMapper = createQueryMapper(config.queries || {});
    dataSources[dataSourceId] = dataSource = dataSourceModule.createDataSource(dataSourceConfig, queryMapper);
  }
  _DEBUG && console.log('use data source:', dataSourceId);
  return dataSource;
}

function createDao(dataSource, config) {
  if (arguments.length === 1) {
    config = dataSource;
    dataSource = createDataSource();
  }
  return require('./dao').createDao(dataSource, config);
}

/////////////////////////////////////////////////////////////////////

module.exports = {
  NobatisError: NobatisError,
  QueryMapper: QueryMapper,
  createQueryMapper: createQueryMapper,
  createDataSource: createDataSource,
  createDao: createDao
};
