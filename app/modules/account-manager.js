/*
Table Schema:

CREATE TABLE accounts (id SERIAL NOT NULL UNIQUE, name text, password text, email text, date timestamp default current_timestamp, admin BOOLEAN DEFAULT FALSE);
CREATE TABLE roles_fk (id SERIAL NOT NULL, user_id integer references accounts(id) ON DELETE CASCADE, accred_id integer references accreditations(id) ON DELETE CASCADE);
*/

var crypto 		= require('crypto');
const db      = require('./db-connect');

/* login validation methods */
exports.createAdmin = function(pass) {
	db.none("DELETE FROM accounts WHERE email = 'admin'")
		.then(() => {
			saltAndHash(pass, function(hash){
				db.one('INSERT INTO accounts(name, email, password) VALUES ($1, $2, $3) RETURNING *', ['Administrator', 'admin', hash])
					.then(data => {
						db.none("UPDATE accounts SET admin = 't' WHERE id = $1", [data.id]);
						console.log("Admin created.")
					});
			});
		});
}

exports.autoLogin = function(email, pass, callback) {
	db.one('SELECT id, name, password, email, admin, (SELECT array(SELECT accred_id FROM roles_fk WHERE roles_fk.user_id = accounts.id)) AS roles FROM accounts WHERE email = $1', email)
    .then(data => {
			if (data) {
				data.password == pass ? callback(data) : callback(null);
			} else {
				callback(null);
			}
    })
    .catch(error => {
        callback(error);
    });
}

exports.manualLogin = function(email, pass, callback) {
	db.one('SELECT id, name, email, password, email, admin, (SELECT array(SELECT accred_id FROM roles_fk WHERE roles_fk.user_id = accounts.id)) AS roles FROM accounts WHERE email = $1', email)
    .then(data => {
			if (data){
				validatePassword(pass, data.password, function(err, res) {
					if (res){
						callback(null, data);
					}	else{
						callback('invalid-password');
					}
				});
			}	else{
				callback('user-not-found');
			}
    })
    .catch(error => {
      callback(error);
    });
}

exports.getSessionById = function(user_id, callback) {
	db.one('SELECT id, name, password, email, admin, (SELECT array(SELECT accred_id FROM roles_fk WHERE roles_fk.user_id = accounts.id)) AS roles FROM accounts WHERE id = $1', user_id)
    .then(data => {
			callback(data);
    })
    .catch(error => {
        callback(null);
    });
}

exports.addNewAccount = function(newData, callback) {
	db.oneOrNone('SELECT * FROM accounts WHERE email = $1', newData.email)
    .then(data => {
			if (data){
				if (data.name != newData.name || (data.password != null && data.password != "")) {
					callback('email-taken');
				} else {
					newData.id = data.id;
					exports.updateAccount(newData, function(err, data) {
						callback(null, data);
					});
				}
			}	else {
				saltAndHash(newData.pass, function(hash){
					newData.pass = hash;
					db.one('INSERT INTO accounts(name, email, password) VALUES (${name}, ${email}, ${pass}) RETURNING *', newData)
						.then(data => {
						  callback(null, data);
						})
						.catch(error => {
						  callback(error);
						});
				});
			}
    })
    .catch(error => {
        callback(error);
    });
}

exports.updateAccount = function(newData, callback) {
	if (newData.pass == '') {
		db.one('UPDATE accounts SET name = ${name}, email = ${email}, admin = ${admin} WHERE id = ${id} RETURNING *', newData)
			.then(data => {
				callback(null, data);
			})
			.catch(error => {
				callback(error);
			});
	} else {
		saltAndHash(newData.pass, function(hash){
			newData.pass = hash;
			db.one('UPDATE accounts SET name = ${name}, password = ${pass}, email = ${email} WHERE id = ${id} RETURNING *', newData)
				.then(data => {
					callback(null, data);
				})
				.catch(error => {
					callback(error);
				});
		});
	}
}

exports.updatePassword = function(email, newPass, callback){
	saltAndHash(newPass, function(hash){
		db.one('UPDATE accounts SET password = $1 WHERE email = $2 RETURNING *', [hash, email])
			.then(data => {
				callback(null, data);
			})
			.catch(error => {
				callback(error);
			});
	});
}

exports.insertUser = function(name, email, callback) {
	db.none('INSERT INTO accounts(name, email) VALUES ($1, $2)', [name, email])
		.then(() => {
			callback(null);
		})
		.catch(error => {
			callback(error);
		});
}

/* account lookup methods */
exports.deleteAccount = function(id, callback) {
	db.none('DELETE FROM accounts WHERE id = $1', id)
    .then(() => {
			callback(null, null);
    })
    .catch(error => {
			callback(error)
    });
}

exports.getAccountByEmail = function(email, callback) {
	db.one('SELECT * FROM accounts WHERE email = $1', email)
    .then(data => {
			callback(null, data);
    })
    .catch(error => {
        callback(error);
    });
}

exports.validateResetLink = function(email, passHash, callback) {
	db.one('SELECT * FROM accounts WHERE email = $1 AND password = $2', [email, passHash])
    .then(data => {
			callback(data ? 'ok' : null);
    })
    .catch(error => {
      callback(error);
    });
}

exports.getAllRecords = function(callback) {
	db.any('SELECT * FROM accounts')
    .then(data => {
			callback(data ? 'ok' : null);
    })
    .catch(error => {
      callback(error);
    });
}

exports.delAllRecords = function(callback) {
	db.any('DELETE FROM accounts')
    .then(data => {
			callback();
    })
    .catch(error => {
      callback();
    });
}

exports.findById = function(id, callback) {
	db.one('SELECT * FROM accounts WHERE id = $1', id)
	.then(data => {
		callback(null, data);
	})
	.catch(error => {
		callback(error);
	});
}

exports.getAllUsers = function(callback) {
	db.any('SELECT id, name, password, email, admin, (SELECT array(SELECT accred_id FROM roles_fk WHERE roles_fk.user_id = accounts.id)) AS roles FROM accounts')
    .then(data => {
			callback(data);
    })
    .catch(error => {
        callback(error);
    });
}

exports.makeUserAdmin = function(set, user_id, callback) {
	db.none('UPDATE accounts SET admin = $1 WHERE id = $2', [set, user_id])
    .then(() => {
			callback(null);
    })
    .catch(error => {
			callback(error)
    });
}

exports.updateRoles = function(user_id, roles, dels, callback) {
	var del_query = "DELETE FROM roles_fk WHERE (user_id, accred_id) IN (";
	var values = [];
	for(var i = 0; i < dels.length; i++){
		values.push("(" + user_id + ", " + dels[i] + ")");
	}
	del_query += values.join(", ") + ")";
	var add_query = "WITH data(employee, accred) AS (VALUES";
	values = [];
	for(var i = 0; i < roles.length; i++){
		values.push("(" + user_id + ", " + roles[i] + ")");
	}
	add_query += values.join(", ") + ") INSERT INTO roles_fk (user_id, accred_id) SELECT d.employee, d.accred FROM data d WHERE NOT EXISTS (SELECT 1 FROM roles_fk WHERE user_id = d.employee AND accred_id = d.accred)";
	db.task(t => {
			var batch = [];
			if(dels.length > 0) {
				batch.push(t.none(del_query));
			}
			if(roles.length > 0) {
				batch.push(t.none(add_query));
			}
			return t.batch(batch);
    })
    .then(events => {
			callback();
    })
    .catch(error => {
      throw error;
			callback();
    });
}

/* private encryption & validation methods */

var generateSalt = function()
{
	var set = '0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ';
	var salt = '';
	for (var i = 0; i < 10; i++) {
		var p = Math.floor(Math.random() * set.length);
		salt += set[p];
	}
	return salt;
}

var md5 = function(str) {
	return crypto.createHash('md5').update(str).digest('hex');
}

var saltAndHash = function(pass, callback)
{
	var salt = generateSalt();
	callback(salt + md5(pass + salt));
}

var validatePassword = function(plainPass, hashedPass, callback)
{
	var salt = hashedPass.substr(0, 10);
	var validHash = salt + md5(plainPass + salt);
	callback(null, hashedPass === validHash);
}

// var getObjectId = function(id)
// {
// 	return new require('mongodb').ObjectID(id);
// }

//
// var findByMultipleFields = function(a, callback)
// {
// // this takes an array of name/val pairs to search against {fieldName : 'value'} //
// 	accounts.find( { $or : a } ).toArray(
// 		function(e, results) {
// 		if (e) callback(e)
// 		else callback(null, results)
// 	});
// }
