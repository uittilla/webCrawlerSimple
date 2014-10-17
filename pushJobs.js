var bs = require('nodestalker'),
        client = bs.Client('127.0.0.1:11300');

var jobs = [
      { "link": "http://www.bbc.co.uk","targets": ["http://www.skybet.com", "https://www.skybet.com"]},
      { "link": "http://www.skysports.com/", "targets": ["http://www.skybet.com", "https://www.skybet.com"]}
];

client.use('default').onSuccess(function (data) {
    console.log(data);
    for(var i in jobs) {
        client.put(JSON.stringify(jobs[i])).onSuccess(function (data) {
            console.log(data);
            //client.disconnect();
        });
    }
});

