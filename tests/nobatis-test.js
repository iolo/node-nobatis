var _ = require('underscore'),
  mariasql = require('mariasql'),
  nobatis = require('../libs/nobatis'),
  config = {
    "dataSource":{
      "driver":"mariasql",
      "host":"localhost",
      "port":3306,
      "user":"root",
      "password":"",
      "db":"test"
    },
    "queries":{
      "test1.selectAll":{
        "type":"select",
        "query":"SELECT * FROM test1",
        "resultType":"Test1Model"
      },
      "test1.selectById":{
        "type":"select",
        "query":"SELECT * FROM test1 WHERE id=?",
        "parameterType":"number",
        "resultType":"object"
      },
      "test1.insert":{
        "type":"insert",
        "query":"INSERT INTO test1(name) VALUES(?)",
        "parameterType":"object"
      },
      "test1.updateById":{
        "type":"update",
        "query":"UPDATE test1 SET name=? WHERE id=?",
        "parameterType":"string"
      },
      "test1.deleteById":{
        "type":"delete",
        "query":"DELETE FROM test1 WHERE id=?",
        "parameterType":"number"
      }
    }
  },
  factory = nobatis.build(config);

module.exports = {
  setUp:function (callback) {
    var sqls = ['DROP TABLE IF EXISTS test1',
      'CREATE TABLE test1 (id INTEGER AUTO_INCREMENT PRIMARY KEY, name VARCHAR(20))',
      'INSERT INTO test1(name) VALUES("one")',
      'INSERT INTO test1(name) VALUES("two")',
      'INSERT INTO test1(name) VALUES("three")'];
    console.log('setUp:', sqls);
    factory.withSession(function (session) {
      sqls.forEach(function (sql, index) {
        session.execute(sql, [], function (result) {
          console.log(result);
        });
      });
      callback();
    });
  },

  tearDown:function (callback) {
    var sqls = ['DROP TABLE test1'];
    console.log('tearDown:', sqls);
    factory.withSession(function (session) {
      sqls.forEach(function (sql, index) {
        session.execute(sql, [], function (result) {
          console.log(result);
        });
      });
      callback();
    });
  },

  testSelect:function (test) {
    factory.withSession(function (session) {
      console.log('select:');
      session.select('test1.selectAll', [], function (err, result) {
        test.ifError(err);
        console.log(result);
        test.ok(result);
        test.ok(_.isArray(result));
        test.equal(3, result.length)
        test.equal(1, result[0].id)
        test.equal("one", result[0].name)
        test.equal(2, result[1].id)
        test.equal("two", result[1].name)
        test.equal(3, result[2].id)
        test.equal("three", result[2].name)
        test.done();
      });
    });
  },

  testSelectWithBounds:function (test) {
    factory.withSession(function (session) {
      session.selectWithBounds('test1.selectAll', new noredis.RowBounds(1, 1), [], function (err, result) {
        test.ifError(err);
        console.log(result);
        test.ok(result);
        test.ok(_.isArray(result));
        test.equal(1, result.length)
        test.equal(2, result[0].id)
        test.equal("two", result[0].name)
        test.done();
      });
    });
  }
  /*,
   testSelectOne:function (test) {
   factory.selectOne('test1.selectById', [1], function (err, result) {
   test.ifError(err);
   console.log(result);
   test.ok(result);
   test.ok(_.isObject(result));
   test.equal(1, result.id);
   test.equal("one", result.name);
   test.done();
   });
   },

   testInsert:function (test) {
   factory.insert('test1.insert', { name:'foo'}, function (err, result) {
   test.ifError(err);
   console.log(result);
   test.ok(result);
   test.ok(_.isString(result));//XXX:mariasql bug?
   test.ok(result > 3)
   test.done();
   });
   },

   testUpdate:function (test) {
   factory.update('test1.update', { id:3, name:'foo'}, function (err, result) {
   test.ifError(err);
   console.log('update:', result);
   test.ok(result);
   test.ok(_.isBoolean(result));
   test.done();
   });
   },

   testDestroy:function (test) {
   factory.destroy('test1.delete', [3], function (err, result) {
   test.ifError(err);
   console.log('destroy:', result);
   console.dir(result);
   test.ok(result);
   test.ok(_.isBoolean(result));
   test.done();
   });
   },

   testQuery:function (test) {
   test1nobatis.query('SELECT * FROM test1 WHERE id < ?', [2], function (err, result) {
   test.ifError(err);
   console.log('query:', result);
   test.ok(result);
   test.ok(_.isArray(result));
   test.equal(1, result.length)
   test.equal(1, result[0].id)
   test.equal("one", result[0].name)
   test.done();
   });
   }
   */
};
