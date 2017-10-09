var example = require('../dummy/example');

module.exports = function(app) {
  app.get('/example', function(req, res) {
    res.render('pages/example', {data: example.data, title: example.title});
  });
}
