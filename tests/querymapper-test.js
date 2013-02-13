'use strict';
var
  nobatis = require('../libs/nobatis');

module.exports = {
  testCreateQueryMapper: function (test) {
    var queries = { "test1.selectAll": "SELECT * FROM test1",
      "test1.select": [
        "SELECT * ",
        "FROM test1 ",
        "WHERE id=?"
      ],
      "test1": {
        "insert": "INSERT INTO test1(name) VALUES(:name)",
        "update": "UPDATE test1 SET name=:name WHERE id=:id",
        "delete": "DELETE FROM test1 WHERE id=?"
      }
    };
    var qm = nobatis.createQueryMapper(queries);
    test.ok(qm.contains('test1.selectAll'));
    test.ok(qm.contains('test1.select'));
    test.ok(qm.contains('test1.insert'));
    test.ok(qm.contains('test1.update'));
    test.ok(qm.contains('test1.delete'));
    test.equal(queries['test1.selectAll'], qm.get('test1.selectAll'));
    test.equal(queries['test1.select'].join(' '), qm.get('test1.select'));
    test.equal(queries.test1.insert, qm.get('test1.insert'));
    test.equal(queries.test1.update, qm.get('test1.update'));
    test.equal(queries.test1.delete, qm.get('test1.delete'));
    test.equal('this.is.not.exist', qm.get('this.is.not.exist'));
    test.done();
  },

  testCreateQueryMapper_empty: function (test) {
    var qm = nobatis.createQueryMapper();
    test.ok(qm);
    test.done();
  }
}

