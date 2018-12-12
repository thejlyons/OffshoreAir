var formidable = require('formidable');
var fs = require('fs');
var Excel = require('exceljs');
var AWS = require('aws-sdk');
AWS.config.setPromisesDependency(require('bluebird'));
var s3 = new AWS.S3();

var ATM = require('../modules/account-manager');
var ACM = require('../modules/accreditation-manager');
var EMD = require('../modules/email-dispatcher.js');
var EMM = require('../modules/email-manager.js');
var FOM = require('../modules/form-manager');
var FIM = require('../modules/file-manager');
var JOM = require('../modules/job-manager');
var NHM = require('../modules/new-hire-manager');
var PVM = require('../modules/page-view-manager');

module.exports = function(app) {
  app.get('/admin', function(req, res) {
    if (req.session.user == null || !req.session.user.admin){
  		res.redirect('/employee');
  	}	else {
      ACM.getAllLimited(function(err, accreds) {
        if(!err) {
          res.render('pages/admin/admin', {user: req.session.user, accreditations: accreds});
        } else {
          res.render('pages/error', {error: err});
        }
      });
    }
  });

  // Files
  app.get('/admin/files', function(req, res) {
    if(req.session.user == null || !req.session.user.admin) {
  		res.redirect('/employee');
  	}	else {
      ACM.getAllLimited(function(err, accreds) {
        if(!err) {
          FIM.getFiles(function(err, files) {
            if(!err) {
              FIM.getLinks(function(err, links) {
                if(!err) {
                  res.render('pages/admin/files', {
                    user: req.session.user,
                    accreditations: accreds,
                    files: files,
                    links: links,
                    url: process.env.AWS_BASE_URL + "files/"
                  });
                }	else {
                  res.render('pages/error', {error: err});
                }
              })
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

  app.post('/admin/manage/links', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if(req.session.user == null || !req.session.user.admin) {
      res.send(JSON.stringify({'success': false}));
    } else {
      var form = new formidable.IncomingForm();
      var files = [];
      var fields = [];
      var id = null;

      form.multiples = true;
      form.on('field', function(field, value) {
        if (field == 'id') {
          FIM.getLinkByID(value, function(err, link) {
            if (err) throw err;

            var params = {
              Bucket: process.env.AWS_BUCKET,
              Delete: {
                Objects: [
                  {
                    Key: "files/" + link.link
                  }
                ],
              },
            };

            s3.deleteObjects(params, function(err, data) {
              if (err) console.log(err, err.stack); // an error occurred
              else     console.log(data);           // successful response
            });
          });
          FIM.deleteLink(value);
        }
        fields.push([field, value]);
      })
        .on('file', function(field, file) {
          fs.readFile(file.path, function(err, content) {
            if(!err) {
              s3.putObject({
                Bucket: process.env.AWS_BUCKET,
                Key: "files/" + file.name,
                Body: content,
                ContentType: file.type,
                ACL: "public-read"
              }, function(err, data) {
                FIM.insertLink(file.name, function(err) {
                  if(err) {
                    console.log(err);
                  }
                  files.push([field, file]);
                });
              });
            }
          });
        })
        .on('error', function(err) {
          console.log(err);
        })
        .on('end', function() {
          res.send(JSON.stringify({"success": true}));
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

  // Jobs
  app.get('/admin/jobs', function(req, res) {
    if(req.session.user == null || !req.session.user.admin) {
  		res.redirect('/employee');
  	}	else {
      ACM.getAllLimited(function(err, accreds) {
        if(!err) {
          JOM.getJobs(function(err, jobs) {
            if(!err) {
              JOM.isVisible(function(is_visible) {
                res.render('pages/admin/jobs', {
                  user: req.session.user,
                  jobs: jobs,
                  accreditations: accreds,
                  url: process.env.AWS_BASE_URL + "jobs/",
                  is_visible: is_visible
                });
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

  app.post('/admin/manage/jobs', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if(req.session.user == null || !req.session.user.admin) {
      res.send(JSON.stringify({'success': false}));
    } else {
      var form = new formidable.IncomingForm();
      var files = [];
      var fields = [];
      var id;

      form.multiples = false;
      form.on('field', function(field, value) {
        if(field == 'id') {
          id = value;
        }
        fields.push([field, value]);
      })
        .on('file', function(field, file) {
          JOM.getImageByID(id, function(err, img) {
            if (err) throw err;

            if(img) {
              var params = {
                Bucket: process.env.AWS_BUCKET,
                Delete: {Objects: [{Key: "jobs/" + img}]},
              };
              s3.deleteObjects(params, function(err, data) {
                if (err) console.log(err, err.stack); // an error occurred
                else     console.log(data);           // successful response
              });
            }

            fs.readFile(file.path, function(err, content) {
              if(!err) {
                s3.putObject({
                  Bucket: process.env.AWS_BUCKET,
                  Key: "jobs/" + file.name,
                  Body: content,
                  ContentType: file.type,
                  ACL: "public-read"
                }, function(err, data) {
                  if(img) {
                    JOM.updateJobImage(id, file.name, function(err) {
                      if(err) {
                        console.log(err);
                      }
                      files.push([field, file]);
                    });
                  } else {
                    files.push([field, file]);
                  }
                });
              }
            });
          });
        })
        .on('error', function(err) {
          console.log(err);
        })
        .on('end', function() {
          setTimeout(function() {
            res.send(JSON.stringify({"success": true}));
          }, 1500);
        });
      form.parse(req);
    }
  });

  app.post('/admin/manage/jobs/toggle', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if(req.session.user == null || !req.session.user.admin) {
      res.send(JSON.stringify({'success': false}));
    } else {
      JOM.toggleVisible(function() {
        res.send(JSON.stringify({'success': true}));
      });
    }
  });

  app.post('/admin/manage/jobs/update', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if(req.session.user == null || !req.session.user.admin) {
      res.send(JSON.stringify({'success': false}));
    } else {
      JOM.updateJob(req.body.job, function(err) {
        if(err) throw err;
        res.send(JSON.stringify({'success': true}));
      });
    }
  });

  app.post('/admin/manage/jobs/insert', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if(req.session.user == null || !req.session.user.admin) {
      res.send(JSON.stringify({'success': false}));
    } else {
      JOM.insertJob(req.body.job, function(err, id) {
        if(err) throw err;
        res.send(JSON.stringify({'success': true, 'id': id}));
      });
    }
  });

  app.post('/admin/manage/jobs/delete', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if(req.session.user == null || !req.session.user.admin) {
      res.send(JSON.stringify({'success': false}));
    } else {
      JOM.deleteJobs(req.body.jobs);
      res.send(JSON.stringify({'success': true}));
    }
  });

  app.post('/admin/manage/jobs/clean', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if(req.session.user == null || !req.session.user.admin) {
      res.send(JSON.stringify({'success': false}));
    } else {
      s3.listObjectsV2({
        Bucket: process.env.AWS_BUCKET,
        Delimiter: '',
        Prefix: 'jobs/'
      }, function(err, data) {
        JOM.getJobs(function(err, jobs) {
          jobs_list = [];
          for(var i = 0; i < jobs.length; i++) {
            jobs_list.push(jobs[i].img);
          }
          for(var i = 0; i < data.Contents.length; i++) {
            if(jobs_list.indexOf(data.Contents[i].Key.replace('jobs/', '')) < 0) {
              var params = {
                Bucket: process.env.AWS_BUCKET,
                Delete: {Objects: [{Key: data.Contents[i].Key}]},
              };
              s3.deleteObjects(params, function(err, data) {
                if (err) console.log(err, err.stack); // an error occurred
                else     console.log(data);           // successful response
              });
            }
          }
        });
      });
      res.send(JSON.stringify({'success': true}));
    }
  });

  // Images
  app.get('/admin/images', function(req, res) {
    if(req.session.user == null || !req.session.user.admin) {
  		res.redirect('/login');
  	}	else {
      ACM.getAllLimited(function(err, accreds) {
        if(!err) {
          s3.listObjectsV2({
            Bucket: process.env.AWS_BUCKET,
            Delimiter: '',
            Prefix: 'images/'
          }, function(err, data) {
            images = [];
            for(var i = 0; i < data.Contents.length; i++) {
              var temp = data.Contents[i].Key.replace('images/', '');
              if(temp != '') {
                images.push(temp);
              }
            }
            res.render('pages/admin/images', {
              user: req.session.user,
              accreditations: accreds,
              images: images,
              url: process.env.AWS_BASE_URL + "images/"
            });
          });
        } else {
          res.render('pages/error', {error: err});
        }
      });
    }
  });

  app.post('/admin/images', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if(req.session.user == null || !req.session.user.admin) {
      res.send(JSON.stringify({'success': false}));
    } else {
      var form = new formidable.IncomingForm();
      var files = [];
      var fields = [];
      var key;

      form.multiples = false;
      form.on('field', function(field, value) {
        if(field == 'key') {
          key = value;
        }
        fields.push([field, value]);
      })
        .on('file', function(field, file) {
          fs.readFile(file.path, function(err, content) {
            if(!err) {
              s3.putObject({
                Bucket: process.env.AWS_BUCKET,
                Key: "images/" + key,
                Body: content,
                ContentType: file.type,
                ACL: "public-read"
              }, function(err, data) {
                if (err) console.log(err, err.stack); // an error occurred
                else     console.log(data);           // successful response
                files.push([field, file]);
              });
            }
          });
        })
        .on('error', function(err) {
          console.log(err);
        })
        .on('end', function() {
          setTimeout(function() {
            res.send(JSON.stringify({"success": true}));
          }, 1500);
        });
      form.parse(req);
    }
  });

  // Form
  app.get('/admin/form', function(req, res) {
    if(req.session.user == null || !req.session.user.admin) {
  		res.redirect('/employee');
  	}	else {
      ACM.getAllLimited(function(err, accreds) {
        if(!err) {
          FOM.getForms(function(err, forms) {
            if(!err) {
              FOM.getAllQuestions(function(err, questions) {
                if(!err) {
                  FOM.getTypes(function(err, types) {
                    if(!err) {
                      res.render('pages/admin/form', {user: req.session.user, accreditations: accreds, forms: forms, questions: questions, types: types});
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

  // Form
  app.get('/admin/responses', function(req, res) {
    load_responses(req, res);
  });

  app.post('/admin/responses', function(req, res) {
    if(req.body.download) {
      if(req.session.user == null || !req.session.user.admin) {
        res.writeHead(400);
      } else {
        FOM.getFormById(req.body.form_id, function(err, form) {
          if(err) throw err;
          FOM.getQuestions(form.id, function(err, questions) {
            if(err) throw err;
            FOM.getFormSubmissions(form.id, function(err, submissions) {
              res.writeHead(200, {
                'Content-Disposition': 'attachment; filename="' + form.name + '.xlsx"',
                'Transfer-Encoding': 'chunked',
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
              });
              var workbook = new Excel.stream.xlsx.WorkbookWriter({ stream: res });
              var worksheet = workbook.addWorksheet('Responses');
              worksheet.addRow([form.name, form.description]).commit();
              var row_questions = []
              for(var i=0; i < questions.length; i++) {
                row_questions.push(questions[i].question);
              }
              worksheet.addRow(row_questions).commit();
              for(var i=0; i < submissions.length; i++) {
                var row_submission = [];
                for(var j=0; j < questions.length; j++) {
                  if(submissions[i].responses[questions[j].id] != undefined) {
                    row_submission.push(submissions[i].responses[questions[j].id]);
                  } else {
                    row_submission.push("");
                  }
                }
                worksheet.addRow(row_submission).commit();
              }
              worksheet.commit();
              workbook.commit();
            });
          });
        });
      }
    } else {
      load_responses(req, res);
    }
  });

  app.post('/admin/manage/response/view/:submission_id', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if(req.session.user == null || !req.session.user.admin) {
      res.send(JSON.stringify({'success': false}));
    } else {
      FOM.getSubmissionResponses(req.params.submission_id, function(err, responses) {
        if(err) throw err;
        res.send(JSON.stringify({'responses': responses}));
      });
    }
  });

  app.post('/admin/manage/response/view', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if(req.session.user == null || !req.session.user.admin) {
      res.send(JSON.stringify({'success': false}));
    } else {
      FOM.getResponses(req.query.formid, req.query.userid, function(err, responses) {
        if(err) throw err;
        res.send(JSON.stringify({'responses': responses}));
      });
    }
  });

  app.post('/admin/manage/response/archive/:submission_id', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if(req.session.user == null || !req.session.user.admin) {
      res.send(JSON.stringify({'success': false}));
    } else {
      FOM.archiveSubmission(req.params.submission_id, function(err, responses) {
        if(err) throw err;
        res.send(JSON.stringify({'success': true}));
      });
    }
  });

  app.post('/admin/manage/response/restore/:submission_id', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if(req.session.user == null || !req.session.user.admin) {
      res.send(JSON.stringify({'success': false}));
    } else {
      FOM.restoreSubmission(req.params.submission_id, function(err, responses) {
        if(err) throw err;
        res.send(JSON.stringify({'success': true}));
      });
    }
  });

  app.post('/admin/manage/response/delete/:submission_id', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if(req.session.user == null || !req.session.user.admin) {
      res.send(JSON.stringify({'success': false}));
    } else {
      FOM.deleteSubmissions([req.params.submission_id]);
      res.send(JSON.stringify({'success': true}));
    }
  });

  // app.get('/admin/hire/form', function(req, res) {
  //   if(req.session.user == null || !req.session.user.admin) {
  // 		res.redirect('/employee');
  // 	}	else {
  //     ACM.getAllLimited(function(err, accreds) {
  //       if(!err) {
  //         FOM.getFormByName("New Hire Form", function(err, form) {
  //           if(!err) {
  //             FOM.getQuestions(form.id, function(err, questions) {
  //               if(!err) {
  //                 FOM.getTypes(function(err, types) {
  //                   if(!err) {
  //                     res.render('pages/admin/form', {user: req.session.user, accreditations: accreds, form: form, questions: questions, types: types});
  //                   }	else {
  //                     res.render('pages/error', {error: err});
  //                   }
  //                 });
  //               }	else {
  //                 res.render('pages/error', {error: err});
  //               }
  //             });
  //           }	else {
  //             res.render('pages/error', {error: err});
  //           }
  //         });
  //       } else {
  //         res.render('pages/error', {error: err});
  //       }
  //     });
  //   }
  // });

  app.post('/admin/manage/form', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if(req.session.user == null || !req.session.user.admin) {
      res.send(JSON.stringify({'success': false}));
    } else {
      FOM.updateForm(req.body.form, function(err) {
        if(err) throw err;
        res.send(JSON.stringify({'success': true}));
      });
    }
  });

  app.post('/admin/manage/form/create', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if(req.session.user == null || !req.session.user.admin) {
      res.send(JSON.stringify({'success': false}));
    } else {
      FOM.createForm(function(err, form) {
        if(err) throw err;
        res.send(JSON.stringify({'id': form.id, 'name': 'New Form'}));
      });
    }
  });

  app.post('/admin/manage/form/delete-form', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if(req.session.user == null || !req.session.user.admin) {
      res.send(JSON.stringify({'success': false}));
    } else {
      FOM.deleteForm(req.body.id, function() {
        res.send(JSON.stringify({'success': true}));
      });
    }
  });

  app.post('/admin/manage/form/insert', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if(req.session.user == null || !req.session.user.admin) {
      res.send(JSON.stringify({'success': false}));
    } else {
      FOM.insertQuestion(req.body.question, req.body.form_id, function(err) {
        if(err) throw err;
        res.send(JSON.stringify({'success': true}));
      });
    }
  });

  app.post('/admin/manage/form/update', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if(req.session.user == null || !req.session.user.admin) {
      res.send(JSON.stringify({'success': false}));
    } else {
      FOM.updateQuestion(req.body.question, function(err) {
        if(err) throw err;
        res.send(JSON.stringify({'success': true}));
      });
    }
  });

  app.post('/admin/manage/form/delete', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if(req.session.user == null || !req.session.user.admin) {
      res.send(JSON.stringify({'success': false}));
    } else {
      FOM.deleteQuestions(req.body.questions);
      res.send(JSON.stringify({'success': true}));
    }
  });

  // Employees
  app.get('/admin/employees', function(req, res) {
    if (req.session.user == null || (!req.session.user.admin && !req.session.user.is_hr)) {
      res.redirect('/employee');
    }	else {
      ACM.getAllRoles(function(err, roles) {
        if(!err) {
          ACM.getAllLimited(function(err, accreds) {
            if(!err) {
              ATM.getAllUsers(function(err, employees) {
                if(!err) {
                  NHM.getAllProgress(function(err, progress, total) {
                    if(!err) {
                      FOM.getForms(function(err, forms) {
                        res.render('pages/admin/employees', {
                          user: req.session.user,
                          employees: employees,
                          roles: roles,
                          accreditations: accreds,
                          progress: progress,
                          forms: forms,
                          total: total
                        });
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

  app.post('/admin/employees', function(req, res) {
    if (req.session.user == null || (!req.session.user.admin && !req.session.user.is_hr)) {
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
          ATM.updateRoles(user.id, (req.body['accred'] != undefined) ? req.body['accred'] : [], accred_dels, function() {
            ACM.getAllRoles(function(err, roles) {
              if(!err) {
                ACM.getAllLimited(function(err, accreds) {
                  if(!err) {
                    ATM.getAllUsers(function(err, employees) {
                      if(!err) {
                        NHM.getAllProgress(function(err, progress, total) {
                          if(!err) {
                            FOM.getForms(function(err, forms) {
                              res.render('pages/admin/employees', {
                                user: req.session.user,
                                employees: employees,
                                roles: roles,
                                accreditations: accreds,
                                progress: progress,
                                total: total,
                                forms: forms
                              });
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
          });
        }	else {
          res.render('pages/error', {error: err});
        }
      });
    }
  });

  app.post('/admin/manage/employees/new', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if (req.session.user == null || (!req.session.user.admin && !req.session.user.is_hr)) {
      res.send(JSON.stringify({'success': false}));
    } else {
      EMD.dispatchUserRequest(req.body.name, req.body.email, function(err) {
        if(err) throw err;
        ATM.insertUser(req.body.name, req.body.email, function(err, id) {
          if(err) throw err;
          ATM.updateRoles(id, (req.body.roles != undefined) ? req.body.roles : [], [], function(err) {
            if(err) throw err;
            res.send(JSON.stringify({'success': true}));
          });
        });
      });
    }
  });

  app.post('/admin/manage/employees/archive/:user_id', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if (req.session.user == null || (!req.session.user.admin && !req.session.user.is_hr)) {
      res.send(JSON.stringify({'success': false}));
    } else {
      ATM.archiveUser(req.params.user_id, function(err) {
        if(err) throw err;
        res.send(JSON.stringify({'success': true}));
      });
    }
  });

  app.post('/admin/manage/employees/restore/:user_id', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if (req.session.user == null || (!req.session.user.admin && !req.session.user.is_hr)) {
      res.send(JSON.stringify({'success': false}));
    } else {
      ATM.restoreUser(req.params.user_id, function(err) {
        if(err) throw err;
        res.send(JSON.stringify({'success': true}));
      });
    }
  });

  app.get('/admin/manage/employees/admin', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if (req.session.user == null || (!req.session.user.admin && !req.session.user.is_hr)) {
      res.send(JSON.stringify({'success': false}));
    } else {
      ATM.makeUserAdmin(req.query.set, req.query.employee, function(err) {
        if(err) throw err;
        res.send(JSON.stringify({'success': true}));
      });
    }
  });

  app.post('/admin/manage/employees/delete/:user_id', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if (req.session.user == null || (!req.session.user.admin && !req.session.user.is_hr)) {
      res.send(JSON.stringify({'success': false}));
    } else {
      ATM.deleteAccount(req.params.user_id, function(err) {
        if(err) throw err;
        res.send(JSON.stringify({'success': true}));
      });
    }
  });

  // Accreditations
  app.get('/admin/accreditations', function(req, res) {
    if(req.session.user == null || !req.session.user.admin) {
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
        } else {
          res.render('pages/error', {error: err});
        }
      });
    }
  });

  app.post('/admin/manage/accreditations/insert', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if(req.session.user == null || !req.session.user.admin) {
      res.send(JSON.stringify({'success': false}));
    } else {
      ACM.insertAccred(req.body.accreditation, function(err) {
        if(err) throw err;
        res.send(JSON.stringify({'success': true}));
      });
    }
  });

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

  app.post('/admin/manage/accreditations/delete', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if(req.session.user == null || !req.session.user.admin) {
      res.send(JSON.stringify({'success': false}));
    } else {
      ACM.deleteAccreds(req.body.accreditations);
      res.send(JSON.stringify({'success': true}));
    }
  });

  app.post('/admin/manage/steps/insert', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if(req.session.user == null || !req.session.user.admin) {
      res.send(JSON.stringify({'success': false}));
    } else {
      ACM.insertStep(req.body.step, function(err) {
        if(err) throw err;
        res.send(JSON.stringify({'success': true}));
      });
    }
  });

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

  app.post('/admin/manage/steps/delete', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if(req.session.user == null || !req.session.user.admin) {
      res.send(JSON.stringify({'success': false}));
    } else {
      ACM.deleteSteps(req.body.steps);
      res.send(JSON.stringify({'success': true}));
    }
  });

  // New Hire - Tasks
  app.get('/admin/hire/tasks', function(req, res) {
    if(req.session.user == null || !req.session.user.admin) {
  		res.redirect('/employee');
  	}	else {
      ACM.getAllLimited(function(err, accreds) {
        if(!err) {
          NHM.getTasks(function(err, tasks) {
            if(!err) {
              NHM.getOwners(function(err, owners) {
                if(!err) {
                  FIM.getFiles(function(err, files) {
                    if(!err) {
                      res.render('pages/admin/new-hire-tasks', {
                        user: req.session.user,
                        accreditations: accreds,
                        tasks: tasks,
                        owners: owners,
                        files: files
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

  app.post('/admin/manage/hire/task/insert', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if(req.session.user == null || !req.session.user.admin) {
      res.send(JSON.stringify({'success': false}));
    } else {
      if(req.body.tasks) {
        NHM.insertTasks(req.body.tasks, function(err, ids) {
          if(err) throw err;
          console.log(ids);
          res.send(JSON.stringify({'success': true, 'ids': ids}));
        });
      } else {
        res.send(JSON.stringify({'success': true, 'ids': []}));
      }
    }
  });

  app.post('/admin/manage/hire/task/update', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if(req.session.user == null || !req.session.user.admin) {
      res.send(JSON.stringify({'success': false}));
    } else {
      NHM.updateTask(req.body.task, function(err) {
        if(err) throw err;
        res.send(JSON.stringify({'success': true}));
      });
    }
  });

  app.post('/admin/manage/hire/task/delete', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if(req.session.user == null || !req.session.user.admin) {
      res.send(JSON.stringify({'success': false}));
    } else {
      NHM.deleteTasks(req.body.tasks);
      res.send(JSON.stringify({'success': true}));
    }
  });

  // New Hire - Employee Page
  app.get('/admin/hire', function(req, res) {
    if(req.session.user == null || (!req.session.user.admin && !req.session.user.is_hr)) {
  		res.redirect('/employee');
  	}	else {
      ATM.findById(req.query.id, function(err, employee) {
        if(err) throw err;
        ACM.getAllLimited(function(err, accreds) {
          if(!err) {
            NHM.getEmployeeTasks(req.query.id, function(err, tasks) {
              if(!err) {
                NHM.getOwners(function(err, owners) {
                  if(!err) {
                    NHM.getUserProgress(req.query.id, function(err, progress) {
                      if(!err) {
                        FIM.getFiles(function(err, files) {
                          if(!err) {
                            res.render('pages/new-hire', {
                              user: req.session.user,
                              accreditations: accreds,
                              tasks: tasks,
                              files: files,
                              url: process.env.AWS_BASE_URL,
                              owners: owners,
                              progress: progress,
                              user_name: employee.name,
                              user_id: req.query.id,
                              is_hr: req.session.user.is_hr,
                              is_doug: req.session.user.id == process.env.DOUG_ID || req.session.user.admin
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
      });
    }
  });

  app.post('/admin/hire', function(req, res) {
    if(req.session.user == null || (!req.session.user.admin && !req.session.user.is_hr)) {
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
        var file_key = "tasks/" + req.query.id + "/" + file.name;
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
        NHM.insertAttachment(file_key, task_id, req.query.id, function(err) {
          res.redirect('/admin/hire?id=' + req.query.id);
        });
      });
      form.parse(req);
    }
  });

  app.post('/hire/attachment/delete', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if(req.session.user == null) {
      res.send(JSON.stringify({'success': false}));
    } else {
      NHM.getAttachmentByID(req.body.id, function(err, attachment) {
        if (err) throw err;

        var params = {
          Bucket: process.env.AWS_BUCKET,
          Delete: {
            Objects: [
              {
                Key: attachment.aws_endpoint
              }
            ],
          },
        };

        s3.deleteObjects(params, function(err, data) {
          if (err) console.log(err, err.stack); // an error occurred
          else     console.log(data);           // successful response
        });
      });
      NHM.deleteAttachment(req.body.id);
      res.send(JSON.stringify({'success': true}));
    }
  });

  app.post('/hire/check', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if (req.session.user == null) {
      res.send(JSON.stringify({'success': false}));
    } else {
      NHM.checkTask(req.body.task_id, req.body.user_id);
      NHM.getNextTask(req.body.task_id, function(err, next_task) {
        if (err) throw err;
        if (next_task) {
          if (next_task.owners[next_task.owner_id] == "HR") {
            ATM.getHrEmails(function(err, hr_emails) {
              ATM.findById(req.body.user_id, function(err, employee) {
                EMD.dispatchNewHireStepHR(hr_emails[0].array, employee, next_task);
              });
            });
          } else if (next_task.owners[next_task.owner_id] == "New Employee") {
            EMD.dispatchNewHireStepEmployee(req.session.user.email, next_task);
          }
        }
      });
      res.send(JSON.stringify({'success': true}));
    }
  });

  app.post('/hire/uncheck', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if(req.session.user == null) {
      res.send(JSON.stringify({'success': false}));
    } else {
      NHM.uncheckTask(req.body.task_id, req.body.user_id);
      res.send(JSON.stringify({'success': true}));
    }
  });

  // Emails
  app.get('/admin/email', function(req, res) {
    if(req.session.user == null || !req.session.user.admin) {
  		res.redirect('/employee');
  	}	else {
      ACM.getAllLimited(function(err, accreds) {
        if(!err) {
          EMM.getEmails(function(err, emails) {
            if(!err) {
              var request_email;
              var confirm_email;
              for(var i = 0; i<emails.length; i++) {
                if(emails[i].id == process.env.EMAIL_REQUEST_ID) {
                  request_email = emails[i];
                }
                if(emails[i].id == process.env.EMAIL_CONFIRM_ID) {
                  confirm_email = emails[i];
                }
              }
              while(request_email.body.indexOf('<br>') != -1) {
                request_email.body = request_email.body.replace('<br>', '\r');
              }
              while(confirm_email.body.indexOf('<br>') != -1) {
                confirm_email.body = confirm_email.body.replace('<br>', '\r');
              }
              res.render('pages/admin/email', {
                user: req.session.user,
                accreditations: accreds,
                request_email: request_email,
                confirm_email: confirm_email
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

  app.post('/admin/email', function(req, res) {
    if(req.session.user == null || !req.session.user.admin) {
  		res.redirect('/employee');
  	}	else {
      EMM.updateEmail(req.body, function(err) {
        if(!err) {
          ACM.getAllLimited(function(err, accreds) {
            if(!err) {
              EMM.getEmails(function(err, emails) {
                var request_email;
                var confirm_email;
                for(var i = 0; i<emails.length; i++) {
                  if(emails[i].id == process.env.EMAIL_REQUEST_ID) {
                    request_email = emails[i];
                  }
                  if(emails[i].id == process.env.EMAIL_CONFIRM_ID) {
                    confirm_email = emails[i];
                  }
                }
                while(request_email.body.indexOf('<br>') != -1) {
                  request_email.body = request_email.body.replace('<br>', '\r');
                }
                while(confirm_email.body.indexOf('<br>') != -1) {
                  confirm_email.body = confirm_email.body.replace('<br>', '\r');
                }
                res.render('pages/admin/email', {
                  user: req.session.user,
                  accreditations: accreds,
                  request_email: request_email,
                  confirm_email: confirm_email
                });
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

  // Page Views
  app.get('/admin/page-views', function(req, res) {
    if(req.session.user == null || !req.session.user.admin) {
  		res.redirect('/employee');
  	}	else {
      ACM.getAllLimited(function(err, accreds) {
        if(!err) {
          PVM.getViews(function(err, pages, views) {
            res.render('pages/admin/page-views', {
              user: req.session.user,
              accreditations: accreds,
              pages: pages,
              views: views
            });
          });
        }	else {
          res.render('pages/error', {error: err});
        }
      });
    }
  });

  function load_responses(req, res) {
    if(req.session.user == null || !req.session.user.admin) {
  		res.redirect('/employee');
  	}	else {
      ACM.getAllLimited(function(err, accreds) {
        if(!err) {
          FOM.getForms(function(err, forms) {
            if(!err) {
              FOM.getAllSubmissions(function(err, submissions) {
                if(!err) {
                  res.render('pages/admin/responses', {
                    user: req.session.user,
                    accreditations: accreds,
                    forms: forms,
                    submissions: submissions
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
  }
}
