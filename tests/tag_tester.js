// This should be able to test that all tags return an expected value.
// I would like this to always function regardless of what actual tags are there.
// This may be best accomplished by finding the tags myself, then testing.

var passedTests = 0;
var failedTests = 0;
var totalTests = 1;

var tag;

try {
  tag = require('../worker/tag_worker.js');

} catch(err) {
  failedTests++;

}

module.exports.fullSuite = function() {
  return new Promise(function (resolve, reject) {
    console.log('Full Suite of Testing for Tag Worker...');
    var tag;

    const checkEnd = function() {
      if (passedTests + failedTests == totalTests) {
        resolve(`Tag_Test: Results: Passed: ${passedTests}; Failed: ${failedTests}`);
      }
    };

    try {
      tag = require('../worker/tag_worker.js');
      passedTests++;
      console.log('Tag_Test: Require Test Passed');
      checkEnd();
    } catch(err) {
      failedTests++;
      reject(`Fundamental Test Failed: Require Test Failed. Failed: ${failedTests}; Passed: ${passedTests}`);
    }

    try {
      tag.deleteTag('FAKE_ID')
        .then(res => {
          // Since tags have not been init, we are expecting this test to fail.
          testResult('fail', `deleteTag Returned normally without Initialization. Return: ${res}`);
          checkEnd();
        })
        .catch(err => {
          // This would be the expected return
          if (err == 'Tags have not been initialized') {
            testResult('pass', `deleteTag Failed without Initialization as expected.`);
            checkEnd();
          } else {
            testResult('fail', `deleteTag Failed without Initialization as expected, but returned unexpected error: ${err}`);
            checkEnd();
          }
        });
    } catch(err) {
      testResult('fail', `deleteTag without Initialization Threw Error: ${err}`);
      checkEnd();
    }

    

  });
}

function testResult(status, msg) {
  if (status == 'fail') {
    failedTests++;
    console.log(`Tag_Test: [FAILED] ${msg}`);
  } else if (status == 'pass') {
    passedTests++;
    console.log(`Tag_Test: [PASSED] ${msg}`);
  } else {
    console.log(`UNEXPECTED VALUE PASSED to testResult: ${status}: ${msg}`);
  }
}
