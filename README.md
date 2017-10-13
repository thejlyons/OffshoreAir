# Offshore Air Inc.

A nodejs web application running on Heroku for [Offshore Air Inc.](http://offshoreair.com)

## Running Locally

Make sure you have [Node.js](http://nodejs.org/) and [PostgresSQL](https://www.postgresql.org/) installed.

```sh
$ git clone https://github.com/balancingact/OffshoreAir # or clone your own fork
$ cd OffshoreAir
$ npm install
$ npm start
```

Nodemon is included for easier local development:
```sh
$ npm run dev
```

Local env should now be running on [localhost:5000](http://localhost:5000/).

You will need to set up PostgresSQL tables. Syntax for creating the necessary tables are at the top of each
app/module/* file that requires tables.

You will also need to set up the following environmental variables
```sh
$ export ENV_VAR=value
```
- EMAIL_HOST (usually smtp.gmail.com)
- EMAIL_USER
- EMAIL_PASS
- BASE_URL

Optional environmental variables:
- DATABASE_URL (ex. postgres://postgres:dev@localhost:5432/postgres)
- EMAIL_FROM (email address to send emails from)
