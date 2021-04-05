if (process.env.NODE_ENV !== 'production') {
  require('dotenv').load();
}

var sslRedirect = require('heroku-ssl-redirect');
var express = require('express');
var session = require('express-session');
var cookieParser = require('cookie-parser')
// var PostgreSqlStore = require('connect-pg-simple')(session);
var app = express();

const bodyParser = require('body-parser');

// Enable SSL redirect
app.use(sslRedirect(['production'], 301));

app.use(express.static(__dirname + '/public'));

app.set('port', (process.env.PORT || 5000));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

var db_url = process.env.DATABASE_URL || "postgres://postgres:killerfly@localhost:5432/postgres";
db_url = db_url + '?sslmode=require';

const conObject = {
  user: process.env.DATABASE_USER || "postgres",
  password: process.env.DATABASE_PASS || "killerfly",
  database: process.env.DATABASE_DB || "postgres",
  port: 5432,
  host: process.env.DATABASE_HOST || "localhost",
  ssl: true
}

const pgSession = require('connect-pg-simple')(session);
const pgStoreConfig = {
  pgPromise: require('pg-promise')({ promiseLib: require('bluebird') })({ conObject })
}

// app.use(session({
//   store: new pgSession(pgStoreConfig),
//   secret: 'jW8aor76jpPX', // session secret
//   resave: true,
//   saveUninitialized: true,
//   cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 days
// }));


app.use(session({
  	secret: process.env.SECRET || 'fadb4443e5d14fe6f7d04637f78077c75c73d1b4',
  	proxy: true,
  	resave: true,
  	saveUninitialized: true,
    store: new pgSession(pgStoreConfig)
	})
);
// Postgres for session table
// CREATE TABLE "session" ("sid" varchar NOT NULL COLLATE "default", "sess" json NOT NULL, "expire" timestamp(6) NOT NULL) WITH (OIDS=FALSE);
// ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());
app.use(cookieParser())

var normalizedPath = require("path").join(__dirname, "app/routes");
require("fs").readdirSync(normalizedPath).forEach(function(file) {
  require("./app/routes/" + file)(app);
});

var ATM = require('./app/modules/account-manager');
ATM.createAdmin(process.env.ADMIN_PASS);
var ANM = require('./app/modules/accreditation-manager');
ANM.createHR();
var NHM = require('./app/modules/new-hire-manager.js');
NHM.createOwners();

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
