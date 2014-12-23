"use strict";

var fs = require('fs');

var fileSys = function(file) {
    this.file = file;
};

/**
 * Writes to log
 *
 * @param entry
 * @param cb
 */
fileSys.prototype.writeFile = function(entry, cb) {
    entry = JSON.stringify(entry, null, 4 );
    fs.appendFile (this.file, entry + ",", function (err) {
        if (err) {
            console.log('There has been an error saving your configuration data.');
            console.log(err.message);
            return cb(err, null);
        }
        cb(null, "Configuration saved successfully");
    });

};

module.exports = fileSys;