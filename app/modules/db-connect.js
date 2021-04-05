const pgp = require('pg-promise')();

/*
	ESTABLISH DATABASE CONNECTION
*/

var conf = {
  user: process.env.DATABASE_USER || "postgres",
  password: process.env.DATABASE_PASS || "killerfly",
  database: process.env.DATABASE_DB || "postgres",
  port: 5432,
  host: process.env.DATABASE_HOST || "localhost",
  ssl: true
};

const db = pgp(conf);

module.exports = db;
