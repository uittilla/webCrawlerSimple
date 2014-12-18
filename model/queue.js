"use strict";

/**
 * @Purpose: Wrap Beanstalk in emmiters
 * @Author: Mark Ibbotson (Ibbo) <mark.ibbotson>
 * @type {*}
 */

var beanstalk = require('nodestalker'),
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
    this.tube   = tube;
    this.client = beanstalk.Client();
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
    this.client.watch(this.tube).onSuccess(function(data) {
        self.reserveJob();
    });
}

/**
 * Call watch
 */
Queue.prototype.watch = function(cb) {
    var self = this;
    this.client = beanstalk.Client();
    this.client.watch(this.tube).onSuccess(function(data) {
        cb(data);
    });
}

/**
 * Call reserve
 */
Queue.prototype.reserveJob = function() {
    var self = this;

    this.client.reserveWithTimeout(120).onSuccess(function(job) {
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
    this.client.deleteJob(id).onSuccess(function(del_msg) {
        self.emit('jobDeleted', id, del_msg, crawler);
    }).onError(function(err){
        console.log("Cannot delete", id, err);
    });
}

Queue.prototype.statsTube = function(cb) {
    var self = this;
    this.client.stats_tube(this.tube).onSuccess(function (data) {
        cb(data);
    });
}

/**
 * Kill the connection
 */
Queue.prototype.disconnect = function() {
    this.client.disconnect();
}

module.exports = Queue;
