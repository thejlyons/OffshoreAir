module.exports = function(app){
  app.get('/story', function(req, res){
    res.render('pages/story', {
      this_title : "Our Story"
    });
  });

  app.get('/services', function(req, res){
    res.render('pages/services', {
      this_title : "Our Services"
    });
  });

  app.get('/contact', function(req, res){
    res.render('pages/contact', {
      this_title : "Contact Us"
    });
  });

  app.get('/estimate', function(req, res){
    res.render('pages/estimate', {
      this_title : "Estimates"
    });
  });
}
