"use strict";

var Crawler  = require('./model/crawler');
var Queue    = require('./model/queue');
var jobQueue = new Queue("default");

var numJobs  = 1;
var job, jobs={};

function listen(crawler) {
    var target;
    
    crawler.on("error", function(error) {
        console.error("Error", error);
    });

    crawler.on('stop', function(err, id, res, matched, maxMatches) {
        if(!err) {
           // Result Synopsis
            console.log("Job complete %d Matched %d, Max matches %d", id, matched, maxMatches);
           // All results
           // console.log(JSON.stringify(res));
            jobQueue.deleteJob(id, crawler);
        }
    });
}

function stats() {
    jobQueue.statsTube(function(data) {
        if(data['current-jobs-reserved'] === 0 ) {
            console.log("Jobs remaining ", data['current-jobs-ready'] - data['current-jobs-reserved']);
            if (data['current-jobs-reserved'] - data['current-jobs-ready'] === 0) {
                console.log("no more jobs");
            } else {
                if(data['current-jobs-ready'] > 10) {
                    var jobs = 10;
                    while(jobs--) {
                        jobQueue.getJob();
                    }
                } else {
                    jobQueue.getJob();
                }
            }
        }
    });
}

jobQueue.on('jobReady', function job(_job) {
    var data = JSON.parse(_job.data);
    listen(new Crawler(_job.id, data.link, data.targets));
});

jobQueue.on('jobDeleted', function (id, msg, crawler) {
    console.log("Deleted", id, msg);
    crawler = null;
    stats();
});

stats();

