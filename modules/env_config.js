console.log('Loading Environment Variables...');

const path = require('path');

const envPath = path.join(__dirname, '../.env');
const dotenv = require('dotenv').config({path: envPath });

if (dotenv.error) {
  throw dotenv.error;
}

module.exports = {
  log_severity: process.env.LOG_SEVERITY,
  listen_port: process.env.PORT
};
