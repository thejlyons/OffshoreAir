var formidable = require('formidable');
var fs = require('fs');

var ATM = require('../modules/account-manager');
var FIM = require('../modules/file-manager');

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
  		res.redirect('/');
  	}	else {
      FIM.getFiles(function(err, files) {
        if(!err) {
          FIM.getLinks(function(err, links) {
            if(!err) {
              res.render('pages/admin/files', {
                files: files,
                links: links,
                fsapikey: process.env.FILEPICKER_API_KEY,
                fspolicy: process.env.FILEPICKER_POLICY,
                fssign: process.env.FILEPICKER_SIGN
              });
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

  app.post('/admin/manage/links/insert', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if(req.session.user == null || !req.session.user.admin) {
      res.send(JSON.stringify({'success': false}));
    } else {
      FIM.insertLinks(req.body, function(err) {
        if(err) throw err;
        res.send(JSON.stringify({'success': true}));
      });
    }
  });

  app.post('/admin/manage/links/delete', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if(req.session.user == null || !req.session.user.admin) {
      res.send(JSON.stringify({'success': false}));
    } else {
      FIM.deleteLinks(req.body, function(err) {
        if(err) throw err;
        res.send(JSON.stringify({'success': true}));
      });
      res.send(JSON.stringify({'success': true}));
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
}
