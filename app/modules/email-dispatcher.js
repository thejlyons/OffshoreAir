var EM = {};
module.exports = EM;

EM.server = require("emailjs/email").server.connect({
	host 	    : process.env.EMAIL_HOST,
	user 	    : process.env.EMAIL_USER,
	password  : process.env.EMAIL_PASS,
	ssl 			: true
});

EM.dispatchResetPasswordLink = function(account, callback){
	EM.server.send({
		from         : process.env.EMAIL_FROM || 'Offshore Air <do-not-reply@gmail.com>',
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

EM.dispatchGetEstimate = function(data, callback) {
	EM.server.send({
		from         : process.env.EMAIL_FROM || 'Offshore Air Estimate <do-not-reply@gmail.com>',
		to           : process.env.ADMIN_EMAIL,
		subject      : 'Offshore Air Estimate',
		text         : 'something went wrong... :(',
		attachment   : EM.composeEstimateEmail(data)
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
		html += "</body></html>";
	return  [{data:html, alternative:true}];
}

EM.composeEstimateEmail = function(data) {
	var html = "<html><body>";
	  html += "New estimate from <strong>" + data.full_name[0] + " (" + data.full_name[1] + ")</strong><br><br>";
		html += "Address:<br><strong>";
		html += data.street1 + "<br>";
		html += data.city + ", " + data.zip + "</strong><br><br>";
		html += "How did you hear about us?<br>";
		if('heard' in data) {
			html += "<strong>" + data.heard + "</strong><br><br>";
		}
		html += "What days and times are you most available to schedule an appointment with our estimator?<br><strong>";
		html += data.message[0] + "</strong><br><br>";
		html += "What rooms do you want to install AC in?<br><strong>";
		html += data.message[1] + "</strong><br><br>";
		if('insulated' in data) {
			html += "Is your home/office insulated? <strong>" + data.insulated + "</strong>";
		}
		html += "</body></html>";
	return  [{data:html, alternative:true}];
}
