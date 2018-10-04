/*
Table Schema:

CREATE TABLE hire_task_owner (id SERIAL NOT NULL UNIQUE, owner text);
CREATE TABLE hire_task (id SERIAL NOT NULL UNIQUE, task text, owner_id integer references hire_task_owner(id), dependent_on integer references hire_task(id), attachment_id integer references files(id), task_order integer);
CREATE TABLE hire_progress_fk (id SERIAL NOT NULL, user_id integer references accounts(id) ON DELETE CASCADE, hire_task_id integer references hire_task(id) ON DELETE CASCADE);
*/

const db = require('./db-connect');

/* Task methods */
exports.getTasks = function(callback) {
	db.any('SELECT * FROM hire_task')
    .then(data => {
			callback(null, data);
    })
    .catch(error => {
        callback(error);
    });
}

exports.getOwners = function(callback) {
	db.any('SELECT * FROM hire_task_owner')
    .then(data => {
			callback(null, data);
    })
    .catch(error => {
        callback(error);
    });
}

exports.getAllProgress = function(callback) {
	db.any('SELECT user_id, COUNT(user_id) FROM hire_progress_fk GROUP BY user_id')
    .then(data => {
			db.any('SELECT COUNT(*) FROM hire_task')
		    .then(count => {
					callback(null, data, count[0].count);
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
	db.any('SELECT * FROM hire_progress_fk WHERE user_id = $1', user_id)
    .then(data => {
			callback(null, data);
    })
    .catch(error => {
        callback(error);
    });
}

exports.updateTask = function(task, callback) {
	db.none('UPDATE hire_task SET task = $1, owner_id = $2, dependent_on = $3, attachment_id = $4, task_order = $5 WHERE id = $6', [task.task, task.owner_id, task.dependent_on, task.attachment_id, task.task_order, task.id])
		.then(() => {
			callback(null);
		})
		.catch(error => {
			callback(error);
		});
}

exports.insertTask = function(task, callback) {
	db.one('INSERT INTO hire_task (task) VALUES ($1) RETURNING id', task)
		.then(data => {
			callback(null, data.id);
		})
		.catch(error => {
			callback(error);
		});
}

exports.insertTasks = function(tasks, callback) {
	if(tasks && tasks.length) {
		db.tx(t => {
	    const queries = tasks.map(task => {
	      return t.one('INSERT INTO hire_Task (task) VALUES ($1) RETURNING id', task.task, a => +a.id)
					.then(data => {
						return [data, task.id];
					});
	    });
	    return t.batch(queries);
		})
	    .then(data => {
	      callback(null, data);
	    })
	    .catch(error => {
	      callback(error);
	    });
	} else {
		return [];
	}
}

exports.deleteTasks = function(del_ids) {
	for(var i = 0; i < del_ids.length; i++){
		db.none('DELETE FROM hire_task WHERE id = $1', del_ids[i]);
	}
}

exports.createOwners = function() {
	db.oneOrNone('SELECT id FROM hire_task_owner WHERE owner = $1', 'Doug')
		.then(data => {
			if (!data) {
				db.none('INSERT INTO hire_task_owner (owner) VALUES ($1)', 'Doug');
			}
		})
		.catch(error => {
			console.log(error);
		});
	db.oneOrNone('SELECT id FROM hire_task_owner WHERE owner = $1', 'HR')
		.then(data => {
			if (!data) {
				db.none('INSERT INTO hire_task_owner (owner) VALUES ($1)', 'HR');
			}
		})
		.catch(error => {
			console.log(error);
		});
	db.oneOrNone('SELECT id FROM hire_task_owner WHERE owner = $1', 'New Employee')
		.then(data => {
			if (!data) {
				db.none('INSERT INTO hire_task_owner (owner) VALUES ($1)', 'New Employee');
			}
		})
		.catch(error => {
			console.log(error);
		});
}

exports.isHR = function(user, callback) {
	db.one('SELECT id FROM accreditations WHERE title = \'HR\'')
    .then(data => {
			db.oneOrNone('SELECT * FROM roles_fk WHERE accred_id = $1 AND user_id = $2', [data.id, user.id])
		    .then(data => {
					ret = false;
					if(data || user.admin) {
						ret = true;
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

exports.checkTask = function(task_id, user_id) {
	db.none('INSERT INTO hire_progress_fk (hire_task_id, user_id) VALUES ($1, $2)', [task_id, user_id]);
}

exports.uncheckTask = function(task_id, user_id) {
	db.none('DELETE FROM hire_progress_fk WHERE hire_task_id = $1 AND user_id = $2', [task_id, user_id]);
}
