module.exports.test_read = function() {
  return new Promise(function (resolve, reject) {
    console.log('Testing File Handler...');

    const path = require('path');
    var file_handler = require('../modules/file_handler');
    var fs = require('fs');

    try {

      console.log('Testing File Handler Read...');

      // We will create our own file manually, then test if we can read the same data back. Remembering the file_handler.read_file
      // will return JSON always
      var testingFile = path.join(__dirname, "../json/test-file.json");
      var datatowrite = {
        testing: 'File Hanlder',
        version: 1,
        easter: 'egg'
      }

      createTestFile(testingFile, datatowrite)
        .then(res => {
          // Was able to success create or confirm existance of test file
          file_handler.read_file(testingFile, 'JSON Test File')
            .then(res => {
              if (res.toString() == datatowrite.toString()) {
                resolve(res);
              } else {
                // Indicates that the files do not match.
                reject(`Files do not match! ${res}`);
              }
            })
            .catch(err => {
              reject(err);
            });
        });
    } catch(err) {
      reject(err);
    }
  });
}


function createTestFile(testingFile, datatowrite) {
  return new Promise(function (resolve, reject) {
    var fs = require('fs');

    fs.access(testingFile, fs.constants.F_OK, (err) => {
      if (err) {
        // Indicates the file DOES NOT exist
        fs.writeFile(testingFile, JSON.stringify(datatowrite, null, 2), function(err) {
          if (err) {
            reject(err);
          } else {
            resolve('SUCCESS');
          }
        });
      } else {
        // Indicates the file DOES exist
        resolve('SUCCESS');
      }
    });
  });
}
