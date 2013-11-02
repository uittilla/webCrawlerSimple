"use strict";

var url, http, Crawler;

url   = require('url');
http  = require('http');

Crawler = {
    uri:    null,
    target: null,
    /**
     *
     * @returns {*}
     */
  init: function(uri, target) {
      this.uri    = uri;
      this.target =target;
      return this;
  },

    /**
     *
     * @param uri
     */
  fetch: function() {
      var self = this;

      var options = {
          host: self.uri
      };

      var req = http.request(options, this.parse);
      req.end();
  },

    /**
     *
     * @param response
     */
  parse: function(response) {
      var str = ''
      var self = this;

      response.on('data', function (chunk) {
          str += chunk;
      });

      response.on('end', function () {
          //console.log(str);
          Crawler.findLinks(str);
      });
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

      for(var link in matches) {
         if(matches[link].indexOf(url.parse(this.target).host) !== -1) {
             console.log("Found:", matches[link]);
         }
      }
  }
};

var crawler = Crawler.init("www.stickyeyes.com", "http://twitter.com");
crawler.fetch();