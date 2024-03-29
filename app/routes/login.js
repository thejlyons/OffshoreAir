var ACM = require('../modules/account-manager');
var EMD = require('../modules/email-dispatcher');
var NHM = require('../modules/new-hire-manager.js');

module.exports = function(app) {
  app.get('/login', function (req, res) {
    console.log(req.cookies.user);
    if (req.session.user == null && (req.cookies.email == undefined || req.cookies.pass == undefined)){
      res.render('pages/login');
		}	else{
	    // attempt automatic login //
      var email = (req.session.user == null) ? req.cookies.email : req.session.user.email;
      var pass = (req.session.user == null) ? req.cookies.pass : req.session.user.password;
      ACM.autoLogin(email, pass, function(o) {
				if (o != null) {
          NHM.isHR(o, function(err, is_hr) {
            o.is_hr = is_hr;
            req.session.user = o;
  					res.redirect('/admin');
          });
				}	else {
					res.render('pages/login');
				}
			});
		}
  });

  app.post('/login', function(req, res){
		ACM.manualLogin(req.body['email'], req.body['pass'], function(e, o){
			if (!o) {
				res.status(400).send(e);
			}	else {
        NHM.isHR(o, function(err, is_hr) {
          o.is_hr = is_hr;
          req.session.user = o;
          if (req.body['remember-me'] == 'true'){
            res.cookie('email', o.email,    { maxAge: 900000 });
            res.cookie('pass',  o.password, { maxAge: 900000 });
          }
          res.redirect('/admin');
        });
			}
		});
	});

  app.get('/signup', function (req, res) {
    if(req.query.email) {
      ACM.getAccountByEmail(req.query.email, function(err, user) {
        if(!err) {
          res.render('pages/signup', {'user': user});
        } else {
          var user = {
            "name": "",
            "email": ""
          };
          res.render('pages/signup', {'user': user});
        }
      })
    } else {
      var user = {
        "name": "",
        "email": ""
      };
      res.render('pages/signup', {'user': user});
    }
  });

  app.post('/signup', function(req, res){
		ACM.addNewAccount({
			name   	: req.body['name'],
			email   : req.body['email'],
			pass	  : req.body['pass']
		}, function(e, o){
			if (e){
				res.status(400).send(e);
			}	else {
        ACM.getSessionById(o.id, function(user) {
          NHM.isHR(user, function(err, is_hr) {
            user.is_hr = is_hr;
            req.session.user = user;
            res.status(200).send('ok');
          });
        });
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

  app.post('/lost-password', function(req, res){
    ACM.getAccountByEmail(req.body['email'], function(e, o){
      if (o){
        EMD.dispatchResetPasswordLink(o, function(e, m){
          if (!e){
            res.status(200).send('ok');
          }	else{
            for (k in e) console.log('ERROR : ', k, e[k]);
            res.status(400).send('unable to dispatch password reset');
          }
        });
      }	else{
        res.status(400).send('email-not-found');
      }
    });
	});

	app.get('/reset-password', function(req, res) {
		var email = req.query["e"];
		var passH = req.query["p"];
		ACM.validateResetLink(email, passH, function(e){
			if (e != 'ok'){
				res.redirect('/');
			} else{
				req.session.reset = { email:email, passHash:passH };
				res.render('pages/reset');
			}
		})
	});

	app.post('/reset-password', function(req, res) {
		var nPass = req.body['pass'];
		var email = req.session.reset.email;
		req.session.destroy();
		ACM.updatePassword(email, nPass, function(e, o){
			if (o){
				res.status(200).send('ok');
			}	else{
				res.status(400).send('unable to update password');
			}
		})
	});
}
