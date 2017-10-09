const pgp = require('pg-promise')();

/*
	ESTABLISH DATABASE CONNECTION
*/

var db_url = process.env.DATABASE_URL || "postgres://postgres:killerfly@localhost:5432/postgres";
const db = pgp(db_url);

module.exports = db;
