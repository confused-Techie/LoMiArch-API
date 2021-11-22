// The following list of all functions
// TODO:
// create album
// edit album
// delete album
// add item to album; should take array or single item
// also add dynamic album adding, to allow things to be added in the future

// EXAMPLE: { uuid: 'uuidValue', name: 'Album Name', preview: '/media/ofpreview', access: [ 'username-with-access' ] }

var albumdb = [];
var albumImport = false;

// ERROR DECLARATIONS
var alreadyImportRESOLVE = 'Albums have already been imported.';
var notImportERROR = 'Albums have not been initialized.';

// this is needing to fix the save call from this.saveAlbum() to _this.saveAlbum()
var _this = this;

module.exports.createAlbum = function(albumName, albumPreview, albumCreator) {
  return new Promise(function (resolve, reject) {
    if (albumImport) {
      if (albumName == '' || albumPreview == '' || albumCreator == '' || albumName == null || albumPreview == null || albumCreator == null) {
        reject('Required Value to create Album is missing');
      } else {
        try {
          var albumUUID = uuidGenerate();
          // while originally I was worried about converting the albumPreview to the
          // Actual Path, since the webUI would be requesting it, this can be convereted to the Universal Path
          let tempJson = { uuid: albumUUID, name: albumName, preview: albumPreview, access: [ albumCreator ] };
          albumdb.push(tempJson);

          logThis('notice', 'createAlbum', `Created ${albumName}...`);

          _this.saveAlbums()
            .then(res => {
              resolve('Successfully created new album with no Items');
            })
            .catch(err => {
              reject(err);
            });
        } catch(err) {
          reject(err);
        }
      }
    } else {
      reject(notImportERROR);
    }
  });
}

module.exports.editAlbum = function(albumUUID, newName, newPreview, newAccess, albumIndex) {
  // This would strictly apply to editing the Album items, rather than editing what content is within it.
  return new Promise(function (resolve, reject) {
    // Its expected that the album UUID has been validated before this is called, since currently
    // jsonMedia is the only possible caller, and should be providing the index
    if (albumImport) {
      // Now we can check whats been supplied to change within the designated album
      // For this we can just check the truthiness of the value.

      // Below to save my fingers, I can define a internal function to call the save feature
      const internalSave = function() {
        _this.saveAlbums()
          .then(res => {
            resolve('SUCCESS');
          })
          .catch(err => {
            reject(err);
          });
      };

      if (newName) {
        albumdb[albumIndex].name = newName;
        internalSave();
      } else if (newPreview) {
        albumdb[albumIndex].preview = newPreview;
        internalSave();
      } else if (newAccess) {
        albumdb[albumIndex].access.push(newAccess);
        internalSave();
      } else {
        reject('No supplied value to modify within album');
      }
    } else {
      reject(notImportERROR);
    }
  });
}

module.exports.deleteAlbum = function(albumUUID) {
  return new Promise(function (resolve, reject) {
    if (albumImport) {

      try {
        albumdb.forEach(function(item, index, array) {
          if (albumUUID == album[index].uuid) {
            logThis('notice', 'deleteAlbum', `Found Matching Album for Deletion: ${album[index].name}, ${album[index].uuid}...`);
            let removedAlbum = albumdb.splice(index, 1);
            _this.saveAlbums()
              .then(res => {
                resolve('SUCCESS');
              })
              .catch(err => {
                reject(err);
              });
          }
        });
      } catch(err) {
        reject(err);
      }
    } else {
      reject(notImportERROR);
    }
  });
}

module.exports.getAlbums = function() {
  return new Promise(function (resolve, reject) {
    if (albumImport) {
      resolve(albumdb);
    } else {
      reject(notImportERROR);
    }
  });
}

module.exports.validateAlbum = function(albumUUID) {
  // Will return the index of the album or -1 if it doesn't exist.
  return new Promise(function (resolve, reject) {
    if (albumImport) {
      albumdb.forEach((element, index) => {
        if (albumUUID == albumdb[index].uuid) {
          // with the matching index, this can just return the correct index location
          resolve(index);
        } else {
          if (index -1 = albumdb.length) {
            reject(-1);
          }
        }
      });
    } else {
      reject(notImportERROR);
    }
  });
}

module.exports.saveAlbums = function() {
  return new Promise(function (resolve, reject) {
    if (albumImport) {
      const start = process.hrtime();

      logThis('debug', 'saveAlbums', 'Saving Album Collection...');

      try {
        const path = require('path');

        var file_handler = require('../modules/file_handler');

        file_handler.write_file(path.join(__dirname, '../json/albums.json'), albumdb, 'Album Collection')
          .then(res => {
            logTime(start, 'Saving Album Collection', 'saveAlbums');
            resolve('SUCCESS');
          })
          .catch(err => {
            reject(err);
          });
      } catch( err) {
        reject(err);
      }
    } else {
      reject(notImportERROR);
    }
  });
}

module.exports.initAlbums = function() {
  return new Promise(function (resolve, reject) {
    if (!albumImport) {
      logThis('debug', 'initAlbums', 'Beginning Saved Album Import...');

      const start = process.hrtime();
      const path = require('path');
      var file_handler = require('../modules/file_handler');

      try {
        file_handler.read_file(path.join(__dirname, '../json/albums.json'), 'Album Collection')
          .then(res => {
            if (res == 'nodata') {
              // The file was empty
              logThis('debug', 'initAlbums', 'No saved Albums to Import...');
              logTime(start, 'Empty Album Collection Import', 'initAlbums');
              albumImport = true;
              resolve('SUCCESS');
            } else {
              // The file was NOT empty
              albumdb = res;
              logTime(start, 'Album Collection Import', 'initAlbums');
              albumImport = true;
              resolve('SUCCESS');
            }
          })
          .catch(err => {
            reject(err);
          });
      } catch(err) {
        reject(err);
      }
    } else {
      resolve(alreadyImportRESOLVE);
    }
  });
}

function logTime(start, phrase, func) {
  var getDurationInMilliseconds = require('./getDurationInMilliseconds');
  const durationInMilliseconds = getDurationInMilliseconds.getDurationInMilliseconds(start);
  logThis('debug', func, `[FINISHED] ${phrase}: ${durationInMilliseconds} ms`);
}

function uuidGenerate() {
  const { v4: uuidv4 } = require('uuid');

  try {
    return uuidv4();
  } catch(ex) {
    return `ERROR Occured: ${ex}`;
  }
}

function logThis(severity, func, msg) {
  // Since most of these functions have console.log I can use a single import here to avoid importing globally, or per function basis.
  // Plus avoid typing the file each time.
  var logger = require('../modules/logger.js');
  logger.log(severity, 'album_worker', func, msg);
}
