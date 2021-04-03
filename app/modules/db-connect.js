const pgp = require('pg-promise')();

/*
	ESTABLISH DATABASE CONNECTION
*/

var db_url = process.env.DATABASE_URL || "postgres://postgres:killerfly@localhost:5432/postgres";
// db_url = db_url + '?sslmode=require';

var conf = {
    connectionString: db_url,
    ssl: {
      require: true,
      // rejectUnauthorized: false
    },
}
const db = pgp(conf);

module.exports = db;
