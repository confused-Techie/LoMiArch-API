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

module.exports.createAlbum = function(albumName, albumPreview, albumCreator) {
  return new Promise(function (resolve, reject) {
    if (albumImport) {
      try {
        var albumUUID = uuidGenerate();

        // while originally I was worried about converting the albumPreview to the
        // Actual Path, since the webUI would be requesting it, this can be converted to the Universal Path

        let tempJson = { uuid: albumUUID, name: albumName, preview: albumPreview, access: [ albumCreator ] };
        albumdb.push(tempJson);

        console.log(`Created ${albumName}...`);

        this.saveAlbums()
          .then(res => {
            resolve('Successfully created new album with no Items');
          })
          .catch(err => {
            reject(err);
          });

      } catch(err) {
        reject(err);
      }
    } else {
      reject(notImportERROR);
    }
  });
}

module.exports.editAlbum = function() {
  // This would strictly apply to editing the Album items, rather than editing what content is within it.
}

module.exports.deleteAlbum = function(albumUUID) {
  return new Promise(function (resolve, reject) {
    if (albumImport) {

      try {
        albumdb.forEach(function(item, index, array) {
          if (albumUUID == album[index].uuid) {
            console.log(`Found Matching Album for Deletion: ${album[index].name}, ${album[index].uuid}...`);
            let removedAlbum = albumdb.splice(index, 1);
            this.saveAlbums()
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

module.exports.saveAlbums = function() {
  return new Promise(function (resolve, reject) {
    if (albumImport) {
      const start = process.hrtime();

      console.log('Saving Album Collection...');

      try {
        const path = require('path');

        var file_handler = require('../modules/file_handler');

        file_handler.write_file(path.join(__dirname, '../json/albums.json'), albumdb, 'Album Collection')
          .then(res => {
            logTime(start, 'Saving Album Collection');
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
      console.log('Beginning Saved Album Import...');

      const start = process.hrtime();
      const path = require('path');
      var file_handler = require('../modules/file_handler');

      try {
        file_handler.read_file(path.join(__dirname, '../json/albums.json'), 'Album Collection')
          .then(res => {
            if (res == 'nodata') {
              // The file was empty
              console.log('No saved Albums to Import...');
              logTime(start, 'Empty Album Collection Import');
              albumImport = true;
              resolve('SUCCESS');
            } else {
              // The file was NOT empty
              albumdb = res;
              logTime(start, 'Album Collection Import');
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

function logTime(start, phrase) {
  var getDurationInMilliseconds = require('./getDurationInMilliseconds');
  const durationInMilliseconds = getDurationInMilliseconds.getDurationInMilliseconds(start);
  console.log(`[FINISHED] ${phrase}: ${durationInMilliseconds} ms`);
}

function uuidGenerate() {
  const { v4: uuidv4 } = require('uuid');

  try {
    return uuidv4();
  } catch(ex) {
    return `ERROR Occured: ${ex}`;
  }
}
