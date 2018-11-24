var formidable = require('formidable');
var validator = require('validator');
var EM = require('../modules/email-dispatcher');
var JM = require('../modules/job-manager');
var FM = require('../modules/form-manager');

module.exports = function(app){
  app.get('/story', function(req, res){
    JM.isVisible(function(is_visible) {
      res.render('pages/story', {
        this_title: "Our Story",
        is_visible: is_visible
      });
    });
  });

  app.get('/services', function(req, res){
    JM.isVisible(function(is_visible) {
      res.render('pages/services', {
        this_title: "Our Services",
        is_visible: is_visible
      });
    });
  });

  app.get('/contact', function(req, res){
    JM.isVisible(function(is_visible) {
      res.render('pages/contact', {
        this_title : "Contact Us",
        is_visible: is_visible
      });
    });
  });

  app.get('/sample-work', function(req, res) {
    JM.getJobs(function(err, jobs) {
      JM.isVisible(function(is_visible) {
        res.render('pages/sample-work', {
          this_title : "Sample Work",
          jobs: jobs,
          url: process.env.AWS_BASE_URL + 'jobs/',
          is_visible: is_visible
        });
      });
    });
  });

  app.get('/estimate', function(req, res){
    FM.getFormById(process.env.ESTIMATE_ID, function(err, form) {
      FM.getQuestions(form.id, function(err, questions) {
        JM.isVisible(function(is_visible) {
          res.render('pages/estimate', {
            this_title : "Estimates",
            description: form.description,
            questions: questions,
            post: false,
            errors: [],
            is_visible: is_visible
          });
        });
      });
    });
  });

  app.post('/estimate', function(req, res){
    var form = new formidable.IncomingForm();
    var fields = [];

    form.on('field', function(field, value) {
      fields.push([field, value]);
    })
      .on('error', function(err) {
        console.log(err);
      });
    form.parse(req);

    var responses = {};
    for (input in req.body) {
      var key = input.slice(8);
      responses[key] = req.body[input];
    }
    FM.getFormById(process.env.ESTIMATE_ID, function(err, form) {
      FM.getQuestions(form.id, function(err, questions) {
        JM.isVisible(function(is_visible) {
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
            res.render('pages/estimate', {
              this_title : "Estimates",
              description: form.description,
              questions: questions,
              post: false,
              errors: errors,
              is_visible: is_visible
            });
          } else {
            // TODO: Add responses to response table
            EM.dispatchGetEstimate(responses, questions, function(err, message) {
              console.log(err || message);
              FM.insertSubmission(process.env.ESTIMATE_ID, function(err, submission) {
                for (id in responses) {
                  var question;
                  for (i in questions) {
                    if (parseInt(id, 10) === parseInt(questions[i].id, 10)) {
                      question = questions[i];
                      break;
                    }
                  }
                  FM.insertResponse(responses[id], question.id, submission.id);
                }
                res.render('pages/estimate', {
                  this_title : "Estimates",
                  description: form.description,
                  questions: questions,
                  post: true,
                  errors: [],
                  is_visible: is_visible
                });
              });
            });
          }
        });
      });
    });
  });

  app.get('/form', function(req, res){
    FM.getFormById(req.query.formid, function(err, form) {
      FM.getQuestions(form.id, function(err, questions) {
        JM.isVisible(function(is_visible) {
          res.render('pages/estimate', {
            this_title: form.name,
            description: form.description,
            questions: questions,
            post: false,
            errors: [],
            is_visible: is_visible
          });
        });
      });
    });
  });

  app.post('/form', function(req, res){
    var form = new formidable.IncomingForm();
    var fields = [];

    form.on('field', function(field, value) {
      fields.push([field, value]);
    })
      .on('error', function(err) {
        console.log(err);
      });
    form.parse(req);

    var responses = {};
    for (input in req.body) {
      var key = input.slice(8);
      responses[key] = req.body[input];
    }
    FM.getFormById(req.query.formid, function(err, form) {
      FM.getQuestions(form.id, function(err, questions) {
        JM.isVisible(function(is_visible) {
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
            res.render('pages/estimate', {
              this_title : form.name,
              description: form.description,
              questions: questions,
              post: false,
              errors: errors,
              is_visible: is_visible
            });
          } else {
            FM.insertSubmission(req.query.formid, function(err, submission) {
              for (id in responses) {
                var question;
                for (i in questions) {
                  if (parseInt(id, 10) === parseInt(questions[i].id, 10)) {
                    question = questions[i];
                    break;
                  }
                }
                FM.insertResponse(responses[id], question.id, submission.id);
              }
              res.render('pages/estimate', {
                this_title : form.name,
                description: form.description,
                questions: questions,
                post: true,
                errors: [],
                is_visible: is_visible
              });
            });
          }
        });
      });
    });
  });
}
