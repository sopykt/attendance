var async = require('async');
var models = require('../lib/models');

exports.list = function(req, res, next) {
  async.waterfall([
                  function(cb) {
    models.Org.find().sort('name', 1).exec(cb);
  },
  ], function(err, orgs) {
    if (err) {
      return next(err);
    }
    res.render('orgs', {
      title: 'All Organizations',
      orgs: orgs,
    });
  });
};

exports.details = function(req, res, next) {
  async.waterfall([
                  function(cb) {
    models.Org.findOne({slug: req.params.slug}, cb);
  },
  function(org, cb){
    models.Event.find({org:org._id})
      .sort('start_time', -1).limit(10).exec(function(err, events){
      cb(err, org, events);
    });
  }
  ], function(err, org, events) {
    if (err) {
      return next(err);
    }
    if (!org) {
      return res.send(404);
    }
    res.render('org', {
      org: org,
      events: events
    });
  });
};

exports.post = function(req, res, next) {
  async.waterfall([
                  function(cb) {
    if (!req.user.is_admin) {
      return res.send(403);
    }
    cb();
  },
  function(cb) {
    var org = new models.Org({
      name: req.body.name,
      description: req.body.description,
      slug: req.body.slug,
    });
    org.save(cb);
  },
  ], function(err) {
    if (err) {
      return next(err);
    }
    req.flash('success', 'Org created: %s', req.body.name);
    res.redirect('/orgs/' + req.body.slug);
  });
};

exports.put = function(req, res, next) {
  models.Org.findOne({slug: req.params.slug}, function(err, org) {
    if (err) {
      return next(err);
    }
    if (org == null) {
      return res.send(404);
    }
    if (!req.user || (org.admins.indexOf(req.user.id) < 0
                      && !req.user.is_admin)) {
                        return res.send(403);
                      }
                      org.name = req.body.name;
                      org.description = req.body.description;
                      org.slug = req.body.slug;
                      org.save();
                      res.redirect('/orgs/' + org.slug);
  });
};

exports.delete = function(req, res, next) {
  async.waterfall([
                  function(cb) {
    models.Org.findOne({slug: req.params.slug}, cb);
  },
  function(org, cb) {
    if (req.user.is_admin || org.admins.indexOf(req.user.id) >= 0) {
      return cb(null, org);
    }
    return res.send(403);
  },
  function(org, cb) {
    models.Event.remove({org: org.id}, function(err) {
      cb(err, org);
    });
  },
  function(org, cb) {
    models.Org.remove({_id: org.id}, function(err) {
      cb(err, org);
    });
  },
  ], function(err, org) {
    if (err) {
      return next(err);
    }
    req.flash('success', 'Org deleted: %s', org.name);
    res.redirect('/orgs/');
  });
};

exports.create = function(req, res, next) {
  res.render('create-org', {
    update: false,
    org: {},
  });
};

exports.edit = function(req, res, next) {
  models.Org.findOne({slug: req.params.slug}, function(err, org) {
    if (err) {
      return next(err);
    }
    if (org == null) {
      return res.send(404);
    }
    res.render('create-org', {
      update: true,
      org: org,
    });
  });
};
