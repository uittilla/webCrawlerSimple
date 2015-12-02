var request = require('request'),
    cheerio = require('cheerio'),
    async   = require('async'),
    seen    = {},
    queue;

queue = async.queue(function crawl(url, next) {

  console.log("URL", url);

  if (!url || seen[url]) return next(null);

  request(url, function(err, response, body){
    if (err) return next(err);

    seen[url] = true;

    var $ = cheerio.load(body);
    queue.push($('a').map(function(i, e){ return $(e).attr('href'); }));

    next(null);
  });
}, 2);

queue.push('http://m.skybet.com');
