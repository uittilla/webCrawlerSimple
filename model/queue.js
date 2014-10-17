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
    __proto__: event.prototype,
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
        console.log("Cannot reserve with timeout", id, err);
    });;
}

/**
 * Delete job
 * @param id
 */
Queue.prototype.deleteJob = function(id) {
    var self = this;

    client.deleteJob(id).onSuccess(function(del_msg) {
       //console.log('deleted', id);
       // console.log('message', del_msg);
        self.emit('jobDeleted', id, del_msg);
    }).onError(function(err){
        console.log("Cannot delete", id);
    });
}

Queue.prototype.statsTube = function(tube) {
    client.stats_tube(tube).onSuccess(function (data) {
        console.log(data);
        self.emit('statsTube', data);
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