const c = require("./connect.js");
const Benchmark = require("benchmark");
var suite = new Benchmark.Suite;

let time, diff;

c.establish({
    pg: {
      user: 'postgres', //env var: PGUSER
      database: 'postgres', //env var: PGDATABASE
      password: '2', //env var: PGPASSWORD
      host: 'localhost', // Server hosting the postgres database
      port: 5432, //env var: PGPORT
      max: 10, // max number of clients in the pool
      idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
    },
    mongo: 'mongodb://localhost:27017/test'
  })
  .then((res) => {


    // add tests
    suite
      .add('mng', {
        'defer': true,
        'fn': function(deferred) {
          c.queryMongo()
            .then(() => deferred.resolve())
        }
      })
      .add('pg', {
        'defer': true,
        'fn': function(deferred) {
          c.queryPg()
            .then(() => deferred.resolve())
        }
      })
      .on('cycle', function(event) {
        console.log(String(event.target));
      })
      .on('complete', function() {
        console.log('Fastest is ' + this.filter('fastest')
          .map('name'));
      })
      .run({
        'async': true
      });

  });
