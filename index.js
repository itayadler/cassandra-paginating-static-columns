var sql = require('squel');
const TEST_KEYSPACE_NAME = "test_paginate_static";
const TEST_TABLE_NAME = TEST_KEYSPACE_NAME + ".test";
const TEST_PAGE_QUERY = sql.select()
  .from(TEST_TABLE_NAME)
  .toParam();
var cass = require('cassandra-driver');

sql.registerValueHandler(cass.types.Uuid, function(uuid){ return uuid; });

var Promise = require('bluebird');
var chalk = require('chalk');

var cassandraConfig = require('./cassandra-config.json');
// Creating the cassandra client to our desired cassandra store
var cassandraClient = new cass.Client(cassandraConfig);
var batch = Promise.promisify(cassandraClient.batch, cassandraClient);
var execute = Promise.promisify(cassandraClient.execute, cassandraClient);
var shutdown = Promise.promisify(cassandraClient.shutdown, cassandraClient);

function runQuery(queryText, queryValues) {
  return execute(queryText, queryValues, {prepare: true});
}

function runBatch(queries) {
  return batch(queries, {prepare: true});
}

function generateTestDummyData(numOfRows) {
  var result = [];
  var pkId = cass.types.Uuid.random();
  for (var i = 0; i < numOfRows; i++) {
    var testRow = {
      id: pkId,
      number: i,
      total_count: numOfRows
    };
    result.push(testRow);
  }
  return result;
}

function generateInserts(data) {
  var result = [];
  for (var i=0; i < data.length; i++) {
    var query = sql.insert()
      .into(TEST_TABLE_NAME)
      .setFields(data[i])
      .toParam()
    result.push({
      query: query.text,
      params: query.values
    });
  }
  return result;
}

// Bootstrapping the keyspace and test table with dummy data.
function bootstrapTest() {
  // Create keyspace
  console.log(chalk.blue('Bootstrapping test...'));
  console.log(chalk.green('Creating keyspace ' + TEST_KEYSPACE_NAME + "..."));
  return runQuery(require('./create_keyspace.js')(TEST_KEYSPACE_NAME), []).then(function(){
    // Create test table
    console.log(chalk.green('Creating table ' + TEST_TABLE_NAME + "..."));
    return runQuery(require('./create_test_table.js')(TEST_KEYSPACE_NAME), []);
  }).then(function(){
    var query = sql.select()
      .from(TEST_TABLE_NAME)
      .toParam()
    return runQuery(query.text, query.values);
  }).then(function(result){
    if (result.rows.length === 0) {
      console.log('Creating test data...');
      var dummyData = generateTestDummyData(10);
      var inserts = generateInserts(dummyData);
      return runBatch(inserts);
    } else {
      console.log('Test data already exists, skipping.');
      return Promise.resolve()
    }
  });
}

function paginate(queryText, queryParams, pageState, fetchSize) {
  return new Promise(function(resolve, reject){
    rows = []
    queryOptions = {
      prepare: 1,
      fetchSize: fetchSize,
      pageState: pageState
    };
    self = this;
    cassandraClient.eachRow(queryText, queryParams, queryOptions, function(n, row){
      rows.push(row);
    }, function(err, result){
      if (err) return reject(err)
      return resolve({pageState: result.pageState, rows: rows});
    });
  });
}

bootstrapTest().then(function() {
  console.log(chalk.blue('Starting pagination test...'));
  // Paging first page
  return paginate(TEST_PAGE_QUERY.text, TEST_PAGE_QUERY.values, null, 5);
}).then(function(result){
  console.log(chalk.blue('Printing first 5 results...'));
  console.log(result.rows);
  return paginate(TEST_PAGE_QUERY.text, TEST_PAGE_QUERY.values, result.pageState, 5).then(function(result){
    console.log(chalk.blue('Printing last 5 results...'));
    console.log(result.rows);
    console.log(chalk.blue('Notice that the total_count column is null in the 2nd batch.'));
  });
}).finally(function() {
  return shutdown().then(function(){
    console.log(chalk.green('Closed cassandra driver connection successfully'));
  });
}).catch(function(err){
  console.log(chalk.red('An error occurred ' + err));
});
