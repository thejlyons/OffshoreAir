/*
Table Schema:

CREATE TABLE jobs (id SERIAL NOT NULL UNIQUE, title text, description text, img text);
CREATE TABLE jobs_visible(id SERIAL NOT NULL UNIQUE, is_visible boolean);
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
	if(id.includes("new")) {
		callback(null, null);
	} else {
		db.one('SELECT img FROM jobs WHERE id = $1', id)
			.then(data => {
				callback(null, data.img);
			})
			.catch(error => {
				callback(error);
			});
	}
}

exports.updateJob = function(job, callback) {
	console.log(job.description);
	db.none('UPDATE jobs SET title = $1, img = $2, description = $3 WHERE id = $4', [job.title, job.img, job.description, job.id])
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

exports.insertNewJob = function(id, callback) {
	if(id.includes("new")) {
		db.one('INSERT INTO jobs (title, description) VALUES (\'New Job\', \'This is a new job.\') RETURNING id')
		.then(data => {
			callback(null, data.id);
		})
		.catch(error => {
			callback(error);
		});
	} else {
		return id;
	}
}

exports.deleteJobs = function(del_ids) {
	for(var i = 0; i < del_ids.length; i++){
		db.none('DELETE FROM jobs WHERE id = $1', del_ids[i]);
	}
}

exports.isVisible = function(callback) {
	db.one('SELECT is_visible FROM jobs_visible WHERE id = 1')
		.then(data => {
			callback(data.is_visible);
		})
		.catch(error => {
			callback(false);
		});
}

exports.toggleVisible = function() {
	db.none('UPDATE jobs_visible SET is_visible = NOT is_visible WHERE id = 1');
}
