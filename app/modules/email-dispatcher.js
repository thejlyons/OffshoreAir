var EM = {};
module.exports = EM;

var FM = require('../modules/form-manager');
var MM = require('../modules/email-manager');

EM.server = require("emailjs/email").server.connect({
	host 	    : process.env.SMTP_SERVER,
	user 	    : process.env.SMTP_USERNAME,
	password  : process.env.SMTP_PASSWORD,
	ssl 			: true
});

EM.dispatchResetPasswordLink = function(account, callback){
	EM.server.send({
		from         : 'Offshore Air Password Reset <' + process.env.SMTP_USERNAME + '>' || 'Offshore Air Password Reset <do-not-reply@' + process.env.SMTP_DOMAIN + '>',
		to           : account.email,
		subject      : 'Password Reset',
		text         : 'something went wrong... :(',
		attachment   : EM.composeEmail(account)
	}, callback );
}

EM.dispatchUserRequest = function(name, email, callback) {
	MM.getEmail(1, function(err, email_data) {
		if(err) throw err;
		EM.server.send({
			from         : email_data.from_title + ' <' + email_data.from_address + '@' + process.env.SMTP_DOMAIN + '>' || 'Offshore Air <do-not-reply@' + process.env.SMTP_DOMAIN + '>',
			to           : email,
			subject      : email_data.subject,
			text         : 'something went wrong... :(',
			attachment   : EM.composeRequestEmail(name, email, email_data.body)
		}, callback );
	});
}

EM.dispatchGetEstimate = function(data, questions, callback) {
	EM.server.send({
		from         : 'Offshore Air Estimate <' + process.env.SMTP_USERNAME + '>' || 'Offshore Air Estimate <do-not-reply@' + process.env.SMTP_DOMAIN + '>',
		to           : process.env.ADMIN_EMAIL,
		subject      : 'Offshore Air Estimate',
		text         : 'something went wrong... :(',
		attachment   : EM.composeEstimateEmail(data, questions)
	}, callback );
}

// Emails
EM.composeEmail = function(account){
	var link = process.env.BASE_URL + 'reset-password?e=' + account.email+'&p=' + account.password;
	var html = "<html><body>";
		html += "Hi " + account.name + ",<br><br>";
		html += "<a href='" + link + "'>Click here to reset your password</a><br><br>";
		html += "</body></html>";
	return  [{data:html, alternative:true}];
}

EM.composeRequestEmail = function(name, email, body){
	var link = process.env.BASE_URL+'signup?email='+email;
	body = body.replace('{{name}}', name);
	while(body.indexOf("{{") != -1) {
		var temp = body.substring(body.indexOf("{{")+2, body.indexOf("}}"));
		body = body.replace("{{" + temp + "}}", "<a href='" + link + "'>" + temp + "</a>")
	}
	var html = "<html><body>";
		html += body;
		html += "</body></html>";
	return  [{data:html, alternative:true}];
}

EM.composeEstimateEmail = function(data, questions) {
	var html = "<html><body><h3>New estimate</h3><br>";
	for (id in data) {
		var question;
		for (i in questions) {
			if (parseInt(id, 10) === parseInt(questions[i].id, 10)) {
				question = questions[i];
				break;
			}
		}
		html += question.question + ":<br><strong>" + data[id] + "</strong><br><br>";
	}
	html += "</body></html>";
	return  [{data:html, alternative:true}];
}
