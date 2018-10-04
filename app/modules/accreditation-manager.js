/*
Table Schema:

CREATE TABLE accreditations (id SERIAL NOT NULL UNIQUE, title text, skills text[]);
CREATE TABLE steps (id SERIAL NOT NULL UNIQUE, content text, place integer);
CREATE TABLE progress_fk (id SERIAL NOT NULL, user_id integer references accounts(id) ON DELETE CASCADE, accred_id integer references accreditations(id) ON DELETE CASCADE, step_id integer references steps(id) ON DELETE CASCADE);
*/

const db      = require('./db-connect');

/* Accreditation methods */
exports.getAllRoles = function(callback) {
	db.any('SELECT id, title FROM accreditations')
    .then(data => {
			callback(null, data);
    })
    .catch(error => {
      callback(error);
    });
}

exports.getAllAccreds = function(callback) {
	db.any('SELECT * FROM accreditations WHERE title <> \'HR\'')
    .then(data => {
			callback(null, data);
    })
    .catch(error => {
      callback(error);
    });
}

exports.getAllLimited = function(callback) {
	db.any('SELECT id, title FROM accreditations WHERE title <> \'HR\'')
    .then(data => {
			callback(null, data);
    })
    .catch(error => {
      callback(error);
    });
}

exports.getAccredById = function(id, callback) {
	db.one('SELECT * FROM accreditations WHERE id = $1', id)
    .then(data => {
			callback(null, data);
    })
    .catch(error => {
      callback(error);
    });
}

exports.getAllSteps = function(callback) {
	db.any('SELECT * FROM steps ORDER BY place')
    .then(data => {
			callback(null, data);
    })
    .catch(error => {
      callback(error);
    });
}

exports.getAllUserProgress = function(callback) {
	db.any('SELECT id, name, email FROM accounts')
    .then(users => {
			var ret = {}
			for(var i = 0; i < users.length; i++) {
				ret[users[i].email] = {
					"id": users[i].id,
					"name": users[i].name
				};
			}
			db.any('SELECT accounts.id, name, email, accred_id, step_id FROM accounts, progress_fk WHERE accounts.id = progress_fk.user_id ORDER BY accred_id ASC, step_id ASC')
				.then(data => {
					for(var i = 0; i < data.length; i++){
						if(!ret[data[i].email][data[i].accred_id]) {
							ret[data[i].email][data[i].accred_id] = [];
						}
						ret[data[i].email][data[i].accred_id].push(data[i].step_id);
					}
					callback(null, ret);
				})
				.catch(error => {
					callback(error);
				});
    })
    .catch(error => {
      callback(error);
    });
}

exports.getUserProgress = function(user_id, callback) {
	db.any('SELECT * FROM progress_fk WHERE user_id=$1 ORDER BY accred_id ASC, step_id ASC', user_id)
    .then(data => {
			var ret = {};
			for(var i = 0; i < data.length; i++){
				if(!ret[data[i].accred_id]) {
					ret[data[i].accred_id] = [];
				}
				ret[data[i].accred_id].push(data[i].step_id);
			}
			callback(null, ret);
    })
    .catch(error => {
      callback(error);
    });
}

exports.checkProgress = function(user_id, accred_id, step_id, callback) {
	db.none('INSERT INTO progress_fk (user_id, accred_id, step_id) VALUES ($1, $2, $3)', [user_id, accred_id, step_id])
    .then(() => {
			callback(null);
    })
    .catch(error => {
      callback(error);
    });
}

exports.updateAccred = function(accred, callback) {
	db.none('UPDATE accreditations SET title = $1, skills = $2 WHERE id = $3', [accred.title, accred.skills, accred.id])
		.then(() => {
			callback(null);
		})
		.catch(error => {
			callback(error);
		});
}

exports.insertAccred = function(accred, callback) {
	db.one('INSERT INTO accreditations (title, skills) VALUES ($1, $2::text[]) RETURNING id', [accred.title, accred.skills])
		.then(data => {
			callback(null, data.id);
		})
		.catch(error => {
			callback(error);
		});
}

exports.createHR = function() {
	db.oneOrNone('SELECT * FROM accreditations WHERE title=\'HR\'')
		.then(data => {
			if (!data) {
				exports.insertAccred({'title': 'HR', 'skills': []}, function(error, data) {
					if(error) { console.log(error); }
					console.log("HR created.");
				});
			}
		})
		.catch(error => {
			console.log(error);
		});
}

exports.deleteAccreds = function(del_ids) {
	for(var i = 0; i < del_ids.length; i++){
		db.none('DELETE FROM accreditations WHERE id = $1', del_ids[i]);
	}
}

exports.updateStep = function(step, callback) {
	db.none('UPDATE steps SET content = $1, place = $2 WHERE id = $3', [step.content, step.place, step.id])
		.then(() => {
			callback(null);
		})
		.catch(error => {
			callback(error);
		});
}

exports.insertStep = function(step, callback) {
	db.one('INSERT INTO steps (content, place) VALUES ($1, $2) RETURNING id', [step.content, step.place])
		.then(data => {
			callback(null, data.id);
		})
		.catch(error => {
			callback(error);
		});
}

exports.deleteSteps = function(del_ids) {
	for(var i = 0; i < del_ids.length; i++){
		db.none('DELETE FROM steps WHERE id = $1', del_ids[i]);
	}
}
