'use strict';
var
  nobatis = require('../libs/nobatis'),
  config1 = {
    "id": "config1",
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
      "test1": {
        "insert": "INSERT INTO test1(name) VALUES(:name)",
        "update": "UPDATE test1 SET name=:name WHERE id=:id",
        "delete": "DELETE FROM test1 WHERE id=?"
      }
    }
  },
  config2 = {
    "id": "config2",
    "dataSource": {
      "driver": "mariasql",
      "host": "localhost",
      "port": 3306,
      "user": "root",
      "password": "",
      "db": "test"
    },
    "queries": {
      "test1.selectAll": ["SELECT *", "FROM test1"],
      "test1.selectById": ["SELECT *", "FROM test1", "WHERE id=?"],
      "test1.insert": ["INSERT INTO", "test1(name)","VALUES(:name)"],
      "test1.update": ["UPDATE test1", "SET name=:name","WHERE id=:id"],
      "test1.delete": ["DELETE FROM test1","WHERE id=?"]
    }
  };

module.exports = {
  testConfig1: function(test) {
    var config = nobatis.build(config1).config;
    console.log(config);
    test.done();
  },
  testConfig2: function(test) {
    var config = nobatis.build(config2).config;
    console.log(config);
    test.done();
  },
  testConfig3: function(test) {
    var config = nobatis.build(require('./config3')).config;
    console.log(config);
    test.done();
  },
  testConfig4: function(test) {
    var config = nobatis.build(require('./config4')).config;
    console.log(config);
    test.done();
  }
}

