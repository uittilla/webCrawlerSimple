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
    jobQueue.getJob();
}

jobQueue.on('jobReady', function job(_job) {
    var data = JSON.parse(_job.data);
    var count = 0;

    if(data.link !== "") {
        listen(new Crawler(_job.id, data.link, data.targets));
    } else {
        count++;
    }

    if(count > 0) {
        console.log("Jobs done");
        process.exit();
    }
});

jobQueue.on('jobDeleted', function (id, msg, crawler) {
    console.log("Deleted", id, msg);
    crawler = null;

    jobQueue.statsTube("default", function(data){
         console.log(data);
         jobQueue.getJob();
    });
});
