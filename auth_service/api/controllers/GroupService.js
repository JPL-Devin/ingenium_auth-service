'use strict';
var util = require('util');
var models = require('../../server/models/index.js');
var _ = require('lodash');
const node_funcs = require('../../node_funcs.js');
const RoleService = require('./RoleService.js');
const { Op } = require('sequelize');
const log = node_funcs.log;

exports.get_all_groups = function(args, res, next) {
  // create query paramaters based on request parameters
  let total_count = 0;
  var queryParams = {
      attributes: ["id", "name", "createdAt", "updatedAt"]
    }
  if (!_.isUndefined(args.limit.value)) {
    queryParams.limit = args.limit.value;
  }
  if (!_.isUndefined(args.q.value)) {
    queryParams.where = {
      name: {
        [Op.like]: (args.q.value) + '%'
      }
    }
  }
  if (!_.isUndefined(args.offset.value)) {
    queryParams.offset = args.offset.value;
  }
  if (args.order.value === 'DESC') {
    queryParams.order = [['name', 'DESC']];
  } else if (args.order.value === 'ASC') {
    queryParams.order = [['name', 'ASC']];
  }

  // V2 Updates 

  var avoid = false;

  // TODO Specify the below in the swagger spec

  if (!_.isUndefined(args.rolefilter.value)) {
    avoid = true;
    log.trace("ROLEFILTER query parameter specified.");
    
    //search for roles equal to query
    models.Role.findAndCountAll({
      where: {
        name: { [Op.like]: args.rolefilter.value+'%' }
      }
    })
    .then(function(roles) {
      return Promise.all(roles.rows.map(function(role) {
        return role.getGroups();
      }));
    }).then(function(groupLists) {
      var groups = _.flatten(groupLists);
      groups = _.uniqBy(groups, 'id');

      total_count = groups.length;

      // order by
      if(args.order.value === 'DESC'){
        groups = _.orderBy(groups, ['name'], ['desc']);
      }else{
        groups = _.orderBy(groups, ['name'], ['asc']);
      }

      //offset
      if (!_.isUndefined(args.offset.value)) {
        groups = _.drop(groups, args.offset.value);
      }

      // limit
      if (!_.isUndefined(args.limit.value)) {
        groups = _.take(groups, args.limit.value);
      }

      return Promise.all(groups.map(function(group){
        return RoleService.get_scopes_and_roles(group);
      }))
    })
    .then(function(groups){
      res.status(200).json({"total": total_count, "results": groups});
    });
  }

  if (!_.isUndefined(args.userfilter.value)) {
    avoid = true;
    log.trace("Userfilter Selected.");
    
    //search for roles equal to query
    models.User.findAndCountAll({
      where: {
        username: { [Op.like]: args.userfilter.value+'%' }
      }
    })
    .then(function(users) {
      return Promise.all(users.rows.map(function(user) {
        return user.getGroups();
      }));
    }).then(function(groupLists) {
      var groups = _.flatten(groupLists);
      groups = _.uniqBy(groups, 'id');

      total_count = groups.length;

      // order by
      if(args.order.value === 'DESC'){
        groups = _.orderBy(groups, ['name'], ['desc']);
      }else{
        groups = _.orderBy(groups, ['name'], ['asc']);
      }

      //offset
      if (!_.isUndefined(args.offset.value)) {
        groups = _.drop(groups, args.offset.value);
      }

      // limit
      if (!_.isUndefined(args.limit.value)) {
        groups = _.take(groups, args.limit.value);
      }

      return Promise.all(groups.map(function(group){
        return RoleService.get_scopes_and_roles(group);
      }))
    }).then(function(groups){
      res.status(200).json({"total": total_count, "results": groups});
    });
  }

  if (!_.isUndefined(args.scopefilter.value)) {
    avoid = true;
    log.trace("Scopefilter Selected.");
    
    //search for roles equal to query
    models.Permission.findAndCountAll({
      where: {
        name: { [Op.like]: args.scopefilter.value+'%' }
      }
    })
    .then(function(permissions) {
      return Promise.all(permissions.rows.map(function(permission) {
        return permission.getRoles();
      }));
    })
    .then(function(rolesLists) {
      //given roles, now remove duplicate roles
      var roles = _.flatten(rolesLists);
      roles = _.uniqBy(roles, 'id');

      return Promise.all(roles.map(function(role) {
        return role.getGroups();
      }));
    })
    .then(function(groupsList){
      var groups = _.flatten(groupsList);
      groups = _.uniqBy(groups, 'id');

      total_count = groups.length;

      // order by
      if(args.order.value === 'DESC'){
        groups = _.orderBy(groups, ['name'], ['desc']);
      }else{
        groups = _.orderBy(groups, ['name'], ['asc']);
      }

      //offset
      if (!_.isUndefined(args.offset.value)) {
        groups = _.drop(groups, args.offset.value);
      }

      // limit
      if (!_.isUndefined(args.limit.value)) {
        groups = _.take(groups, args.limit.value);
      }

      return Promise.all(groups.map(function(group){
        return RoleService.get_scopes_and_roles(group);
      }))
    })
    .then(function(groups){
      res.status(200).json({"total": groups.length, "results": groups});
    });
  }

  if(!avoid){
    models.Group.findAndCountAll(queryParams)
    .then(function(groups){
      if(groups.count > 0){
        total_count = groups.count;
        return Promise.all(groups.rows.map(function(group){
          return RoleService.get_scopes_and_roles(group);
        }));
      }else{
        let msg = "Group was not found";
        log.warning(msg);
        res.status(404).json({message: msg});
      }
    })
    .then(function(groups) {
      res.status(200).json({"total": total_count, "results": groups});
    }).catch(function(err) {
      let msg = "get_all_groups coldn't get all the groups";
      log.critical(msg, util.inspect(err));
      res.status(404).json({message: msg});
    });
  }
}

exports.get_group = function(args, res, next) {
  models.Group.findByPk(args.group_id.value)
  .then(function(group) {
    if (group) {
      RoleService.get_scopes_and_roles(group)
      .then(function(group){
          res.status(200).json(group);
      }).catch(function(err) {
        let msg = "get_group couldn't get the group";
        log.error(msg, util.inspect(err));
        res.status(400).json({message: msg});
      });
    } else {
      res.status(404).json({message: `Not found with ID: ${args.group_id.value}`});
    }
  });
}

exports.delete_group = function(args, res, next) {
    models.Group.findByPk(args.id.value)
    .then(function(group) {
      if (group) {
        group.destroy()
        .then(function() {
          res.status(200).json();
        }).catch(function(err){
          let msg = `delete_group couldn't delete the group with ID: ${args.id.value}`;
          log.error(msg, util.inspect(err));
          res.status(400).json({message: msg});
        });
      } else {
        let msg = `Not found with ID: ${args.id.value}`;
        log.info(msg);
        res.status(404).json({message: msg});
      }
    })
}
