var EM = {};
module.exports = EM;

EM.server = require("emailjs/email").server.connect({
	host 	    : process.env.EMAIL_HOST,
	user 	    : process.env.EMAIL_USER,
	password  : process.env.EMAIL_PASS,
	ssl		    : true
});

EM.dispatchResetPasswordLink = function(account, callback){
	EM.server.send({
		from         : process.env.EMAIL_FROM || 'Offshor Air <do-not-reply@gmail.com>',
		to           : account.email,
		subject      : 'Password Reset',
		text         : 'something went wrong... :(',
		attachment   : EM.composeEmail(account)
	}, callback );
}

EM.dispatchUserRequest = function(name, email, callback) {
	EM.server.send({
		from         : process.env.EMAIL_FROM || 'Offshor Air <do-not-reply@gmail.com>',
		to           : email,
		subject      : 'Offshore Air Invite',
		text         : 'something went wrong... :(',
		attachment   : EM.composeRequestEmail(name, email)
	}, callback );
}

// Emails
EM.composeEmail = function(account){
	var link = process.env.BASE_URL + 'reset-password?e=' + account.email+'&p=' + account.password;
	var html = "<html><body>";
		html += "Hi " + account.name + ",<br><br>";
		html += "Your username is <b>" + account.username + "</b><br><br>";
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
		html += "</body></html>";
	return  [{data:html, alternative:true}];
}
