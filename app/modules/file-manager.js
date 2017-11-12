/*
Table Schema:

CREATE TABLE links (id text NOT NULL UNIQUE, link text, url text);
CREATE TABLE files (id SERIAL NOT NULL UNIQUE, name text, description text, link_id text references links(id) ON DELETE CASCADE);
*/

const db = require('./db-connect');

/* login validation methods */
exports.getFiles = function(callback) {
	db.any('SELECT files.id, name, description, link_id, link FROM files, links WHERE files.link_id = links.id')
    .then(data => {
			callback(null, data);
    })
    .catch(error => {
        callback(error);
    });
}

exports.updateFile = function(file, callback) {
	db.none('UPDATE files SET name = $1, link_id = $2, description = $3 WHERE id = $4', [file.name, file.link_id, file.description, file.id])
		.then(() => {
			callback(null);
		})
		.catch(error => {
			callback(error);
		});
}

exports.insertFile = function(file, callback) {
	db.one('INSERT INTO files (name, link_id, description) VALUES ($1, $2, $3) RETURNING id', [file.name, file.link_id, file.description])
		.then(data => {
			callback(null, data.id);
		})
		.catch(error => {
			callback(error);
		});
}

exports.deleteFiles = function(del_ids) {
	for(var i = 0; i < del_ids.length; i++){
		db.none('DELETE FROM files WHERE id = $1', del_ids[i]);
	}
}

exports.getLinks = function(callback) {
	db.any('SELECT * from links')
		.then(data => {
			callback(null, data);
		})
		.catch(error => {
			callback(error);
		});
}

exports.getLinkByIDAsync = function(id) {
	db.one('SELECT link from links WHERE id=$1', id)
		.then(data => {
			return data;
		})
		.catch(err => {
			throw err;
		});
}

exports.getLinkByID = function(id, callback) {
	db.one('SELECT link from links WHERE id=$1', id)
		.then(data => {
			callback(null, data);
		})
		.catch(error => {
			callback(error);
		});
}

exports.insertLink = function(link, callback) {
		db.one('INSERT INTO links (id, link, url) VALUES (${id}, ${link}, ${url}) RETURNING id', link)
			.then(data => {
				callback(null);
			})
			.catch(error => {
				callback(error);
			});
}

exports.insertLinks = function(links, callback) {
	for(var i = 0; i < links.length; i++) {
		db.none('INSERT INTO links (id, link, url) VALUES (${id}, ${link}, ${url})', links[i]);
	}
	callback();
}

exports.deleteLink = function(id) {
	db.none('DELETE FROM links WHERE id = $1', id);
}

exports.deleteLinks = function(ids) {
	for(var i = 0; i < ids.length; i++){
		db.none('DELETE FROM links WHERE id = $1', ids[i]);
	}
}
