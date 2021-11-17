// This console.log can easily use logger but I'm unsure if it would create an uneeded import, and keep an additional instance of logger in memory
// Will have to do testing to see if this causes any noticable changes in performance before changing
console.log('Loading Environment Variables...');

const path = require('path');

const envPath = path.join(__dirname, '../.env');
const dotenv = require('dotenv').config({path: envPath });

if (dotenv.error) {
  throw dotenv.error;
}

module.exports = {
  log_severity: process.env.LOG_SEVERITY,
  listen_port: process.env.PORT,
  notify_expiry: process.env.NOTIFICATION_EXPIRATION
};
