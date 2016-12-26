const c = require("./connect.js");
const gens = require('data-filler');

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
  .then(() => c.prepare())
  .then((res) => {
    console.log(c);
    return c.insert(gens);
  })
  .then((res) => {
    console.log(res);
  });
