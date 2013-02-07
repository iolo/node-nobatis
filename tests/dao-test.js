'use strict';

var _ = require('underscore'),
  q = require('q'),
  nobatis = require('../libs/nobatis'),
  daofactory = require('../libs/dao'),
  config = {
    "dataSource": {
      "driver": "mariasql",
      "host": "localhost",
      "port": 3306,
      "row": "root",
      "password": "",
      "db": "test"
    },
    "queries": {
      "test1.selectAll": "SELECT * FROM test1",
      "test1.select": "SELECT * FROM test1 WHERE id=?",
      "test1.insert": "INSERT INTO test1(name) VALUES(:name)",
      "test1.update": "UPDATE test1 SET name=:name WHERE id=:id",
      "test1.delete": "DELETE FROM test1 WHERE id=?"
    }
  },
  factory = nobatis.build(config),
  testDao = nobatis.createDao({
    table: 'test1',
    defaults: {id: 0, name: 'noname'}
  });

module.exports = {
  setUp: function (callback) {
    var queries = ['DROP TABLE IF EXISTS test1',
      'CREATE TABLE test1 (id INTEGER AUTO_INCREMENT PRIMARY KEY, name VARCHAR(20))',
      'INSERT INTO test1(name) VALUES("one")',
      'INSERT INTO test1(name) VALUES("two")',
      'INSERT INTO test1(name) VALUES("three")'];
    factory.withSession(function (session) {
      q.all(queries.map(function (query, index) {
          var d = q.defer();
          console.log('setUp#' + index, query);
          session.execute(query, [], function (result) {
            console.log(result);
            d.resolve();
          });
          return d.promise;
        })).done(function () {
          callback();
        });
    });
  },

  tearDown: function (callback) {
    var queries = ['DROP TABLE test1'];
    factory.withSession(function (session) {
      q.all(queries.map(function (query, index) {
          var d = q.defer();
          console.log('tearDown#' + index, query);
          session.execute(query, [], function (result) {
            console.log(result);
            d.resolve();
          });
          return d.promise;
        })).done(function () {
          callback()
        });
    });
  },

  testNew: function (test) {
    var obj1 = testDao.createNew();
    test.ok(testDao.isNew(obj1));
    test.equal(0, obj1.id);
    test.equal('noname', obj1.name);

    var obj2 = testDao.createNew({name: 'foo'});
    test.ok(testDao.isNew(obj1));
    test.equal(0, obj2.id);
    test.equal('foo', obj2.name);

    test.done();
  },

  testLoad: function (test) {
    testDao.load(1, function (err, row) {
      console.log('*** load 1:', arguments);
      test.ifError(err);

      test.ok(row);
      test.ok(!testDao.isNew(row));
      test.equal('one', row.name);

      testDao.load(2, function (err, row) {
        console.log('*** load 2:', arguments);
        test.ifError(err);

        test.ok(row);
        test.ok(!testDao.isNew(row));
        test.equal('two', row.name);

        testDao.load(3, function (err, row) {
          console.log('*** load 3:', arguments);
          test.ifError(err);

          test.ok(row);
          test.ok(!testDao.isNew(row));
          test.equal('three', row.name);

          test.done();
        });
      });
    });
  },

  testLoad_noResult: function (test) {
    testDao.load(-999, function (err, row) {
      console.log('*** load noresult:', arguments);
      test.ok(err);
      test.ok(err instanceof nobatis.NobatisError);
      test.done();
    });
  },

  testAll: function (test) {
    testDao.all(function (err, rows, numRows) {
      console.log('*** all:', arguments);
      test.ifError(err);

      test.ok(rows);
      test.ok(rows instanceof Array);
      test.equal(3, rows.length);
      test.equal(1, rows[0].id)
      test.equal("one", rows[0].name)
      test.equal(2, rows[1].id)
      test.equal("two", rows[1].name)
      test.equal(3, rows[2].id)
      test.equal("three", rows[2].name)
      test.equal(rows.length, numRows);
      test.done();
    });
  },

  testAll_bounds: function (test) {
    testDao.all({offset: 1, limit: 1}, function (err, rows, numRows) {
      console.log('*** all_bounds:', arguments);
      test.ifError(err);

      test.ok(rows);
      test.ok(rows instanceof Array);
      test.equal(1, rows.length);
      test.equal(2, rows[0].id)
      test.equal("two", rows[0].name)
      test.equal(rows.length, numRows);
      test.done();
    });
  },

  testSave_insert: function (test) {
    var obj = testDao.createNew({name: 'foo'});
    test.ok(testDao.isNew(obj));
    test.equal('foo', obj.name);
    console.log('*** create new to insert: ', obj);

    testDao.save(obj, function (err, affectedRows, insertId) {
      console.log('*** save insert:', arguments);

      test.ifError(err);

      test.equal(1, affectedRows);
      test.ok(insertId);

      testDao.load(insertId, function (err, reloadedObj) {
        console.log('*** load after insert:', arguments);
        test.ifError(err);

        test.equal('foo', reloadedObj.name);
        test.done();
      });
    });
  },

  testSave_update: function (test) {
    testDao.load(3, function (err, obj) {
      console.log('*** load 3 to update:', obj);

      test.ifError(err);

      obj.name = 'foo';
      testDao.save(obj, function (err, affectedRow) {
        console.log('*** save update:', arguments);
        test.ifError(err);

        testDao.load(3, function (err, reloadedObj) {
          console.log('*** load after update:', reloadedObj);
          test.ifError(err);

          test.equal('foo', reloadedObj.name);
          test.done();
        });
      });
    });
  },

  testDestroy: function (test) {
    testDao.destroy(3, function (err, affectedRows) {
      console.log('*** destroy 3:', arguments);
      test.ifError(err);
      test.equal(1, affectedRows);

      testDao.load(3, function (err, reloadedObj) {
        console.log('*** load 3 after destroy:', arguments);
        test.ok(err);
        test.ok(err instanceof nobatis.NobatisError);
        test.done();
      });

    });
  }
};
