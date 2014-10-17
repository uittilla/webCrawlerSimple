"use strict";

var Crawler  = require('./model/crawler_proto');
var Queue    = require('./model/queue');
var jobQueue = new Queue('default');
var numJobs  = 2;
var job, jobs=[];

function listen(crawler) {
    var target;
    
    crawler.on("error", function(error) {
        console.error("Error", error);
    });

    crawler.on('stop', function(err, id, res, matched, maxMatches) {

        if(!err) {
          console.log("Job complete %d Matched %d, Max matches %d", id, matched, maxMatches);
          jobQueue.deleteJob(id);
        }
    });
}

while(numJobs--) {
    jobQueue.getJob();
}

jobQueue.on('jobReady', function job(_job) {
    console.log(_job)
    var data = JSON.parse(_job.data);

    jobs.push(_job.id);

    listen(new Crawler(_job.id, data.link, data.targets));      
});

jobQueue.on('jobDeleted', function (id, msg) {
    console.log("Deleted", id, msg);
    console.log("All jobs", jobs);
    jobs.splice(jobs.indexOf(id), 1);

    jobQueue.disconnect();

    setTimeout(function() {
       jobQueue.getJob();
    }, 1000);
});