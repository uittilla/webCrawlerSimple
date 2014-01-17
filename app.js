"use strict";

var Crawler = require('./model/crawler_proto');

var targets = ["http://www.facebook.com", "http://www.twitter.com", "http://twitter.com"];
var links   = ["http://www.bbc.co.uk", "http://www.theregister.co.uk", "http://slashdot.org", "http://www.thedailymash.co.uk", "http://www.theguardian.co.uk"];

function listen(crawler) {
    crawler.on("error", function(error) {
        console.error("Error", error);
    });

    crawler.on('stop', function(err, res, matched, maxMatches) {

        if(!err) {
            console.log("Job complete");
            Object.keys(res).forEach(function(value){
              console.log("Page: %d, href: %s", res[value].Page, value);

              for(var target in (res[value].Targets)) {
                console.log("Target: %s, Anchor: %s", res[value].Targets[target].href, res[value].Targets[target].anchor);
              }               
          });

          console.log("Matched %d, Max matches %d", matched, maxMatches);
        }
    });
}

for(var i in links) {
   listen(new Crawler(links[i], targets)); 
}
