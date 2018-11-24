var formidable = require('formidable');
var fs = require('fs');
var AWS = require('aws-sdk');
AWS.config.setPromisesDependency(require('bluebird'));
var s3 = new AWS.S3();

var ATM = require('../modules/account-manager');
var FIM = require('../modules/file-manager');
var FOM = require('../modules/form-manager');
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
                    progress: progress,
                    post: (req.query.success == undefined) ? false : true
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

  app.get('/employee/forms', function(req, res) {
    if (req.session.user == null){
  		res.redirect('/login');
  	}	else {
      ACM.getAllLimited(function(err, accreds) {
        if(!err) {
          FOM.getEmployeeForms(function(err, forms) {
            if(!err) {
              res.render('pages/employee/forms', {user: req.session.user, accreditations: accreds, forms: forms});
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
    console.log(req.session.user);
    if(req.session.user == null) {
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
                      // NHM.isHR(req.session.user, function(err, is_hr) {
                      //   if(!err) {
                          FIM.getFiles(function(err, files) {
                            if(!err) {
                              res.render('pages/new-hire', {
                                user: req.session.user,
                                url: process.env.AWS_BASE_URL,
                                accreditations: accreds,
                                tasks: tasks,
                                owners: owners,
                                progress: progress,
                                files: files,
                                user_id: req.session.user.id,
                                is_hr: req.session.user.is_hr,
                                is_doug: req.session.user.id == process.env.DOUG_ID || req.session.user.admin
                              });
                            }	else {
                              res.render('pages/error', {error: err});
                            }
                          });
                      //   }	else {
                      //     res.render('pages/error', {error: err});
                      //   }
                      // });
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

  app.post('/employee/hire', function(req, res) {
    if(req.session.user == null) {
  		res.redirect('/employee');
  	}	else {
      var form = new formidable.IncomingForm();
      var files = [];
      var fields = [];
      var task_id;

      form.multiples = false;
      form.on('field', function(field, value) {
        if(field == 'task_id') {
          task_id = value;
        }
        fields.push([field, value]);
      })
      .on('file', function(field, file) {
        var file_key = "tasks/" + req.session.user.id + "/" + file.name;
        files.push([field, file, file_key]);
        fs.readFile(file.path, function(err, content) {
          if(!err) {
            s3.putObject({
              Bucket: process.env.AWS_BUCKET,
              Key: file_key,
              Body: content,
              ContentType: file.type,
              ACL: "public-read"
            }, function(err, data) {
              if (err) console.log(err, err.stack); // an error occurred
              else     console.log(data);           // successful response
            });
          }
        });
      })
      .on('error', function(err) {
        console.log(err);
      })
      .on('end', function() {
        var file_key = files[0][2];
        NHM.insertAttachment(file_key, task_id, req.session.user.id, function(err) {
          res.redirect('/employee/hire');
        });
      });
      form.parse(req);
    }
  });

  app.get('/employee/form', function(req, res){
    if(req.session.user == null) {
  		res.redirect('/employee');
  	}	else {
      ACM.getAllLimited(function(err, accreds) {
        if(!err) {
          FOM.getFormById(req.query.formid, function(err, form) {
            FOM.getQuestions(form.id, function(err, questions) {
              FOM.getUserSubmission(form.id, req.session.user.id, function(err, responses) {
                res.render('pages/employee/form', {
                  user: req.session.user,
                  accreditations: accreds,
                  this_title: form.name,
                  description: form.description,
                  questions: questions,
                  responses: responses,
                  post: false,
                  errors: []
                });
              })
            });
          });
        }	else {
          res.render('pages/error', {error: err});
        }
      });
    }
  });

  app.post('/employee/form', function(req, res){
    if(req.session.user == null) {
      res.redirect('/employee');
    }	else {
      var form = new formidable.IncomingForm();
      var fields = [];

      form.on('field', function(field, value) {
        fields.push([field, value]);
      })
        .on('error', function(err) {
          console.log(err);
        });
      form.parse(req);

      var responses = {};
      for (input in req.body) {
        var key = input.slice(8);
        responses[key] = req.body[input];
      }
      ACM.getAllLimited(function(err, accreds) {
        if(!err) {
          FOM.getFormById(req.query.formid, function(err, form) {
            FOM.getQuestions(form.id, function(err, questions) {
              var errors = [];
              for (id in responses) {
                var question;
                for (i in questions) {
                  if (parseInt(id, 10) === parseInt(questions[i].id, 10)) {
                    question = questions[i];
                    break;
                  }
                }
                if(question.is_email && !validator.isEmail(responses[id])) {
                  errors.push("Invalid email address.");
                }
                if(question.is_phone && !validator.isMobilePhone(responses[id], 'en-US')) {
                  errors.push("Invalid phone number.");
                }
              }

              if(errors.length) {
                FOM.getUserSubmission(form.id, req.session.user.id, function(err, responses) {
                  res.render('pages/employee/form', {
                    user: req.session.user,
                    accreditations: accreds,
                    this_title : form.name,
                    description: form.description,
                    questions: questions,
                    responses: responses,
                    post: false,
                    errors: errors,
                    is_visible: is_visible
                  });
                });
              } else {
                FOM.retrieveEmployeeSubmission(req.session.user.id, req.query.formid, function(err, submission) {
                  if(err) console.log(err);

                  for (id in responses) {
                    var question;
                    for (i in questions) {
                      if (parseInt(id, 10) === parseInt(questions[i].id, 10)) {
                        question = questions[i];
                        break;
                      }
                    }
                    FOM.insertResponse(responses[id], question.id, submission.id);
                  }
                  res.redirect('/employee?success');
                });
              }
            });
          });
        }
      });
    }
  });
}
