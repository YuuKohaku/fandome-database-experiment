const pg = require('pg');
const Promise = require("bluebird");
const _ = require("lodash");
const mongoose = require('mongoose');
mongoose.Promise = Promise;
const Schema = mongoose.Schema;

const postSchema = new Schema({
	id: String,
	text: String,
	timestamp: {
		type: Number,
		index: true
	},
	user_id: Number,
	group_id: Number,
});

const userSchema = new Schema({
	id: Number,
	name: String,
	pic: String
});

const Post = mongoose.model('Post', postSchema);
const User = mongoose.model('User', userSchema);


let count = 1000000;

function runAll(x, counter, cb) {
	counter++
	return runTen(x, cb)
		.then(d => counter * 50 < count ? setImmediate(runAll.bind(this, x, counter, cb)) : true);
}

function runTen(x, callback) {
	let result = [];
	for (var i = 0; i < 50; i++) {
		let v = x.next();
		let value = v.value;
		let done = v.done;
		result.push(callback(value))
	}

	return Promise.all(result);
}


class Connect {
	constructor() {
		this._pg = null;
		this._mongo = null;
	}

	_connectPg(params) {
		this._pg = new pg.Client(params);
		return new Promise((resolve, reject) => {
			this._pg.connect((err) => {
				if (err) return reject(new Error(err));
				return resolve();
			})
		});

	}

	_connectMongo(params) {
		mongoose.connect(params);
		this._mongo = mongoose.connection;
		return new Promise((resolve, reject) => {
			this._mongo.once('error', err => reject(new Error(err)));
			this._mongo.once('open', () => resolve());
		});
	}

	establish(params) {
		return Promise.props({
			pg: params.pg && this._connectPg(params.pg),
			mongo: params.mongo && this._connectMongo(params.mongo)
		});
	}

	_insertPgSingle(table, row) {
		let vals = _.map(_.range(1, Object.keys(row)
				.length + 1), t => `$${t}`)
			.toString();
		return new Promise((resolve, reject) => {
			// console.log(`INSERT INTO ${table} (${Object.keys(row).toString()}) VALUES (${vals});`);
			this._pg.query(`INSERT INTO ${table} (${Object.keys(row).toString()}) VALUES (${vals});`, _.values(row), (err, result) => {
				if (err) reject(new Error(err));
				resolve(result);
			});
		});
	}

	_insertPg(data) {
		if (!this._pg)
			return Promise.resolve(false);
		let cPost = data.post;
		let post = new cPost();

		post.groups(1000)
			.count(count)
			.wordsCount(100)
			.users(100000);

		var x = post[Symbol.iterator]();

		return Promise.map(data.user(100000), user_data => this._insertPgSingle('users', user_data), {
				concurrency: 50
			})
			.then(() => runAll(x, 0, post_data => this._insertPgSingle('posts', post_data)));
	}

	_insertMongo(data) {
		if (!this._mongo)
			return Promise.resolve(false);
		let cPost = data.post;
		let post = new cPost();

		post.groups(1000)
			.count(count)
			.wordsCount(100)
			.users(100000);

		var x = post[Symbol.iterator]();
		return Promise.map(data.user(100000), user_data => (new User(user_data))
				.save(), {
					concurrency: 50
				})
			.then(() => runAll(x, 0, post_data => (new Post(post_data))
				.save()));
	}

	insert(data) {
		return Promise.props({
			pg: this._insertPg(data),
			mongo: this._insertMongo(data)
		});
	}

	_preparePg() {
		return Promise.resolve(true);
	}

	_prepareMongo() {
		return Promise.resolve(true);
	}

	prepare() {
		return Promise.props({
			pg: this._preparePg(),
			mongo: this._prepareMongo()
		});
	}

	queryMongo() {
		// let offset = _.random(100, 10000);
		let grp = _.random(0, 2);
		return Post.find({
				group_id: grp
			})
			.lean()
			// .skip(offset)
			.limit(10)
			.sort('-timestamp')
			.then((res) => {
				// console.log(res);
				let usr = _.uniq(_.flatMap(res, 'user_id'));
				return User.find({
						id: {
							$in: usr
						}
					})
					.lean()
					.then((users) => {
						let u = _.keyBy(users, 'id');
						_.forEach(res, (entry) => {
							entry.user = u[entry.user_id];
							return entry;
						});
						return res;
					});
			});
	}

	queryPg() {
		// let offset = _.random(100, 10000);OFFSET ${offset}
		let grp = _.random(0, 2);
		return new Promise((resolve, reject) => {
				this._pg.query(`SELECT posts.id, posts.text, posts.timestamp, users.id, users.name, users.pic FROM posts  INNER JOIN users ON posts.user_id = users.id WHERE posts.group_id = ${grp} ORDER BY posts.timestamp DESC LIMIT 10`, (err, result) => {
					if (err) reject(new Error(err));
					resolve(result);
				});
			})
			.then(res => res.rows);
	}

}

let c = new Connect();

module.exports = c;

// // connect to our database
// client.connect(function (err) {
//
//   // execute a query on our database
//   client.query('SELECT $1::text as name', ['brianc'], function (err, result) {
//     if (err) throw err;
//
//     // just print the result to the console
//     console.log(result.rows[0]); // outputs: { name: 'brianc' }
//
//     // disconnect the client
//     client.end(function (err) {
//       if (err) throw err;
//     });
//   });
// });