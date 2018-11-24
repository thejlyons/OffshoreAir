/*
Table Schema:

CREATE TABLE emails (id SERIAL NOT NULL UNIQUE, from_title text, from_address text, subject text, body text);
*/

const db = require('./db-connect');

exports.getEmails = function(callback) {
	db.any('SELECT * FROM emails')
    .then(data => {
			callback(null, data);
    })
    .catch(error => {
        callback(error);
    });
}

exports.getEmail = function(id, callback) {
	db.one('SELECT * FROM emails WHERE id = $1', id)
    .then(data => {
			callback(null, data);
    })
    .catch(error => {
        callback(error);
    });
}

exports.updateEmail = function(email, callback) {
	while(email.body.indexOf('\r') != -1) {
		email.body = email.body.replace('\r', '<br>');
	}
	db.none('UPDATE emails SET from_title = $1, from_address = $2, subject = $3, body = $4 WHERE id = $5', [email.from_title, email.from_address, email.subject, email.body, email.id])
		.then(() => {
			callback(null);
		})
		.catch(error => {
			callback(error);
		});
}
