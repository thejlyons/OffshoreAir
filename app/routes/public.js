var formidable = require('formidable');
var validator = require('validator');
var EM = require('../modules/email-dispatcher');
var JM = require('../modules/job-manager');
var FM = require('../modules/form-manager');

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

  app.get('/sample-work', function(req, res) {
    JM.getJobs(function(err, jobs) {
      res.render('pages/sample-work', {
        this_title : "Sample Work",
        jobs: jobs,
        url: process.env.AWS_BASE_URL + 'jobs/'
      });
    });
  });

  app.get('/estimate', function(req, res){
    FM.getQuestions(function(err, questions) {
      res.render('pages/estimate-new', {
        this_title : "Estimates",
        questions: questions,
        post: false,
        errors: []
      });
    });
  });

  app.post('/estimate', function(req, res){
    var form = new formidable.IncomingForm();
    var fields = [];

    form.on('field', function(field, value) {
      console.log(field);
      console.log(value);
      fields.push([field, value]);
    })
      .on('error', function(err) {
        console.log(err);
      });
    form.parse(req);

    console.log(req.body);
    var responses = {};
    for (input in req.body) {
      var key = input.slice(8);
      responses[key] = req.body[input];
    }
    FM.getQuestions(function(err, questions) {
      var errors = [];
      for (id in responses) {
        var question;
        for (i in questions) {
          if (parseInt(id, 10) === parseInt(questions[i].id, 10)) {
            question = questions[i];
            break;
          }
        }
        if(question.is_email && !validator.isEmail(responses[id])) {
          errors.push("Invalid email address.");
        }
        if(question.is_phone && !validator.isMobilePhone(responses[id], 'en-US')) {
          errors.push("Invalid phone number.");
        }
      }

      if(errors.length) {
        res.render('pages/estimate-new', {
          this_title : "Estimates",
          questions: questions,
          post: false,
          errors: errors
        });
      } else {
        EM.dispatchGetEstimate(responses, questions, function(err, message) {
          console.log(err || message);
          res.render('pages/estimate-new', {
            this_title : "Estimates",
            questions: questions,
            post: true,
            errors: []
          });
        });
      }
    });
  });

  app.get('/test', function(req, res){
    res.render('pages/test');
  });
}
