"use strict";

/*
 * Author:   Ibbo (mark.ibbotson)
 * Purpose:  Crawler agent
 *
 * Maintains a list of links seen and pending
 * Visits each link in the list and emits its contents back to the crawler
 * Shifts links from pending to current to seen maintaining a fluid crawl
 *
 */

var EventEmitter, url, request, DEBUG;

EventEmitter = require('events').EventEmitter;
url          = require('url');
request      = require('request');
DEBUG        = true;

/**]
 *
 * @type {
 *   { __proto__              : *,
 *     _seen                  : Array,
 *     _pending               : Array,
 *     current                : null,
 *     running                : boolean,
 *     host                   : null,
 *     viewed                 : number,
 *     init                   : Function,
 *     open                   : Function,
 *     formatHostFromRedirect : Function,
 *     getNext                : Function,
 *     addLink                : Function,
 *     findLink               : Function,
 *     start                  : Function,
 *     stop                   : Function,
 *     next                   : Function,
 *     pending                : Function,
 *     seen                   : Function
 * }}
 */
var Agent = {
    __proto__  : EventEmitter.prototype, // inherit EventEmitter
    _seen      : [],                     // internal store for seen pages
    _pending   : [],                     // internal store for yet to visit pages
    current    : null,                   // current page
    running    : false,                  // system state
    host       : null,                   // container for host name (used for matching internal links)
    viewed     : 0,                      // keep track of pages viewed so far

    /**
     * @param host
     * @param links
     * @param id
     * @returns {*}
     */
    init: function (host) {               // bootup
        this.current   = host;            // current page to visit

        // build our master host
        var tmp   = url.parse(host);
        this.host =  tmp.protocol + "//" + (tmp.host || tmp.hostname);

        return this;
    },

    /**
     *  Visits the link and pulls back the page contents
     *  Handles redirects and maps now master host to initial redirect host
     */
    open: function() {
        var self, status, options;

        self     = this;
        options  = {                           // options for the request
            "uri"            : self.current,
            "timeout"        : 10000,          // initial timeout
            "maxRedirects"   : 8,              // max redirects allowed
            "followRedirect" : !!(self.viewed === 0),
            "encoding"       : 'utf-8',
            "retries"        : 2,
            "headers"        : {
                'User-Agent': 'Mozilla/5.0 (X11; Linux i686) AppleWebKit/536.11 (KHTML, like Gecko) Ubuntu/12.04 Chromium/20.0.1132.47 Chrome/20.0.1132.47'
            }
        };

        // make the request
        request(options, function (error, res, body)
        {
            if(!error)
            {
                status = res.statusCode;

                // Redirects found under this.redirects
                if (this.redirects && this.redirects.length > 0)
                {
                    self.formatHostFromRedirect(this.redirects);
                }

                if(status < 400)
                {
                   self.emit('next', null, {"body": body, "status": status, "host": self.host});
                }
                else
                {
                    self.emit('next', true, {"host": self.current, "status": status});
                }
            }
            else
            {   // report back error (will continue the crawl)
                self.emit('next', {"error": error, "host": options, "status": status || 0 }, self, null);
            }
        });
    },

    /**
     * If a redirect is encountered we need to format our host to reflect it
     * If we do not do this we wont be finding valid host to domain internal links
     * @param redirects
     */
    formatHostFromRedirect: function(redirects) {
        var location = redirects[redirects.length - 1].redirectUri,
            status   = redirects[redirects.length - 1].statusCode,
            tmp      = url.parse(location);

        this.host =  tmp.protocol + "//" + (tmp.host || tmp.hostname);
    },

    /**
     * shifts around _pending and _seen (reflecting our crawl)
     */
    getNext: function() {

        // stop when pending is empty
        if(this.pending() === 0 && this.viewed > 1)
        {
            this.stop();  // and emit a stop
        }

        // shift pending to current
        if(this.viewed > 0 && this._pending.length > 0)
        {
            this.current = url.resolve(this.host, this._pending.shift());
        }

        // crawl current
        this.open();

        // shift current to seen
        this._seen.push(this.current);

        // increment viewed
        this.viewed++;
    },

    /**
     * Add a new link to _pending
     * @param link
     */
    addLink: function(link) {
        this._pending.push(link);
    },

    /**
     * Ensures we do not have duplicate links
     * @return bool
     */
    findLink: function(link) {
        // check pending
        for(var l in this._pending)
        {
            if(this._pending[l] === link)
                return true;
        }

        // check seen
        for(var l in this._seen)
        {
            if(this._seen[l] === link)
                return true;
        }

        // check current
        return link === this.current;
    },

    /**
     * Starts the agent
     */
    start: function () {
        this.running = true;
        this.getNext();
    },

    /**
     * Stops the agent
     */
    stop: function () {
        this.running = false;
        this.emit('stop');
        this.removeAllListeners();
    },

    /**
     * Get next page
     */
    next: function () {
        this.getNext();
    },

    /**
     * Return the number of pages pending
     * @return int
     */
    pending: function() {
        return this._pending.length || 0;
    },

    /**
     * Return the number of pages seen
     * @return int
     */
    seen: function () {
        return this._seen.length || 0;
    }
};

module.exports = Agent;