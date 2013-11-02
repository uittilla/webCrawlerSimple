"use strict";

var Crawler = require('./model/crawler');

var crawler = Crawler.init("http://www.nationalclubgolfer.com", ["http://www.facebook.com", "http://www.twitter.com", "http://twitter.com"]);

crawler.on("error", function(error) {
    console.error("Error", error);
});

crawler.once('stop', function(err, res, matched, maxMatches) {

    if(!err) {
        console.log("Job complete");
        Object.keys(res).forEach(function(value){

            console.log("Page: %d, href: %s", res[value].Page, value);

            for(var target in (res[value].Targets)) {
               console.log("Target: %s, Anchor: %s", res[value].Targets[target].href, res[value].Targets[target].anchor);
            }

            console.log();
        });

        console.log("Matched %d, Max matches %d", matched, maxMatches);
    }
});