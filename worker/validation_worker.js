
module.exports.validate = function(media, notify, pathToMedia) {
  const start = process.hrtime();
  var itemsToCheck = media.length;

  // To validate data we will use the md5 Hash that accompanies each item. With that hash we can then check the validity
  // of that hash matching with a newly generated MD5 Hash

  try {
    if (media.length != 0) {

      media.forEach((data, index) => {
        //console.log(pathToMedia.join(__dirname, `../${media[index].pod_loc}`));
        let currentMD5 = md5Generate(pathToMedia.join(__dirname, `../${media[index].pod_loc}`));
        if (currentMD5.includes('ERROR')) {
          console.log(`ERROR Occured while Generating Strict Hash: ${currentMD5}`);
        } else {
          if (currentMD5 != media[index].md5) {
            console.log('Media Hashes do not match! Encountered Corrupt Media...');
            // TODO: Handle this with a media handler worker
            notify.newNotification('Corrupt Media Found!',
              `There was a corrupt media item discovered: ${media[index].pod_loc}. It has been temporarily removed.`, 1);
          }
        }
      });

      if (itemsToCheck == media.length) {
        // This would indicate that no items were found to be invalid
        console.log('Validation found no corrupt media...');
        notify.newNotification('Media Validation Successful',
          'All your media passed the validation check.', 3);
      }
    } else {
      console.log('No saved Media to Validate...');
    }
  } catch(ex) {
    console.log(ex);
  }
}

function md5Generate(file) {
  const CryptoJS = require('crypto-js');
  var fs = require('fs');

  const rawFile = fs.readFileSync(file).toString('binary');

  try {
    const md5Hash = CryptoJS.MD5(rawFile);
    return md5Hash.toString(CryptoJS.enc.Hex);
  } catch(ex) {
    return `ERROR Occured: ${ex}`;
  }
}

const getDurationInMilliseconds = (start) => {
  const NS_PER_SEC = 1e9;
  const NS_TO_MS = 1e6;
  const diff = process.hrtime(start);

  return (diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS;
}
