const c = require("./connect.js");
const gens = require('data-filler');
var argv = require('minimist')(process.argv.slice(2));


c.establish({
		pg: argv.pg && {
			user: 'postgres', //env var: PGUSER
			database: 'postgres', //env var: PGDATABASE
			password: '2', //env var: PGPASSWORD
			host: argv.pg, // Server hosting the postgres database
			port: 5432, //env var: PGPORT
			max: 10, // max number of clients in the pool
			idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
		},
		mongo: argv.mongo && `mongodb://${argv.mongo}/test`
	})
	.then((res) => {
		return c.insert(gens);
	})
	.then((res) => {
		console.log(res);
	});