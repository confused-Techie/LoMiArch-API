
module.exports.read_file = function( datapath, friendlyName ) {
  return new Promise(function (resolve, reject) {
    const start = process.hrtime();

    var fs = require('fs');

    try {

      let rawdata = fs.readFileSync(datapath);

      if (rawdata != '') {
        let jsondata = JSON.parse(rawdata);
        logTime(start, friendlyName, 'Import');
        resolve(jsondata);
      } else {
        logTime(start, friendlyName, 'Import');
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
          logTime(start, friendlyName, 'Write');
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
          logTime(start, friendlyName, 'Remove');
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
          logTime(start, friendlyName, 'Copy');
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

function logTime(start, friendlyName, action) {
  var getDurationInMilliseconds = require('../worker/getDurationInMilliseconds.js');
  const durationInMilliseconds = getDurationInMilliseconds.getDurationInMilliseconds(start);
  console.log(`[FINISHED:file_handler] ${friendlyName} ${action}: ${durationInMilliseconds} ms`);
}
