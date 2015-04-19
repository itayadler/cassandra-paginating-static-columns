module.exports = function(keyspaceName) {
  var str = "CREATE KEYSPACE IF NOT EXISTS " + keyspaceName + " WITH replication = {'class' : 'SimpleStrategy', 'replication_factor' : 1};";
  return str;
};
