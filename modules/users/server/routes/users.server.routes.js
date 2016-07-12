'use strict';

// User Routes
var users   = require('../controllers/users.server.controller');
var routes = require ('../../../core/server/controllers/cc.routes.controller');
var policy = require ('../../../core/server/controllers/cc.policy.controller');

module.exports = function (app) {

	// Setting up the users profile api
	app.route('/api/users/me').get(users.me);
	app.route('/api/users').put(users.update);
	app.route('/api/users/accounts').delete(users.removeOAuthProvider);
	app.route('/api/users/password').post(users.changePassword);
	app.route('/api/users/picture').post(users.changeProfilePicture);

	app.route('/api/user/alert').get(function(req,res){res.json([]);});

	// Import logic
	app.route ('/api/users/import').all (policy ('admin'))
	.post (function (req, res) {
		var file = req.files.file;
		if (file) {
			// console.log("Received users import file:",file);
			routes.setSessionContext(req)
			.then( function (opts) {
				return users.loadUsers(file, req, res, opts);
			}).then (routes.success(res), routes.failure(res));
		}
	});
	// Import logic
	app.route ('/api/groupusers/import').all (policy ('admin'))
		.post (function (req, res) {
			var file = req.files.file;
			if (file) {
				// console.log("Received contact import file:",file);
				users.loadGroupUsers(file, req, res)
						 .then (routes.success(res), routes.failure(res));
			}
		});
	// Finish by binding the user middleware
	app.param('userId', users.userByID);
};
