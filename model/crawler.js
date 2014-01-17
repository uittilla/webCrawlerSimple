"use strict";

/*
 * Author:   Ibbo (mark.ibbotson)
 * Purpose:  backlink checker worker
 *
 * Implements agent.js as the crawl agent
 * Crawler uses the information pulled back from agent to gather page statistics
 */

var EventEmitter, url, CrawlAgent, cheerio, Crawler, DEBUG, MAX_LINKS=5, PAGE_TIMEOUT=1000;

EventEmitter = require('events').EventEmitter;
url          = require('url');
cheerio      = require('cheerio');
CrawlAgent   = require('./agent_proto');

DEBUG = true;


Crawler = {
    __proto__: EventEmitter.prototype,   // inherit EventEmitter
    badLinks: /\.(bmp|BMP|exe|EXE|jpeg|JPEG|swf|SWF|pdf|PDF|gif|GIFF|png|PNG|jpg|JPG|doc|DOC|avi|AVI|mov|MOV|mpg|MPG|tiff|TIFF|zip|ZIP|tgz|TGZ|xml|XML|xml|XML|rss|RSS|mp3|MP3|ogg|OGG|wav|WAV|rar|RAR)$/i,
    matched: 0,
    maxMatches: 0,

    /**
     * Controls the flow of the crawl
     *
     * @param host
     * @param masters
     * @returns {*}
     */
    init: function(host, masters) {

        console.log("init", host);
        var report, master_regex, agent, self, $, internals, grab, visited_count, targets;

        agent         = Object.create(CrawlAgent).init(host);       // Agent
        self          = this;                        // map this for scope
        internals     = [];                          // internal link storage
        grab          = true;                        // indicate to grab links or not
        visited_count = 0;                           // tally of visited pages
        report        = {};                          // report container

        master_regex  = this.createTargetRegex(masters);

        this.listen(agent, internals, grab, visited_count, report, master_regex, targets);

        // Setup complete start the crawl
        agent.start();

        return this;
    },

    /**
     * Listen for event signals
     *
     * @param agent
     * @param internals
     * @param grab
     * @param visited_count
     * @param report
     * @param master_regex
     * @param targets
     */
    listen: function(agent, internals, grab, visited_count, report, master_regex, targets) {
        var self = this, $=null;
        /**
         * Catch agent next signals
         */
        agent.on('next', function(err, data)
        {
            try
            {
                visited_count++;

                if(!err)
                {
                    // Set up Cheerio
                    $ = cheerio.load(data.body, {
                        lowerCaseTags           : true,
                        lowerCaseAttributeNames : true,
                        ignoreWhitespace        : true
                    });

                    // Grab and parse more links
                    if( grab && (agent.pending() + visited_count < MAX_LINKS) )
                    {
                        console.log("Got ", agent.pending() + visited_count);
                        internals = self.getLinks($, agent, data);         // grab all links
                        internals = self.dropDuplicates(internals);        // de dupe
                        internals = self.dropUndesirables(internals);      // drop bad file types
                        self.addNewLinks(agent, internals, visited_count); // save for crawling
                    }
                    else
                    {
                        grab = false;
                    }

                    targets               = self.matchTargets($, agent, master_regex);
                    report[agent.current] = {"Page": agent.viewed, "Targets" : targets};

                    console.log(
                        "Page %d, Current %s, Status %d, Targets %d, Matched %d, Max Matches %d",
                        agent.viewed,
                        agent.current,
                        data.status,
                        report[agent.current].Targets.length,
                        self.matched,
                        self.maxMatches
                    );
                }
                else
                {
                    self.emit("error", {"error": err});
                }

                // stop when pending is empty
                if(agent.pending() === 0 && agent.seen() > 1)
                {
                    agent.stop();
                }
                else
                {
                    // next
                    setTimeout(function()
                    {
                        agent.next();

                    }, PAGE_TIMEOUT);
                }
            }
            catch(e)
            {   self.emit("error", {"error": e});
                agent.next();
            }
        });

        agent.once('error', function()
        {
            self.emit("error", {"error": err});
            agent.next();
        });

        /**
         * Listens for a agent stop event
         */
        agent.once('stop', function()
        {
            self.emit('stop', null, report, self.matched, self.maxMatches);
            agent.removeAllListeners();
        });
    },

    /**
     * Drop all duplicate links
     *
     * @param links
     * @returns {Array}
     */
    dropDuplicates: function(links) {
        links = links.filter(function (elem, pos)
        {
            return links.indexOf(elem) === pos;
        });

        return links;
    },

    /**
     * Skip all links that end with the following
     * @param links
     * @returns {Array}
     */
    dropUndesirables: function(links) {
        var self = this;

        // finally drop any of the following bad urls
        links = links.filter(function (elem, pos)
        {
            return !(self.badLinks).test(elem);
        });

        return links;
    },

    /**
     * Build a Target URL regex
     * Avoids closure memory leek
     *
     * I.E.
     *
     * for (var i in masters) {
     *     term = masters[i];
     *     $("a[href^='" + term + "']").each(function () {
     *
     * @param masters
     * @returns {string}
     */
    createTargetRegex: function(masters) {

        var term, master, master_regex = "";

        for (master in masters)
        {
            if(masters.hasOwnProperty(master))
            {
                term = masters[master];
                master_regex += 'a[href^="' + term + '"],';
            }
        }

        return master_regex.slice(0, -1);
    },

    /**
     * Finds all internal links for this domain
     *
     * @param $
     * @param agent
     * @param data
     * @returns {Array|jQuery}
     */
    getLinks: function ($, agent, data) {
        var tmp = data.host;
            tmp = tmp.replace("www.", "");

        // format a host matching regex
        var regExp = new RegExp("^(http|https)://(www\.)?" + url.parse(tmp).host  + "($|/)");

        // grab all on page links
        var nodes =  $('a').map(function (i, el)
        {
            var href = $(this).attr('href');

            if(href && href !== undefined)
            {
                // lowercase the url (another anti web crawling pattern)
                href = href.trim().toLowerCase();

                // check for link locality
                var isLocal = (href.substring(0,4) === "http") ? regExp.test(href) : true;

                // returns a resolved link to domain link
                if(isLocal && !/^(#|javascript|mailto)/.test(href) )
                {
                    return url.resolve(agent.host, href);
                }
            }
        });

        return nodes;
    },

    /**
     * Adds new links to agent.pending
     * Ensures link does not already exists in the agent stack
     *
     * @param agent
     * @param internals
     * @param visited_count
     */
    addNewLinks: function (agent, internals, visited_count) {
        for(var link in internals)
        {
            if( internals.hasOwnProperty(link)
                && (agent.pending() + visited_count < MAX_LINKS)
                && !agent.findLink(internals[link])
              )
            {
                if(internals[link] !== undefined) {
                    agent.addLink(internals[link]);
                }
            }
        }
    },

    /**
     * Find any matching Target links on page
     * Stores the uri and its anchor text if true
     *
     * @param $
     * @param worker
     * @param masters
     */
    matchTargets: function ($, worker, masters) {
        // Target matching
        var j = 0, self = this;

        var targets = $(masters).map(function (i, el)
        {
            j++;
            self.matched++;
            return {
                "href"   : $(this).attr('href'),
                "anchor" : $(this).html()
            };
        });

        this.maxMatches = (j > self.maxMatches) ? j : self.maxMatches;

        return targets;
    }
};

module.exports = Crawler;