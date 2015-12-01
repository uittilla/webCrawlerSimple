var request = require('request')
  , cheerio = require('cheerio')
  , async = require('async')
  , seen = {};

var queue = async.queue(function crawl(url, next) {
  if (!url || seen[url]) return next(null);

  request(url, function(err, response, body){
    if (err) return next(err);

    seen[url] = true;
    console.log(url);
    var $ = cheerio.load(body);
    queue.push($('a').map(function(i, e){ return $(e).attr('href'); }));

    next(null);
  });
}, 2);

queue.push('http://twitter.com');
