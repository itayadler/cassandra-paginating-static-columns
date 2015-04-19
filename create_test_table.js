module.exports = function(keyspaceName) {
  var str = "" +
  "CREATE TABLE IF NOT EXISTS " + keyspaceName + ".test(\n" +
  "  id uuid,\n" +
  "  number int\n," +
  "  total_count int static,\n" +
  "  PRIMARY KEY(id, number)\n" +
  ")\n" +
  "WITH CLUSTERING ORDER BY (number ASC);";
  return str;
};
