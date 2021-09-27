// deleteMedia
// corruptMedia

module.exports.deleteMedia = function() {
  // TODO: Create whole function to handle media removal
  // using finishTask as a way to notify the user its done
  // Lots of the code from corrupt seems like it'll be identical, except location
  // and logs. This may need to be split into a few functions operating off promises instead of done booleans 
}

module.exports.corruptMedia = function(media, notify, path, index) {
  console.log('Removing Suspected Corrupt Media...');

  const start = process.hrtime();
  var fs = require('fs');

  var dbDone = false;
  var purgDone = false;
  var jsonDone = false;

  try {

    if (isNaN(index) || isNaN(media) || isNaN(notify) || isNaN(pathToMedia)) {
      console.log('A required Value is missing from this fucntion.');
    } else {
      // This ensures all needed values are specified.
      try {
        // Remove from the mediadb
        let removedItem = media.splice(index, 1);
        dbDone = true;
        console.log(`Removed ${removedItem.pod_loc} from Media Database...`);
        finishTask(start, notify, dbDone, purgDone, jsonDone, 'Corrupt');

      } catch(ex) {
        console.log('Error Occured removing item from Media Database!');
      }

      try {
        // Move File to purgatory

        // Copy the file to purgatory
        let fileName = media[index].pod_loc;
        let fileNameParsed.split('/');
        fs.copyFile(`..${media[index].pod_loc}`, `../media/purgatory/${fileNameParsed[fileNameParsed.length -1]}`);
        console.log('Successfully Copied Corrupt Media File...');
        fs.rm(`..${media[index].pod_loc}`, function (err) {
          if (err) {
            console.log(`Error Removing File: ${err}`);
          } else {
            console.log('Successfully Removing Corrupt Media File...');
            purgDone = true;
            finishTask(start, notify, dbDone, purgDone, jsonDone, 'Corrupt');
          }
        });
      } catch(ex) {
        console.log('Error Occured Moving File to Purgatory!');
      }

      try {
        // Delete original JSON File && Move the data into blacklist

        // write read data into blacklist
        let rawblacklist = fs.readFileSync(path.join(__dirname, `../settings/blacklist.json`));
        var jsontowrite;

        if (rawblacklist == '') {
          // account for an empty file
          jsontowrite = media[index];
        } else {
          let jsonblacklist = JSON.parse(rawblacklist);

          jsonblacklist.unshift(media[index]);
          jsontowrite = jsonblacklist;
          // Using Unshift since I don't plan on organizing in any way so it'll be helpful to have it be most recent to oldest
        }

        fs.writeFile(path.join(__dirname, `../settings/blacklist.json`), JSON.stringify(jsontowrite, null, 2), function (err) {
          if (err) {
            console.log(`Error Writing File: ${err}`);
          } else {
            console.log('Successfully Wrote Blacklist File...');

            // Blacklist now contains the original file json data, accounting for an empty or pre-populated file
            // Delete original json file
            fs.rm(path.join(__dirname, `../json/${media[index].uuid}.json`), function (err) {
              if (err) {
                console.log(`Error Deleting JSON File: ${err}`);
              } else {
                console.log('Successfully deleted Corrupt JSON Media File...');
                jsonDone = true;
                finishTask(start, notify, dbDone, purgDone, jsonDone, 'Corrupt');
              }
            });
          }
        });
      } catch(ex) {
        console.log('Error Occured Modifying Corrupt Media JSON Data!');
      }

    }
  } catch(ex) {
    console.log(`ERROR Occured in processing Corrupt Media: ${ex}`);
  }
}

function finishTask(start, notify, dbDone, taskDone, jsonDone, task) {
  var getDurationInMilliseconds = require('./getDurationInMilliseconds');
  // This can be used to allow calling at each end step to ensure it runs properly on async tasks
  if (!dbDone && !taskDone && !jsonDone) {
    // TODO:
    // Send notification that the file is done being handled, usable from both corrupt and delete
    // logging the time the task took
  }
}
