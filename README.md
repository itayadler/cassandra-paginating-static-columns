#What is this?

This is a test project I wrote to demonstrate an issue I've with Cassandra
NodeJS driver by DataStax. (I'm not sure if this is an issue with the driver
or Cassandra, I'll be glad to know)

#The issue

Lets say I have a table `test` with 10 rows.

test table: `{ id(uuid), number(int), total_count(static_int) }`

Running a query with pagination (using `eachRow`) will yield null values for
a static column (total_count in this case) from the 2nd page.

#How to run the test?

You'll need to have a Cassandra server, I tested this on version 2.0.14.
And also Node & npm installed.

* `npm install`

* Edit the `cassandra-config.json` contactPoints to your cassandra server.

* Run `node index.js`
