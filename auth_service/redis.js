var util = require('util');
var redis = require('redis');
const node_funcs = require('./node_funcs.js');
const log = node_funcs.log;

var client = redis.createClient({
    socket: {
        host: "auth_service_redis",
        port: 6379
    }
});

client.on('connect', function() {
    log.info("Connected to REDIS");
});

client.on("error", function (err) {
    log.error("Couldn't connect to REDIS ", util.inspect(err));
});

// Redis v4 requires explicit connect
client.connect().catch(function(err) {
    log.error("Failed to connect to REDIS", util.inspect(err));
});

module.exports.redisClient = client;
