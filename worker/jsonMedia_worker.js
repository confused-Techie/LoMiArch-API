// Reworked 'Modular Worker Architecture'

var path = require('path');
var jsonPath = path.join(__dirname, "../json");

// New dependencies of jsonMedia_worker of other media types, to avoid redundant code
var tags = require('./tag_worker.js');
var album = require('./album_worker.js');

var media = [];
var uuid = [];
var gallery = [];
//var tag = [];
//var album = [];

const getMedia = () => {
  return media;
}

const getUUID = () => {
  return uuid;
}

const getGallery = () => {
  return gallery;
}

//const getTag = () => {
//  return tag;
//}

const getAlbum = () => {
  return album;
}

module.exports.getMedia = getMedia;
module.exports.getUUID = getUUID;
module.exports.getGallery = getGallery;
//module.exports.getTag = getTag;
module.exports.getAlbum = getAlbum;

module.exports.importMedia = function() {
  return new Promise(function (resolve, reject) {
    mediaJSON('import')
      .then(res => {
        tags.initTag()
          .then(res => {
            // Once albums are implemented will need to add that as well.
            album.initAlbums()
              .then(res => {
                resolve(res);
              })
              .catch(err => {
                reject(err);
              });
            //resolve(res);
          })
          .catch(err => {
            reject(err);
          });
        //resolve(res);
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

// ---------------------- TAGS FEATURES ---------------------------------------

module.exports.deleteTag = function(name) {
  return new Promise(function (resolve, reject) {
    tags.deleteTag(name)
      .then(res => {
        resolve(res);
      })
      .catch(err => {
        reject(err);
      });
  });
}

module.exports.createTag = function(name, colour) {
  return new Promise(function (resolve, reject) {
    tags.createTag(name, colour)
      .then(res => {
        resolve(res);
      })
      .catch(err => {
        reject(err);
      });
  })
}

module.exports.addTag = function() {
  // TODO
}

module.exports.getTags = function() {
  return new Promise(function (resolve, reject) {
    tags.getTags()
      .then(res => {
        resolve(res);
      })
      .catch(err => {
        reject(err);
      });
  });
}

module.exports.saveTag = function() {
  return new Promise(function (resolve, reject) {
    tags.saveTag()
      .then(res => {
        resolve(res);
      })
      .catch(err => {
        reject(err);
      });
  });
}

// ------------------------------------- ALBUM FEATURES -----------------------

module.exports.getAlbums = function() {
  return new Promise(function (resolve, reject) {
    album.getAlbums()
      .then(res => {
        resolve(res);
      })
      .catch(err => {
        reject(err);
      });
  });
}

// ------------------------- MEDIA FEATURES --------------------------------

module.exports.mediaDetails = function(uuidVar) {
  return new Promise(function (resolve, reject) {
    try {
      if (!uuidVar) reject('UUID Required for Detail Request');

      if (!~uuid.indexOf(uuidVar)) reject('Invalid UUID Value');

      media.forEach(function(tem, index, array) {
        if (media[index].uuid == uuidVar) {
          resolve(media[index]);
        }

        if (index == media.length -1) {
          reject(`UUID ${uuidVar} could not be found in the Media Database`);
        }
      });
    } catch(err) {
      reject(err);
    }
  });
}

module.exports.mediaFile = function(uuidVar) {
  return new Promise(function (resolve, reject) {
    try {
      if (!uuidVar) reject('Media ID Required');
      if (!~uuid.indexOf(uuidVar)) reject('Invalid Media Request');

      media.forEach(function(item, index, array) {
        if (media[index].uuid == uuidVar) {
          resolve(media[index].pod_loc);
        }

        if (index == media.length -1 ) {
          reject(`UUID ${uuidVar} could not be found in the Media Database`);
        }
      });
    } catch(err) {
      reject(err);
    }
  });
}

module.exports.mediaCollection = function(type, currentPage) {
  return new Promise(function (resolve, reject) {
    var max_return = 10;
    console.log(`DEV TYPE: ${type}; DEV PAGE: ${currentPage}`);

    try {
      if (!type) reject('Gallery Type Required');
      if (!currentPage) reject('Page Required');

      //This should handle the different types of gallery requests that can be made
      var galReq = 'default'; // normal galleries are the default return for this API func
      // Keep in mind this would also cause issues if a tag or album or gallery had the same name

      // To make sure non-syncronious requests don't fail to assign the proper requests
      var tagCheck = false;
      var albumCheck = false;

      tags.getTags()
        .then(res => {
          res.forEach(function(item, index, array) {
            if (type == res[index][0]) {
              console.log(`Gallery type matches Tag: ${type} || ${res[index][0]}`);
              galReq = 'tag';
              // If the gallery request is of a tag, return tag media with galReq var
            }
          });
        })
        .catch(err => {
          reject(err);
        });

        album.getAlbums()
          .then(res => {
            res.forEach(function(item, index, array) {
              if (type == res[index].uuid) {
                console.log(`Gallery type matches Album Name: ${type} || ${album[index].name}`);
                galReq = 'album';
              }
            });
          })
          .catch(err => {
            reject(err);
          });

        // TODO: Add support for different Galleries
        if (galReq == 'default') {
          if (!~gallery.indexOf(type)) reject('Invalid Gallery Type');
        }

        var uuid_collection = [];

        media.forEach(function(item, index, array) {
          if (galReq == 'default') {

            if (media[index].gallery.indexOf(type) != -1) {
              // custom json return
              tmp_json = { link: `/media/${media[index].uuid}`, date_taken: `${media[index].date_taken}`, time_taken: media[index].time_taken, type: media[index].type };
              uuid_collection.push(tmp_json);
            }
          } else if (galReq == 'tag') {
            if (media[index].tag.indexOf(type) != -1) {
              // cusotm json return for tag
              tmp_json = { link: `/media/${media[index].uuid}`, date_taken: `${media[index].date_taken}`, time_taken: media[index].time_taken, type: media[index].type };
              uuid_collection.push(tmp_json);
            }

          } else if (galReq == 'album') {
            if (media[index].album.indexOf(type) != -1) {
              // album custom json return
              tmp_json = { link: `/media/${media[index].uuid}`, date_taken: `${media[index].date_taken}`, time_taken: media[index].time_taken, type: media[index].type };
              uuid_collection.push(tmp_json);
            }
          }
        });

        uuid_collection.sort((a, b) => b.time_taken - a.time_taken); // sorts the items by most recent to oldest
        var total_uuid_collection = uuid_collection.length;
        // the above is needed in case data is pruned we still need to pass how much total data there is in this gallery type
        if (uuid_collection.length > max_return) {
          uuid_collection.splice(max_return * currentPage, uuid_collection.length - (max_return * currentPage) );
          // the above should prune the remaining items after the last position on the current page
          if (currentPage != 1) {
            uuid_collection.splice(0, max_return * (currentPage - 1) );
            // If we are not on page one,
            // this should remove the preceding items to the first item on the current page
          }
        } // else can be returned normally as no pruning is needed

        finalized_json = { total: total_uuid_collection, media: uuid_collection };
        resolve(finalized_json);

    } catch(err) {
      reject(err);
    }
  });
}

function mediaJSON(mode) {
  return new Promise(function (resolve, reject) {
    const start = process.hrtime();
    var fs = require('fs');
    var file_handler = require('../modules/file_handler');

    if (mode == 'refresh') {
      // If this is a refresh we can clear all previous variables while the scan is occuring
      //tag = '';
      //album = '';
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

          const fileImportCheck = function() {
            //console.log('fileImportCheck');
            if (itemsProcessed == totalItems && totalItems != 0) {
              logTime(start, 'Media Import');

              try {
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
                      resolveStatus();
                    }

                    if (media.length == galCollection.length && galDone == false) {
                      galCollection.forEach((galData, galIndex) => {
                        // If one item belongs to multiple galleries, we need to descend into that gallery and check each item
                        if (galCollection[galIndex].length > 1) {
                          galCollection[galIndex].forEach((galDataTwo, galIndexTwo) => {
                            if (gallery.indexOf( galCollection[galindex][galindexTwo] ) == -1) {
                              // Since this item is not the gallerydb, add it
                              gallery.push( galCollection[galIndex][galIndexTwo] );
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
                      resolveStatus();
                    }
                  });
                } else {
                  // this would trigger when media is empty, and has no value
                  uuidDone = true;
                  galDone = true;
                  resolveStatus();
                }
              } catch(err) {
                console.log(err);
                reject(`Severe Error: ${err}`);
              }
            }
          };

          content.forEach(file => {

            if (file.isFile()) {
              // We only want to pay attention to files within the json dir

              if (file.name == 'tags.json') {
                // Will instead allow tags to be handled entirely by the tag worker.
                itemsProcessed++;
                fileImportCheck();
                //const tagStart = process.hrtime();

                //file_handler.read_file(jsonPath+'/'+file.name, 'Tag JSON')
                //  .then(res => {
                //    if (res == 'nodata') {
                      // Since the file is empty, leave the variable alone
                //      tag = '';
                //      itemsProcessed++;
                //      logTime(tagStart, 'Tag Import');
                //    } else {
                //      tag = res;
                //      itemsProcessed++;
                //      logTime(tagStart, 'Tag Import');
                //    }
                //  })
                //  .catch(err => {
                //    reject(err);
                //  });
              } else if (file.name == 'albums.json') {
                // Will instead allow albums to be handled entirely by the tag worker.
                itemsProcessed++;
                fileImportCheck();
                //const albumStart = process.hrtime();

                //file_handler.read_file(jsonPath+'/'+file.name, 'Album JSON')
                //  .then(res => {
                //    if (res == 'nodata') {
                //      album = '';
                //      itemsProcessed++;
                //      logTime(albumStart, 'Album Import');
                //    } else {
                //      album = res;
                //      itemsProcessed++;
                //      logTime(albumStart, 'Album Import');
                //    }
                //  })
                //  .catch(err => {
                //    reject(err);
                //  });
              } else if (file.name == '.gitignore') {
                // Ignore the gitignore file, but still put it into the count of total items
                itemsProcessed++;
                fileImportCheck();
              } else {
                // Now to process the regular JSON data.
                const jsonStart = process.hrtime();
                try {

                  file_handler.read_file(jsonPath+'/'+file.name, 'Media JSON')
                    .then(res => {
                      media.push(res);
                      itemsProcessed++;
                      logTime(jsonStart, 'Media JSON Import');
                      fileImportCheck();
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
              // Seems adding a promise to the file handler rather than using fs Sync functions has introduced
              // an issue that could prevent this check and itemsProcessed == totalItems check from being seen.
              // Will attempt to introduce const fileImportCheck and resolveStatus check respectively.
              // Otherwise fs may be needed here again.
              // or introduce syncronious reads in file handler
              logTime(start, 'Total Import');
              resolve('SUCCESS');
            }
          });



          const resolveStatus = function() {
            if (galDone && uuidDone) {
              logTime(start, 'Total Import');
              resolve('SUCCESS');
            }
          };

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
