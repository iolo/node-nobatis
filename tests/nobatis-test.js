'use strict';

var _ = require('underscore'),
  q = require('q'),
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
      "test1.select": "SELECT * FROM test1 WHERE id=?",
      "test1.insert": "INSERT INTO test1(name) VALUES(:name)",
      "test1.update": "UPDATE test1 SET name=:name WHERE id=:id",
      "test1.delete": "DELETE FROM test1 WHERE id=?"
    }
  },
  ds = nobatis.createDataSource(config);

module.exports = {
  setUp: function (callback) {
    var queries = ['DROP TABLE IF EXISTS test1',
      'CREATE TABLE test1 (id INTEGER AUTO_INCREMENT PRIMARY KEY, name VARCHAR(20))',
      'INSERT INTO test1(name) VALUES("one")',
      'INSERT INTO test1(name) VALUES("two")',
      'INSERT INTO test1(name) VALUES("three")'];
    ds.withSession(function (session) {
      return q.all(queries.map(function (query, index) {
        console.log('setUp#' + index, query);
        return session.execute(query, []);
      }));
    }).then(function() {
      console.log('**** setUp ok', arguments);
      callback();
    })
    .fail(function (err) {
      console.error(err);
    }).done();
  },

  tearDown: function (callback) {
    var queries = ['DROP TABLE test1'];
    ds.withSession(function (session) {
      return q.all(queries.map(function (query, index) {
        console.log('tearDown#' + index, query);
        return session.execute(query, []);
      }));
    }).then(function() {
        console.log('**** tearDown ok', arguments);
        callback();
      })
    .fail(function (err) {
      console.error(err);
    }).done();
  },

  testSelect: function (test) {
    console.log('***************testSelect');
    ds.withSession(function (session) {
      return session.select('test1.selectAll', []);
    })
      .then(function (rows) {
        console.log('select', arguments);
        test.ok(rows);
        test.ok(_.isArray(rows));
        test.equal(3, rows.length)
        test.equal(1, rows[0].id)
        test.equal("one", rows[0].name)
        test.equal(2, rows[1].id)
        test.equal("two", rows[1].name)
        test.equal(3, rows[2].id)
        test.equal("three", rows[2].name)
      }).fail(function (err) {
        test.ifError(err);
      })
      .fin(test.done);
  },

  testSelectOne: function (test) {
    ds.withSession(function (session) {
      return session.selectOne('test1.select', [1])
        .then(function (row) {
          console.log('selectOne:', arguments);
          test.ok(_.isObject(row));
          test.equal(1, row.id)
          test.equal("one", row.name)
        })
        .fail(function (err) {
          test.ifError(err);
        });
    }).fin(test.done);
  },

  testSelectOne_noResult: function (test) {
    ds.withSession(function (session) {
      return session.selectOne('test1.select', [-999])
        .then(function (row) {
          console.log('selectOne_noResult:', arguments);
          test.ok(false);
        })
        .fail(function (err) {
          test.ok(err instanceof nobatis.NobatisError);
        });
    }).fin(test.done);
  },

  testSelect_bounds: function (test) {
    ds.withSession(function (session) {
      return session.select('test1.selectAll', [], {offset: 1, limit: 1})
        .then(function (rows) {
          console.log('select_bounds:', arguments);
          test.ok(rows);
          test.ok(_.isArray(rows));
          test.equal(1, rows.length)
          test.equal(2, rows[0].id)
          test.equal("two", rows[0].name)
        })
        .fail(function (err) {
          test.ifError(err);
        });
    }).fin(test.done);
  },
  testInsert: function (test) {
    ds.withSession(function (session) {
      return session.insert('test1.insert', { name: 'foo'})
        .then(function (insertId) {
          console.log('insert:', arguments);
          test.ok(insertId > 3)
        })
        .fail(function (err) {
          test.ifError(err);
        });
    }).fin(test.done);
  },

  testUpdate: function (test) {
    ds.withSession(function (session) {
      return session.update('test1.update', { id: 3, name: 'foo'})
        .then(function (affectedRows) {
          console.log('update:', arguments);
          test.equal(1, affectedRows);
        })
        .fail(function (err) {
          test.ifError(err);
        })
    }).fin(test.done);
  },

  testDestroy: function (test) {
    ds.withSession(function (session) {
      return session.destroy('test1.delete', [3])
        .then(function (affectedRows) {
          console.log('destroy:', arguments);
          test.equal(1, affectedRows);
          test.done();
        })
        .fail(function (err) {
          test.ifError(err);
        });
    }).fin(test.done);
  }
};
