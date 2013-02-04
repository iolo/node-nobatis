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
    "test1.selectById": "SELECT * FROM test1 WHERE id=?",
    "test1.insert": "INSERT INTO test1(name) VALUES(:name)",
    "test1.update": "UPDATE test1 SET name=:name WHERE id=:id",
    "test1.delete": "DELETE FROM test1 WHERE id=?"
  }
};
</pre></code>
**or else** you can write configurations to a file(json module).
3. import nobatis module
<pre><code class="javascript">
nobatis = require('nobatis');
</pre></code>
4. load configurations and create ```SqlSessionFactory```:
<pre><code class="javascript">
ssf = nobatis.build(config);
</pre></code>
**or else** you can load configuration from a file(json module):
<pre><code class="javascript">
ssf = nobatis.build('./config');
</pre></code>
4. now you can use ```openSession()``` method to get SqlSession:
<pre><code class="javascript">
var session = null;
try {
  session = ssf.openSession();
  // use session here …
} finally {
  session && session.close();
}
</pre></code>
*or* you can use ```withSession()``` method:
<pre><code class="javascript">
ssf.withSession(function (session) {
  // use session here …
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
session.selectWithRowBounds('test1.selectAll', [], new nobatis.RowBounds(2, 2), function(err, rows, numRows) {
    ...
});
</pre></code>

* select a single row
<pre><code class="javascript">
session.selectOne('test1.selectById', [1], function(err, row) {
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

* TBW
