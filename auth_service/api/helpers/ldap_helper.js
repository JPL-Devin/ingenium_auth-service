'use strict';
var util = require('util');
var ldap = require('ldapjs');
var app = require('./../../app.js');
var _ = require('lodash');
var models = require('../../server/models/index.js');
const dc = 'ou=personnel,dc=dir,dc=jpl,dc=nasa,dc=gov';
const node_funcs = require('../../node_funcs.js');
const env_config = require('../../env_config.js');

const log = node_funcs.log;
const ldap_url = env_config.ldap_url;

function create_client() {
    var client = ldap.createClient({
        url: ldap_url,
        reconnect: false
    });
    client.on('error', function(err) {
        log.warning('LDAP connection failed.', util.inspect(err));
    });
    return client;
}

// Helper to promisify ldap client.search for ldapjs v3
function searchPromise(client, base, opts) {
    return new Promise(function(resolve, reject) {
        client.search(base, opts, function(err, resobj) {
            if (err) {
                reject(err);
            } else {
                resolve(resobj);
            }
        });
    });
}
exports.validate_ldap_groups_exist = function (groupnames) {
    var client = create_client();
    return new Promise(function(resolve, reject) {
        if (groupnames.length == 0) {
            resolve([]);
        } else {
            var groups = groupnames.join(')(cn=');
            var opts = {
                filter: '(&(objectclass=jplgroup)(|(cn=' + groups + ')))',
                scope: 'sub'
            }

            searchPromise(client, dc, opts).then(function (resobj) {
                var entries = [];
                resobj.on('searchEntry', function (entry) {
                    var pojo = entry.pojo;
                    var cnAttr = pojo.attributes.find(function(a) { return a.type === 'cn'; });
                    if (cnAttr && cnAttr.values.length > 0) entries.push(_.toLower(cnAttr.values[0]));
                })
                resobj.on('end', function () {
                    resolve(entries);
                    client.destroy();
                })
                resobj.on('error', function (err) {
                    log.warning("Unable to successfully validate groups.", util.inspect(err));
                    reject();
                    client.destroy();
                })
            }).catch(function (err) {
                log.warning("Unable to successfully validate groups.", util.inspect(err));
                reject();
                client.destroy();
            })
        }
    })
}

exports.validate_ldap_group_exists = function (groupname) {
    var client = create_client();
    return new Promise(function(resolve, reject) {
        var opts = {
            filter: '(&(objectclass=jplgroup)(cn=' + groupname + '))',
            scope: 'sub'
        }
        searchPromise(client, dc, opts).then(function(resobj) {
            var entries = [];
            resobj.on('searchEntry', function(entry) {
                var pojo = entry.pojo;
                var cnAttr = pojo.attributes.find(function(a) { return a.type === 'cn'; });
                if (cnAttr && cnAttr.values.length > 0) entries.push(_.toLower(cnAttr.values[0]));
            })
            resobj.on('end', function() {
                if (_.includes(entries, groupname)) {
                    resolve(true);
                } else {
                    resolve(false);
                }
                client.destroy();
            })
            resobj.on('error', function(err) {
                log.warning("Unable to successfully validate group.", util.inspect(err));
                reject();
                client.destroy();
            })
        }).catch(function(err) {
            log.warning("Unable to successfully validate group.", util.inspect(err));
            reject();
            client.destroy();
        })
    })
}

exports.validate_users_exist = function (users) {
    var client = create_client();
    return new Promise(function(resolve, reject) {
        if (users.length == 0) {
            resolve([]);
        } else {
            var usernames = users.join(')(uid=');
            var opts = {
                filter: '(&(objectclass=person)(|(uid=' + usernames + ')))',
                scope: 'sub'
            }

            searchPromise(client, dc, opts).then(function (resobj) {
                var entries = [];
                resobj.on('searchEntry', function (entry) {
                    var pojo = entry.pojo;
                    var uidAttr = pojo.attributes.find(function(a) { return a.type === 'uid'; });
                    if (uidAttr && uidAttr.values.length > 0) entries.push(_.toLower(uidAttr.values[0]));
                })
                resobj.on('end', function () {
                    resolve(entries);
                    client.destroy();
                })
                resobj.on('error', function (err) {
                    log.warning("Error attempting to validate users.", util.inspect(err));
                    reject();
                    client.destroy();
                })
            }).catch(function (err) {
                log.warning("Problem with client search.", util.inspect(err));
                reject();
                client.destroy();
            })
        }
    })
}

exports.validate_user_exists = function (username) {
    var client = create_client();
    return new Promise(function(resolve, reject) {
        var opts = {
            filter: '(&(objectclass=person)(uid=' + username + '))',
            scope: 'sub'
        }
        searchPromise(client, dc, opts).then(function(resobj) {
            var entries = [];
            resobj.on('searchEntry', function(entry) {
                var pojo = entry.pojo;
                var uidAttr = pojo.attributes.find(function(a) { return a.type === 'uid'; });
                if (uidAttr && uidAttr.values.length > 0) entries.push(_.toLower(uidAttr.values[0]));
            })
            resobj.on('end', function() {
                if (_.includes(entries, username)) {
                    log.trace("Successfully validate user exists.");
                    resolve(true);
                } else {
                    log.trace("Successfully determined user doesn't exist.");
                    resolve(false);
                }
                client.destroy();
            })
            resobj.on('error', function (err) {
                log.warning("Error in trying to determine if user exists.", util.inspect(err));
                reject();
                client.destroy();
            })
        }).catch(function(err) {
            log.warning("Error in trying to execute the client search.", util.inspect(err));
            reject();
            client.destroy();
        })
    })
}

    // queries LDAP with existing groups in system, and returns ones belonging to user
exports.getGroupsForUser = function (username) {
    var client = create_client();
    return new Promise(function(resolve, reject) {
        //get all existing groups
        models.Group.findAll({ 
            attributes: ['name']
        }).then(function(groups) {
            //only proceed if there are groups in the ingenium system
            if (groups.length > 0) {
                var groupnames = _.map(groups, function(group) {
                    return group.name;
                });
                var groupstring = groupnames.join(')(cn=');
                var userdn = "uid=" + username + "," + dc;
                var opts = {
                    filter: '(&(objectclass=jplgroup)(uniqueMember=' + userdn + ')(|(cn=' + groupstring + ')))',
                    scope: 'sub'
                }

                searchPromise(client, dc, opts).then(function(resobj) {
                    var entries = [];
                    resobj.on('searchEntry', function (entry) {
                        var pojo = entry.pojo;
                        var attrs = {};
                        pojo.attributes.forEach(function(a) { attrs[a.type] = a.values; });
                        entries.push(attrs);
                    });
                    resobj.on('end', function (result) {
                        var groupsArr = [];
                        _.forEach(entries, function (entry) {
                            if (entry.uniqueMember) {
                                var name = entry.cn ? entry.cn[0] : null;
                                if (name) groupsArr.push(_.toLower(name));
                            }
                        })
                        resolve(groupsArr);
                        client.destroy();
                    })
                    resobj.on('error', function (err) {
                        log.warning("Error in attempting to retrieve groups for a user.", util.inspect(err));
                        reject();
                        client.destroy();
                    })
                }).catch(function(err) {
                    log.warning("Attempting to run the client search, but was unsuccessful.", util.inspect(err));
                    reject();
                    client.destroy();
                })
            } else {
                log.warning("The user does not belong to any groups in auth service.");
                resolve([]);
                client.destroy();
            }
        }).catch(function(err) {
            log.warning("Error in attempting to retrieve groups for a user. Groups.findAll", util.inspect(err));
            reject();
            client.destroy();
        })
    })
}

exports.get_user_info = function (username) {
    var client = create_client();
    return new Promise(function(resolve, reject) {
        var opts = {
            filter: '(&(objectclass=person)(uid=' + username + '))',
            scope: 'sub'
        }
        searchPromise(client, dc, opts).then(function(resobj) {
            var entries = [];
            resobj.on('searchEntry', function(entry) {
                var pojo = entry.pojo;
                var attrs = {};
                pojo.attributes.forEach(function(a) { attrs[a.type] = a.values; });
                entries.push({"username": attrs.uid ? attrs.uid[0] : null, "displayName": attrs.displayName ? attrs.displayName[0] : null});
            });
            resobj.on('end', function() {
                resolve(entries);
                client.destroy();
            });
            resobj.on('error', function (err) {
                log.warning("Error attempting to search for users.", util.inspect(err));
                reject();
                client.destroy();
            })
        }).catch(function(err) {
            log.warning("Error searching for user.", util.inspect(err));
            reject();
            client.destroy();
        })
    })
}

exports.search_users = function (user_string) {
    var client = create_client();
    return new Promise(function(resolve, reject) {
        var opts = {
            filter: '(&(objectclass=person)(uid=' + user_string + '*))',
            scope: 'sub'
        }
        searchPromise(client, dc, opts).then(function(resobj) {
            var entries = [];
            resobj.on('searchEntry', function(entry) {
                var pojo = entry.pojo;
                var attrs = {};
                pojo.attributes.forEach(function(a) { attrs[a.type] = a.values; });
                entries.push({"username": attrs.uid ? attrs.uid[0] : null, "displayName": attrs.displayName ? attrs.displayName[0] : null});
            });
            resobj.on('end', function() {
                resolve(entries);
                client.destroy();
            });
            resobj.on('error', function (err) {
                log.warning("Error attempting to search for users.", util.inspect(err));
                reject();
                client.destroy();
            })
        }).catch(function(err) {
            log.warning("Error searching for users.", util.inspect(err));
            reject();
            client.destroy();
        })
    })
}

exports.search_groups = function (group_string) {
    var client = create_client();
    return new Promise(function(resolve, reject) {

        var opts = {
            filter: '(&(objectclass=jplgroup)(cn=' + group_string + '*))',
            scope: 'sub'
        }
        searchPromise(client, dc, opts).then(function(resobj) {
                var entries = [];
                resobj.on('searchEntry', function (entry) {
                    var pojo = entry.pojo;
                    var cnAttr = pojo.attributes.find(function(a) { return a.type === 'cn'; });
                    if (cnAttr && cnAttr.values.length > 0) entries.push(cnAttr.values[0]);
                })
                resobj.on('end', function () {
                    resolve(entries);
                    client.destroy();
                })
                resobj.on('error', function(err) {
                    log.warning("Error attempting to search for groups.", util.inspect(err));
                    reject();
                    client.destroy();
                })

        }).catch(function(err) {
            log.warning("Error attempting to search for groups.", util.inspect(err));
            reject();
            client.destroy();
        })
    })
}


