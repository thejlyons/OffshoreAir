var EM = {};
module.exports = EM;

var FM = require('../modules/form-manager');

EM.server = require("emailjs/email").server.connect({
	host 	    : process.env.SMTP_SERVER,
	user 	    : process.env.SMTP_USERNAME,
	password  : process.env.SMTP_PASSWORD,
	ssl 			: true
});

EM.dispatchResetPasswordLink = function(account, callback){
	console.log('Offshore Air <' + process.env.SMTP_USERNAME + '>');
	EM.server.send({
		from         : 'Offshore Air <' + process.env.SMTP_USERNAME + '>' || 'Offshore Air <do-not-reply@gmail.com>',
		to           : account.email,
		subject      : 'Password Reset',
		text         : 'something went wrong... :(',
		attachment   : EM.composeEmail(account)
	}, callback );
}

EM.dispatchUserRequest = function(name, email, callback) {
	EM.server.send({
		from         : process.env.EMAIL_FROM || 'Offshore Air <do-not-reply@gmail.com>',
		to           : email,
		subject      : 'Offshore Air Invite',
		text         : 'something went wrong... :(',
		attachment   : EM.composeRequestEmail(name, email)
	}, callback );
}

EM.dispatchGetEstimate = function(data, questions, callback) {
	EM.server.send({
		from         : process.env.EMAIL_FROM || 'Offshore Air Estimate <do-not-reply@gmail.com>',
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

EM.composeRequestEmail = function(name, email){
	var link = process.env.BASE_URL+'signup?email='+email;
	var html = "<html><body>";
		html += "Hello " + name + ",<br><br>";
		html += "You have been invited to join the Offshore Air employee portal.<br><br>";
		html += "<a href='"+link+"'>Click here to join</a><br><br>";
		html += "Or copy and paste the link below:<br>";
		html += "<a href='"+link+"'>"+link+"</a><br><br>";
		html += " ";
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
