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

How to Get DataSource
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
4. create ```DataSource``` with configutaion:
<pre><code class="javascript">
var dataSource = nobatis.createDataSource(config);
</pre></code>
**or** create one with a configuration file(json module):
<pre><code class="javascript">
var dataSource = nobatis.createDataSource(require('./config'));
</pre></code>
**or** get the default one:
<pre><code class="javascript">
var dataSource = nobatis.createDataSource();
</pre></code>
4. now ```openSession()```:
<pre><code class="javascript">
var session = null;
try {
  session = dataSource.openSession();
  // use session here …
} finally {
  session && session.close();
}
</pre></code>
*or* ```withSession()```:
<pre><code class="javascript">
dataSource.withSession(function (session) {
  // use session here ...
});
</pre></code>

How to Execute Queries
----------------------

* select multiple rows
<pre><code class="javascript">
session.select('test1.selectAll', [])
.then(function(rows) {
  ...
}).fail(function(err) {
  ...
});
</pre></code>

* select rows with row bounds
<pre><code class="javascript">
session.select('test1.selectAll', [], {offset:2, limit:2})
.then(function(rows) {
  ...
})
.fail(function(err) {
  ...
});
</pre></code>

* select a single row
<pre><code class="javascript">
session.selectOne('test1.select', [1])
.then(function(row) {
  ...
.fail(function(err) {
  ...
});
</pre></code>

* insert new row
<pre><code class="javascript">
session.insert('test1.insert', {name:'a'})
.then(function(insertId) {
  ...
.fail(function(err) {
  ...
});
</pre></code>

* update row(s)
<pre><code class="javascript">
session.update('test1.update', {id:1, name:'a'})
.then(function(affectedRows) {
  ...
.fail(function(err) {
  ...
});
</pre></code>

* delete row(s)
<pre><code class="javascript">
session.destroy('test1.delete', [1])
.then(function(affectedRows) {
  ...
.fail(function(err) {
  ...
});
</pre></code>

How to Create DAO
-----------------

<pre><code class="javascript">
var nobatis = require('nobatis');
var dataSource = require('nobatis').createDataSource(config);
var dao = nobatis.createDao(dataSource, {
  table: 'test1',
  primaryKey: 'id',
  primaryKeyGenerated: true,
  defaults: function () {
    return {
      id: 0,
      name: '',
      created: new Date()
    };
  }
});
var obj = dao.createNew();

// assert(dao.isNew(obj));

dao.load(pk)
.then(function (obj) {
  ...
.fail(function(err) {
  ...
});

dao.save(obj)
.then(function (affectedRow-or-insertId) {
  ...
.fail(function(err) {
  ...
});

dao.destroy(pk)
.then(function (affectedRow) {
  ...
.fail(function(err) {
  ...
});

dao.all()
.then(function (rows) {
  ...
.fail(function(err) {
  ...
});

dao.all({offset:10, limit:10})
.then(function (rows, numRows) {
  ...
.fail(function(err) {
  ...
});
</pre></code>

* see also [https://github.com/kriskowal/q]

* TBW
