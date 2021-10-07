// This should be able to test all modules of the code, based on promises and specific imports to test each feature/function

// This should be structured like a Unit Test Pyramid
// Units at the base, Integrations, then 'UI' but in this case REST Api Responses.
// We can test the Units, like Notifications, Tags, Albums, File_handler,
// Integrations like jsonMedia and soon to be other 'Complex Workers'
// UI Rest Api Responses

var passedTests = 0;
var failedTests = 0;
var totalTests = 2;

var tag = require('./tag_tester.js');

//var filehandler_test = require('./filehandler_test');
//var notify_test = require('./notify_test');

//filehandler_test.test_read()
//  .then(res => {
//    console.log('Test Passed for File Handler Module: Read');
//    passedTests++;
//    endResults();
//  })
//  .catch(err => {
//    console.log('Test FAILED for File Handler Module: Read');
//    console.log(err);
//    failedTests++;
//    endResults();
//  });

//notify_test.notify_test()
//  .then(res => {
//    console.log('Test Passed for Notify Worker');
//    passedTests++;
//    endResults();
//  })
//  .catch(err => {
//    console.log('Test FAILED for Notify Worker');
//    console.log(err);
//    failedTests++;
//    endResults();
//  });




function endResults() {
  if (passedTests + failedTests == totalTests) {
    console.log('------------------------------------------------------');
    console.log(`Testing Complete`);
    console.log(`Total PASSED Tests: ${passedTests}`);
    console.log(`Total FAILED Tests: ${failedTests}`);
  }
}
