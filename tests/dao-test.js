'use strict';

var _ = require('underscore'),
  q = require('q'),
  nobatis = require('../libs/nobatis'),
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
  ds = nobatis.createDataSource(config),
  testDao = nobatis.createDao({
    table: 'test1',
    defaults: function () {
      return {id: 0, name: 'noname'};
    }
  });

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
    }).then(function () {
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
    }).then(function () {
        console.log('**** tearDown ok', arguments);
        callback();
      })
      .fail(function (err) {
        console.error(err);
      }).done();
  },

  testNew: function (test) {
    var obj1 = testDao.createNew();
    console.log('*** new 1:', obj1);
    test.ok(testDao.isNew(obj1));
    test.equal(0, obj1.id);
    test.equal('noname', obj1.name);

    var obj2 = testDao.createNew({name: 'foo'});
    console.log('*** new 2:', obj2);
    test.ok(testDao.isNew(obj1));
    test.equal(0, obj2.id);
    test.equal('foo', obj2.name);

    test.done();
  },

  testLoad: function (test) {
    testDao.load(1)
      .then(function (row) {
        console.log('*** load 1:', arguments);

        test.ok(row);
        test.ok(!testDao.isNew(row));
        test.equal('one', row.name);

        return testDao.load(2);
      })
      .then(function (row) {
        console.log('*** load 2:', arguments);

        test.ok(row);
        test.ok(!testDao.isNew(row));
        test.equal('two', row.name);

        return testDao.load(3);
      })
      .then(function (row) {
        console.log('*** load 3:', arguments);

        test.ok(row);
        test.ok(!testDao.isNew(row));
        test.equal('three', row.name);
      }).fail(function (err) {
        test.ifError(err);
      }).fin(test.done);
  },

  testLoad_noResult: function (test) {
    testDao.load(-999)
      .then(function (row) {
        console.log('*** load noresult:', arguments);
        test.ok(false);
      })
      .fail(function (err) {
        test.ok(err);
        test.ok(err instanceof nobatis.NobatisError);
      })
      .fin(test.done);
  },

  testAll: function (test) {
    testDao.all()
      .then(function (rows) {
        console.log('*** all:', arguments);

        test.ok(rows);
        test.ok(rows instanceof Array);
        test.equal(3, rows.length);
        test.equal(1, rows[0].id)
        test.equal("one", rows[0].name)
        test.equal(2, rows[1].id)
        test.equal("two", rows[1].name)
        test.equal(3, rows[2].id)
        test.equal("three", rows[2].name)
      })
      .fail(function (err) {
        test.ifError(err);
      })
      .fin(test.done);
  },

  testAll_bounds: function (test) {
    testDao.all({offset: 1, limit: 1})
      .then(function (rows) {
        console.log('*** all_bounds:', arguments);

        test.ok(rows);
        test.ok(rows instanceof Array);
        test.equal(1, rows.length);
        test.equal(2, rows[0].id)
        test.equal("two", rows[0].name)
      })
      .fail(function (err) {
        test.ifError(err);
      })
      .fin(test.done);
  },

  testSave_insert: function (test) {
    var obj = testDao.createNew({name: 'foo'});
    test.ok(testDao.isNew(obj));
    test.equal('foo', obj.name);
    console.log('*** create new to insert: ', obj);

    testDao.save(obj)
      .then(function (insertRow) {
        console.log('*** save insert:', arguments);

        test.ok(insertRow > 0);

        return testDao.load(insertRow);
      })
      .then(function (savedObj) {
        console.log('*** save insert and reload:', arguments);

        test.ok(savedObj);
        test.ok(!testDao.isNew(savedObj));
        test.equal('foo', obj.name);
      })
      .fail(function (err) {
        test.ifError(err);
      })
      .fin(test.done);
  },

  testSave_insert_reload: function (test) {
    var obj = testDao.createNew({name: 'foo'});
    test.ok(testDao.isNew(obj));
    test.equal('foo', obj.name);
    console.log('*** create new to insert: ', obj);

    testDao.save(obj, true)
      .then(function (savedObj) {
        console.log('*** save insert:', arguments);

        test.ok(savedObj);
        test.ok(!testDao.isNew(savedObj));
        test.equal('foo', obj.name);
      })
      .fail(function (err) {
        test.ifError(err);
      })
      .fin(test.done);
  },

  testSave_update: function (test) {
    testDao.load(3)
      .then(function (obj) {
        console.log('*** load 3 to update:', obj);

        test.ok(!testDao.isNew(obj));
        obj.name = 'foo';

        return testDao.save(obj);
      })
      .then(function (result) {

        test.ok(result);

        return testDao.load(3);
      })
      .then(function (savedObj) {
        console.log('*** save update reload 3:', arguments);

        test.ok(!testDao.isNew(savedObj));
        test.equal('foo', savedObj.name);
      })
      .fail(function (err) {
        test.ifError(err);
      })
      .fin(test.done);
  },

  testSave_update_reload: function (test) {
    testDao.load(3)
      .then(function (obj) {
        console.log('*** load 3 to update:', obj);

        test.ok(!testDao.isNew(obj));
        obj.name = 'foo';

        return testDao.save(obj, true);
      })
      .then(function (savedObj) {
        console.log('*** save update 3:', arguments);

        test.ok(!testDao.isNew(savedObj));
        test.equal('foo', savedObj.name);
      })
      .fail(function (err) {
        test.ifError(err);
      })
      .fin(test.done);
  },

  testSave_update_notExist: function (test) {
    var obj = testDao.createNew({id:-999, name: 'foo'});
    test.ok(!testDao.isNew(obj));
    test.equal(-999, obj.id);
    test.equal('foo', obj.name);

    testDao.save(obj, true)
      .then(function (savedObj) {
        console.log('*** save update -999:', arguments);

        test.ok(false);
      })
      .fail(function (err) {
        test.ok(err);
        test.ok(err instanceof nobatis.NobatisError);
      })
      .fin(test.done);
  },

  testDestroy: function (test) {
    testDao.destroy(3)
      .then(function (result) {
        console.log('*** destroy 3:', arguments);
        test.ok(result);

        return testDao.load(3);
      })
      .then(function (reloadedObj) {
        console.log('*** load 3 after destroy:', arguments);
        test.ok(false);
      })
      .fail(function (err) {
        test.ok(err);
        test.ok(err instanceof nobatis.NobatisError);
      })
      .fin(test.done);
  },

  testDestroy_notExist: function (test) {
    testDao.destroy(-999)
      .then(function (result) {
        console.log('*** destroy -999:', arguments);

        test.ok(false);
      })
      .fail(function (err) {
        test.ok(err);
        test.ok(err instanceof nobatis.NobatisError);
      })
      .fin(test.done);
  }
};
