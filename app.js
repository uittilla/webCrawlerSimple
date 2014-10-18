"use strict";

var Crawler  = require('./model/crawler_proto');
var Queue    = require('./model/queue');
var jobQueue = new Queue('default');
var numJobs  = 3;
var job, jobs={};

function listen(crawler) {
    var target;
    
    crawler.on("error", function(error) {
        console.error("Error", error);
    });

    crawler.on('stop', function(err, id, res, matched, maxMatches) {
        if(!err) {
            console.log("Job complete %d Matched %d, Max matches %d", id, matched, maxMatches);
            jobQueue.deleteJob(id, crawler);
        }
    });
}

while(numJobs--) {
   // jobQueue = new Queue('default');
    jobQueue.getJob();
}


jobQueue.on('jobReady', function job(_job) {
    var data = JSON.parse(_job.data);
    listen(new Crawler(_job.id, data.link, data.targets));      
});

jobQueue.on('jobDeleted', function (id, msg, crawler) {
    console.log("Deleted", id, msg);
    crawler = null;
   // jobQueue.disconnect();
    jobQueue.statsTube("default", function(data){
         console.log(data);
         jobQueue.getJob();
    });
   // jobQueue = new Queue('default');
});


