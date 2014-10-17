"use strict";

var Crawler  = require('./model/crawler_proto');
var Queue    = require('./model/queue');
var jobQueue = new Queue('default');
var numJobs  = 2;
var job;

function listen(crawler) {
    var target;
    
    crawler.on("error", function(error) {
        console.error("Error", error);
    });

    crawler.on('stop', function(err, id, res, matched, maxMatches) {

        if(!err) {
          console.log("Job complete", id);
         /* Object.keys(res).forEach(function(value){
              console.log("Page: %d, href: %s, Found targets #%d", res[value].Page, value, res[value].Targets.length);
          });*/

          console.log("Matched %d, Max matches %d", matched, maxMatches);
          
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
    listen(new Crawler(_job.id, data.link, data.targets));      
});

jobQueue.on('jobDeleted', function (id, msg) {
    console.log("Deleted", id, msg);
    jobQueue.disconnect();

    setTimeout(function(){
       jobQueue.getJob();
    }, 1000);
});