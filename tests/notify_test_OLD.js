// This module is in charge of testing the aspects of notifications, fully.

module.exports.notifyTest = function() {

  getNotifyBlank()
    .then(res => {
      console.log('Success Indicated from getNotifyBlank');
      console.log(res);
    })
    .catch(err => {
      console.log('Failure in getNotifyBlank!');
      console.log(err);
    });
}

async function getNotifyBlank() {
  return new Promise(function(resolve, reject) {
    var notificationWork = require('../worker/notification_worker');

    console.log('Testing Blank notifications...');

    try {
      var fs = require('fs');
      var path = require('path');

      let rawdata = fs.readFileSync(path.join(__dirname, '../settings/notifications.json'));

      if (rawdata == '') {
        console.log('Notification Save File is Blank; Testing Module...');

        notificationWork.initNotification()
          .then(res => {
            // TODO: Test fails after turning notifcication_worker.initNotification into promise to avoid emitting events due to syncnous nature
          console.log('Notification Module Emitted Ready...');

          let emptyFullTest = notificationWork.getNotifications();

          if (emptyFullTest == '') {
            console.log('Notification getNotifications() Successfully Returned an Empty DB...');

            let emptyPartTest = notificationWork.getNotification('FAKEID');

            // Since at this time getNotification returns ERROR for any error will check against that and count on logs.

            if (emptyPartTest == 'ERROR') {
              console.log(`Notification getNotification('FAKEID') Returned ${emptyPartTest} as expected...`);
              console.log("Check Full logs to ensure reason...");

              console.log('Testing deleteNotification(FAKEID)...');
              notificationWork.deleteNotification('FAKEID');
              resolve('All Tests Passed... Check Logs for Details');
            } else {
              reject(`getNotification('FAKEID') Returned Unexpected Value: ${emptyPartTest}`);
            }
          } else {
            console.log(`Notification getNotifications() Returned incorrect result: ${emptyFullTest}`);
            reject(`Notification getNotifications() Returned incorrect result: ${emptyFullTest}`);
          }
        });
        console.log('seemed to skip waiting for event');
      }
    } catch(ex) {
      console.log(`ERROR Testing Notifications: ${ex}`);
      reject(`ERROR Testing Notifications: ${ex}`);
    }
  });
}
