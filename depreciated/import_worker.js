
// WARNING: This worker has been depreciated and all functionality moved to import_worker.js : importMedia

module.exports = {
  importWorker: function (rootPath, media) {
    check_content(rootPath.join(__dirname, "../media"), rootPath.join(__dirname, "../json"), '/media', media);
    return "Starting Scan...";
  }
};

async function check_content(rootPath, writePath, relativePath, media) {

  const start = process.hrtime();


  var fs = require('fs');

  readPath = rootPath;

  // To provide the quickest method of checking weather media already exists, we can create an array of the
  // Location of already known media
  var knownMedia = [];
  media.forEach((data, index) => {
    knownMedia.push(media[index].pod_loc);
  });

  try {
    fs.readdir(readPath, {withFileTypes: true}, (err, content) => {

      if (err) {
        console.log(err);
      } else {
        // Each top level Folder is its own library.
        // Each second level folder is a new album.
        // Media is not supported in the top level directory
        content.forEach(file => {

          if (file.isDirectory()) {
            if (file.name != 'trash') {
              if (file.name != 'purgatory') {
                console.log(`Beginning Check on Library: ${file.name}`);

                // Now to scan the next level down or the actual content of the library.

                fs.readdir(readPath+'/'+file.name, {withFileTypes: true}, (ex, libContent) => {

                  if (ex) {
                    console.log(ex);
                  } else {
                    console.log()
                    libContent.forEach(libFile => {

                      if (libFile.isDirectory()) {
                        // TODO: Build support for sub folder named albums
                      } else if (libFile.isFile()) {
                        if (knownMedia.indexOf(relativePath+'/'+file.name+'/'+libFile.name) == -1) {
                          console.log(`Content Found within ${file.name}: ${libFile.name}`);

                          // Now to gather meta-data and enter this item into the db
                          gatherMetaData(fs, readPath+"/"+file.name+"/"+libFile.name, libFile.name, writePath, relativePath+'/'+file.name+'/'+libFile.name)
                            .then(res => {
                              console.log(res);
                              const durationInMilliseconds = getDurationInMilliseconds (start);
                              console.log(`[FINISHED] Media Item: ${durationInMilliseconds} ms`);
                            })
                            .catch(err => {
                              console.log(err);
                            });
                        } else {
                          console.log(`Skipping ${libFile.name} in ${file.name} since it already exists in the Media Library`);
                        }
                      }
                    });
                  }
                });

              } else {
                console.log('Ignoring Purgatory folder for Media Import...');
              }
            } else {
              console.log('Ignoring Trash folder for Media Import...');
            }

          } else if (file.isFile()) {
            if (file.name != '.gitignore') {
              // Ensure the needed .gitignore does not trigger this warning
              console.log("Content is not supported in the Top Level Directory and will be ignored...");
            }
          }
        });
      }
    });
  } catch(ex) {
    console.error(ex);
  }

}

function gatherMetaData(fs, filePath, fileName, writePath, relativePath) {
  return new Promise(function(resolve, reject) {
    const supported_files = ["jpg", "jpeg", "gif"];
    const supported_videos = ["mp4", "avi"];

    var file_type_check = fileName.split(".");
    var file_type = file_type_check[file_type_check.length - 1];
    // checking the last plae minus one allows accomidation of file names with '.'

    if (supported_files.includes(file_type)) {
      // Now we can gather image meta data about this item

      // All metadata to collect will be declared here
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

        // If the data has been grabbed successfully includes wont be a valid function on an object.
        try {
          if (dimensionsData.includes('ERROR')) {
            console.log(`ERROR in Dimensions Gathering: ${dimensionsData}`);
          }
        } catch(exD) {
          if (exD instanceof TypeError) {
            // This likely means this failed as hoped and includes is not valid on an object, like the successfully returned object.
            // We can ignore these errors
          } else {
            // Otherwise may be a valid error and should be logged. Returning values to empty
            console.log(`Error in checking for Dimensions Error: ${exD}`);
            dimensionsData.height = '';
            dimensionsData.width = '';
          }
        }

      } catch(exD) {
        console.log(`Severe Soft Error in Collecting Dimension Data: ${exD}`);
        // Declare values empty to avoid errors. And assume good data moving forward.
        dimensionsData.height = '';
        dimensionsData.width = '';
      }

      // From here we can assume dimensionsData is safe and a valid format, even if failed.
      try {
        // Gather md5Hash data
        md5Hash = md5Generate(filePath, fs);

        // since the proper return is a string this can be checked without a try catch
        if (md5Hash.includes('ERROR')) {
          console.log(`ERROR in Generating md5Hash: ${md5Hash}`);
          // Since there is no safe way known to recover, exit.
          reject(`ERROR Occured while generating strict hash: ${md5Hash}`);
        }
      } catch(ex) {
        console.log(`md5Hash Error: ${ex}`);
      }

      // Now with the MD5 Hash present move onto next meta-data item. UUID

      try {
        uuidValue = uuidGenerate();
        if (uuidValue.includes('ERROR')) {
          console.log(`ERROR in Generating UUID: ${uuidValue}`);
          // Again no safe way known to recover, exit.
          reject(`ERROR Occured while Generating UUID: ${uuidValue}`);
        }
      } catch(ex) {
        console.log(`UUID Error: ${ex}`);
        // With no safe way to recover from this, exit
        reject(`ERROR Occured Generating UUID: ${ex}`);
      }

      // Now with the UUID we need to gather Exif Data. Which posed a problem in the previous import_worker.
      try {
        exifData = exifCollector(filePath, fs);

        // If this was successful includes is not a valid function and must be try catched
        try {
          if (exifData.includes('ERROR')) {
            console.log(`ERROR in Exif Collection: ${exifData}`);
          } // else assume validity
        } catch(ex) {
          if (ex instanceof TypeError) {
            // likely means success in gathering data
            // ignore
          } else {
            // Otherwise may be a valid error and should be logged. Returning values to empty
            console.log(`ERROR in Exif Collection: ${ex}`);
            exifData = '';
          }
        }
      } catch(ex) {
        console.log(`ERROR In collecting Exif Data: ${ex}`);
        exifData = '';
      }

      // Now to grab values accessible from the file only

      var fsStats = fileStats(fs, filePath, exifData);
      fileStats(fs, filePath, exifData)
        .then((fsStats) => {

          // Now with all the meta data collected, we can save the data and exit.
          let temp_content_json = {
            uuid: uuidValue,
            pod_loc: relativePath,
            time_taken: fsStats.epochTime,
            gallery: [ 'default' ],
            dimensions: {
              height: dimensionsData.height,
              width: dimensionsData.width
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

            var writeLoc = writePath+"/"+uuidValue+".json";

            fs.writeFile(writeLoc, JSON.stringify(temp_content_json, null, 2), function (err) {
              if (err) {
                reject(`ERROR Occured while Writing Data: ${err}`);
              } // else file shoul've been written successfully
              // This could be a trigger for refreshing the db once implemented
              resolve(`Successfully Gathered and Wrote Data for ${contentName}`);
            });
          } catch(ex) {
            reject(`ERROR Occured writing data: ${ex}`);
          }
        });

    } else if (supported_videos.includes(file_type)) {
      // Now we can gather VIDEO meta data about this item
      // TODO
    } else {

      reject(`ERROR: Unsupported file: ${fileName}`);
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
  // supported_files bmp, cur, dds, gif, icns, ico, jpeg, ktx, png, pnm, pam, pbm, pfm, pgm, ppm, psd, svg, tiff, webp, jpg

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

    // loop through the Image File Directory and extract all tags associated. Will start storing them all, except thumbnail.
    var mediaIFD = {};

    for (const ifd in mediaExif) {
      if (ifd != 'thumbnail') {
        for (const tag in mediaExif[ifd]) {
          var ifdTag = piexif.TAGS[ifd][tag]['name'];
          var ifdValue = mediaExif[ifd][tag];

          //console.log(`${ifdTag}: ${ifdValue}`);
          // Set the keys and values of the object dynamically to make a valid object to later be converted to JSON
          mediaIFD[ifdTag] = ifdValue;
        }
      }
    }

    return mediaIFD;

  } catch(ex) {
    console.log(`Error Occured Reading Exif Data: ${ex}`);
    return `ERROR Occured Reading Exif Data: ${ex}`;
  }
}

function timeConverter(date, format ) {
  var dayjs = require('dayjs');
  var customParseFormat = require('dayjs/plugin/customParseFormat');
  dayjs.extend(customParseFormat);

  // having the value of will convert this to milliseconds since epoch time to align with fs return.
  return dayjs(date, format).valueOf();
}

function sizeConverter(size) {
  const byteSize = require('byte-size');

  // Defaults to using metric, so no other values needed. Just loading outisde of the main function to use less resources.
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

        // To create a proper timestamp I will need to compare the Exif data and what the system thinks is the original time.
        // Exif data if present should win this argument.
        // First I can list all the available times, converting to epoch time, and whichever is the earliest, will become the winner.

        let max_value = Number.MAX_SAFE_INTEGER;  // better than previous defaulting to 0
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
        if (isNaN(temp_epochTime)) {
          console.log('epochTime'+temp_epochTime);
          console.log('birthtime'+fsBirthTime);
          console.log('datetime'+exifDateTime);
          console.log('datetimeoriginal'+exifDateTimeOriginal);
          console.log('datetimedigitzed'+exifDateTimeDigitized);
          console.log('currentdate'+currentDate);
        }

        resolve( { byteSize: temp_byteSize, friendlySize: temp_friendlySize, epochTime: temp_epochTime } );
      })
    } catch(ex) {
      console.log(`error: ${ex}`);
      reject(ex);
    }
  });
}

const getDurationInMilliseconds = (start) => {
  const NS_PER_SEC = 1e9;
  const NS_TO_MS = 1e6;
  const diff = process.hrtime(start);

  return(diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS;
}
