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


}
