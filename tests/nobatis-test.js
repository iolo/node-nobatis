var _ = require('underscore'),
  q = require('q'),
  mariasql = require('mariasql'),
  nobatis = require('../libs/nobatis'),
  config = {
    "dataSource": {
      "driver": "mariasql",
      "host": "localhost",
      "port": 3306,
      "user": "root",
      "password": "",
      "db": "test"
    },
    "queries": {
      "test1.selectAll": "SELECT * FROM test1",
      "test1.selectById": "SELECT * FROM test1 WHERE id=?",
      "test1.insert": "INSERT INTO test1(name) VALUES(:name)",
      "test1.update": "UPDATE test1 SET name=:name WHERE id=:id",
      "test1.delete": "DELETE FROM test1 WHERE id=?"
    }
  },
  factory = nobatis.build(config);

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

  testSelect: function (test) {
    factory.withSession(function (session) {
      session.select('test1.selectAll', [], function (err, rows, numRows) {
        console.log('select', arguments);
        test.ifError(err);
        console.log(rows);
        test.ok(rows);
        test.ok(_.isArray(rows));
        test.equal(3, rows.length)
        test.equal(1, rows[0].id)
        test.equal("one", rows[0].name)
        test.equal(2, rows[1].id)
        test.equal("two", rows[1].name)
        test.equal(3, rows[2].id)
        test.equal("three", rows[2].name)
        test.equal(rows.length, numRows);
        test.done();
      });
    });
  },

  testSelectOne: function (test) {
    factory.withSession(function (session) {
      session.selectOne('test1.selectById', [1], function (err, row, numRows) {
        console.log('selectOne:', arguments);
        test.ifError(err);
        test.ok(row);
        test.equal(1, row.id)
        test.equal("one", row.name)
        test.equal(1, numRows);
        test.done();
      });
    });
  },

  testSelectOne_noResult: function (test) {
    factory.withSession(function (session) {
      session.selectOne('test1.selectById', [-999], function (err, row, numRows) {
        console.log('selectOne_noResult:', arguments);
        test.ok(err instanceof nobatis.NobatisError);
        test.done();
      });
    });
  },

  testSelectWithRowBounds: function (test) {
    factory.withSession(function (session) {
      session.selectWithRowBounds('test1.selectAll', [], new nobatis.RowBounds(1, 1), function (err, rows, numRows) {
        console.log('selectWithRowBounds:', arguments);
        test.ifError(err);
        test.ok(rows);
        test.ok(_.isArray(rows));
        test.equal(1, rows.length)
        test.equal(2, rows[0].id)
        test.equal("two", rows[0].name)
        test.equal(rows.length, numRows);
        test.done();
      });
    });
  },
  testInsert: function (test) {
    factory.withSession(function (session) {
      session.insert('test1.insert', { name: 'foo'}, function (err, affectedRows, insertId) {
        console.log('insert:', arguments);
        test.ifError(err);
        test.equal(1, affectedRows);
        test.ok(insertId > 3)
        test.done();
      });
    });
  },

  testUpdate: function (test) {
    factory.withSession(function (session) {
      session.update('test1.update', { id: 3, name: 'foo'}, function (err, affectedRows) {
        console.log('update:', arguments);
        test.ifError(err);
        test.equal(1, affectedRows);
        test.done();
      });
    });
  },

  testDestroy: function (test) {
    factory.withSession(function (session) {
      session.destroy('test1.delete', [3], function (err, affectedRows) {
        console.log('destroy:', arguments);
        test.ifError(err);
        test.equal(1, affectedRows);
        test.done();
      });
    });
  }
};
