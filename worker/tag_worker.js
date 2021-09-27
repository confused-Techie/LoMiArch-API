// This is part of the reworked 'Modular Worker Architecture'

var tagdb = [];
var tagImport = false;

// ERROR DECLARATIONS
var notImport = 'Tags have not been initialized';

module.exports.deleteTag = function(name) {
  return new Promise(function (resolve, reject) {
    if (tagImport) {
      try {

        // Since the tag is a two dimensional array we can't use indexof and will loop
        var tagIndex;
        tagdb.forEach((item, index) => {
          if (name == item[0]) {
            tagIndex = index;
          }
        });

        if (tagIndex != '') {
          let removedItem = tagdb.splice(tagIndex, 1);
          this.saveTag()
            .then(res => {
              resolve('SUCCESS');
            })
            .catch(err => {
              reject(err);
            });
          resolve(`Removed ${removedItem[0]} Successfully from Tag DB`);
        } else {
          reject('Unable to find Tag within Tag DB...');
        }
      } catch(ex) {
        reject(ex);
      }
    } else {
      reject(notImport);
    }
  });
}

module.exports.createTag = function(name, colour) {
  return new Promise(function (resolve, reject) {
    if (tagImport) {
      try {
        var tempTag = [ name, colour ];

        tagdb.unshift(tempTag);
        // Using unshift to avoid organizing, and can keep them newest to oldest
        console.log(`Added ${tempTag[0]} to Tag Collection...`);
        this.saveTag()
          .then(res => {
            resolve('SUCCESS');
          })
          .catch(err => {
            reject(err);
          });
      } catch(ex) {
        reject(ex);
      }
    } else {
      reject(notImport);
    }
  });
}

module.exports.addTag = function() {
  return new Promise(function (resolve, reject) {
    if (tagImport) {
      // TODO
    } else {
      reject(notImport);
    }
  });
}

module.exports.initTag = function() {
  return new Promise(function (resolve, reject) {
    if (!tagImport) {
      console.log('Beginning Saved Tag Import...');

      const start = process.hrtime();
      const path = require('path');
      var file_handler = require('../modules/file_handler');

      try {
        file_hanlder.read_file(path.join(__dirname, '../json/tags.json'), 'Tag Collection')
          .then(res => {
            if (res == 'nodata') {
              console.log('No saved Tags to Import...');
              logTime(start, 'Empty Tag Collection Import');
              tagImport = true;
              resolve('SUCCESS');
            } else {
              tagdb = res;
              logTime(start, 'Tag Collection Import');
              tagImport = true;
              resolve('SUCCESS');
            }
          })
          .catch(err => {
            reject(err);
          });
      } catch(ex) {

      }
    } else {
      resolve('Tags have already been imported.');
    }
  });
}

module.exports.getTags = function() {
  return new Promise(function (resolve, reject) {
    if (tagImport) {
      resolve(tagdb);
    } else {
      reject(notImport);
    }
  });
}

module.exports.saveTag = function() {
  return new Promise(function (resolve, reject) {
    if (tagImport) {
      const start = process.hrtime();

      console.log('Saving Tag Collection...');

      try {
        const path = require('path');

        var file_handler = require('../modules/file_handler');

        file_handler.write_file(path.join(__dirname, '../json/tags.json'), tagdb, 'Tag Collection')
          .then(res => {
            logTime(start, 'Saving Tag Collection');
            resolve('SUCCESS');
          })
          .catch(err => {
            reject(err);
          });
      } catch(ex) {
        reject(ex);
      }
    } else {
      reject(notImport);
    }
  });
}

function logTime(start, phrase) {
  var getDurationInMilliseconds = require('./getDurationInMilliseconds');
  const durationInMilliseconds = getDurationInMilliseconds.getDurationInMilliseconds(start);
  console.log(`[FINISHED] ${phrase}: ${durationInMilliseconds} ms`);
}
