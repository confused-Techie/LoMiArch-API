
// This is the reworked 'Modular Worker Architecture'

var notificationdb = [];
var notifyImport = false;

// ERROR DECLARATIONS
var notImportERROR = 'Notifications have not been initialized';
var noSaveERROR = 'No Saved Notifications, Unable to search for specific one';
var noIDERROR = 'Notification ID Must be specified to return a value';

// Since calling this.someFunc() failed with
// TypeError: this.someFunc is not a function
var _this = this;

module.exports.getNotifications = function() {
  return new Promise(function (resolve, reject) {
    if (notifyImport) {
      resolve(notificationdb);
    } else {
      reject(notImportERROR);
    }
  });
}

module.exports.getNotification = function(id) {
  return new Promise(function (resolve, reject) {
    if (notifyImport) {
      if (id != '') {
        if (notificationdb.length != 0) {
          const start = process.hrtime();

          notificationdb.forEach((data, index) => {
            if (id == notificationdb[index].uuid) {
              logTime(start, 'Notification', 'Retrival', 'getNotification', 'debug');
              resolve(notificationdb[index]);
            }

            if (index == notificationdb.length -1) {
              reject(`Notification ${id} could not be found in the Notification Database`);
            }
          });
        } else {
          reject(noSaveERROR);
        }
      } else {
        reject(noIDERROR);
      }
    } else {
      reject(notImportERROR);
    }
  });
}

module.exports.deleteNotification = function(id) {
  return new Promise(function (resolve, reject) {
    if (notifyImport) {
      if (notificationdb.length != 0) {
        if (id != '') {
          const start = process.hrtime();

          notificationdb.forEach((data, index) => {
            if (id == notificationdb[index].uuid) {
              let removedItem = notificationdb.splice(index, 1);
              logTime(start, 'Notification', 'Removal', 'deleteNotification', 'info');
              console.log(removedItem);
              _this.saveNotification()
                .then(res => {
                  resolve('SUCCESS');
                })
                .catch(err => {
                  reject(err);
                });
            }

            if (index == notificationdb.length -1) {
              reject(`Notification ${id} could not be found in the Notification Database`);
            }
          });
        } else {
          reject(noIDERROR);
        }
      } else {
        reject(noSaveERROR);
      }
    } else {
      reject(notImportERROR);
    }
  });
}

module.exports.updateNotification = function() {
  return new Promise(function (resolve, reject) {
    // This will simly be a check for low priority notifications to clear properly.

    var notifyExpiry = 6.048e8; // This defualt value is a full week.

    if (notifyImport) {
      if (notificationdb.length != 0) {
        const start = process.hrtime();

        notificationdb.forEach((data, index) => {
          if (notificationdb[index].priority == 3) {
            // Ensure that the priority is one that can be pruned
            let currentTime = Date.now();
            if (currentTime - notificationdb[index].birth > notifyExpiry) {
              // If the difference between the current time and origin of the notifications are more than the expiry time
              console.log(`Expired Low Priority Notification Found: ${notificationdb[index].title}`);
              _this.deleteNotification(notificationdb[index].uuid)
                .then(res => {
                  logTime(start, `Notification '${notificationdb[index].title}'`, 'Pruning', 'updateNotification', 'info');
                })
                .catch(err => {
                  reject(err);
                });
            } else {
              console.log('Notify Expiry has not been reached. Leaving Notifications as is...');
            }
          }

          if (index == notificationdb.length -1) {
            logTime(start, 'Notification DB', 'Pruning', 'updateNotification', 'info');
            _this.saveNotification()
              .then(res => {
                resolve('SUCCESS');
              })
              .catch(err => {
                reject(err);
              });
          }
        });
      } else {
        console.log('No saved Notifications to Update; Skipping...');
        resolve('SUCCESS');
      }
    } else {
      reject(notImportERROR);
    }
  });
}

module.exports.newNotification = function(title, message, priority) {
  return new Promise(function (resolve, reject) {
    if (notifyImport) {
      if (title == '' || message == '' || priority == '' || title == null || message == null || priority == null) {
        reject('Required Value to create New Notification Missing');
      } else {
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
          logTime(start, `Notification '${title}'`, 'Creation', 'newNotification', 'debug');
          _this.saveNotification()
            .then(res => {
              resolve('SUCCESS');
            })
            .catch(err => {
              reject(err);
            });
        } catch(ex) {
          reject(ex);
        }
      }
    } else {
      reject(notImportERROR);
    }
  });
}

module.exports.saveNotification = function() {
  return new Promise(function (resolve, reject) {
    if (notifyImport) {
      const start = process.hrtime();

      console.log('Saving Notifications File...');

      try {
        const path = require('path');
        var file_handler = require('../modules/file_handler');

        file_handler.write_file(path.join(__dirname, '../settings/notifications.json'), notificationdb, 'Notification DB')
          .then(res => {
            logTime(start, 'Notification DB', 'Save', 'saveNotification', 'info');
            resolve('SUCCESS');
          })
          .catch(err => {
            reject(err);
          });
      } catch(err) {
        reject(err);
      }

    } else {
      reject(notImportERROR);
    }
  });
}

module.exports.initNotification = function() {
  return new Promise(function(resolve, reject) {
    var logger = require('../modules/logger.js');

    logger.log('notice', 'notification_worker', 'initNotification', 'Beginning Saved Notifications Import...');

    const start = process.hrtime();

    const path = require('path');
    var file_handler = require('../modules/file_handler');

    try {
      file_handler.read_file(path.join(__dirname, '../settings/notifications.json'), 'Notification DB')
        .then(res => {
          if (res == 'nodata') {
            logger.log('debug', 'notification_worker', 'initNotification', 'No saved Notifications to Import...');
            logTime(start, 'Empty Notification DB', 'Import', 'initNotification', 'info');
            notifyImport = true;
            resolve('SUCCESS');
          } else {
            notificationdb = res;
            logTime(start, 'Notification DB', 'Import', 'initNotification', 'info');
            notifyImport = true;
            resolve('SUCCESS');
          }
        })
        .catch(err => {
          reject(`initNotification => file_handler.read_file.catch: ${err}`);
        });
    } catch (err) {
      reject(`initNotification => [246]catch: ${err}`);
    }
  });
}

function logTime(start, friendlyName, action, func, severity) {
  var logger = require('../modules/logger.js');
  var getDurationInMilliseconds = require('./getDurationInMilliseconds');
  const durationInMilliseconds = getDurationInMilliseconds.getDurationInMilliseconds(start);
  logger.log(`${severity}`, 'notification_worker', `${func}`, `${friendlyName} ${action}: ${durationInMilliseconds} ms`);
}

function uuidGenerate() {
  const { v4: uuidv4 } = require('uuid');

  try {
    return uuidv4();
  } catch(ex) {
    return `ERROR Occured: ${ex}`;
  }
}
