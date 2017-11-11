var formidable = require('formidable');
var fs = require('fs');

var ATM = require('../modules/account-manager');
var FIM = require('../modules/file-manager');

module.exports = function(app) {
  app.get('/admin', function(req, res) {
    if (req.session.user == null || !req.session.user.admin){
  		res.redirect('/login');
  	}	else {
      res.render('pages/admin/test', {user: req.session.user});
    }
  });

  app.get('/admin/manage/accreditations', function(req, res) {
    if (req.session.user == null || !req.session.user.admin){
  		res.redirect('/employee');
  	}	else {
      ACM.getAllAccreds(function(err, accreds) {
        if(!err) {
          ACM.getAllSteps(function(err, steps) {
            if(!err) {
              res.render('pages/admin/accreditations', {user: req.session.user, accreditations: accreds, steps: steps});
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

  // Accreditations
  app.post('/admin/manage/accreditations/update', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if(req.session.user == null || !req.session.user.admin) {
      res.send(JSON.stringify({'success': false}));
    } else {
      ACM.updateAccred(req.body.accreditation, function(err) {
        if(err) throw err;
        res.send(JSON.stringify({'success': true}));
      });
    }
  });

  app.post('/admin/manage/accreditations/insert', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if(req.session.user == null || !req.session.user.admin) {
      res.send(JSON.stringify({'success': false}));
    } else {
      ACM.insertAccred(req.body.accreditation, function(err, id) {
        if(err) throw err;
        res.send(JSON.stringify({'success': true, 'id': id}));
      });
    }
  });

  app.post('/admin/manage/accreditations/delete', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if(req.session.user == null || !req.session.user.admin) {
      res.send(JSON.stringify({'success': false}));
    } else {
      ACM.deleteAccreds(req.body.accreditations);
      res.send(JSON.stringify({'success': true}));
    }
  });

  // Steps
  app.post('/admin/manage/steps/update', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if(req.session.user == null || !req.session.user.admin) {
      res.send(JSON.stringify({'success': false}));
    } else {
      ACM.updateStep(req.body.step, function(err) {
        if(err) throw err;
        res.send(JSON.stringify({'success': true}));
      });
    }
  });

  app.post('/admin/manage/steps/insert', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if(req.session.user == null || !req.session.user.admin) {
      res.send(JSON.stringify({'success': false}));
    } else {
      ACM.insertStep(req.body.step, function(err, id) {
        if(err) throw err;
        res.send(JSON.stringify({'success': true, 'id': id}));
      });
    }
  });

  app.post('/admin/manage/steps/delete', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if(req.session.user == null || !req.session.user.admin) {
      res.send(JSON.stringify({'success': false}));
    } else {
      ACM.deleteSteps(req.body.steps);
      res.send(JSON.stringify({'success': true}));
    }
  });

  app.get('/admin/manage/files', function(req, res) {
    if(req.session.user == null || !req.session.user.admin) {
  		res.redirect('/employee');
  	}	else {
      FIM.getFiles(function(err, files) {
        if(!err) {
          FIM.getLinks(function(err, links) {
            if(!err) {
              res.render('pages/admin/files', {user: req.session.user, files: files, links: links});
            }	else {
    					res.render('pages/error', {error: err});
    				}
          })
        }	else {
					res.render('pages/error', {error: err});
				}
      });
    }
  });

  app.post('/admin/manage/links', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if(req.session.user == null || !req.session.user.admin) {
      res.send(JSON.stringify({'success': false}));
    } else {
      var form = new formidable.IncomingForm();
      var files = [];
      var fields = [];
      var id = null;

      // form.multiples = true;
      form.on('field', function(field, value) {
        if (field == 'id') {
          FIM.getLinkByID(value, function(err, link) {
            if (err) throw err;

            try {
              var path = process.cwd() + '/public/files/' + link.link;
              var stats = fs.statSync(path);
              fs.unlink(path);
            } catch (e) {
              console.log("File does not exist.");
            }
          });
          FIM.deleteLink(value);
        }
        fields.push([field, value]);
      })
        .on('file', function(field, file) {
          var oldpath = file.path;
          var newpath = process.cwd() + '/public/files/' + file.name;
          fs.rename(oldpath, newpath, function (err) {
            if (err) throw err;
          });
          files.push([field, file]);
        })
        .on('error', function(err) {
          console.log(err);
        })
        .on('end', function() {
          if(files.length > 0) {
            console.log("files");
            if(files.length > 1) {
              throw "Too many files";
            } else {
              FIM.insertLink(files[0][1].name, function(err, id) {
                if(err) throw err;

                console.log(id);
                res.send(JSON.stringify({"success": true, "id": id}));
              });
            }
          } else {
            console.log("Not file");
            res.send(JSON.stringify({"success": true}));
          }
        });
      form.parse(req);
    }
  });

  app.post('/admin/manage/files/update', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if(req.session.user == null || !req.session.user.admin) {
      res.send(JSON.stringify({'success': false}));
    } else {
      FIM.updateFile(req.body.file, function(err) {
        if(err) throw err;
        res.send(JSON.stringify({'success': true}));
      });
    }
  });

  app.post('/admin/manage/files/insert', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if(req.session.user == null || !req.session.user.admin) {
      res.send(JSON.stringify({'success': false}));
    } else {
      FIM.insertFile(req.body.file, function(err, id) {
        if(err) throw err;
        res.send(JSON.stringify({'success': true, 'id': id}));
      });
    }
  });

  app.post('/admin/manage/files/delete', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if(req.session.user == null || !req.session.user.admin) {
      res.send(JSON.stringify({'success': false}));
    } else {
      FIM.deleteFiles(req.body.files);
      res.send(JSON.stringify({'success': true}));
    }
  });

  // Users
  app.get('/admin/manage/users', function(req, res) {
    if (req.session.user == null || !req.session.user.admin){
      res.redirect('/employee');
    }	else {
      ACM.getAllLimited(function(err, accreds) {
        if(!err) {
          ATM.getAllUsers(function(employees) {
            res.render('pages/admin/users', {user: req.session.user, employees: employees, accreditations: accreds});
          });
        }	else {
					res.render('pages/error', {error: err});
				}
      });
    }
  });

  app.post('/admin/manage/users', function(req, res) {
    if (req.session.user == null || !req.session.user.admin){
      res.redirect('/employee');
    }	else {
      var user = {
        id   : req.body['id'],
  			name : req.body['name'],
  			email: req.body['email'],
  			admin: req.body['admin']
      };
      if(!req.body['accred']) {
        req.body['accred'] = []
      }
      if(!req.body['original_role']) {
        req.body['original_role'] = []
      }
      var accred_dels = [];
      for(var i = 0; i < req.body['original_role'].length; i++) {
        if(req.body['accred'].indexOf(req.body['original_role'][i]) == -1) {
          accred_dels.push(req.body['original_role'][i]);
        }
      }
      ATM.updateAccount(user, function(err) {
        if(!err) {
          ATM.updateRoles(user.id, req.body['accred'], accred_dels, function() {
            ACM.getAllLimited(function(err, accreds) {
              if(!err) {
                ATM.getAllUsers(function(employees) {
                  res.render('pages/admin/users', {user: req.session.user, employees: employees, accreditations: accreds});
                });
              }	else {
                res.render('pages/error', {error: err});
              }
            });
          });
        }	else {
          res.render('pages/error', {error: err});
				}
      });
    }
  });

  app.post('/admin/manage/users/new', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if(req.session.user == null || !req.session.user.admin) {
      res.send(JSON.stringify({'success': false}));
    } else {
      EMD.dispatchUserRequest(req.body.name, req.body.email, function(err) {
        if(err) throw err;

        ATM.insertUser(req.body.name, req.body.email, function(err) {
          if(err) throw err;
        });
        res.send(JSON.stringify({'success': true}));
      });
    }
  });

  app.get('/admin/manage/users/admin', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if(req.session.user == null || !req.session.user.admin) {
      res.send(JSON.stringify({'success': false}));
    } else {
      ATM.makeUserAdmin(req.query.set, req.query.user, function(err) {
        if(err) throw err;
        res.send(JSON.stringify({'success': true}));
      });
    }
  });

  app.get('/admin/manage/users/delete', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if(req.session.user == null || !req.session.user.admin) {
      res.send(JSON.stringify({'success': false}));
    } else {
      ATM.deleteAccount(req.query.user, function(err) {
        if(err) throw err;
        res.send(JSON.stringify({'success': true}));
      });
    }
  });
}
