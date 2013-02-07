nobatis
=======

*This is extremely experimental stuff*

This is a simple "mybatis-like" dao for nodejs.

Features
--------

* TBW ...

Install
-------

```
npm install nobatis
```

or

```
npm install git@github.com:iolo/node-nobatis.git
```

How to Get SqlSession(using SqlSessionFactory)
----------------------------------------------

1. prepare configurations:
<pre><code class="javascript">
var config = {
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
};
</pre></code>
**or** you can write configurations to a file(json module).
3. import nobatis module
<pre><code class="javascript">
var nobatis = require('nobatis');
</pre></code>
4. create ```SqlSessionFactory``` with configutaion:
<pre><code class="javascript">
var ssf = nobatis.build(config);
</pre></code>
**or** create one with a configuration file(json module):
<pre><code class="javascript">
var ssf = nobatis.build(require('./config'));
</pre></code>
**or** get the default one:
<pre><code class="javascript">
var ssf = nobatis.build();
</pre></code>
4. now ```openSession()```:
<pre><code class="javascript">
var session = null;
try {
  session = ssf.openSession();
  // use session here …
} finally {
  session && session.close();
}
</pre></code>
*or* ```withSession()```:
<pre><code class="javascript">
ssf.withSession(function (session) {
  // use session here ...
});
</pre></code>

How to Execute Queries(using SqlSession)
----------------------------------------

* select multiple rows
<pre><code class="javascript">
session.select('test1.selectAll', [], function(err, rows, numRows) {
    ...
});
</pre></code>

* select rows with row bounds
<pre><code class="javascript">
session.select('test1.selectAll', [], {offset:2, limit:2}, function(err, rows, numRows) {
    ...
});
</pre></code>

* select a single row
<pre><code class="javascript">
session.selectOne('test1.select', [1], function(err, row) {
    ...
});
</pre></code>

* insert new row
<pre><code class="javascript">
session.insert('test1.insert', {name:'a'}, function(err, affectedRows, insertId) {
    ...
});
</pre></code>

* update row(s)
<pre><code class="javascript">
session.update('test1.update', {id:1, name:'a'}, function(err, affectedRows) {
    ...
});
</pre></code>

* delete row(s)
<pre><code class="javascript">
session.destroy('test1.delete', [1], function(err, affectedRows) {
    ...
});
</pre></code>

How to Create DAO(using NobatisDao)
-----------------------------------

<pre><code class="javascript">
var nobatis = require('nobatis');
// create dao
var dao = nobatis.createDao({
  table: 'test1',
  primaryKey: 'id',
  primaryKeyGenerated: true,
  defaults: {
    id: 0,
    name: ''
  }
}, factoryConfig);
// or
var dao = nobatis.createDao()
  .withSqlSessionFactory(nobatis.build(...))
  .withTable('test1')
  .withPrimaryKey('id', true)
  .withDefaults({
    id: 0,
    name: ''
  });
});

var obj = dao.createNew();

// assert(dao.isNew(obj));

dao.load(pk, function (err, obj) {
    if (err) {
      // not found
    }
    ...
});

dao.save(obj, function (err, affectedRow, insertId) {
    ...
    // assert(affectedRow === 1);
    // assert(!dao.isNew(obj));
});

dao.destroy(pk, function (err, affectedRow) {
    ...
    // assert(affectedRow === 1);
});

dao.all(function (err, rows, numRows) {
    ...
    // assert(rows.length === numRows);
});

dao.all({offset:10, limit:10}, function (err, rows, numRows) {
    ...
    // assert(rows.length === numRows);
    // assert(rows.length <= limit);
});
</pre></code>


* TBW
