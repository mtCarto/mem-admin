'use strict';
// =========================================================================
//
// this is intended to be a sort of base class for all crud services in the
// client, just to avoid retyping everything over and over again
//
// =========================================================================
angular.module('core').factory ('ModelBase', ['$http', '_', function ($http, _) {
  var ModelBase = function (o) {
    this.model = null; // the current loaded model
    this.collection = null; // the current loaded collection
    this.modelIsNew = true;
    this._init (o);
  };
  _.extend (ModelBase.prototype, {
    //
    // this must be extended, it is used to build the service URLs
    //
    urlName : 'somemodel',
    // -------------------------------------------------------------------------
    //
    // initialize the object, set some instance vars
    //
    // -------------------------------------------------------------------------
    _init : function () {
      this.urlall = '/api/'+this.urlName;
      this.urlbase = '/api/'+this.urlName+'/';
      this.urlnew = '/api/new/'+this.urlName;
      this.urlquery = '/api/query/'+this.urlName;
      _.bindAll (this);
    },
    // -------------------------------------------------------------------------
    //
    // gets the listing of all whatever things this is and sets the local
    // collection to that. The collection can then be pivoted on or somehow
    // else manipulated for display purposes. also returns the listing through
    // the promise resolution.
    //
    // -------------------------------------------------------------------------
    getCollection: function () {
      var self = this;
      return new Promise (function (resolve, reject) {
        self.all ().then (function (res) {
          self.collection = res;
          resolve (res);
        }).catch (reject);
      });
    },
    // -------------------------------------------------------------------------
    //
    // load a model from the server, set the local and resolve it
    //
    // -------------------------------------------------------------------------
    getModel: function (id) {
      var self = this;
      return new Promise (function (resolve, reject) {
        self.getId (id).then (function (res) {
          self.model = res;
          self.modelIsNew = false;
          resolve (res);
        }).catch (reject);
      });
    },
    // -------------------------------------------------------------------------
    //
    // load a query result from the server, set the local and resolve it
    //
    // -------------------------------------------------------------------------
    getQuery: function (q, fields) {
      var self = this;
      return new Promise (function (resolve, reject) {
        self.query (q, fields).then (function (res) {
          self.collection = res;
          resolve (res);
        }).catch (reject);
      });
    },
    // -------------------------------------------------------------------------
    //
    // get a new empty model
    //
    // -------------------------------------------------------------------------
    getNew: function () {
      var self = this;
      return new Promise (function (resolve, reject) {
        self.new ().then (function (res) {
          self.model = res;
          self.modelIsNew = true;
          resolve (res);
        }).catch (reject);
      });
    },
    // -------------------------------------------------------------------------
    //
    // get a copy of the current model, or the one passed in
    //
    // -------------------------------------------------------------------------
    getCopy: function (m) {
      if (m) {return _.cloneDeep (m);}
      else {return _.cloneDeep (this.model);}
    },
    // -------------------------------------------------------------------------
    //
    // set the current model
    //
    // -------------------------------------------------------------------------
    setModel: function (obj) {
      this.modelIsNew = false;
      this.model = obj;
    },
    // -------------------------------------------------------------------------
    //
    // short hand for saving a copy
    //
    // -------------------------------------------------------------------------
    saveCopy: function (obj) {
      this.model = obj;
      return this.saveModel ();
    },
    // -------------------------------------------------------------------------
    //
    // Save the current model, or, if one is passed in, set that one to
    // current and save it
    //
    // -------------------------------------------------------------------------
    saveModel: function (m) {
      if (m) {this.setModel (m);}
      var self = this;
      return new Promise (function (resolve, reject) {
        var p = (self.modelIsNew) ? self.add (self.model) : self.save (self.model);
        p.then (function (res) {
          self.model = res;
          self.modelIsNew = false;
          resolve (res);
        }).catch (reject);
      });
    },
    // -------------------------------------------------------------------------
    //
    // pivot the collection on some field. return an object with keys that are
    // the unique values of the field and values that are arrays of the models
    // that have that field value
    //
    // -------------------------------------------------------------------------
    pivot: function (field) {
      this.pivot = {};
      this.pivotField = field || null;
      if (!this.pivotField) {return null;}
      var value;
      _.each (this.collection, function (model) {
        value = model[field];
        if (_.isNil (value)) {value = '_empty_';}
        if (!this.pivot[value]) {this.pivot[value] = [];}
        this.pivot[value].push (model);
      });
      return this.pivot;
    },
    // -------------------------------------------------------------------------
    //
    // a bunch of crud stuff
    //
    // -------------------------------------------------------------------------
    new : function () {
      return this.get (this.urlnew);
    },
    all : function () {
      return this.get (this.urlall);
    },
    deleteId : function (id) {
      return this.delete (this.urlbase+id);
    },
    getId : function (id) {
      return this.get (this.urlbase+id);
    },
    save : function (obj) {
      return this.put (this.urlbase+obj._id, obj);
    },
    add : function (obj) {
      return this.post (this.urlall, obj);
    },
    // -------------------------------------------------------------------------
    //
    // Returns a list of models matching the criteria sent in the query
    // @param q - the query to execute; e.g. { name: 'foo' }
    // @param fields - which fields to include or exclude in the response (also known as the query "projection")
    //
    // A projection must be either inclusive or exclusive. You must either list the fields to include
    // (which excludes all others), or list the fields to exclude (which implies all other fields are included).
    //
    // -------------------------------------------------------------------------
    query : function (q, fields) {
      var obj = { q: q, fields: fields };
      return this.put (this.urlquery, obj);
    },
    // -------------------------------------------------------------------------
    //
    // basic
    //
    // -------------------------------------------------------------------------
    put : function (url, data) {
      return this.talk ('PUT', url, data, null);
    },
    post : function (url, data) {
      return this.talk ('POST', url, data, null);
    },
    get : function (url, headers) {
      return this.talk ('GET', url, null, headers);
    },
    delete : function (url) {
      return this.talk ('DELETE', url, null, null);
    },
    talk : function (method, url, data, headers) {
      return new Promise (function (resolve, reject) {
        $http ({method:method, url:url, data:data, headers: headers })
          .then (function (res) {
            resolve (res.data);
          }).catch (function (res) {
            reject (res.data);
          });
      });
    }
  });
  ModelBase.extend = function (protoProps, staticProps) {
    var parent = this; var child;
    if (protoProps && _.has(protoProps, 'constructor')) {child = protoProps.constructor;}
    else {child = function(){ return parent.apply(this, arguments); }; }
    _.extend(child, parent, staticProps);
    var Surrogate = function(){ this.constructor = child; };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate ();
    if (protoProps) {_.extend(child.prototype, protoProps);}
    child.__super__ = parent.prototype;
    return child;
  };
  return ModelBase;
}]);
