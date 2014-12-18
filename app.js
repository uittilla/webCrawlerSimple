"use strict";

var Crawler  = require('./model/crawler');
var Queue    = require('./model/queue');
var fileSys  = require('./model/storage');
var jobQueue = new Queue("default");
var fileWrite = new fileSys("./results/results.txt");

var numJobs  = 1;
var job, jobs={};

function listen(crawler) {
    var target;
    
    crawler.on("error", function(error) {
        console.error("Error", error);
    });

    crawler.on('stop', function(err, id, res) {
        if(!err) {
            console.log("Job complete %d Matched %d, Max matches %d", id, res.matched, res.maxMatches);
            fileWrite.writeFile(res, function(err, res) {
                if(!err) jobQueue.deleteJob(id, crawler);
                else console.log("write issues", err);
            });
        }
    });
}

function stats() {
    jobQueue.statsTube(function(data) {
        if(data['current-jobs-reserved'] === 0 ) {
            console.log("Jobs remaining ", data['current-jobs-ready'] - data['current-jobs-reserved']);
            if (data['current-jobs-reserved'] - data['current-jobs-ready'] === 0) {
                console.log("no more jobs");
                process.nextTick(function() { process.exit(); });
            } else {
                if(data['current-jobs-ready'] > 10) {
                    var jobs = 10;
                    while(jobs--) {
                        jobQueue.getJob();
                    }
                } else if(data['current-jobs-ready'] > 5) {
                    var jobs = 5;
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

