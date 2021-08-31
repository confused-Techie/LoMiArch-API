//var EventEmitter = require('events').EventEmitter;
//var value;

//module.exports = new EventEmitter();


//setTimeout(function() {
//  value = "Now I'm Ready";
//  module.exports.emit('ready');
//}, 2000);

//module.exports.value = value;

var EventEmitter = require('events').EventEmitter;
var value;
var value2;

module.exports = new EventEmitter();


const getValue = () => {
  return value + value2;
};


// Cannot place this with the other export because getValue is not defined
module.exports.getValue = getValue;
module.exports.setValue = function(givenValue) {
  value2 = givenValue;

  hope();
}

if (value2 == "Hello World") {
setTimeout(function() {
  console.log("Working on it");
  value = "Now I'm Ready";
  module.exports.emit('ready');
}, 2000);
}

function hope() {
  console.log("function called");
  setTimeout(function() {
    console.log("Working on it");
    value = "Now I'm Ready";
    module.exports.emit('ready');
  }, 2000);
}
