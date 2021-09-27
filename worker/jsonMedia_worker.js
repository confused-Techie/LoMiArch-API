// Reworked 'Modular Worker Architecture'

var path = require('path');
var jsonPath = path.join(__dirname, "../json");

var media = [];
var uuid = [];
var gallery = [];
var tag = [];
var album = [];

const getMedia = () => {
  return media;
}

const getUUID = () => {
  return uuid;
}

const getGallery = () => {
  return gallery;
}

const getTag = () => {
  return tag;
}

const getAlbum = () => {
  return album;
}

module.exports.getMedia = getMedia;
module.exports.getUUID = getUUID;
module.exports.getGallery = getGallery;
module.exports.getTag = getTag;
module.exports.getAlbum = getAlbum;

module.exports.importMedia = function() {
  return new Promise(function (resolve, reject) {
    mediaJSON('import')
      .then(res => {
        resolve(res);
      })
      .catch(err => {
        reject(err);
      });
  });
}

module.exports.refreshMedia = function() {
  return new Promise(function (resolve, reject) {
    mediaJSON('refresh')
      .then(res => {
        resolve(res);
      })
      .catch(err => {
        reject(err);
      });
  })
}

function mediaJSON(mode) {
  return new Promise(function (resolve, reject) {
    const start = process.hrtime();
    var fs = require('fs');
    var file_handler = require('../modules/file_handler');

    if (mode == 'refresh') {
      // If this is a refresh we can clear all previous variables while the scan is occuring
      tag = '';
      album = '';
      media = '';
    }

    try {

      var itemsProcessed = 0;
      var totalItems = 0;
      var galDone = false;
      var uuidDone = false;

      fs.readdir(jsonPath, {withFileTypes: true}, (err, content) => {
        if (err) {
          reject(`ERROR Occured Reading Import Media: ${err}`);
        } else {
          // Assign Content
          if (totalItems == 0) {
            totalItems = content.length;
          }

          content.forEach(file => {

            if (file.isFile()) {
              // We only want to pay attention to files within the json dir

              if (file.name == 'tags.json') {
                const tagStart = process.hrtime();

                file_handler.read_file(jsonPath+'/'+file.name, 'Tag JSON')
                  .then(res => {
                    if (res == 'nodata') {
                      // Since the file is empty, leave the variable alone
                      tag = '';
                      itemsProcessed++;
                      logTime(tagStart, 'Tag Import');
                    } else {
                      tag = res;
                      itemsProcessed++;
                      logTime(tagStart, 'Tag Import');
                    }
                  })
                  .catch(err => {
                    reject(err);
                  });
              } else if (file.name == 'albums.json') {
                const albumStart = process.hrtime();

                file_handler.read_file(jsonPath+'/'+file.name, 'Album JSON')
                  .then(res => {
                    if (res == 'nodata') {
                      album = '';
                      itemsProcessed++;
                      logTime(albumStart, 'Album Import');
                    } else {
                      album = res;
                      itemsProcessed++;
                      logTime(albumStart, 'Album Import');
                    }
                  })
                  .catch(err => {
                    reject(err);
                  });
              } else if (file.name == '.gitignore') {
                // Ignore the gitignore file, but still put it into the count of total items
                itemsProcessed++;
              } else {
                // Now to process the regular JSON data.
                const jsonStart = process.hrtime();
                try {

                  file_handler.read_file(jsonPath+'/'+file.name, 'Media JSON')
                    .then(res => {
                      media.push(res);
                      itemsProcessed++;
                      logTime(jsonStart, 'Media JSON Import');
                    })
                    .catch(err => {
                      reject(`ERROR Occured on JSON Data Import Read: ${err}`);
                    });
                } catch(err) {
                  reject(`ERROR Occured on JSON Data Import: ${err}`);
                }
              }
            } else if (file.isDirectory()) {
              console.log(`Directories are not supported at the Root of the JSON Directory...`);
            } else {
              console.log(`Unrecognized Content in the Root of the JSON Directory...`);
            }

            // Check this data within the Loop
            if (itemsProcessed == totalItems && totalItems != 0) {
              logTime(start, 'Media Import');

              try {
                // UUID Import
                const startUUID = process.hrtime();
                var uuidProcessed = 0;

                const startGal = process.hrtime();
                var galCollection = [];

                if (media != '') {
                  media.forEach((data, index) => {
                    uuid.push(media[index].uuid);
                    uuidProcessed++;

                    galCollection.push(media[index].gallery);

                    if (media.length == uuidProcessed && uuidDone == false) {
                      logTime(startUUID, 'UUID Import');
                      uuidDone = true;
                    }

                    if (media.length == galCollection.length && galDone == false) {
                      galCollection.forEach((galData, galIndex) => {
                        // If one item belongs to multiple galleries, we need to descend into that gallery and check each item
                        if (galCollection[galIndex].length > 1) {
                          galCollection[galIndex].forEach((galDataTwo, galIndexTwo) => {
                            if (gallery.indexOf( galCollection[galIndex][galIndexTwo] ) == -1) {
                              // Since this item is not in the gallery, add it
                              gallery.push( galCollection[galIndex][galIndextwo] );
                            }
                          });
                        } else {
                          if (gallery.indexOf( galCollection[galIndex][0] ) == -1) {
                            // Since this item is not in the gallery, add it
                            gallery.push( galCollection[galIndex][0] );
                          }
                        }
                      });

                      // At this point the galleries should be done being imported
                      logTime(startGal, 'Gallery Import');
                      galDone = true;
                    }
                  });
                } else {
                  // this would trigger when media i empty, and has no value
                  uuidDone = true;
                  galDone = true;
                }
              } catch(err) {
                reject(`Severe Error: ${ex}`);
              }
            }

            // Check for the dependent items being done to complete the import
            if (galDone && uuidDone) {
              logTime(start, 'Total Import');
              resolve('SUCCESS');
            }
          });
        }
      })
    } catch(ex) {
      reject(`Severe Error: ${ex}`);
    }
  });
}

function logTime(start, phrase) {
  var getDurationInMilliseconds = require('./getDurationInMilliseconds');
  const durationInMilliseconds = getDurationInMilliseconds.getDurationInMilliseconds(start);
  console.log(`[FINISHED:jsonMedia_worker] ${phrase}: ${durationInMilliseconds} ms`);
}
