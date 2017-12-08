/*
Table Schema:

CREATE TABLE jobs (id SERIAL NOT NULL UNIQUE, title text, description text, img text);
*/

const db = require('./db-connect');

/* login validation methods */
exports.getJobs = function(callback) {
	db.any('SELECT * FROM jobs')
    .then(data => {
			callback(null, data);
    })
    .catch(error => {
        callback(error);
    });
}

exports.getImageByID = function(id, callback) {
	db.one('SELECT img FROM jobs WHERE id = $1', id)
		.then(data => {
			callback(null, data);
		})
		.catch(error => {
			callback(error);
		});
}

exports.updateJob = function(job, callback) {
	db.none('UPDATE jobs SET title = $1, img = $2, description = $4 WHERE id = $5', [job.title, job.img, job.description, job.id])
		.then(() => {
			callback(null);
		})
		.catch(error => {
			callback(error);
		});
}

exports.updateJobImage = function(id, img, callback) {
	db.none('UPDATE jobs SET img = $1 WHERE id = $2', [img, id])
		.then(() => {
			callback(null);
		})
		.catch(error => {
			callback(error);
		});
}

exports.insertJob = function(job, callback) {
	db.one('INSERT INTO jobs (title, img, description) VALUES ($1, $2, $3) RETURNING id', [job.title, job.img, job.description])
		.then(data => {
			callback(null, data.id);
		})
		.catch(error => {
			callback(error);
		});
}

exports.deleteJobs = function(del_ids) {
	for(var i = 0; i < del_ids.length; i++){
		db.none('DELETE FROM jobs WHERE id = $1', del_ids[i]);
	}
}
