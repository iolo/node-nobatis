'use strict';
/*global it, describe, it, before, after, beforeEach, afterEach */

var
    assert = require('assert'),
    nobatis = require('../libs/nobatis');

describe('query mapper', function () {
    it('should createQueryMapper', function (done) {
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
        assert.ok(qm.contains('test1.selectAll'));
        assert.ok(qm.contains('test1.select'));
        assert.ok(qm.contains('test1.insert'));
        assert.ok(qm.contains('test1.update'));
        assert.ok(qm.contains('test1.delete'));
        assert.equal(queries['test1.selectAll'], qm.get('test1.selectAll'));
        assert.equal(queries['test1.select'].join(' '), qm.get('test1.select'));
        assert.equal(queries.test1.insert, qm.get('test1.insert'));
        assert.equal(queries.test1.update, qm.get('test1.update'));
        assert.equal(queries.test1.delete, qm.get('test1.delete'));
        assert.equal('this.is.not.exist', qm.get('this.is.not.exist'));
        done();
    });

    it('should createQueryMapper_empty', function (done) {
        var qm = nobatis.createQueryMapper();
        assert.ok(qm);
        done();
    });
});

