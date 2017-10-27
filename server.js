var express = require('express');
var session = require('express-session');
var cookieParser = require('cookie-parser')
var PostgreSqlStore = require('connect-pg-simple')(session);
var app = express();

const bodyParser = require('body-parser');

app.use(express.static(__dirname + '/public'));

app.set('port', (process.env.PORT || 5000));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

var db_url = process.env.DATABASE_URL || "postgres://postgres:killerfly@localhost:5432/postgres";

app.use(session({
  	secret: 'fadb4443e5d14fe6f7d04637f78077c75c73d1b4',
  	proxy: true,
  	resave: true,
  	saveUninitialized: true,
    store: new PostgreSqlStore({conString: db_url})
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

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});