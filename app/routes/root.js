var JM = require('../modules/job-manager');
var PV = require('../modules/page-view-manager');

module.exports = function(app) {
  app.get('/', function(request, response) {
    PV.count('index');
    JM.isVisible(function(is_visible) {
      response.render('pages/index', {
        this_title: "Our Story",
        is_visible: is_visible
      });
    });
  });
}
