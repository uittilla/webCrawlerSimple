"use strict";

var bs = require('nodestalker'),
        client = bs.Client('127.0.0.1:11300');

var jobs = [
    { "link": "http://www.bbc.co.uk","targets": ["http://www.skybet.com", "https://www.skybet.com"]},
    { "link": "http://www.skysports.com/", "targets": ["http://www.skybet.com", "https://www.skybet.com"]},
    { "link": "http://www.football-league.co.uk/sky-bet-championship/news/", "targets": ["http://www.skybet.com", "https://www.skybet.com"]},
    { "link": "http://www.dailymail.co.uk","targets": ["http://www.skybet.com", "https://www.skybet.com"]},
    { "link": "http://www.reddit.com/", "targets": ["http://www.skybet.com", "https://www.skybet.com"]},
    { "link": "http://www.affiliatehub.com", "targets": ["http://www.skybet.com", "https://www.skybet.com"]},
    { "link": "http://www.sportinglife.com","targets": ["http://www.skybet.com", "https://www.skybet.com"]},
    { "link": "http://www.freebets.org.uk", "targets": ["http://www.skybet.com", "https://www.skybet.com"]},
    { "link": "http://www.betting-directory.com", "targets": ["http://www.skybet.com", "https://www.skybet.com"]},
    { "link": "http://www.marketingweek.co.uk","targets": ["http://www.skybet.com", "https://www.skybet.com"]},
    { "link": "http://www.free-bet-advice.com", "targets": ["http://www.skybet.com", "https://www.skybet.com"]},
    { "link": "http://www.online-betting.me.uk", "targets": ["http://www.skybet.com", "https://www.skybet.com"]},
    { "link": "http://www.cheltenham-festival.co.uk","targets": ["http://www.skybet.com", "https://www.skybet.com"]},
    { "link": "http://www.themillers.co.uk", "targets": ["http://www.skybet.com", "https://www.skybet.com"]},
    { "link": "http://www.oddschecker.com", "targets": ["http://www.skybet.com", "https://www.skybet.com"]},
    { "link": "http://www.yorkshirepost.co.uk","targets": ["http://www.skybet.com", "https://www.skybet.com"]},
    { "link": "http://www.football365.com", "targets": ["http://www.skybet.com", "https://www.skybet.com"]},
    { "link": "http://www.wosb.com", "targets": ["http://www.skybet.com", "https://www.skybet.com"]},
    { "link": "http://www.betrescue.com","targets": ["http://www.skybet.com", "https://www.skybet.com"]},
    { "link": "http://www.football-data.co.uk", "targets": ["http://www.skybet.com", "https://www.skybet.com"]},
    { "link": "https://apps.facebook.com", "targets": ["http://www.skybet.com", "https://www.skybet.com"]}
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

