var FIM = require('../modules/file-manager');

module.exports = function(app) {
  app.get('/employee', function(req, res) {
    FIM.getFiles(function(err, o) {
      if(!err) {
        res.render('pages/employee/files', {files: o});
      } else {
        res.render('pages/error', {error: err});
      }
    });
  });

  app.get('/employee/files', function(req, res) {
    res.redirect('/employee');
  });
}
