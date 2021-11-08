// Reworked 'Modular Worker Architecture'

var fs = require('fs');
var path = require('path');
var rootPath = path.join(__dirname, "../media");
var writePath = path.join(__dirname, "../json");

module.exports.deleteMedia = function(filePath, reason, fileName) {
  // This should expect a reason, to then know if the file should be moved to
  // Purgatory or moved to the trash
  return new Promise(function (resolve, reject) {
    console.log('Removal of Media Requested...');

    const start = process.hrtime();

    var file_handler = require('../modules/file_handler.js');

    if (filePath == '' || filePath == null || reason == '' || reason == null || fileName == '' || fileName == null) {
      reject('Required Value for Delete Media Missing...');
    } else {
      // Regaurdless of the reason, this will need to do two things.
      // Copy the file to the proper location
      // And then delete the original file.
      // The only difference here will be the location it needs to move two.
      if (reason == 'purgatory') {
        var purgPath = path.join(__dirname, `../media/purgatory/${fileName}`);

        file_handler.copy_file(filePath, purgPath, fileName)
          .then(res => {
            if (res == 'SUCCESS') {
              // Now that the file has successfully been copied to the new location, we will request deletion of the original file.
              file_handler.delete_file(filePath, fileName)
                .then(res => {
                  if (res == 'SUCCESS') {
                    // The file has now been successfully deleted.
                    logTime(start, `Moving ${fileName} to Purgatory`);
                    resolve('SUCCESS');
                  } else {
                    reject(`Unknown Resolve on File Deletion: ${res}`);
                  }
                })
                .catch(err => {
                  reject(`Failed to Delete file During Deletion: ${err}`);
                });
            } else {
              reject(`Unknown Resolve on Copy File: ${res}`);
            }
          })
          .catch(err => {
            reject(`Failed to Copy File During Deletion: ${err}`);
          });

      } else if (reason == 'trash') {
        var trashPath = path.join(__dirname, `../media/trash/${fileName}`);

        file_handler.copy_file(filePath, trashPath, fileName)
          .then(res => {
            // Now with a successfully copied file we can delete the original.
            file_handler.delete_file(filePath, fileName)
              .then(res => {
                // Now with the file successfully deleted we can resolve.
                logTime(start, `Moving ${fileName} to the Trash Folder`);
                resolve('SUCCESS');
              })
              .catch(err => {
                reject(`Failed to Delete file During Deletion: ${err}`);
              })
          })
          .catch(err => {
            reject(`Failed to Copy File During Deletion: ${err}`);
          });

      } else {
        reject(`Unrecognized reason for media removal: ${reason}; Valid reasons: purgatory, trash`);
      }
    }
  });
}

module.exports.importMedia = function(media) {
  console.log('Starting Scan...');

  const start = process.hrtime();

  // To provide the quickets method of checking wether media already exists we can create an array of the
  // location of already known media
  var knownMedia = [];
  media.forEach((data, index) => {
    knownMedia.push(media[index].pod_loc);
  });

  try {
    fs.readdir(rootPath, {withFileTypes: true}, (err, content) => {
      if (err) {
        console.log(err);
      } else {
        // Each top level Folder is its own library
        // Each second level folder is a new album
        // Media is not supported in the top level directory
        content.forEach(file => {
          if (file.isDirectory()) {
            if (file.name != 'trash' && file.name != 'purgatory') {
              console.log(`Beginning Check on Library: ${file.name}`);

              // Now to scan the next level down for the actual content of the library or Albums

              fs.readdir(rootPath+'/'+file.name, {withFileTypes: true}, (ex, libContent) => {
                if (ex) {
                  console.log(err);
                } else {
                  libContent.forEach(libFile => {
                    if (libFile.isDirectory()) {
                      // TODO: Build support for sub folder named albums

                    } else if (libFile.isFile()) {
                      handleMedia(fs, knownMedia, file.name, libFile.name)
                        .then(res => {
                          console.log(res);
                          logTime(start, `Scanning and Writing Media Item: ${libFile.name}`);
                        })
                        .catch(err => {
                          console.log(err);
                        });
                    } else {
                      console.log(`Unrecognized Item in Library ${file.name}: ${libFile.name}`);
                    }
                  });
                }
              });
            } // else ignore both trash and purgatory files
          } else if (file.isFile()) {
            if (file.name != '.gitignore') {
              // Ensure the needed .gitignore does not trigger this warning
              console.log(`Content is not supported in the Top Level Directory of Media, and will be ignored: ${file.name}`);
            }
          } else {
            console.log(`Unrecognized Item in Top Level Directory of Media: ${file.name}`);
          }
        });
      }
    });
  } catch(err) {
    console.log(err);
  }
}

function handleMedia(fs, knownMedia, libraryName, fileName) {
  return new Promise(function (resolve, reject) {
    var filePath = rootPath+'/'+libraryName+'/'+fileName;
    if (knownMedia.indexOf(filePath) == -1) {
      console.log(`Content Found within ${libraryName}: ${fileName}`);

      // Now to gather metadata for this item and write the JSON files

      const supported_files = ["jpg", "jpeg", "gif"];
      const supported_videos = ["mp4", "avi"];

      var file_type_check = fileName.split(".");
      var file_type = file_type_check[file_type_check.length -1];
      // Checking the last place minus one allows accomidation of the file names with '.'

      if (supported_files.includes(file_type)) {
        // Now we can gather image meta data about this item

        // All metadata to collect will be delcared here
        let contentName = fileName;
        let contentSpecificType = file_type;
        let contentType = 'image';
        let dimensionsData;
        let exifData;
        let md5Hash;
        let uuidValue;
        let epochTime;
        let byteSize;
        let friendlySize;

        try {

          // Gather Dimensions Data
          dimensionsData = collectDimensions(filePath);
          // If the data has been grabbed successfully includes wont be a valid function on an object
          try {
            if (dimensionsData.includes('ERROR')) {
              console.log(`ERROR in Dimencions Gathering: ${dimensionsData}`);
              // Declare empty values to avoid errors, and assume good data going forward
              dimensionsData = undefined;
              dimensionsData.height = '';
              dimensionsData.width = '';
            }
          } catch(errD) {
            if (errD instanceof TypeError) {
              // This likely means this failed as hoped and includes is not valid on an object, like the successfully returned
              // Object ought to be. We can ignore these errors
            } else {
              // Otherwise may be a valid error and should be logged. Returning values to empty
              console.log(`Error in checking for Dimensions Error: ${errD}`);
              dimensionsData = undefined;
              dimensionsData.height = '';
              dimensionsData.width = '';
            }
          }
        } catch(errD) {
          console.log(`Severe Soft Error in Collecting Dimensions Data: ${errD}`);
          // Declare values empty to avoid errors and assume good data moving forward
          dimensionsData = undefined;
          dimensionsData.height = '';
          dimensionsData.width = '';
        }

        // From here we can assume dimensionsData is safe and a valid format. Even if failed
        try {
          //Gather MD5Hash
          md5Hash = md5Generate(filePath, fs);

          // since the proper return is a string this can be checked without a try catch
          if (md5Hash.includes('ERROR')) {
            console.log(`ERROR in Generating md5Hash: ${md5Hash}`);
            // Since there is no safe way known to recover, exit.
            reject(`ERROR Occured while generating strict hash: ${md5Hash}`);
          } // Else we can assume valid data
        } catch(errH) {
          console.log(`md5Hash Error: ${errH}`);
          // Since again we should assume the md5Hash data is invalid we need to exit
          reject(`md5Hash Generic Error: ${errH}`);
        }

        // md5Hash && dimensionData; UUID
        try {
          uuidValud = uuidGenerate();

          if (uuidValue.includes('ERROR')) {
            console.log(`ERROR in Generating UUID: ${uuidValue}`);
            // Again no safe way to recover
            reject(`ERROR in Generating UUID: ${uuidValue}`);
          } // Else assume valid data
        } catch(errU) {
          console.log(`uuidValue Generic Error: ${errU}`);
          reject(`uuidValue Generic Error: ${errU}`);
        }

        // uuid && md5Hash && dimensionData; exifData

        try {
          exifData = exifCollector(filePath, fs);

          // If successful includes is not a valid function
          try {
            if (exifData.includes('ERROR')) {
              console.log(`ERROR in Exif Collection: ${exifData}`);
              exifData = '';  // Set to default to avoid errors
            } // else assume validity
          } catch(err) {
            if (err instanceof TypeError) {
              // likely means success in gathering data
              // ignore
            } else {
              // Valid error and should be logged
              console.log(`ERROR in Exif Collection: ${err}`);
              exifData = '';
            }
          }
        } catch(errE) {
          console.log(`Generic Error in Collecting Exif Data: ${errE}`);
          exifData = '';
        }

        // exif & uuid & md5Hash & dimensionsData; File Data

        var fsStats = fileStats(fs, filePath, exifData);
        fileStats(fs, filePath, exifData)
          .then((fsStats) => {

            // Now with all the meta data collected, we can save the data and exit
            let temp_content_json = {
              uuid: uuidValue,
              pod_loc: relativePath,
              time_taken: fsStats.epochTime,
              gallery: [ 'default' ],
              dimensions: {
                height: dimensionsData.height,
                width: dimensionsData.width,
              },
              md5: md5Hash,
              exifData: exifData,
              tag: [ ],
              album: [ ],
              type: contentType,
              exactType: contentSpecificType,
              bytes: fsStats.byteSize,
              friendlySize: fsStats.friendlySize
            }

            try {

              var writeLoc = writePath+'/'+uuidValue+'.json';

              var file_handler = require('../modules/file_handler');
              file_handler.write_file(writeLoc, temp_content_json, 'Media JSON File')
                .then(res => {
                  resolve(`Successfully Gathered and Wrote Data for ${contentName}`);
                })
                .catch(err => {
                  reject(`ERROR Occured writing Data: ${err}`);
                });
            } catch(err) {
              reject(`Generic Error Occured writing Data: ${err}`);
            }
          });
      } else if (supported_videos.includes(file_type)) {
        // TODO: Gather Video Meta data and write the file
      } else {
        reject(`ERROR: Unsupported File: ${fileName}`);
      }

    } else {
      resolve(`Skipping ${fileName} in ${libraryName} since it already exists in the Media Libary`);
    }
  });
}

function uuidGenerate() {
  const { v4: uuidv4 } = require('uuid');

  try {
    return uuidv4();
  } catch(ex) {
    return `ERROR Occured: ${ex}`;
  }
}

function md5Generate(file, fsImport) {
  const CryptoJS = require('crypto-js');

  const rawFile = fsImport.readFileSync(file).toString('binary');

  try {
    const md5Hash = CryptoJS.MD5(rawFile);
    return md5Hash.toString(CryptoJS.enc.Hex);
  } catch(ex) {
    return `ERROR Occured: ${ex}`;
  }
}

function collectDimensions(file) {
  const sizeOf = require('image-size');

  try {
    const dimensions = sizeOf(file);
    return dimensions;
  } catch(ex) {
    return `ERROR Occured: ${ex}`;
  }
}

function exifCollector(file, fsImport) {
  const piexif = require('piexifjs');

  try {
    const getBase64Data = filename => fsImport.readFileSync(filename).toString('binary');
    const getExif = filename => piexif.load(getBase64Data(filename));
    const mediaExif = getExif(file);

    // Loop through the Image File Direcotry and extract all tags associated. Will start sorting them all except thumbnail.
    var mediaIFD = {};

    for (const ifd in mediaExif) {
      if (ifd != 'thumbnail') {
        for (const tag in mediaExif[ifd]) {
          var ifdTag = piexif.TAGS[ifd][tag]['name'];
          var ifdValue = mediaExif[ifd][tag];

          mediaIFD[ifdTag] = ifdValue;
        }
      }
    }

    return mediaIFD;
  } catch(ex) {
    return `ERROR Occred Reading Exif Data: ${ex}`;
  }
}

function timeConverter(date, format) {
  var dayjs = require('dayjs');
  var customParseFormat = require('dayjs/plugin/customParseFormat');
  dayjs.extend(customParseFormat);
  // having the value of will conver this to milliseconds since epoch time to align with fs return.
  return dayjs(date, format).valueOf();
}

function sizeConverter(size) {
  const byteSize = require('byte-size');
  // Defaults to using metric, so no other values needed
  return byteSize(size);
}

function fileStats(fsImport, filePath, exifData) {
  return new Promise(function(resolve, reject) {

    let temp_byteSize;
    let temp_friendlySize;
    let temp_epochTime;

    try {
      fsImport.stat(filePath, (err, stats) => {
        if (stats.size) {
          temp_byteSize = stats.size;
          temp_friendlySize = sizeConverter(temp_byteSize);
        } else {
          temp_byteSize = 0;
          temp_friendlySize = 0;
        }

        // To create a proper timestamp I will need to compare the Exif Data and what the system thinks is the original time.
        // Exif Data if present should win this argument.
        // First I can list all the vailable times, converitng to epoch time, and whicever is the earliest, will win

        let max_value = Number.MAX_SAFE_INTEGER;  // To ensure it never wins the argument
        let fsBirthTime;
        let exifDateTime;
        let exifDateTimeOriginal;
        let exifDateTimeDigitized;
        let currentDate = Date.now();

        if (stats.birthtimeMs) {
          if (typeof stats.birthtimeMs !== undefined) {
            fsBirthTime = stats.birthtimeMs;
          } else {
            fsBirthTime = max_value;
          }
        } else {
          fsBirthTime = max_value;
        }

        if (exifData.DateTime) {
          exifDateTime = timeConverter(exifData.DateTime, 'YYYY:MM:DD HH:mm:ss');
        } else {
          exifDateTime = max_value;
        }

        if (exifData.DateTimeOriginal) {
          exifDateTimeOriginal = timeConverter(exifData.DateTimeOriginal, 'YYYY:MM:DD HH:mm:ss');
        } else {
          exifDateTimeOriginal = max_value;
        }

        if (exifData.DateTimeDigitized) {
          exifDateTimeDigitized = timeConverter(exifData.DateTimeDigitized, 'YYYY:MM:DD HH:mm:ss');
        } else {
          exifDateTimeDigitized = max_value;
        }

        // with all time formats declared we can compare
        const earliestEpoch = Math.min(fsBirthTime, exifDateTime, exifDateTimeOriginal, exifDateTimeDigitized, currentDate);
        temp_epochTime = earliestEpoch;

        // NULL CHECK
        if (isNaN(tempEpochTime)) {
          console.log('epochTime'+temp_epochTime);
          console.log('birthtime'+fsBirthTime);
          console.log('datetime'+exifDateTime);
          console.log('datetimeoriginal'+exifDateTimeOriginal);
          console.log('datetimedigitzed'+exifDateTimeDigitized);
          console.log('currentdate'+currentDate);
        }

        resolve( { byteSize: temp_byteSize, friendlySize: temp_friendlySize, epochTime: temp_epochTime } );
      });
    } catch(ex) {
      reject(ex);
    }
  });
}

function logTime(start, phrase) {
  var getDurationInMilliseconds = require('./getDurationInMilliseconds');
  const durationInMilliseconds = getDurationInMilliseconds.getDurationInMilliseconds(start);
  console.log(`[FINISHED:media_worker] ${phrase}: ${durationInMilliseconds} ms`);
}
