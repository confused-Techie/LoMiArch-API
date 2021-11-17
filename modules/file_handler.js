
module.exports.read_file = function( datapath, friendlyName ) {
  return new Promise(function (resolve, reject) {
    const start = process.hrtime();

    var fs = require('fs');

    try {

      let rawdata = fs.readFileSync(datapath);

      if (rawdata != '') {
        let jsondata = JSON.parse(rawdata);
        logTime(start, friendlyName, 'Read', 'read_file');
        resolve(jsondata);
      } else {
        logTime(start, friendlyName, 'Read', 'read_file');
        resolve('nodata');
      }
    } catch(ex) {
      reject(ex);
    }

  });
}

module.exports.write_file = function( datapath, datatowrite, friendlyName ) {
  return new Promise(function (resolve, reject) {
    const start = process.hrtime();

    var fs = require('fs');

    try {

      fs.writeFile( datapath, JSON.stringify(datatowrite, null, 2), function(err) {
        if (err) {
          reject(err);
        } else {
          logTime(start, friendlyName, 'Write', 'write_file');
          resolve('SUCCESS');
        }
      });
    } catch(ex) {
      reject(ex);
    }

  });
}

module.exports.delete_file = function( datapath, friendlyName ) {
  return new Promise(function (resolve, reject) {
    const start = process.hrtime();

    var fs = require('fs');

    try {
      fs.rm(datapath, function(err) {
        if (err) {
          reject(err);
        } else {
          logTime(start, friendlyName, 'Remove', 'delete_file');
          resolve('SUCCESS');
        }
      });
    } catch(err) {
      reject(err);
    }
  });
}

module.exports.copy_file = function(origPath, newPath, friendlyName ) {
  return new Promise(function (resolve, reject) {
    const start = process.hrtime();

    var fs = require('fs');

    try {
      fs.copyFile(origPath, newPath)
        .then(res => {
          logTime(start, friendlyName, 'Copy', 'copy_file');
          resolve('SUCCESS');
        })
        .catch(err => {
          reject(err);
        });
    } catch(err) {
      reject(err);
    }
  });
}

function logTime(start, friendlyName, action, func) {
  var logger = require('./logger.js');
  var getDurationInMilliseconds = require('../worker/getDurationInMilliseconds.js');
  const durationInMilliseconds = getDurationInMilliseconds.getDurationInMilliseconds(start);
  logger.log('debug', 'file_handler.js', `${func}`, `${friendlyName} ${action}: ${durationInMilliseconds} ms`);
}
