const pg = require('pg');
const Promise = require("bluebird");
const _ = require("lodash");
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema({
  id: String,
  text: String,
  timestamp: Number,
  user_id: Number
});

const userSchema = new Schema({
  id: Number,
  name: String,
  pic: String
});

const Post = mongoose.model('Post', postSchema);
const User = mongoose.model('User', userSchema);

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
    return this._connectPg(params.pg)
      .then(() => this._connectMongo(params.mongo));
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
    return Promise.map(data.user(1000), user_data => this._insertPgSingle('users', user_data), {
        concurrency: 50
      })
      .then(() => Promise.map(data.post(), post_data => this._insertPgSingle('posts', post_data), {
        concurrency: 30
      }));
  }

  _insertMongo(data) {
    return Promise.map(data.user(1000), user_data => (new User(user_data))
        .save(), {
          concurrency: 50
        })
      .then(() => Promise.map(data.post(), post_data => (new Post(post_data))
        .save(), {
          concurrency: 30
        }));
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
