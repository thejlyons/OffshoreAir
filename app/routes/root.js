var JM = require('../modules/job-manager');

module.exports = function(app) {
  app.get('/', function(request, response) {
    JM.isVisible(function(is_visible) {
      response.render('pages/index', {
        this_title: "Our Story",
        is_visible: is_visible
      });
    });
  });
}
