"use strict";

var CrawlAgent   = require('./model/agent');

var Simple = {

    init: function(host) {
        var agent = CrawlAgent.init(host);
        var viewed = 0;
        var self = this;

        agent.on("next", function(err, data) {
            if(!err) {
                var links = self.findLinks(data.body);

                console.log("Links", links);

                agent.next();
            }
        });

        agent.on("error", function(err){
           console.log("Error", err);
        });

        agent.on("stop", function(){
            console.log("Crawl complete");
        });

        agent.start();
    },

    /**
     *
     * @param html
     */
    findLinks: function(html) {
        var regex = /href="([^"]*)/g;
        var matches = [];
        var match;

        while(match = regex.exec(html)){
            matches.push(match[1]);
        }

        return matches;
    }
};

Simple.init("http://www.theregister.co.uk");