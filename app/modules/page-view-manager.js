/*
Table Schema:

CREATE TABLE pages (id SERIAL NOT NULL UNIQUE, name text, route text);
INSERT INTO pages (name, route) VALUES
    ('Home', 'index'),
    ('Our Story', 'story'),
    ('Services', 'services'),
    ('Contact', 'contact'),
    ('Sample Work', 'sample-work'),
    ('Estimate', 'estimate'),
    ('Estimate Attempts', 'estimate-attempts');
    ('Estimate Submissions', 'estimate-post');
CREATE TABLE page_views (id SERIAL NOT NULL UNIQUE, year integer, month integer, data jsonb, page_id integer references pages(id));
*/

const db = require('./db-connect');

/* login validation methods */
exports.count = function(page) {
	var dt = new Date();
	db.oneOrNone('SELECT id, data FROM page_views WHERE page_id = (SELECT id FROM pages WHERE route = $1) AND year = $2 AND month = $3', [page, dt.getFullYear(), dt.getMonth()])
    .then(data => {
			if(data) {
				data.data[dt.getDate()-1]++;
				db.none('UPDATE page_views SET data = $1 WHERE id = $2', [JSON.stringify(data.data), data.id]);
			} else {
				json = Array(28).fill(0);
				if(dt.getMonth() != 1) {
					json.push.apply(json, [0, 0]);
				}
				if([0, 2, 4, 6, 7, 9, 11].indexOf(dt.getMonth()) > -1) {
					json.push(0);
				}
				json[dt.getDate()-1]++;
				db.none('INSERT INTO page_views (year, month, data, page_id) VALUES ($1, $2, $3, (SELECT id FROM pages WHERE route = $4))', [dt.getFullYear(), dt.getMonth(), JSON.stringify(json), page]);
			}
    })
    .catch(error => {
        console.log(error);
    });
}

exports.getViews = function(callback) {
	db.one('SELECT json_object_agg(route, json_build_object(year, (SELECT json_object_agg(month, data) FROM page_views WHERE year = year AND page_id = pages.id))) AS json FROM pages, page_views WHERE page_id = pages.id')
    .then(views => {
			db.any('SELECT * FROM pages')
		    .then(pages => {
					callback(null, pages, views.json);
		    })
		    .catch(error => {
		        callback(error);
		    });
    })
    .catch(error => {
        callback(error);
    });
}
