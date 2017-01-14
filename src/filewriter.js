const gens = require('data-filler');
const Promise = require("bluebird");
const fs = Promise.promisifyAll(require("fs"));

let coll = [...gens.collection(100)];

for (var i = 0; i < coll.length; i++) {
  console.log(coll[i]);
}

fs.writeFileAsync('collection.json', JSON.stringify(coll))
  .then(res => {
    console.log("done");
  });
