var ATM = require('../modules/account-manager');
var FIM = require('../modules/file-manager');
var ACM = require('../modules/accreditation-manager');
var NHM = require('../modules/new-hire-manager');

module.exports = function(app) {
  app.get('/employee', function(req, res) {
    if (req.session.user == null){
  		res.redirect('/login');
  	}	else {
      ACM.getAllLimited(function(err, accreds) {
        if(!err) {
          ACM.getAllSteps(function(err, steps) {
            if(!err) {
              ACM.getUserProgress(req.session.user.id, function(err, progress) {
                if(!err) {
                  res.render('pages/employee/employee', {
                    user: req.session.user,
                    accreditations: accreds,
                    steps: steps,
                    progress: progress
                  });
                } else {
                  res.render('pages/error', {error: err});
                }
              });
            } else {
              res.render('pages/error', {error: err});
            }
          });
        } else {
          res.render('pages/error', {error: err});
        }
      });
    }
  });

  app.get('/employee/files', function(req, res) {
    if (req.session.user == null){
  		res.redirect('/login');
  	}	else {
      ACM.getAllLimited(function(err, accreds) {
        if(!err) {
          FIM.getFiles(function(err, o) {
            if(!err) {
              res.render('pages/employee/files', {user: req.session.user, accreditations: accreds, files: o, url: process.env.AWS_BASE_URL + 'files/'});
            } else {
              res.render('pages/error', {error: err});
            }
          });
        } else {
          res.render('pages/error', {error: err});
        }
      });
    }
  });

  app.get('/employee/accreditation/:accred_id(\\d+)', function(req, res) {
    if (req.session.user == null){
  		res.redirect('/login');
  	}	else {
      ACM.getAllLimited(function(err, accreds) {
        if(!err) {
          var accred_id = parseInt(req.params.accred_id);
          ACM.getAccredById(accred_id, function(err, accred) {
            if(!err) {
              ACM.getAllSteps(function(err, steps) {
                if(!err) {
                  ACM.getUserProgress(req.session.user.id, function(err, progress) {
                    if(!err) {
                      res.render('pages/employee/accreditation', {
                        user: req.session.user,
                        accreditations: accreds,
                        accreditation: accred,
                        steps: steps,
                        progress: progress
                      });
                    }	else {
                      res.render('pages/error', {error: err});
                    }
                  });
                } else {
                  res.render('pages/error', {error: err});
                }
              });
            }
          });
        } else {
          res.render('pages/error', {error: err});
        }
      });
    }
  });

  app.get('/employee/accreditations/check', function(req, res) {
    if (req.session.user == null){
  		res.redirect('/login');
  	}	else {
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
      ACM.getAllLimited(function(err, accreds) {
        if(!err) {
          ACM.getAccredById(accred_id, function(err, accred) {
            if(!err) {
              ACM.getAllSteps(function(err, steps) {
                if(!err) {
                  ACM.getAllUserProgress(function(err, progress) {
                    if(!err) {
                      res.render('pages/employee/supervisor', {user: req.session.user, accreditations: accreds, accreditation: accred, steps: steps, progress: progress});
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
        } else {
          res.render('pages/error', {error: err});
        }
      });
    }
  });

  // New Hire - Employee Page
  app.get('/employee/hire', function(req, res) {
    if(req.session.user == null || !req.session.user.admin) {
  		res.redirect('/employee');
  	}	else {
      ACM.getAllLimited(function(err, accreds) {
        if(!err) {
          NHM.getTasks(function(err, tasks) {
            if(!err) {
              NHM.getOwners(function(err, owners) {
                if(!err) {
                  NHM.getUserProgress(req.session.user.id, function(err, progress) {
                    if(!err) {
                      NHM.isHR(req.session.user, function(err, is_hr) {
                        if(!err) {
                          FIM.getFiles(function(err, files) {
                            if(!err) {
                              res.render('pages/new-hire', {
                                user: req.session.user,
                                url: process.env.AWS_BASE_URL + "files/",
                                accreditations: accreds,
                                tasks: tasks,
                                owners: owners,
                                progress: progress,
                                files: files,
                                user_id: req.session.user.id,
                                is_hr: is_hr,
                                is_doug: req.session.user.id == process.env.DOUG_ID
                              });
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
