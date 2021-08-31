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
var uuid, gallery, tag, album;
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

  // Due to no easy way to check when this variable has been set, we will call the main code here.
  mediaImport();
}

function mediaImport() {

  const start = process.hrtime();

  var fs = require('fs');

  try {

    var itemsProcessed = 0;
    fs.readdir(pathToRead, {withFileTypes: true}, (err, content) => {

      if (err) {
        console.log(`ERROR Occured Reading Import Media: ${err}`);
      }

      content.forEach(file => {
        if (file.isFile()) {
          // We only want to pay attention to files within the json dir
          if (file.name != '.gitignore') {

            let rawdata = fs.readFileSync(pathToRead+'/'+file.name);
            let jsondata = JSON.parse(rawdata);
            media.push(jsondata);
            itemsProcessed++;

            if (itemsProcessed === content.length) {
              // All items should be processed.
              // And we can emit a ready event

              const durationInMilliseconds = getDurationInMilliseconds(start);
              console.log(`[FINISHED] Media Import: ${durationInMilliseconds} ms`);
              module.exports.emit('ready');
            }
          } else {
            // We still need to account for these for itemsProcessed to work as a finished counter.
            itemsProcessed++;
          }
        } // else dir and we can ignroe
      });
    });
  } catch(ex) {
    console.log(`ERROR Occured During Media Import: ${ex}`);
  }
}

const getDurationInMilliseconds = (start) => {
  const NS_PER_SEC = 1e9;
  const NS_TO_MS = 1e6;
  const diff = process.hrtime(start);

  return (diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS;
}
