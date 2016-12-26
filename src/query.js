const c = require("./connect.js");

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
    time = process.hrtime();
    return c.queryMongo();
  })
  .then((res) => {
    diff = process.hrtime(time);
    console.log(`Mongo took ${diff[0] + diff[1]/1e9} seconds`);
    time = process.hrtime();
    return c.queryPg();
  })
  .then(res => {
    diff = process.hrtime(time);
    console.log(`Pg took ${diff[0] + diff[1]/1e9} seconds`);
    // console.log(res);
  });
