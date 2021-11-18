// This is part of the reworked 'Modular Worker Architecture'

// EXAMPLE: [ [ 'animals', '#9c23e8' ] ]

var tagdb = [];
var tagImport = false;

var logger = require('../modules/logger.js');

// ERROR DECLARATIONS
var notImport = 'Tags have not been initialized';

var _this = this;

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
          _this.saveTag()
            .then(res => {
              resolve(`Removed ${removedItem[0]} Successfully from Tag DB`);
            })
            .catch(err => {
              reject(err);
            });
          //resolve(`Removed ${removedItem[0]} Successfully from Tag DB`);
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
      if (name == '' || name == null || colour == '' || colour == null) {
        reject('Required value to create Tag is missing');
      } else {
        try {
          var tempTag = [ name, colour ];

          tagdb.unshift(tempTag);
          // Using unshift to avoid organizing, and can keep them newest to oldest
          logger.log('info', 'tag_worker.js', 'createTag', `Added ${tempTag[0]} to Tag Collection...`);
          _this.saveTag()
            .then(res => {
              resolve('SUCCESS');
            })
            .catch(err => {
              reject(err);
            });
        } catch(ex) {
          reject(ex);
        }
      }
    } else {
      reject(notImport);
    }
  });
}

module.exports.addTag = function() {
  return new Promise(function (resolve, reject) {
    if (tagImport) {
      // It actually seems that adding a tag should be a responsibility of jsonMedia, since access to the
      // media database is needed for this function.
      // this will be discontinued here.
      resolve('This Method is no longer implemented within Tag Worker. Check jsonMedia:AddTag')
    } else {
      reject(notImport);
    }
  });
}

module.exports.initTag = function() {
  return new Promise(function (resolve, reject) {
    if (!tagImport) {
      logger.log('debug', 'tag_worker.js', 'initTag', 'Beginning Saved Tag Import...');

      const start = process.hrtime();
      const path = require('path');
      var file_handler = require('../modules/file_handler');

      try {
        file_handler.read_file(path.join(__dirname, '../json/tags.json'), 'Tag Collection')
          .then(res => {
            if (res == 'nodata') {
              logger.log('debug', 'tag_worker.js', 'initTag', 'No saved Tags to Import...');
              logTime(start, 'Empty Tag Collection Import', 'initTag');
              tagImport = true;
              resolve('SUCCESS');
            } else {
              tagdb = res;
              logTime(start, 'Tag Collection Import', 'initTag');
              tagImport = true;
              resolve('SUCCESS');
            }
          })
          .catch(err => {
            reject(err);
          });
      } catch(ex) {
        reject(ex);
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

      logger.log('debug', 'tag_worker.js', 'saveTag', 'Saving Tag Collection...');

      try {
        const path = require('path');

        var file_handler = require('../modules/file_handler');

        file_handler.write_file(path.join(__dirname, '../json/tags.json'), tagdb, 'Tag Collection')
          .then(res => {
            logTime(start, 'Saving Tag Collection', 'saveTag');
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

function logTime(start, phrase, func) {
  var getDurationInMilliseconds = require('./getDurationInMilliseconds');
  const durationInMilliseconds = getDurationInMilliseconds.getDurationInMilliseconds(start);
  logger.log('debug', 'tag_worker.js', func, `[FINISHED] ${phrase}: ${durationInMilliseconds} ms`);
}
