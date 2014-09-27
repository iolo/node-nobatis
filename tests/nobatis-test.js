'use strict';
/*global it, describe, it, before, after, beforeEach, afterEach */

var
    assert = require('assert'),
    _ = require('lodash'),
    Q = require('q'),
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
    ds = nobatis.createDataSource(config),
    debug = require('debug')('test');

describe('nobatis', function () {
    beforeEach(function (done) {
        var queries = ['DROP TABLE IF EXISTS test1',
            'CREATE TABLE test1 (id INTEGER AUTO_INCREMENT PRIMARY KEY, name VARCHAR(20))',
            'INSERT INTO test1(name) VALUES("one")',
            'INSERT INTO test1(name) VALUES("two")',
            'INSERT INTO test1(name) VALUES("three")'];
        ds.withSession(function (session) {
            return Q.all(queries.map(function (query, index) {
                debug('setUp#' + index, query);
                return session.execute(query, []);
            }));
        }).then(function (result) {
            debug('beforeEach ok', result);
            done();
        }).catch(assert.ifError);
    });

    afterEach(function (done) {
        var queries = ['DROP TABLE test1'];
        ds.withSession(function (session) {
            return Q.all(queries.map(function (query, index) {
                debug('tearDown#' + index, query);
                return session.execute(query, []);
            }));
        }).then(function (result) {
            debug('afterEach ok', result);
            done();
        }).catch(assert.ifError);
    });

    it('should select', function (done) {
        debug('***************testSelect');
        ds.withSession(function (session) {
            return session.select('test1.selectAll', []);
        }).then(function (rows) {
            debug('select', arguments);
            assert.ok(rows);
            assert.ok(_.isArray(rows));
            assert.equal(3, rows.length);
            assert.equal(1, rows[0].id);
            assert.equal("one", rows[0].name);
            assert.equal(2, rows[1].id);
            assert.equal("two", rows[1].name);
            assert.equal(3, rows[2].id);
            assert.equal("three", rows[2].name);
        }).catch(function (err) {
            assert.ifError(err);
        }).finally(done);
    });

//    it('should selectOne', function (done) {
//        ds.withSession(function (session) {
//            return session.selectOne('test1.select', [1])
//                .then(function (row) {
//                    debug('selectOne:', arguments);
//                    assert.ok(_.isObject(row));
//                    assert.equal(1, row.id)
//                    assert.equal("one", row.name)
//                })
//                .catch(function (err) {
//                    assert.ifError(err);
//                });
//        }).finally(done);
//    });
//
//    it('should selectOne_noResult', function (done) {
//        ds.withSession(function (session) {
//            return session.selectOne('test1.select', [-999])
//                .then(function (row) {
//                    debug('selectOne_noResult:', arguments);
//                    assert.ok(false);
//                })
//                .catch(function (err) {
//                    assert.ok(err instanceof nobatis.NobatisError);
//                });
//        }).finally(done);
//    });
//
//    it('should select_bounds', function (done) {
//        ds.withSession(function (session) {
//            return session.select('test1.selectAll', [], {offset: 1, limit: 1})
//                .then(function (rows) {
//                    debug('select_bounds:', arguments);
//                    assert.ok(rows);
//                    assert.ok(_.isArray(rows));
//                    assert.equal(1, rows.length);
//                    assert.equal(2, rows[0].id);
//                    assert.equal("two", rows[0].name);
//                })
//                .catch(function (err) {
//                    assert.ifError(err);
//                });
//        }).finally(done);
//    });
//
//    it('should insert', function (done) {
//        ds.withSession(function (session) {
//            return session.insert('test1.insert', { name: 'foo'})
//                .then(function (insertId) {
//                    debug('insert:', arguments);
//                    assert.ok(insertId > 3)
//                })
//                .catch(function (err) {
//                    assert.ifError(err);
//                });
//        }).finally(done);
//    });
//
//    it('should update', function (done) {
//        ds.withSession(function (session) {
//            return session.update('test1.update', { id: 3, name: 'foo'})
//                .then(function (affectedRows) {
//                    debug('update:', arguments);
//                    assert.equal(1, affectedRows);
//                })
//                .catch(function (err) {
//                    assert.ifError(err);
//                })
//        }).finally(done);
//    });
//
//    it('should destroy', function (done) {
//        ds.withSession(function (session) {
//            return session.destroy('test1.delete', [3])
//                .then(function (affectedRows) {
//                    debug('destroy:', arguments);
//                    assert.equal(1, affectedRows);
//                    done();
//                })
//                .catch(function (err) {
//                    assert.ifError(err);
//                });
//        }).finally(done);
//    });
});
