/*
Table Schema:

CREATE TABLE form_types (id SERIAL NOT NULL UNIQUE, type text, hr_type text);
INSERT INTO form_types (type, hr_type) VALUES
    ('text', 'Short Answer'),
    ('textarea', 'Long Answer'),
    ('checkbox', 'Checkboxes'),
    ('radio', 'Radio Options');
CREATE TABLE form_questions (id SERIAL NOT NULL UNIQUE, question text, placeholder text, description text, required BOOLEAN DEFAULT FALSE, options text[], sort_order integer, is_email BOOLEAN DEFAULT FALSE, is_phone BOOLEAN DEFAULT FALSE, type_id integer references form_types(id), form_id integer references forms(id) ON DELETE CASCADE);
CREATE TABLE form_response (id SERIAL NOT NULL UNIQUE, response text, question_id integer references form_questions(id) ON DELETE CASCADE, submission_id integer references form_submission(id) ON DELETE CASCADE);
CREATE TABLE form_submission (id SERIAL NOT NULL UNIQUE, archived BOOLEAN DEFAULT FALSE, user_id integer references accounts(id) ON DELETE CASCADE, form_id integer references forms(id) ON DELETE CASCADE, submitted_at TIMESTAMP NOT NULL DEFAULT NOW());
CREATE TABLE forms (id SERIAL NOT NULL UNIQUE, name text, description text, removable BOOLEAN DEFAULT TRUE, public BOOLEAN DEFAULT FALSE);
*/

const db = require('./db-connect');

/* login validation methods */
exports.getForms = function(callback) {
	db.any('SELECT * FROM forms ORDER BY id')
    .then(data => {
			callback(null, data);
    })
    .catch(error => {
        callback(error);
    });
}

exports.getEmployeeForms = function(callback) {
	db.any('SELECT * FROM forms WHERE public=\'f\' ORDER BY id')
    .then(data => {
			callback(null, data);
    })
    .catch(error => {
        callback(error);
    });
}

exports.getFormById = function(form_id, callback) {
	db.one('SELECT * FROM forms WHERE id = $1', form_id)
    .then(data => {
			callback(null, data);
    })
    .catch(error => {
        callback(error);
    });
}

exports.createForm = function(callback) {
	db.one('INSERT INTO forms (name, removable) VALUES (\'New Form\', \'t\') RETURNING id')
    .then(data => {
			callback(null, data);
    })
    .catch(error => {
        callback(error);
    });
}

exports.updateForm = function(form, callback) {
	db.none('UPDATE forms SET name = $1, public = $2, description = $3 WHERE id = $4', [form.name, form.public, form.description, form.id])
    .then(() => {
			callback(null);
    })
    .catch(error => {
        callback(error);
    });
}

exports.deleteForm = function(form_id, callback) {
	db.none('DELETE FROM forms WHERE id = $1', form_id)
		.then(() => {
			callback();
		});
}

exports.getAllQuestions = function(callback) {
	db.any('SELECT form_questions.id, question, placeholder, description, required, options, sort_order, is_email, is_phone, type_id, type, hr_type, form_id FROM form_questions, form_types WHERE form_questions.type_id = form_types.id ORDER BY sort_order ASC')
    .then(data => {
			callback(null, data);
    })
    .catch(error => {
        callback(error);
    });
}

exports.getQuestions = function(form_id, callback) {
	db.any('SELECT form_questions.id, question, placeholder, description, required, options, sort_order, is_email, is_phone, type_id, type, hr_type, form_id FROM form_questions, form_types WHERE form_questions.type_id = form_types.id AND form_id = $1 ORDER BY sort_order ASC', form_id)
    .then(data => {
			callback(null, data);
    })
    .catch(error => {
        callback(error);
    });
}

exports.getQuestionById = function(id, callback) {
	db.any('SELECT form_questions.id, question, placeholder, description, required, options, sort_order, is_email, is_phone, type_id, type, hr_type, form_id FROM form_questions, form_types WHERE form_questions.type_id = form_types.id AND form_questions.id = $1 ORDER BY sort_order ASC', [id])
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
	if (!("is_email" in question)) {
		question.is_email = false;
	}
	if (!("is_phone" in question)) {
		question.is_phone = false;
	}
	db.none('UPDATE form_questions SET question = $1, placeholder = $2, description = $3, required = $4, options = $5::text[], sort_order = $6, is_email = $7, is_phone = $8, type_id = $9 WHERE id = $10', [question.question, question.placeholder, question.description, question.required, question.options, question.sort_order, question.is_email, question.is_phone, question.type_id, question.id])
		.then(() => {
			callback(null);
		})
		.catch(error => {
			callback(error);
		});
}

exports.insertQuestion = function(question, form_id, callback) {
	if (!("placeholder" in question)) {
		question.placeholder = "";
	}
	if (!("options" in question)) {
		question.options = [];
	}
	if (!("is_email" in question)) {
		question.is_email = false;
	}
	if (!("is_phone" in question)) {
		question.is_phone = false;
	}
	db.one('INSERT INTO form_questions (question, placeholder, description, required, options, sort_order, is_email, is_phone, type_id, form_id) VALUES ($1, $2, $3, $4, $5::text[], $6, $7, $8, $9, $10) RETURNING id', [question.question, question.placeholder, question.description, question.required, question.options, question.sort_order, question.is_email, question.is_phone, question.type_id, form_id])
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

exports.getAllSubmissions = function(callback) {
	db.any('SELECT form_submission.id, archived, user_id, form_id, submitted_at, (SELECT name FROM accounts WHERE accounts.id = form_submission.user_id) AS name, (SELECT json_object_agg(sort_order, json_build_object(\'question\', question, \'response\', response)) AS responses FROM form_response, form_questions WHERE submission_id = form_submission.id AND form_questions.id = form_response.question_id AND sort_order < 3) FROM form_submission')
		.then(data => {
			callback(null, data);
		})
		.catch(error => {
			callback(error);
		});
}

exports.getUserSubmission = function(form_id, user_id, callback) {
	db.any('SELECT json_object_agg(question_id, response) FROM form_response, form_submission WHERE user_id = $1 AND form_id = $2 AND submission_id = form_submission.id', [user_id, form_id])
		.then(data => {
			callback(null, data);
		})
		.catch(error => {
			callback(error);
		});
}

exports.getFormSubmissions = function(form_id, callback) {
	db.any('SELECT archived, submitted_at, (SELECT json_object_agg(question_id, response) AS responses FROM form_response WHERE submission_id = form_submission.id) FROM form_submission WHERE form_id = $1', form_id)
		.then(data => {
			callback(null, data);
		})
		.catch(error => {
			callback(error);
		});
}

exports.insertSubmission = function(form_id, callback) {
	db.one('INSERT INTO form_submission (form_id) VALUES ($1) RETURNING id', [form_id])
		.then(data => {
			callback(null, data);
		})
		.catch(error => {
			callback(error);
		});
}

exports.retrieveEmployeeSubmission = function(user_id, form_id, callback) {
	db.oneOrNone('SELECT id FROM form_submission WHERE user_id = $1 AND form_id = $2', [user_id, form_id])
		.then(data => {
			if(data) {
				db.none('DELETE FROM form_response WHERE submission_id = $1', data.id)
					.then(() => {
						callback(null, data);
					})
					.catch(error => {
						callback(error);
					});
			} else {
				db.one('INSERT INTO form_submission (user_id, form_id) VALUES ($1, $2) RETURNING id', [user_id, form_id])
					.then(data => {
						callback(null, data);
					})
					.catch(error => {
						callback(error);
					});
			}
		})
		.catch(error => {
			callback(error);
		});
}

exports.archiveSubmission = function(submission_id, callback) {
	db.none('UPDATE form_submission SET archived = \'t\' WHERE id = $1', [submission_id])
		.then(() => {
			callback(null);
		})
		.catch(error => {
			callback(error);
		});
}

exports.restoreSubmission = function(submission_id, callback) {
	db.none('UPDATE form_submission SET archived = \'f\' WHERE id = $1', [submission_id])
		.then(() => {
			callback(null);
		})
		.catch(error => {
			callback(error);
		});
}

exports.deleteSubmissions = function(del_ids) {
	for(var i = 0; i < del_ids.length; i++){
		db.none('DELETE FROM form_submission WHERE id = $1', del_ids[i]);
	}
}

exports.getAllResponses = function(callback) {
	db.any('SELECT * FROM form_response')
		.then(data => {
			callback(null, data);
		})
		.catch(error => {
			callback(error);
		});
}

exports.getSubmissionResponses = function(submission_id, callback) {
	db.any('SELECT * FROM form_response, form_questions WHERE submission_id = $1 AND question_id = form_questions.id ORDER BY sort_order;', submission_id)
		.then(data => {
			callback(null, data);
		})
		.catch(error => {
			callback(error);
		});
}

exports.getResponses = function(form_id, user_id, callback) {
	db.any('SELECT response, question FROM form_response, form_questions, form_submission WHERE form_submission.form_id = $1 AND user_id = $2 AND form_response.submission_id = form_submission.id AND form_questions.id = question_id ORDER BY sort_order', [form_id, user_id])
		.then(data => {
			callback(null, data);
		})
		.catch(error => {
			callback(error);
		});
}

exports.updateResponse = function(response, callback) {
	if(Array.isArray(response.response)) {
		response.response = response.response.join(", ");
	}
	db.none('UPDATE form_response SET response = $1, question_id = $2 WHERE id = $3', [response.response, resonse.question_id, response.id])
		.then(() => {
			callback(null);
		})
		.catch(error => {
			callback(error);
		});
}

exports.insertResponse = function(response, question_id, submission_id) {
	if(Array.isArray(response)) {
		response = response.join(", ");
	}
	db.none('INSERT INTO form_response (response, question_id, submission_id) VALUES ($1, $2, $3)', [response, question_id, submission_id]);
}

exports.deleteResponses = function(del_ids) {
	for(var i = 0; i < del_ids.length; i++){
		db.none('DELETE FROM form_response WHERE id = $1', del_ids[i]);
	}
}
