var ACM = require('../modules/account-manager');

module.exports = function(app) {
  app.get('/login', function (req, res) {
    if (req.cookies.user == undefined || req.cookies.pass == undefined){
      res.render('pages/login');
		}	else{
	    // attempt automatic login //
      ACM.autoLogin(req.cookies.email, req.cookies.pass, function(o) {
				if (o != null) {
          req.session.user = o;
					res.redirect('/admin');
				}	else {
					res.render('pages/login');
				}
			});
		}
  });

  app.post('/login', function(req, res){
		ACM.manualLogin(req.body['email'], req.body['pass'], function(e, o){
			if (!o){
				res.status(400).send(e);
			}	else{
				req.session.user = o;
				if (req.body['remember-me'] == 'true'){
					res.cookie('email', o.email,    { maxAge: 900000 });
					res.cookie('pass',  o.password, { maxAge: 900000 });
				}
        res.redirect('/admin');
			}
		});
	});

  app.get('/logout', function(req, res){
    res.clearCookie('email');
    res.clearCookie('pass');
    req.session.destroy(function(e){
      res.redirect('/login');
    });
  });
}
