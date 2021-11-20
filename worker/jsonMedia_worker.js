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
    MediaJSONv2('import')
      .then(res => {
        tags.initTag()
          .then(res => {
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

module.exports.addTag = function(uuidVar, tagToAdd) {
  return new Promise(function (resolve, reject) {
    try {
      if (!uuidVar) reject('UUID Required for Adding Tag to Media');
      if (!~uuid.indexOf(uuidVar)) reject('Invalid UUID Value');

      // TODO: Add check to ensure tag already exists

      media.forEach(function(item, index, array) {
        if (media[index].uuid == uuidVar) {
          media[index].tag.push(tagToAdd);
        }
        if (index == media.length -1) {
          reject(`UUID ${uuidVar} Could not be found in Media DB`);
        }
      });
    } catch(err) {
      reject(err);
    }
  });
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

module.exports.createAlbum = function(albumName, albumPreview, albumCreator) {
  return new Promise(function (resolve, reject) {
    // since the webUI is going to request based off the UniversalPath, no conversion is needed here.
    album.createAlbum(albumName, albumPreview, albumCreator)
      .then(res => {
        resolve(res);
      })
      .catch(err => {
        reject(err);
      });
  });
}

module.exports.deleteAlbum = function(albumUUID) {
  return new Promise(function (resolve, reject) {
    album.deleteAlbum(albumUUID)
      .then(res => {
        resolve(res);
      })
      .catch(err => {
        reject(err);
      });
  });
}

module.exports.saveAlbums = function() {
  return new Promise(function (resolve, reject) {
    album.saveAlbums()
      .then(res => {
        resolve(res);
      })
      .catch(err => {
        reject(err);
      });
  });
}

module.exports.editAlbum = function() {
  // not implemented yet
  reject('This feature is not currently implemented.');

}

module.exports.contentAddAlbum = function(mediaUUID, albumUUID) {
  return new Promise(function (resolve, reject) {
    const indexToReplace = media.findIndex(findItem => findItem.uuid === mediaItem.uuid);

    if (album.validateAlbum(albumUUID) == -1) {
      reject(`Album UUID is invalid: ${albumUUID}`);
    } // else the id is valid and this can continue

    if (indexToReplace != -1) {
      var tempJSON = media[indexToReplace];

      tempJSON.album.push(albumUUID);
      // the above adds the new album uuid to the array of the extracted object.
      // sending to modifyMedia will then enter this into the file itself and the active db
      _this.modifyMedia(tempJSON, indexToReplace)
        // modifyMedia doesn't require an index, but since we have it already we can provide it so it doesn't need to find it a second time. 
        .then(res => {
          resolve('SUCCESS');
        })
        .catch(err => {
          reject(err);
        });
    } else {
      reject(`Media UUID is invalid: ${mediaUUID}`);
    }
  });
}

// ------------------------- MEDIA FEATURES --------------------------------

module.exports.mediaDetails = function(uuidVar) {
  return new Promise(function (resolve, reject) {
    try {
      if (!uuidVar) reject('UUID Required for Detail Request');

      if (!~uuid.indexOf(uuidVar)) reject('Invalid UUID Value');

      media.forEach(function(item, index, array) {
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

module.exports.modifyMedia = function(mediaItem, mediaProvidedIndex) {
  // This will accept the object of the peice of media we want to modify.
  // This is the newly modified object, and will work as long as the UUID has not changed.
  // And will replace the original value of the item completly.
  return new Promise(function (resolve, reject) {
    if (mediaItem == '' || mediaItem == null ) reject('A Media Item needs to be provided');

    const saveModifyMedia = function() {
      var file_handler = require('../modules/file_handler.js');

      file_handler.write_file(path.join(__dirname, `../json/${mediaItem.uuid}.json`), mediaItem, `Modifying Media: ${mediaItem.uuid}`)
        .then(res => {
          // with the file successfully written the in memroy db has already been updated
          resolve('SUCCESS');
        })
        .catch(err => {
          reject(err);
        });
    }

    if (mediaProvidedIndex) {
      // since the index has been provided we don't need to find it wasting time
      media[mediaProvidedIndex] = mediaItem;
      // Now with the in memory db updated, we just need to save the data.
      // and we can call the previously delcared saveModifyMedia
      saveModifyMedia();
    } else {
      // If the provided index wasn't provided we can calculate it ourselves, letting this have the most flexibiliyt
      const indexToReplace = media.findIndex(findItem => findItem.uuid ==- mediaItem.uuid);
      if (indexToReplace != -1) {
        media[indexToReplace] = mediaItem;
        saveModifyMedia();
      } else {
        reject(`Media UUID Invalid: ${mediaItem.uuid}`);
      }
    }
  });
}

module.exports.removeMedia = function(uuidVar, reason) {
  return new Promise(function (resolve, reject) {
    const start = process.hrtime();
    var file_handler = require('../modules/file_handler.js');

    console.log('Removal of Media Requested');

    try {
      if (!uuidVar) reject('Media ID Required');
      if (!~uuid.indexOf(uuidVar)) reject('Invalid Media Request');
      if (!reason) reject('Reason required for Media Removal');
      if (reason != 'purgatory' && reason != 'trash') reject(`Not Valid Removal Reason Requested: ${reason}`);

      const blacklistWrite = function(dataToWrite) {
        file_handler.write_file(path.join(__dirname, '../settings/blacklist.json'), dataToWrite, 'Blacklist File')
          .then(res => {
            if (res == 'SUCCESS') {
              resolve('SUCCESS');
            } else {
              reject(`Writing to Blacklist resolved incorrectly: ${res}`);
            }
          })
          .catch(err => {
            reject(`Error Writing to Blacklist: ${err}`);
          });
      };

      //logtime start phrase
      media.forEach(function(item, index, array) {
        if (media[index].uuid == uuidVar) {
          // This is the matching item.
          let removedItem = media.splice(index, 1);

          // Now to move this json data into a purgatory or trash location depending on the reason provided.
          // Keep in mind this data is all being written to the blacklist file.
          file_handler.read_file(path.join(__dirname, '../settings/blacklist.json'), 'Blacklist File')
            .then(res => {
              // Now with the blacklist file we can add the new removed item to it.

              if (res == 'nodata') {
                // The file is empty
                var jsonToWrite = [];
                var tempBlacklistJSON = {
                  uuid: `${removedItem.uuid}`,
                  reason: `${reason}`,
                  time_removed: Date.now(),
                  data: removedItem
                };

                jsonToWrite.push(tempBlacklistJSON);
                blacklistWrite(jsonToWrite);
              } else {
                // File is not empty, add to it
                var tempBlacklistJSON = {
                  uuid: `${removedItem.uuid}`,
                  reason: `${reason}`,
                  time_removed: Date.now(),
                  data: removedItem
                };

                res.push(tempBlacklistJSON);
                blacklistWrite(res);
              }
            })
            .catch(err => {
              reject(`Error Reading Blacklist File: ${err}`);
            });
        }

        if (index == media.length -1) {
          reject(`UUID ${uuidVar} could not be found in the Media Database`);
        }
      });
    } catch(err) {
      reject(`Error Occured During JSON Media Removal: ${err}`);
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

function mediaJSON(mode) {  // If setting the import back to this rememebr to change the logTime to func method
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

          // Moving the declaration of resolveStatus before declaration of fileImportCheck, since when the media file is emtpy
          // resolveStatus is called and failed as its not declared yet.
          const resolveStatus = function() {
            if (galDone && uuidDone) {
              logTime(start, 'Total Import');
              resolve('SUCCESS');
            }
          };

          const fileImportCheck = function() {
            //console.log('fileImportCheck');
            if (itemsProcessed == totalItems && totalItems != 0) {
              console.log( `fileImportCheck() logTime`);
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

        }
      })
    } catch(ex) {
      reject(`Severe Error: ${ex}`);
    }
  });
}

function MediaJSONv2(mode) {
  return new Promise(function (resolve, reject) {

    // After the refactor moving certian features into other fucntions and API's within the album && tag workers, these code is unnecisaarily messy, and it may be best
    // to move it into here to be as simple and fast as possible.
    // Plus the bugs duplicated imports,

    const start = process.hrtime();
    var fs = require('fs');
    var file_handler = require('../modules/file_handler.js');
    var logger = require('../modules/logger.js');

    if (mode == 'refresh') {
      // Clearing the media value to allow a full refresh
      media = '';
    }

    try {
      // Declare the variables for use during the import

      var itemsProcessed = 0;
      var totalItems = 0;

      // Instead of looping through again, if we temporarily assign the JOSN data to a var, then extract uuid and gallery from there, we ar
      // no longer looping through all items twice on import
      var uuidCollectionTemp = [];
      var galCollectionTemp = [];

      fs.readdir(jsonPath, {withFileTypes: true}, (err, content) => {
        if (err) {
          reject(`Error Occured Reading Import Media: ${err}`);
        } else {

          // Edge case to check if there are a total of zero items.
          if (content.length == 0) {
            // If there are zero items we can move straight to gallery checking then UUID, which we also know will be zero. But should have edge case built in.
            // Since there is no data, we know we can't import any galleries or uuid's.
            // All values are declared already, and we can resolve.
            logger.log('notice', 'jsonMedia_worker.js', 'MediaJSONv2', `No data within JSON Folder, nothing to import...`);
            resolve('SUCCESS');
          } else {
            if (totalItems == 0) totalItems = content.length;
            // After ensuring there are items to work with but totalItems hasn't been set yet
          }

          // This function can allow quickly checking if all files have been handled.
          const fileImportCheck = function() {
            if (itemsProcessed == totalItems) {
              // This means all files have been done.

              // do a quick check for if any media files were imported. Since the content.lenth = 0 doesn't account for .gitignore, tags, and albums that will be there
              if (media.length == 0) {
                logTime(start, 'No JSON Media Data to Import...', 'MediaJSONv2');
                resolve('SUCCESS');
              } else {
                logTime(start, 'All Media JSON has been Imported', 'MediaJSONv2');
                try {
                  const startGal = process.hrtime();

                  // now with knowing the import has looped through all items, and we have already successfully grabbed all uuid, and gals we can convert gal
                  galCollectionTemp.forEach((galData, galIndex) => {
                    // If one itme belongs to multiple galleries, we need to descend into that gallery and check each item
                    if (galCollectionTemp[galIndex].length> 1) {
                      galCollectionTemp[galIndex].forEach((galDataTwo, galIndexTwo) => {
                        if (gallery.indexOf( galCollectionTemp[galIndex][galIndexTwo] ) == -1) {
                          // since this item is not in the gallerydb, add it
                          gallery.push( galCollectionTemp[galIndex][galIndexTwo] );
                        }
                      });
                    } else {
                      if (gallery.indexOf( galCollectionTemp[galIndex][0] ) == -1) {
                        // since this item is not in the gallery, add it
                        gallery.push( galCollectionTemp[galIndex][0] );
                      }
                    }
                  });

                  // At this point the galleries should be done being converted.
                  logTime(startGal, 'Gallery Import Conversion', 'MediaJSONv2');
                  logTime(start, 'Total JSON Data Import', 'MediaJSONv2');
                  resolve('SUCCESS');
                } catch(err) {
                  reject(`Severe Error During fileImportCheck: ${err}`);
                }
              }

            } // else the fileImportCHeck isn't ready to be run
          };
          // We want to check the contents of each file, knowing tags and albums have their own import now
          content.forEach(file => {
            if (file.isFile()) {
              if (file.name == 'tags.json') {
                // Should only be handled by tag worker. We will just add to total count to ignroe
                itemsProcessed++;
                fileImportCheck();
              } else if (file.name == 'albums.json') {
                itemsProcessed++;
                fileImportCheck();
              } else if (file.name == '.gitignore') {
                itemsProcessed++;
                fileImportCheck();
              } else {
                // Now here we can actuall import the JSON data
                const jsonStart = process.hrtime();
                try {

                  file_handler.read_file(jsonPath+'/'+file.name, 'JSON Media File')
                    .then(res => {
                      // Assign any values needed within the JSON data
                      uuidCollectionTemp.push(res.uuid);
                      galCollectionTemp.push(res.gallery);
                      media.push(res);
                      itemsProcessed++;
                      logTime(jsonStart, `Media JSON: ${file.name} Import`, 'MediaJSONv2');
                      fileImportCheck();
                    })
                    .catch(err => {
                      reject(`Error Occured on JSON Data Import Read for ${file.name}; ${err}`);
                    });
                } catch(err) {
                  // regular json failed to import
                  reject(`ERROR Occured on JSON Data Import: ${err}`);
                }
              }
            } else if (file.isDirectory()) {
              // file is directory, which is not supported.
              logger.log('warning', 'jsonMedia_worker.js', 'MediaJSONv2', `Directories are not supported at the Root of the JSON Directory...`);
            } else {
              // unknown file,
              logger.log('warning', 'jsonMedia_worker.js', 'MediaJSONv2', `Unrecognized Content in the Root of the JSON Directory...`);
            }
          });
        }
      });

    } catch(err) {
      reject(`Severe Error: ${err}`);
    }
  });
}

function logTime(start, phrase, func) {
  var getDurationInMilliseconds = require('./getDurationInMilliseconds');
  var logger = require('../modules/logger.js');
  const durationInMilliseconds = getDurationInMilliseconds.getDurationInMilliseconds(start);
  logger.log('debug', 'jsonMedia_worker.js', func, `${phrase}: ${durationInMilliseconds} ms`);
}
