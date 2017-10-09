var ATM = require('../modules/account-manager');
var FIM = require('../modules/file-manager');
var ACM = require('../modules/accreditation-manager');

module.exports = function(app) {
  app.get('/employee', function(req, res) {
    if (req.session.user == null){
  	   // if user is not logged-in redirect back to login page //
  		res.redirect('/login');
  	}	else {
      ACM.getAllLimited(function(err, accreds) {
        if(!err) {
          res.render('pages/employee/employee', {user: req.session.user, accreditations: accreds});
        }	else {
					res.render('pages/error', {error: err});
				}
      });
    }
  });

  app.get('/employee/files', function(req, res) {
    if (req.session.user == null){
  		res.redirect('/login');
  	}	else {
      FIM.getFiles(function(err, o) {
        if(!err) {
          res.render('pages/employee/files', {user: req.session.user, files: o});
        }	else {
					res.render('pages/error', {error: err});
				}
      })
    }
  });

  app.get('/employee/accreditation/:accred_id(\\d+)', function(req, res) {
    var accred_id = parseInt(req.params.accred_id);
    if (req.session.user == null){
  		res.redirect('/login');
  	}	else {
      ACM.getAccredById(accred_id, function(err, accred) {
        if(!err) {
          ACM.getAllSteps(function(err, steps) {
            if(!err) {
              ACM.getUserProgress(req.session.user.id, function(err, progress) {
                if(!err) {
                  res.render('pages/employee/accreditation', {user: req.session.user, accreditation: accred, steps: steps, progress: progress});
                }	else {
                  res.render('pages/error', {error: err});
                }
              })
            }	else {
    					res.render('pages/error', {error: err});
    				}
          });
        }	else {
					res.render('pages/error', {error: err});
				}
      });
    }
  });

  app.get('/employee/accreditations/check', function(req, res) {
    if(req.session.user == null) {
      res.redirect('/login');
    } else {
      var user = req.session.user.id;
      if(req.query.user) {
        user = req.query.user;
      }
      ACM.checkProgress(user, req.query.accred, req.query.step, function(err) {
        if(!err) {
          res.setHeader('Content-Type', 'application/json');
          res.send(JSON.stringify({'success': true}));
        } else {
          console.log(err);
          res.redirect('/error');
        }
      });
    }
  });

  // Supervisor
  app.get('/employee/supervisor/:accred_id(\\d+)', function(req, res) {
    var accred_id = parseInt(req.params.accred_id);
    if(req.session.user == null) {
      res.redirect('/login');
    } else if(req.session.user.roles.indexOf(accred_id) == -1) {
      res.redirect('/employee');
    } else {
      ACM.getAccredById(accred_id, function(err, accred) {
        if(!err) {
          ACM.getAllSteps(function(err, steps) {
            if(!err) {
              ACM.getAllUserProgress(function(err, progress) {
                if(!err) {
                  res.render('pages/employee/supervisor', {user: req.session.user, accreditation: accred, steps: steps, progress: progress});
                }	else {
                  res.render('pages/error', {error: err});
                }
              });
            }	else {
              res.render('pages/error', {error: err});
            }
          });
        }	else {
          res.render('pages/error', {error: err});
        }
      });
    }
  });
}
