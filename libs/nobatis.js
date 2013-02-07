'use strict';

var
  _ = require('underscore'),
  q = require('q'),
  factories = {},
  DEF_DRIVER = 'mariasql',
  DEF_FACTORY = 'default',
  _DEBUG = !!process.env['NOBATIS_DEBUG'];

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

function createRowBounds(offset, limit) {
  return (limit)
    ? new RowBounds(offset, limit) // both offset and limit
    : new RowBounds(0, offset); // limit-only
}

/////////////////////////////////////////////////////////////////////

// TODO: DataSource abstraction
function DataSource(config) {
  _DEBUG && console.log('create data source:', config);
  _.defaults(this, config, {
    driver: DEF_DRIVER,
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: ''
  });
}

function createDataSource(config) {
  return new DataSource(config);
}

/////////////////////////////////////////////////////////////////////

function QueryMapper(queries) {
  _DEBUG && console.log('create query loader:', queries);
  var queryMap = {};
  // TODO: we need xml? yaml? or something?
  _.each(queries, function (v, k) {
    console.log(k, '...');
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

function createQueryMapper(queries) {
  return new QueryMapper(queries);
}

/////////////////////////////////////////////////////////////////////

function SqlSessionFactoryBuilder() {
}

SqlSessionFactoryBuilder.prototype.build = function (config) {
  var dataSource = createDataSource(config.dataSource);

  try {
    _DEBUG && console.log('load nobatis driver module:' + dataSource.driver);
    var driverModule = require('./nobatis_' + dataSource.driver);

    var queryMapper = createQueryMapper(config.queries);
    return driverModule.createSessionFactory(dataSource, queryMapper);
  } catch (e) {
    _DEBUG && console.error(e);
    throw new NobatisError('failed to load nobatis driver module:' + dataSource.driver, e);
  }
}

/////////////////////////////////////////////////////////////////////

function createSqlSessionFactory(config) {
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

function createDao(daoConfig, factoryConfig) {
  return require('./dao').createDao(_.defaults(daoConfig || {}, { sqlSessionFactory: createSqlSessionFactory(factoryConfig) }));
}

/////////////////////////////////////////////////////////////////////

module.exports = {
  NobatisError: NobatisError,
  RowBounds: RowBounds,
  createRowBounds: createRowBounds,
  createDataSource: createDataSource,
  QueryMapper: QueryMapper,
  createQueryMapper: createQueryMapper,
  SqlSessionFactoryBuilder: SqlSessionFactoryBuilder,
  createSqlSessionFactory: createSqlSessionFactory,
  createDao: createDao,
  build: createSqlSessionFactory,
  dao: createDao
};
