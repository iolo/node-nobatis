nobatis
=======

This is a simple [mybatis](http://mybatis.org)-like DAO(NOT ORM) for node.js.

Features
--------

* query mapper and builder
* TODO: connection management
* TODO: promise support(kriskowal's Q)
* TODO: caching
* TODO: validation 
* TODO: logging 
* TODO: error handling
* DAO(NOT ORM)

Install
-------

```
$ npm install nobatis
```

or

```
$ npm install git@github.com:iolo/node-nobatis.git
```

How to Get DataSource
---------------------

* prepare configurations:

```javascript
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
```

* or you can write configurations to a file(json module)

* import nobatis module

```javascript
var nobatis = require('nobatis');
```

* create ```DataSource``` with configutaion:

```javascript
var dataSource = nobatis.createDataSource(config);
```

* or create one with a configuration file(json module):

```javascript
var dataSource = nobatis.createDataSource(require('./config'));
```

* or get the default one:

```javascript
var dataSource = nobatis.createDataSource();
```

* now you can ```openSession()```:

```javascript
var session = null;
try {
  session = dataSource.openSession();
  // use session here …
} finally {
  session && session.close();
}
```

* or work ```withSession()```:

```javascript
dataSource.withSession(function (session) {
  // use session here ...
});
```

* work ```withSession()``` and ```promise```:

```javascript
dataSource.withSession(function (session) {
  // use session and return promise ...
  return session.select(...)
    .then(function (select_result) {
      return session.insert(...);
    })
    .then(function (insert_result) {
      return session.update(...);
    })
    .then(function (update_result) {
      return session.destroy(...);
    });
})
.then(function (destroy_result) {
  ...
})
.catch(function (err) {
  ...
});
```

How to Execute Queries
----------------------

* select multiple rows

```javascript
session.select('test1.selectAll', [])
  .then(function (rows) {
    ...
  })
  .catch(function (err) {
    ...
  });
```

* select multiple rows with row bounds

```javascript
session.select('test1.selectAll', [], {offset:2, limit:2})
  .then(function (rows) {
    ...
  })
  .catch(function (err) {
    ...
  });
```

* select a single row

```javascript
session.selectOne('test1.select', \[1])
  .then(function (row) {
    ...
  .catch(function (err) {
    ...
  });
```

* insert new row

```javascript
session.insert('test1.insert', {name:'a'})
  .then(function (insertId) {
    ...
  .catch(function (err) {
    ...
  });
```

* update row(s)

```javascript
session.update('test1.update', {id:1, name:'a'})
  .then(function (affectedRows) {
    ...
  .catch(function (err) {
    ...
  });
```

* delete row(s)

```javascript
session.destroy('test1.delete', \[1])
  .then(function (affectedRows) {
    ...
  .catch(function (err) {
    ...
  });
```

How to Create DAO
-----------------

* prepare dao object

```javascript
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
```

* create new object with default attributes
```javascript
var obj = dao.createNew();
```

* create new object with custom attributes
```javascript
var obj = dao.createNew({name:'foo'});
```

* check the object is saved or not
```javascript
dao.isNew(obj);
```

* select an object by primary key
```javascript
dao.load(pk)
  .then(function (obj) {
    ...
  .catch(function (err) {
    ...
  });
```

* insert/update an object
```javascript
dao.save(obj)
  .then(function (affectedRow-or-insertId) {
    ...
  .catch(function (err) {
    ...
  });
```

* insert/update an object and reload it
```javascript
dao.save(obj, true)
  .then(function (obj) {
    ...
  .catch(function (err) {
    ...
  });
```

* delete an object by primary key
```javascript
dao.destroy(pk)
  .then(function (success_or_not) {
    ...
  .catch(function(err) {
    ...
  });
```

* select all rows
```javascript
dao.all()
  .then(function (rows) {
    ...
  .progress(function (row) {
    ...
  .catch(function(err) {
    ...
  });
```

* select all rows with bounds
```javascript
dao.all({offset:10, limit:10})
  .then(function (rows, numRows) {
    ...
  .progress(function (row) {
    ...
  .catch(function(err) {
    ...
  });
```

More
----

* see also
    - [kriskowal's Q](https://github.com/kriskowal/q)
    - [mscdex's mariasql](https://github.com/mscdex/node-mariasql)
    - [felixge's mysql](https://github.com/felixge/node-mysql)

* may the *SOURCE* be with you...
