
// WARNING: This worker has been depreciated and all functionality moved to jsonmedia_worker.js

// dbimport_worker:
// Will import all JSON data from the JSON folder at the root of the project.
// Properly importing tags.json, albums.json and ignoring .gitignore
// Once properly imported emits the ready or refresh event based on which type requested
// Requires setPath to be called first to properly set the path that will be used.
// setPath(path) triggers the media Import and expects a direct system path to the json folder
// refreshMedia() triggers the Media Import as long as setPath has already been called
// Once it emits ready or refresh subsequent calls can be made to all other functions to return the full value of
// getMedia = media [ This is the full item, nothing needs to be done to return data ]
// getUUID = full collection of all UUID's on the system as an array
// getGallery = Again full collection as array
// getTag = same as above
// getAlbum = same as above

/*
Example Usage of this item from logic.js

var a = require('./worker/test');
console.log(a.getMedia());
  RESULT: undefined
a.setPath(path.join(__dirname, "../json"));
  Keep in mind setting the path must be done before it'll ever become available.
a.on('ready', function() {
  console.log(a.getMedia());
    RESULT: Valid Media
});
*/

var EventEmitter = require('events').EventEmitter;

var media = [];
var uuid = [];
var gallery = [];
var tag = [];
var album = [];

var pathToRead;

module.exports = new EventEmitter();

const getMedia = () => {
  return media;
};

const getUUID = () => {
  return uuid;
};

const getGallery = () => {
  return gallery;
};

const getTag = () => {
  return tag;
};

const getAlbum = () => {
  return album;
};

// These can't be declared with other exports since the functions aren't defined yet.
module.exports.getMedia = getMedia;
module.exports.getUUID = getUUID;
module.exports.getGallery = getGallery;
module.exports.getTag = getTag;
module.exports.getAlbum = getAlbum;

module.exports.setPath = function(givenPath) {
  // The setPath must be called before this can even be expected to be ready.
  pathToRead = givenPath;

  console.log('Beginning Saved Data Import...');
  mediaImport('init');
}

module.exports.refreshMedia = function() {
  console.log('Refreshing Saved media...');
  mediaImport('refresh');
}

function mediaImport(mode) {

  const start = process.hrtime();

  var fs = require('fs');

  try {

    var itemsProcessed = 0;
    var totalItems = 0;

    var galDone = false;
    var uuidDone = false;

    fs.readdir(pathToRead, {withFileTypes: true}, (err, content) => {
      if (err) {
        console.log(`ERROR Occured Reading Import Media: ${err}`);
      } else {

        // Assign Content
        if (totalItems == 0) {
          totalItems = content.length;
        }

        content.forEach(file => {

          if (file.isFile()) {
            // We only want to pay attentino to files within the json dir

            if (file.name == 'tags.json') {

              const tagStart = process.hrtime();

              let rawdata = fs.readFileSync(pathToRead+'/'+file.name);

              if (rawdata != '') {
                let jsondata = JSON.parse(rawdata);
                tag = jsondata;
              }
              //let jsondata = JSON.parse(rawdata);
              //tag = jsondata;

              itemsProcessed++;

              const durationInMilliseconds = getDurationInMilliseconds(tagStart);
              console.log(`[FINISHED] Tag Import: ${durationInMilliseconds} ms`);

            } else if (file.name == 'albums.json') {

              const albumStart = process.hrtime();

              let rawdata = fs.readFileSync(pathToRead+'/'+file.name);

              if (rawdata != '') {
                let jsondata = JSON.parse(rawdata);
                album = jsondata;
              }
              //let jsondata = JSON.parse(rawdata);
              //album = jsondata;

              itemsProcessed++;

              const durationInMilliseconds = getDurationInMilliseconds(albumStart);
              console.log(`[FINISHED] Album Import: ${durationInMilliseconds} ms`);

            } else if (file.name == '.gitignore') {
              console.log('Ignoring gitignore in Database Import Worker...');

              itemsProcessed++;
            } else {
              // Now to process the regular JSON data
              try {

                let rawdata = fs.readFileSync(pathToRead+'/'+file.name);
                let jsondata = JSON.parse(rawdata);
                media.push(jsondata);

                itemsProcessed++;

              } catch(ex) {
                console.log(`Error Occured on JSON Data Import: ${ex}`);
              }
            }
          } // ELSE DIR

          // Check this data within the loop

          if (itemsProcessed == totalItems && totalItems != 0) {
          // All Items should be processed.
          // And we can build the dependent items.
          // Logging that the original import is done.

          const durationInMillisecondsJSON = getDurationInMilliseconds(start);
          console.log(`[FINISHED] Media Import: ${durationInMillisecondsJSON} ms`);

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
                const durationInMillisecondsUUID = getDurationInMilliseconds(startUUID);
                console.log(`[FINISHED] UUID Import: ${durationInMillisecondsUUID} ms`);

                uuidDone = true;
              }

              if (media.length == galCollection.length && galDone == false) {
                galCollection.forEach((galData, galIndex) => {
                  // If one item belongs to multiple galleries, we need to desend into that gallery, and check each item.
                  if (galCollection[galIndex].length > 1) {
                    galCollection[galIndex].forEach((galDataTwo, galIndexTwo) => {

                      if (gallery.indexOf( galCollection[galIndex][galIndexTwo] ) == -1) {
                        // Since this item is nnot in the gallery, add it.
                        gallery.push( galCollection[galIndex][galIndexTwo] );
                      }
                    });
                  } else {

                    if (gallery.indexOf( galCollection[galIndex][0] ) == -1) {
                      // Since this item is not in the gallery, add it.
                      gallery.push( galCollection[galIndex][0] );
                    }
                  }
                });

                // At this point the galleries should be done being imported
                const durationInMillisecondsGAL = getDurationInMilliseconds(startGal);
                console.log(`[FINISHED] Gallery Import: ${durationInMillisecondsGAL} ms`);
                galDone = true;
              }
            });
          } else {
            // This would trigger when media is empty, and has no value
            uuidDone = true;
            galDone = true;
          }
          } catch(ex) {
            console.log(`SEVERE ERROR: ${ex}`);
          }
        }

        // Check for the dependent items being done to complete the import
        if (galDone && uuidDone) {
          const durationInMillisecondsTOTAL = getDurationInMilliseconds(start);
          console.log(`[FINISHED] Total Import: ${durationInMillisecondsTOTAL} ms`);

          if (mode == 'init') {
            module.exports.emit('ready');
          } else if (mode == 'refresh') {
            module.exports.emit('refresh');
          }
          //module.exports.emit('ready');
        }
        });

      }
    });
  } catch(ex) {
    console.log(`SEVERE ERROR: ${ex}`);
  }

}

const getDurationInMilliseconds = (start) => {
  const NS_PER_SEC = 1e9;
  const NS_TO_MS = 1e6;
  const diff = process.hrtime(start);

  return (diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS;
}
