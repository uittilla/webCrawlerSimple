"use strict";

/*
 * Author:   Ibbo (mark.ibbotson)
 * Purpose:  main
 *
 * Crawler handler
 * Keeps the crawler running until no more jobs
 */

var Crawler = require('./model/crawler');
var Queue = require('./model/queue');
var fileSys = require('./model/storage');

var jobQueue = new Queue("default");
var fileWrite = new fileSys("./results/results.txt");

/**
 * Listens for signals from the crawler
 *
 * @param crawler
 */
function listen(crawler) {
    var target;

    crawler.on("error", function (error) {
        console.error("Error", error);
    });

    crawler.on('stop', function (err, id, res, host) {
        if (!err) {

            console.log("Job complete %d Matched %d, Max matches %d", id, res[host].matched, res[host].maxMatches);

            fileWrite.writeFile(res, function (err, res) {
                if (!err) jobQueue.deleteJob(id, crawler);
                else console.log("write issues", err);
            });
        }
    });
}

/**
 * Polls the queue and maintains upto 10 running jobs
 */
function stats() {
    jobQueue.statsTube(function (data) {
        var jobs = 10;
        if (data['current-jobs-reserved'] === 0) {

            console.log("Jobs remaining ", data['current-jobs-ready'] - data['current-jobs-reserved']);

            if (data['current-jobs-reserved'] - data['current-jobs-ready'] === 0) {
                console.log("no more jobs");
                process.nextTick(function () { process.exit(); });

            } else {
                if (data['current-jobs-ready'] > 10) {
                    jobs=10;
                    while (jobs--) {
                        jobQueue.getJob();
                    }

                } else if (data['current-jobs-ready'] < 10 && data['current-jobs-ready'] > 5) {
                    jobs = 5;
                    while (jobs--) {
                        jobQueue.getJob();
                    }

                } else {
                    jobQueue.getJob();
                }
            }
        }
    });
}

/**
 * Queue ready
 */
jobQueue.on('jobReady', function job(job) {
    var data = JSON.parse(job.data);
    listen(new Crawler(job.id, data.link, data.targets));
});

/**
 * Job removed
 */
jobQueue.on('jobDeleted', function (id, msg, crawler) {
    console.log("Deleted", id, msg);
    crawler = null;
    stats();
});

stats();
