'use strict';
// =========================================================================
//
// Controller for Activity
//
// =========================================================================
var path = require('path');
var DBModel = require (path.resolve('./modules/core/server/controllers/core.dbmodel.controller'));
var ActivityBaseClass = require ('./activitybase.controller');


module.exports = DBModel.extend ({
  name : 'Activity',
  plural: 'activities',
  bind: ['start','complete','copyActivityBase','setInitalDates'],
  // -------------------------------------------------------------------------
  //
  // just get a base activity, returns a promise
  //
  // -------------------------------------------------------------------------
  getActivityBase: function (code) {
    return (new ActivityBaseClass (this.opts)).findOne ({code:code});
  },
  // -------------------------------------------------------------------------
  //
  // copy a base activity into a new activity and return the promise of it
  //
  // -------------------------------------------------------------------------
  copyActivityBase: function (base) {
    return this.copy (base);
  },
  // -------------------------------------------------------------------------
  //
  // set dateStartedEst from duration, return activity
  //
  // -------------------------------------------------------------------------
  setInitalDates: function (activity) {
    activity.dateStartedEst = new Date ();
    activity.dateCompletedEst = new Date ();
    activity.dateCompletedEst.setDate (activity.dateCompletedEst.getDate () + activity.duration);
    if (activity.startOnCreate) {
      activity.status = 'In Progress';
      activity.dateStarted = new Date ();
    }
    return activity;
  },
  // -------------------------------------------------------------------------
  //
  // copy milestone ancestry into activity and return activity
  //
  // -------------------------------------------------------------------------
  setAncestry: function (activity, milestone) {
    activity.milestone = milestone._id;
    activity.phase = milestone.phase;
    activity.phaseName = milestone.phaseName;
    activity.phaseCode = milestone.phaseCode;
    activity.project = milestone.project;
    activity.projectCode = milestone.projectCode;
    activity.stream = milestone.stream;
    activity.order = milestone.activities.length + 1;
    return activity;
  },
  // -------------------------------------------------------------------------
  //
  // build a permission set from the default eao and proponent roles for the
  // project indicated by the projectCode copied earlier from the milestone
  // return the promise from the role machine (this also saves the activity
  // and resolves to the list of activities passed in, all saved)
  //
  // -------------------------------------------------------------------------
  setDefaultRoles: function (activity/* , base */) {
    return activity;
  },
  // -------------------------------------------------------------------------
  //
  // start an activity
  //
  // -------------------------------------------------------------------------
  start: function (activity) {
    activity.status = 'In Progress';
    activity.dateStarted = new Date ();
    activity.dateCompletedEst = new Date ();
    activity.dateCompletedEst.setDate (activity.dateCompletedEst.getDate () + activity.duration);
    return this.findAndUpdate (activity);
  },
  // -------------------------------------------------------------------------
  //
  // complete an activity
  //
  // -------------------------------------------------------------------------
  complete: function (activity) {
    activity.status = 'Complete';
    activity.completed = true;
    activity.completedBy = this.user._id;
    activity.dateCompleted = new Date ();
    return this.findAndUpdate (activity);
  },
  // -------------------------------------------------------------------------
  //
  // override an activity
  //
  // -------------------------------------------------------------------------
  override: function (activity, reason) {
    activity.status = 'Not Required';
    activity.overrideReason = reason;
    activity.overridden = true;
    activity.completed = true;
    activity.completedBy = this.user._id;
    activity.dateCompleted = new Date ();
    return this.findAndUpdate (activity);
  },
  // -------------------------------------------------------------------------
  //
  // Using the functions above, make a new activity from a base code and
  // attach it to the passed in milestone and the milestone ancestry
  // if data is present, then attach that as well
  //
  // -------------------------------------------------------------------------
  fromBase: function (code, milestone, data) {
    var self = this;
    var base;
    var baseId;
    var activity;
    //
    // allow anyone to make a new activity, this is needed as they
    // get created for all sorts of things automatically and it would
    // be a nightmare trying to limit both creation and usage
    //
    this.setForce (true);
    return new Promise (function (resolve, reject) {
      //
      // get the base
      //
      self.getActivityBase (code)
      //
      // copy its id and such before we lose it, then copy the entire thing
      //
        .then (function (m) {
          base = m;
          baseId = m._id;
          return self.copyActivityBase (base);
        })
      //
      // set the base id and then initial dates
      //
        .then (function (m) {
          activity = m;
          activity.activityBase = baseId;
          return self.setInitalDates (activity);
        })
      //
      // copy over stuff from the milestone
      //
        .then (function (m) {
          if (m) {
            return self.setAncestry (m, milestone);
          } else {
            return null;
          }
        })
      //
      // set up all the default roles, creates them if need be
      //
        .then (function (m) {
          activity.data = data ? data : {};
          activity.data.projectid = activity.projectCode;
          return self.setDefaultRoles (m, base);
        })
      //
      // the model was saved during the roles step so we just
      // have to resolve it here
      //
        .then (function (model) {
          if (milestone) {
            milestone.activities.push (model._id);
            milestone.save ();
          }
          return (model);
        })
        .then (resolve, reject);
    });
  },
  // -------------------------------------------------------------------------
  //
  // get activities for a given context of access and project
  //
  // -------------------------------------------------------------------------
  userActivities: function (projectCode, access) {
    var self = this;
    return new Promise (function (resolve, reject) {
      var q = (projectCode) ? {projectCode:projectCode} : {};
      var p = (access === 'write') ? self.listwrite (q) : self.list (q);
      p.then (resolve, reject);
    });
  },
  // -------------------------------------------------------------------------
  //
  // activities for a milestone
  //
  // -------------------------------------------------------------------------
  activitiesForMilestone: function (id) {
    var p = this.list ({milestone:id});
    return new Promise (function (resolve, reject) {
      p.then (resolve, reject);
    });
  }
});
