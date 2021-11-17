console.log('Loading Environment Variables...');

const path = require('path');

const envPath = path.join(__dirname, '../.env');
const dotenv = require('dotenv').config({path: envPath });

if (dotenv.error) {
  throw dotenv.error;
}

module.exports = {
  test_env: process.env.TEST_ENV,
  test2: 'Hello World'
};
