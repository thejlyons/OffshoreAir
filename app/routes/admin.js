var formidable = require('formidable');
var fs = require('fs');
var AWS = require('aws-sdk');
AWS.config.setPromisesDependency(require('bluebird'));
var s3 = new AWS.S3();

var ATM = require('../modules/account-manager');
var EFM = require('../modules/form-manager');
var FIM = require('../modules/file-manager');
var JOM = require('../modules/job-manager');

module.exports = function(app) {
  app.get('/admin', function(req, res) {
    if (req.session.user == null || !req.session.user.admin){
  		res.redirect('/login');
  	}	else {
      res.render('pages/admin/admin');
    }
  });

  app.get('/admin/files', function(req, res) {
    if(req.session.user == null || !req.session.user.admin) {
  		res.redirect('/login');
  	}	else {
      FIM.getFiles(function(err, files) {
        if(!err) {
          FIM.getLinks(function(err, links) {
            if(!err) {
              res.render('pages/admin/files', {user: req.session.user, files: files, links: links, url: process.env.AWS_BASE_URL + "files/"});
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

  app.get('/admin/jobs', function(req, res) {
    if(req.session.user == null || !req.session.user.admin) {
  		res.redirect('/login');
  	}	else {
      JOM.getJobs(function(err, jobs) {
        if(!err) {
          res.render('pages/admin/jobs', {
            jobs: jobs,
            url: process.env.AWS_BASE_URL + "jobs/"
          });
        }	else {
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

  app.get('/admin/images', function(req, res) {
    if(req.session.user == null || !req.session.user.admin) {
  		res.redirect('/login');
  	}	else {
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
          images: images,
          url: process.env.AWS_BASE_URL + "images/"
        });
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

  app.get('/admin/form', function(req, res) {
    if(req.session.user == null || !req.session.user.admin) {
  		res.redirect('/login');
  	}	else {
      EFM.getQuestions(function(err, questions) {
        if(!err) {
          EFM.getTypes(function(err, types) {
            if(!err) {
              res.render('pages/admin/form', {user: req.session.user, questions: questions, types: types});
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

  app.post('/admin/manage/form/insert', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if(req.session.user == null || !req.session.user.admin) {
      res.send(JSON.stringify({'success': false}));
    } else {
      EFM.insertQuestion(req.body.question, function(err) {
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
      EFM.updateQuestion(req.body.question, function(err) {
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
      EFM.deleteQuestions(req.body.questions);
      res.send(JSON.stringify({'success': true}));
    }
  });
}
