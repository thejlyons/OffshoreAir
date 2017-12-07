var formidable = require('formidable');
var fs = require('fs');
var AWS = require('aws-sdk');
var s3 = new AWS.S3();

var ATM = require('../modules/account-manager');
var EMD = require('../modules/email-dispatcher.js');
var FIM = require('../modules/file-manager');

module.exports = function(app) {
  app.get('/admin-test', function(req, res) {
    if (req.session.user == null || !req.session.user.admin){
  		res.redirect('/employee');
  	}	else {
      res.render('pages/admin/admin', {user: req.session.user});
    }
  });

  app.get('/admin-test/files', function(req, res) {
    if(req.session.user == null || !req.session.user.admin) {
  		res.redirect('/employee');
  	}	else {
      FIM.getFiles(function(err, files) {
        if(!err) {
          FIM.getLinks(function(err, links) {
            if(!err) {
              res.render('pages/admin/files-test', {user: req.session.user, files: files, links: links, url: process.env.AWS_BASE_URL});
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

  app.post('/admin-test/manage/links', function(req, res) {
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
                    Key: link.link
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
                Bucket: "offshoreair-uploads",
                Key: file.name,
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

  app.post('/admin-test/manage/files/update', function(req, res) {
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

  app.post('/admin-test/manage/files/insert', function(req, res) {
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

  app.post('/admin-test/manage/files/delete', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if(req.session.user == null || !req.session.user.admin) {
      res.send(JSON.stringify({'success': false}));
    } else {
      FIM.deleteFiles(req.body.files);
      res.send(JSON.stringify({'success': true}));
    }
  });
}
