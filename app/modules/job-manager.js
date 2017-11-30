/*
Table Schema:

CREATE TABLE jobs (id SERIAL NOT NULL UNIQUE, title text, description text, img text, img_id text);
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

exports.updateJob = function(job, callback) {
	db.none('UPDATE jobs SET title = $1, img = $2, img_id = $3, description = $4 WHERE id = $5', [job.title, job.img, job.img_id, job.description, job.id])
		.then(() => {
			callback(null);
		})
		.catch(error => {
			callback(error);
		});
}

exports.insertJob = function(job, callback) {
	db.one('INSERT INTO jobs (title, img, img_id, description) VALUES ($1, $2, $3, $4) RETURNING id', [job.title, job.img, job.img_id, job.description])
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
