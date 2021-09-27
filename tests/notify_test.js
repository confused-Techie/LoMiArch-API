module.exports.notify_test = function() {
  return new Promise(function (resolve, reject) {
    console.log('Testing Notifications...');

    var fs = require('fs');
    var path = require('path');

    var notificationWorker = require('../worker/notification_worker');

    try {

      let rawdata = fs.readFileSync(path.join(__dirname, '../settings/notifications.json'));

      if (rawdata == '') {
        console.log('Testing Blank Notification DB');

        notificationWorker.initNotification()
          .then(res => {
            if (res == 'SUCCESS') {
              // This means the init was successfull and we can continue to test the rest of the features.
              notificationWorker.getNotifications()
                .then(res => {
                  if (res == '') {
                    // Indicates an empty value returned for all notificaiton retreival as expected
                    notificationWorker.getNotification('FAKEID')
                      .then(res => {
                        // With a fake id and no notificaitons this is expected to fail.
                        reject(`Get Notification with a Fake ID reportedly Succedded where it should not: ${res}`);
                      })
                      .catch(err => {
                        // Since this is expected to fail this indicates a success
                        if (err == 'No Saved Notifications, Unable to search for specific one') {
                          // This is the exact error message expected meaning it was successful.
                          notificationWorker.deleteNotification('FAKEID')
                            .then(res => {
                              reject(`Delete Notification Reportedly Succedded where it should not: ${res}`);
                            })
                            .catch(err => {
                              // again with a fake id this is expected to fail. Plus it being an empty db
                              if (err == 'No Saved Notifications, Unable to search for specific one') {
                                // This is the exact error message expected meaning it was successful.
                                resolve('SUCCESS');
                              }
                            });
                        }
                      });
                  } else {
                    reject(`Unexpected Value returned from getNotifications: ${res}`);
                  }
                })
                .catch(err => {
                  reject(err);
                });
            }
          })
          .catch(err => {
            reject(err);
          });
      } else {
        console.log('Testing Non-Blank Notficiation DB');
        resolve('SUCCESS');
      }
    } catch(err) {
      reject(err);
    }

  });
}
