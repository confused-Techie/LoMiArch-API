// deleteMedia
// corruptMedia

module.exports.deleteMedia = function() {

}

module.exports.corruptMedia = function(media, notify, pathToMedia, index) {
  const start = process.hrtime();
  var getDurationInMilliseconds = require('./getDurationInMilliseconds');

  try {

    if (isNaN(index) || isNaN(media) || isNaN(notify) || isNaN(pathToMedia)) {
      console.log('A required Value is missing from this fucntion.');
    } else {
      // This ensures all needed values are specified.
      // TODO:
      // Remove the entry from the mediadb
      // Remove the actual File to the purgatory folder
      // Delete the original JSON File
      // Add the JSON Data to the blacklist file.
    }
  } catch(ex) {
    console.log(`ERROR Occured in processing Corrupt Media: ${ex}`);
  }
}
