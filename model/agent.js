"use strict";

/*
 * Author:   Ibbo (mark.ibbotson)
 * Purpose:  Crawler agent
 *
 * Maintains a list of links seen and pending
 * Visits each link in the list and emits its contents back toi the crawler
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
            "maxRedirects"   : 4,              // max redirects allowed
            "followRedirect" : !!(self.viewed === 0),
            "encoding"       : null,
            "retries"        : 1,
            "headers"        : {
                'User-Agent': 'Mozilla/5.0 (X11; Linux i686) AppleWebKit/536.11 (KHTML, like Gecko) Ubuntu/12.04 Chromium/20.0.1132.47 Chrome/20.0.1132.47'
            }
        };

        // request module in action
        request(options, function (error, res, body) {
            if(!error) {
                status = res.statusCode;

                // Redirects found under this.redirects
                if (this.redirects && this.redirects.length > 0) {
                    self.formatHostFromRedirect(this.redirects);
                }

                if(status < 400) {
                   self.emit('next', null, {"body": body, "status": status, "host": self.host});
                }
                else {
                    console.log("status", status);
                    self.emit('next', true, {"host": self.current});
                }
            }
            else {// report back error (will continue the crawl)
                console.log("Request error", error);
                self.emit('error', {"error": error, "host": options, "status": status || 0 }, self, null);
            }

        });
    },

    /**
     * If a redirect is encountered we need to format our ost to reflect it
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
            this.emit('stop');               // and emit a stop
        }
        else
        {
            if(this.viewed > 0) {
                // shift pending to current
                this.current = url.resolve(this.host, this._pending.shift());
            }

            // crawl current
            this.open();

            // shift current to seen
            this._seen.push(this.current);

            this.viewed++;
        }
    },

    /**
     * add a new link (if not exists) to _pending
     * @param link
     */
    addLink: function(link) {
        this._pending.push(link);
    },

    /**
     * ensures we do not have duplicate links
     * @return bool
     */
    findLink: function(link) {
        for(var l in this._pending) {
            if(this._pending[l] === link)
                return true;
        }

        for(var l in this._seen) {
            if(this._seen[l] === link)
                return true;
        }

        return link === this.current;
    },

    /**
     * Start the agent
     */
    start: function () {
        this.running = true;
        this.getNext();
    },

    /**
     * Stops the crawl
     */
    stop: function () {
        this.running = false;
        this.emit('stop');
        this.removeAllListeners();
    },


    /**
     * simple agent method to kick next
     */
    next: function () {
        this.getNext();
    },

    /**
     *
     * @return int
     */
    pending: function() {
        return this._pending.length || 0;
    },

    /**
     *
     * @return int
     */
    seen: function () {
        return this._seen.length || 0;
    }
};

module.exports = Agent;