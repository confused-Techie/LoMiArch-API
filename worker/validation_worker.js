// Following new Modular Worker Achitecure


// Since Validation is a Complex Worker task it needs to be passed all of its dependents instead of any kind of initialization.

// Should have media, jsonMedia, and notification passed as dependencies

var path = require('path');
var rootPath = path.join(__dirname, "../media");

module.exports.validate = function(media, notify) {
  return new Promise(function (resolve, reject) {
    // To validate data we will use the md5 hash that accompanies each item.  With that hash we can then check
    // the validity of that hash matching with a newly generated MD5 Hash.

    console.log('Starting Media Validation...');

    const start = process.hrtime();
    var itemsToCheck = media.length;
    var itemsChecked = 0;
    var corruptItems = 0;
    var uncheckedItems = 0;

    try {
      if (media.length != 0) {

        media.forEach((data, index) => {
          let currentMD5 = md5Generate(rootPath.join(__dirname, `../${media[index].pod_loc}`));
          if (currentMD5.includes('ERROR')) {
            // ERROR occured while generating strict hash
            console.log(`Validation ERROR: Failed to Generate current MD5 Hash: ${currentMD5} : For ${media[index].pod_loc}`);
            uncheckedItems++;
            itemsChecked++;
          } else {
            try {
              if (currentMD5 != media[index].md5) {
                // media hashes don't match
                var notifyMessage = `${media[index].pod_loc}:: Does not match the Strict Hash from initial Import and is likely corrupt. This Item has been moved to the Purgatory folder for review.`;
                // The notification will be given a priority of 1 since it should not be pruned and indicates a serious problem.
                notify.newNotification('Corrupt Media Found', notifyMessage, 1)
                  .then(res => {
                    // Now it is time to move this item to purgatory folder.
                    // TODO: Handle this with the media handler
                    console.log(`Validation ERROR: Corrupt Media Found. Successfully created Notification. Media: ${media[index].pod_loc}`);
                  })
                  .catch(err => {
                    console.log(`Validation ERROR: Corrupt Media Found. Failed to create Notification. Media: ${media[index].pod_loc}`);
                  });
                corruptItems++;
                uncheckedItems++;
              } else {
                // the hashes do match
                // Since logging this would create uneeded junk logs, we will just add to the checked total
                itemsChecked++;
              }
            } catch(err) {
              // Most likely the check on the md5 index failed, possibly meaning that this item has no hash.
              console.log(`Validation ERROR: Failed to Check MD5 Hash: ${media[index].md5} is the current Hash. Error: ${err}`);
              uncheckedItems++;
              itemsChecked++;
            }
          }
        });

        if (itemsToCheck == itemsChecked) {
          // this would indicate that all items are done being checked.
          // Here we can report back with logs and a notification the amount of corrupt items and total items.
          logTime(start, 'Checking Validity of All Library Items');
          resolve(`Validation Check has completed. Total Items in Library: ${itemsToCheck}; Total Items Checked: ${itemsToCheck}; Total Unchecked: ${uncheckedItems}; Total Corrupt: ${corruptItems}`);
        }
      } else {
        // No saved media to validate
        resolve('No Saved Media to Validate');
      }
    } catch(err) {
      // General Failure
      reject(`Error Occured Valdating Media: ${err}`);
    }
  });
}

function md5Generate(file) {
  const CryptoJS = require('crypto-js');
  var fs = require('fs');

  const rawFile = fsImport.readFileSync(file).toString('binary');

  try {
    const md5Hash = CryptoJS.MD5(rawFile);
    return md5Hash.toString(CryptoJS.enc.Hex);
  } catch(err) {
    return `ERROR Occured: ${ex}`;
  }
}

function logTime(start, phrase) {
  var getDurationInMilliseconds = require('./getDurationInMilliseconds');
  const durationInMilliseconds = getDurationInMilliseconds.getDurationInMilliseconds(start);
  console.log(`[FINISHED:validation_worker] ${phrase}: ${durationInMilliseconds} ms`);
}
