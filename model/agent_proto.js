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

var EventEmitter, url, request, utils, DEBUG;

EventEmitter = require('events').EventEmitter;
url          = require('url');
request      = require('request');
utils        = require('util');
DEBUG        = true;


var Agent = function(host) {
    
    this._seen    = [];                     // internal store for seen pages
    this._pending = [];                     // internal store for yet to visit pages
    this.current  = null;                   // current page
    this.running  = false;                  // system state
    this.host     = null;                   // container for host name (used for matching internal links)
    this.viewed   = 0;                      // keep track of pages viewed so far
    this.current  = host;                   // current page to visit

    // build our master host
    var tmp   = url.parse(host);
    this.host =  tmp.protocol + "//" + (tmp.host || tmp.hostname);
};


utils.inherits(Agent, EventEmitter);

Agent.prototype.open = function() {
    var self, status, options;

    self     = this;
    options  = {                           // options for the request
        "uri"            : self.current,
        "timeout"        : 10000,          // initial timeout
        "maxRedirects"   : 4,              // max redirects allowed
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
                status = this.redirects[this.redirects.length - 1].statusCode;  // we want the status of a redirect
                self.formatHostFromRedirect(this.redirects);
            }

            if(status < 400)
            {
               self.emit('next', null, {"body": body, "status": status, "host": self.host});
            }
            else
            {
                self.emit('next', {"host": self.current, "status": status}, null);
            }
        }
        else
        {   // report back error (will continue the crawl)
            self.emit('next', {"error": error, "host": options, "status": status || 0 }, null);
        }
    });
}


Agent.prototype.formatHostFromRedirect = function(redirects) {
    var location = redirects[redirects.length - 1].redirectUri,
        tmp      = url.parse(location);

    this.host =  tmp.protocol + "//" + (tmp.host || tmp.hostname);
}

Agent.prototype.getNext = function() {

    // shift pending to current
    if(this.seen() > 0 && this.pending() > 0)
    {
        this.current = url.resolve(this.host, this._pending.shift());
    }

    // crawl current
    this.open();

    // shift current to seen
    this._seen.push(this.current);

    // increment viewed
    this.viewed++;
}

Agent.prototype.addLink = function(link) {
    this._pending.push(link);
}

/**
 * Ensures we do not have duplicate links
 * @return bool
 */
Agent.prototype.findLink = function(link) {
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
}

/**
 * Starts the agent
 */
Agent.prototype.start = function () {
    this.running = true;
    this.getNext();
}

/**
 * Stops the agent
 */
Agent.prototype.stop = function () {
    this.running = false;
    this.emit('stop');
    this.removeAllListeners();
}

/**
 * Get next page
 */
Agent.prototype.next = function () {
    this.getNext();
}

/**
 * Return the number of pages pending
 * @return int
 */
Agent.prototype.pending = function() {
    return (this._pending.length || 0);
}

/**
 * Return the number of pages seen
 * @return int
 */
Agent.prototype.seen = function () {
    return (this._seen.length || 0);
}


module.exports = Agent;