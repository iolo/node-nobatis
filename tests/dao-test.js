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
    dao = nobatis.createDao({
        table: 'test1',
        defaults: function () {
            return {id: 0, name: 'noname'};
        }
    }),
    debug = require('debug')('test');

describe('dao', function () {
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

    it('should createNew', function (done) {
        var obj1 = dao.createNew();
        debug('*** new 1:', obj1);
        assert.ok(dao.isNew(obj1));
        assert.equal(0, obj1.id);
        assert.equal('noname', obj1.name);

        var obj2 = dao.createNew({name: 'foo'});
        debug('*** new 2:', obj2);
        assert.ok(dao.isNew(obj1));
        assert.equal(0, obj2.id);
        assert.equal('foo', obj2.name);

        done();
    });

    it('should load', function (done) {
        dao.load(1)
            .then(function (row) {
                debug('*** load 1:', arguments);

                assert.ok(row);
                assert.ok(!dao.isNew(row));
                assert.equal('one', row.name);

                return dao.load(2);
            })
            .then(function (row) {
                debug('*** load 2:', arguments);

                assert.ok(row);
                assert.ok(!dao.isNew(row));
                assert.equal('two', row.name);

                return dao.load(3);
            })
            .then(function (row) {
                debug('*** load 3:', arguments);

                assert.ok(row);
                assert.ok(!dao.isNew(row));
                assert.equal('three', row.name);
            }).catch(function (err) {
                assert.ifError(err);
            }).finally(done);
    });

    it('should load_noResult', function (done) {
        dao.load(-999)
            .then(function (row) {
                debug('*** load noresult:', arguments);
                assert.ok(false);
            })
            .catch(function (err) {
                assert.ok(err);
                assert.ok(err instanceof nobatis.NobatisError);
            })
            .finally(done);
    });

    it('should all', function (done) {
        dao.all()
            .then(function (rows) {
                debug('*** all:', arguments);

                assert.ok(rows);
                assert.ok(rows instanceof Array);
                assert.equal(3, rows.length);
                assert.equal(1, rows[0].id);
                assert.equal("one", rows[0].name);
                assert.equal(2, rows[1].id);
                assert.equal("two", rows[1].name);
                assert.equal(3, rows[2].id);
                assert.equal("three", rows[2].name);
            })
            .catch(function (err) {
                assert.ifError(err);
            })
            .finally(done);
    });

    it('should all_bounds', function (done) {
        dao.all({offset: 1, limit: 1})
            .then(function (rows) {
                debug('*** all_bounds:', arguments);

                assert.ok(rows);
                assert.ok(rows instanceof Array);
                assert.equal(1, rows.length);
                assert.equal(2, rows[0].id);
                assert.equal("two", rows[0].name);
            })
            .catch(function (err) {
                assert.ifError(err);
            })
            .finally(done);
    });

    it('should save_insert', function (done) {
        var obj = dao.createNew({name: 'foo'});
        assert.ok(dao.isNew(obj));
        assert.equal('foo', obj.name);
        debug('*** create new to insert: ', obj);

        dao.save(obj)
            .then(function (insertRow) {
                debug('*** save insert:', arguments);

                assert.ok(insertRow > 0);

                return dao.load(insertRow);
            })
            .then(function (savedObj) {
                debug('*** save insert and reload:', arguments);

                assert.ok(savedObj);
                assert.ok(!dao.isNew(savedObj));
                assert.equal('foo', obj.name);
            })
            .catch(function (err) {
                assert.ifError(err);
            })
            .finally(done);
    });

    it('should save_insert_reload', function (done) {
        var obj = dao.createNew({name: 'foo'});
        assert.ok(dao.isNew(obj));
        assert.equal('foo', obj.name);
        debug('*** create new to insert: ', obj);

        dao.save(obj, true)
            .then(function (savedObj) {
                debug('*** save insert:', arguments);

                assert.ok(savedObj);
                assert.ok(!dao.isNew(savedObj));
                assert.equal('foo', obj.name);
            })
            .catch(function (err) {
                assert.ifError(err);
            })
            .finally(done);
    });

    it('should save_update', function (done) {
        dao.load(3)
            .then(function (obj) {
                debug('*** load 3 to update:', obj);

                assert.ok(!dao.isNew(obj));
                obj.name = 'foo';

                return dao.save(obj);
            })
            .then(function (result) {

                assert.ok(result);

                return dao.load(3);
            })
            .then(function (savedObj) {
                debug('*** save update reload 3:', arguments);

                assert.ok(!dao.isNew(savedObj));
                assert.equal('foo', savedObj.name);
            })
            .catch(function (err) {
                assert.ifError(err);
            })
            .finally(done);
    });

    it('should save_update_reload', function (done) {
        dao.load(3)
            .then(function (obj) {
                debug('*** load 3 to update:', obj);

                assert.ok(!dao.isNew(obj));
                obj.name = 'foo';

                return dao.save(obj, true);
            })
            .then(function (savedObj) {
                debug('*** save update 3:', arguments);

                assert.ok(!dao.isNew(savedObj));
                assert.equal('foo', savedObj.name);
            })
            .catch(function (err) {
                assert.ifError(err);
            })
            .finally(done);
    });

    it('should save_update_notExist', function (done) {
        var obj = dao.createNew({id: -999, name: 'foo'});
        assert.ok(!dao.isNew(obj));
        assert.equal(-999, obj.id);
        assert.equal('foo', obj.name);

        dao.save(obj, true)
            .then(function (savedObj) {
                debug('*** save update -999:', arguments);

                assert.ok(false);
            })
            .catch(function (err) {
                assert.ok(err);
                assert.ok(err instanceof nobatis.NobatisError);
            })
            .finally(done);
    });

    it('should destroy', function (done) {
        dao.destroy(3)
            .then(function (result) {
                debug('*** destroy 3:', arguments);
                assert.ok(result);

                return dao.load(3);
            })
            .then(function (reloadedObj) {
                debug('*** load 3 after destroy:', arguments);
                assert.ok(false);
            })
            .catch(function (err) {
                assert.ok(err);
                assert.ok(err instanceof nobatis.NobatisError);
            })
            .finally(done);
    });

    it('should destroy_notExist', function (done) {
        dao.destroy(-999)
            .then(function (result) {
                debug('*** destroy -999:', arguments);

                assert.ok(false);
            })
            .catch(function (err) {
                assert.ok(err);
                assert.ok(err instanceof nobatis.NobatisError);
            })
            .finally(done);
    });
});
