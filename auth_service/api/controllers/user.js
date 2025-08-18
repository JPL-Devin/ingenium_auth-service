'use strict';

var url = require('url');

var User = require('./UserService');
/*
module.exports.delete_user = function delete_user (req, res, next) {
  User.delete_user(req.swagger.params, res, next);
};

module.exports.create_user = function create_user (req, res, next) {
  User.create_user(req.swagger.params, res, next);
}*/

module.exports.get_all_users = function get_all_users (req, res, next) {
  User.get_all_users(req.swagger.params, res, next);
};

module.exports.get_user = function get_user (req, res, next) {
  User.get_user(req.swagger.params, res, next);
};

module.exports.edit_user = function edit_user (req, res, next) {
	User.edit_user(req.swagger.params, res, next);
}
/*

module.exports.activate_user = function activate_user (req, res, next) {
	User.activate_user(req.swagger.params, res, next);
}

module.exports.deactivate_user = function deactivate_user(req, res, next) {
	User.deactivate_user(req.swagger.params, res, next);
}
*/

module.exports.get_user_permissions = function get_user_permissions (req, res, next) {
  User.get_user_permissions(req.swagger.params, res, next);
};

module.exports.get_user_roles = function get_user_roles (req, res, next) {
	User.get_user_roles(req.swagger.params, res, next);
}