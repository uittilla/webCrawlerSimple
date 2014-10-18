"use strict";

/**
 * @Purpose: Wrap Beanstalk in emmiters
 * @Author: Mark Ibbotson (Ibbo) <mark.ibbotson>
 * @type {*}
 */

var beanstalk = require('nodestalker'),
    client    = beanstalk.Client(),
    event     = require('events').EventEmitter,
    utils     = require('util');

/**
 *
 * @type {
 *  {
 *    __proto__: *,
 *    tube: null,
 *    init:, getJob:, watchTube:, reserveJob:, deleteJob:, disconnect: Function
 *    }
 *  }
 */
var Queue = function (tube) {
    this.tube  = tube;
}

utils.inherits(Queue, event);

/**
 * Entry point
 */
Queue.prototype.getJob = function() {
    this.watchTube();
}

/**
 * Call watch
 */
Queue.prototype.watchTube = function() {
    var self = this;

    client.watch(this.tube).onSuccess(function(data) {
        self.reserveJob();
    });
}

/**
 * Call reserve
 */
Queue.prototype.reserveJob = function() {
    var self = this;

    client.reserveWithTimeout(120).onSuccess(function(job) {
        //console.log(job);
        self.emit('jobReady', job);
    }).onError(function(err){
        console.log("Cannot reserve with timeout", err);
    });
}

/**
 * Delete job
 * @param id
 */
Queue.prototype.deleteJob = function(id, crawler) {
    var self = this;

    console.log("delete request for %d", id);
    client.watch(this.tube).onSuccess(function(data) {
        client.deleteJob(id).onSuccess(function(del_msg) {
            console.log('deleted', id);
            console.log('message', del_msg);
            self.emit('jobDeleted', id, del_msg, crawler);
        }).onError(function(err){
            console.log("Cannot delete", id);
        });
    });    
}

Queue.prototype.statsTube = function(tube, cb) {
    var self = this;
    client.stats_tube(tube).onSuccess(function (data) {
        console.log(data);
        cb(data);
        //client.disconnect();
    });
}

/**
 * Kill the connection
 */
Queue.prototype.disconnect = function() {
    client.disconnect();
}

module.exports = Queue;
