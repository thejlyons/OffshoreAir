/*
Table Schema:

CREATE TABLE form_types (id SERIAL NOT NULL UNIQUE, type text, hr_type text);
INSERT INTO form_types (type, hr_type) VALUES
    ('text', 'Short Answer'),
    ('textarea', 'Long Answer'),
    ('checkbox', 'Checkboxes'),
    ('radio', 'Radio Options');
CREATE TABLE form_questions (id SERIAL NOT NULL UNIQUE, question text, placeholder text, options text[], sort_order integer, type_id integer references form_types(id));
*/

const db = require('./db-connect');

/* login validation methods */
exports.getQuestions = function(callback) {
	db.any('SELECT form_questions.id, question, placeholder, options, sort_order, type_id, type, hr_type FROM form_questions, form_types WHERE form_questions.type_id = form_types.id ORDER BY sort_order ASC')
    .then(data => {
			callback(null, data);
    })
    .catch(error => {
        callback(error);
    });
}

exports.getQuestionById = function(id, callback) {
	db.any('SELECT form_questions.id, question, placeholder, options, sort_order, type_id, type, hr_type FROM form_questions, form_types WHERE form_questions.type_id = form_types.id AND form_questions.id = $1 ORDER BY sort_order ASC', [id])
    .then(data => {
			callback(null, data);
    })
    .catch(error => {
        callback(error);
    });
}

exports.getTypes = function(callback) {
	db.any('SELECT * FROM form_types')
    .then(data => {
        callback(null, data);
    })
    .catch(error => {
        callback(error);
    });
}

exports.updateQuestion = function(question, callback) {
	if (!("placeholder" in question)) {
		question.placeholder = "";
	}
	if (!("options" in question)) {
		question.options = [];
	}
	db.none('UPDATE form_questions SET question = $1, placeholder = $2, options = $3::text[], sort_order = $4, type_id = $5 WHERE id = $6', [question.question, question.placeholder, question.options, question.sort_order, question.type_id, question.id])
		.then(() => {
			callback(null);
		})
		.catch(error => {
			callback(error);
		});
}

exports.insertQuestion = function(question, callback) {
	if (!("placeholder" in question)) {
		question.placeholder = "";
	}
	if (!("options" in question)) {
		question.options = [];
	}
	db.one('INSERT INTO form_questions (question, placeholder, options, sort_order, type_id) VALUES ($1, $2, $3::text[], $4, $5) RETURNING id', [question.question, question.placeholder, question.options, question.sort_order, question.type_id])
		.then(data => {
			callback(null, data.id);
		})
		.catch(error => {
			callback(error);
		});
}

exports.deleteQuestions = function(del_ids) {
	for(var i = 0; i < del_ids.length; i++){
		db.none('DELETE FROM form_questions WHERE id = $1', del_ids[i]);
	}
}
