
// WARNING: This worker has been depreciated and all functionality has been moved to notification_worker.js


// The following list of all functions
// getNotifications: Returns ALL Notifications
// getNotification(id): Returns specific notification from uuid
// deleteNotification(id): Delete specific notification from uuid
// updateNotification: Removes any low priority Notifications older than notifyExpiry
// newNotification(title, message, priority): Creates notification with needed data.
// initNotification: Imports the saved notifications from the save file

const path = require('path');
var EventEmitter = require('events').EventEmitter;
var notificationdb = [];
var notifyImport = false;
var datapath = path.join(__dirname, "../settings");
var notifyFile = '/notifications.json';
var notifyExpiry = 6.048e8; // This default value is a full week.

module.exports = new EventEmitter();

module.exports.getNotifications = function() {
  if (notifyImport) {
    return notificationdb;
  } else {
    console.log('Notifications have not been successfully imported!');
    return 'ERROR';
  }
}

module.exports.getNotification = function(id) {
  if (id != '') {
    if (notifyImport) {
      if (notificationdb.length != 0) {
        const start = process.hrtime();

        notificationdb.forEach((data, index) => {
          if (id == notificationdb[index].uuid) {
            const durationInMilliseconds = getDurationInMilliseconds(start);
            console.log(`[FINISHED] Retreiving Notification: ${durationInMilliseconds} ms`);
            return notificationdb[index];
          } else {
            console.log('Notification could not be found in Notification Database...');
            return 'ERROR';
          }
        });
      } else {
        console.log('No Saved Notifications, Returning Error status for getNotification...');
        return 'ERROR';
      }
    } else {
      console.log('Notifications have not been successfully imported!');
      console.log('Attempting to Import Notifications...');
      notificationImport();
      return 'ERROR';
    }
  } else {
    console.log('Notification ID Must be specified to return a value!');
    console.log(id);
    return 'ERROR';
  }
}

module.exports.deleteNotification = function(id) {
  deleteNotification(id);
}

module.exports.updateNotification = function() {
  // This will be simply to check for low priority notifications to clear properly.
  if (notifyImport) {
    if (notificationdb.length != 0) {

      const start = process.hrtime();

      notificationdb.forEach((data, index) => {
        if (notificationdb[index].priority == 3) {
          // Ensure that the priority is one that can be pruned
          let currentTime = Date.now();
          if (currentTime - notificationdb[index].birth > notifyExpiry) {
            // If the difference between the current time and origin of the notification are more than the expiry time
            console.log(`Expired Low Priority Notification Found: ${notificationdb[index].title}`);
            deleteNotification(notificationdb[index].uuid);
          }
        }

        if (notificationdb.length == index-1) {
          const durationInMilliseconds = getDurationInMilliseconds(start);
          console.log(`[FINISHED] Notification Pruning: ${durationInMilliseconds} ms`);
        }
      });
    } else {
      console.log('No Saved Notifications, skipping Update Check');
    }
  } else {
    console.log('Notifications have not been successfully imported!');
    console.log('Attempting to Import Notifications...');
    notificationImport();
  }
}

module.exports.newNotification = function(title, message, priority) {
  if (notifyImport) {
    const start = process.hrtime();

    let uuidValue = uuidGenerate();
    let birthTime = Date.now();

    let temp_json = {
      uuid: uuidValue,
      priority: priority,
      birth: birthTime,
      title: title,
      message: message,
      extras: {
        textColor: '#ffffff',
        bgColor: '#000000'
      }
    }

    try {
      notificationdb.unshift(temp_json);
      // Using unshift to ensure that the newest is first, since I'd rather not organize these later by birth time.
      const durationInMilliseconds = getDurationInMilliseconds(start);
      console.log(`Added new Notification ${title} in ${durationInMilliseconds} ms`);
      saveNotification();
    } catch(ex) {
      console.log(ex);
    }

  } else {
    console.log('Notifications have not been successfully imported!');
    console.log('Attempting to Import Notifications...');
    notificationImport();
  }
}

module.exports.initNotification = function() {
  // This must be called first to start the notification import.
  return new Promise(function(resolve, reject) {

  console.log('Beginning Saved Notifications Import...');

  notificationImport()
    .then(res => {
      // the import went well
      console.log('import went well');
      return 'SUCCESS';
    })
    .catch(err => {
      // The import went badly
      return 'ERROR';
    });
  });
}

function notificationImport() {
  return new Promise(function(resolve, reject) {
  const start = process.hrtime();

  var fs = require('fs');

  try {

    let rawdata = fs.readFileSync(datapath+notifyFile);

    if (rawdata != '') {
      let jsondata = JSON.parse(rawdata);

      notificationdb = jsondata;

      notifyImport = true;
      const durationInMilliseconds = getDurationInMilliseconds(start);
      console.log(`[FINISHED] Notification Import: ${durationInMilliseconds} ms`);
      resolve('SUCCESS');
    } else {
      console.log('No saved Notifications to import...');
      const durationInMilliseconds = getDurationInMilliseconds(start);
      console.log(`[FINISHED] Empty Notification Import: ${durationInMilliseconds} ms`);
      notifyImport = true;
      resolve('SUCCESS');
    }
  } catch(ex) {
    console.log(ex);
    reject('ERROR');
  }
});
}

function saveNotification() {
  const start = process.hrtime();
  console.log('Saving Notifications File...');

  var fs = require('fs');

  try {
    fs.writeFile(datapath+notifyFile, JSON.stringify(notificationdb, null, 2), function(err) {
      if (err) {
        console.log(`ERROR Occured while writing Notification Data: ${err}`);
      } else {
        const durationInMilliseconds = getDurationInMilliseconds(start);
        console.log(`[FINISHED] Writing Notification Save File: ${durationInMilliseconds} ms`);
      }
    });
  } catch(ex) {
    console.log(ex);
  }

}

function deleteNotification(id) {
  if (notifyImport) {
    if (notificationdb.length != 0) {
      const start = process.hrtime();

      notificationdb.forEach((data, index) => {
        if (id == notificationdb[index].uuid) {
          // This is the item to remove
          let removedItem = notificationdb.splice(index, 1);
          const durationInMilliseconds = getDurationInMilliseconds(start);

          console.log(`Removed below notification in ${durationInMilliseconds} ms`);
          console.log(removedItem);
          saveNotification();
        } else {
          console.log(`Couldn't find Notification ${id} to Delete...`);
        }
      });
    } else {
      console.log('No Saved Notifications, deleteNotification Failed...');
    }
  } else {
    console.log('Notifications have not been successfully imported!');
    console.log('Attempting to Import Notifications...');
    notificationImport();
  }
}

const getDurationInMilliseconds = (start) => {
  const NS_PER_SEC = 1e9;
  const NS_TO_MS = 1e6;
  const diff = process.hrtime(start);

  return (diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS;
}

function uuidGenerate() {
  const { v4: uuidv4 } = require('uuid');

  try {
    return uuidv4();
  } catch(ex) {
    return `ERROR Occured: ${ex}`;
  }
}
