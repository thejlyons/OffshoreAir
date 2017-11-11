var example = require('../dummy/example');

module.exports = function(app) {
  app.get('/example', function(req, res) {
    res.render('pages/example', {name: example.name, picture: example.picture});
  });
}
