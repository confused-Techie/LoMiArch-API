// This file will ensure the logging of the API can be changed based on admin preference
// The value of logging will follow RFC 5424 Severity level indicator. Functioning inclusively of severity chosen.

const { log_severity } = require('./env_config.js');

// First we want to check the validity of the env value
const log_values = [ "emergency", "alert", "critical", "error", "warning", "notice", "info", "debug" ];
try {
  if (!log_values.includes(log_severity.toLowerCase())) {
    throw `Log Severity Value is invalid: ${log_severity}; Valid Values: ${log_values}`;
  }
} catch(err) {
  throw `Error Occured checking validity of Log Severity. Log Value: ${log_severity}; Error: ${err}`;
}

module.exports.log = function(msgSeverity, sourceFile, sourceFunc, msg) {
  // Ensure values supplied are valid
  if (log_values.includes(msgSeverity.toLowerCase())) {
    // msgSeverity is valid
    if (sourceFile == '' || sourceFile == null || sourceFunc == '' || sourceFunc == null || msg == '' || msg == null) {
      // Provided values are not valid
      // severity of this should be warn
      if ( convertLog(log_severity) >= 4) {
        contentLogger('warning', 'logger.js', 'log()',
          `Values Provided are invalid. Original values: Severity: ${msgSeverity}; File: ${sourceFile}; Function: ${sourceFunc}; Message: ${msg}`);
      } // else; while this failed to log it doesn't match the log level and will be discarded.
    } else {
      // All provided values are valid and we can begin check to log.

      if ( convertLog(log_severity) >= convertLog(msgSeverity) ) {
        // Using this will ensure the inclusivity of the log is utilized to log
        // everything below or equal to the chosen log value.
        contentLogger(msgSeverity.toLowerCase(), sourceFile, sourceFunc, msg);
      } // else the item is not logged.
    }
  } else {
    // msgSeverity is not valid. We will check this error here to see if this should be logged.
    // Severity of this should be warn
    if ( convertLog(log_severity) >= 4) {
      contentLogger('warning', 'logger.js', 'log()',
        `Severity Provided is invalid. Original Values: Severity: ${msgSeverity}; File: ${sourceFile}; Function: ${sourceFunc}; Message: ${msg}`);
    } // else; while this failed to log it doesn't match the log level and will be discarded.
  }

}

function convertLog(provided) {
  var providLow = provided.toLowerCase();

  if (providLow == 'emergency') return 0;
  if (providLow == 'alert') return 1;
  if (providLow == 'critical') return 2;
  if (providLow == 'error') return 3;
  if (providLow == 'warning') return 4;
  if (providLow == 'notice') return 5;
  if (providLow == 'info') return 6;
  if (providLow == 'debug') return 7;
}

function getDateTime() {
  var dayjs = require('dayjs');
  return dayjs().toISOString();
}

function contentLogger(normSeverity, sourceFile, sourceFunc, msg) {
  console.log(`${getDateTime()} <${normSeverity}> [${sourceFile}:${sourceFunc}] ${msg}`);
}
