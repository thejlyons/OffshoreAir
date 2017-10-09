var pg = require('pg');

module.exports = function(app) {
  app.get('/db', function (request, response) {
    var db_url = process.env.DATABASE_URL || "postgres://postgres:dev@localhost:5432/postgres";

    pg.connect(db_url, function(err, client, done) {
      client.query('SELECT * FROM test_table', function(err, result) {
        done();
        if (err) {
          console.error(err); response.send("Error " + err);
        }
        else {
          response.render('pages/db', {results: result.rows});
        }
      });
    });
  });
}
