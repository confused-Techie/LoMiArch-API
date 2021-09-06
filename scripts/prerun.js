console.log('Setting up missing build files...');
var fs = require('fs');
const path = require('path');

var files = [
  { loc: '../settings/test.json', shortLoc: 'test.json' },
  { loc: '../settings/notifications.json', shortLoc: 'notifications.json' },
  { loc: '../settings/blacklist.json', shortLoc: 'blacklist.json' },
  { loc: '../json/albums.json', shortLoc: 'albums.json' },
  { loc: '../json/tags.json', shortLoc: 'tags.json' }
];

var folders = [
  { loc: '../media/trash', shortLoc: 'Trash' },
  { loc: '../media/purgatory', shortLoc: 'Purgatory' }
];

files.forEach((data, index) => {
  writeFile(files[index].loc, files[index].shortLoc);
});

folders.forEach((data, index) => {
  writeDir(folders[index].loc, folders[index].shortLoc);
});

function writeFile(loc, shortLoc) {

  // Check if the specified file exists
  fs.access(path.join(__dirname, loc), fs.constants.F_OK, (err) => {
    if (err) {
      // Indicates that the file does not exist.
      fs.writeFileSync(path.join(__dirname, loc), '');
      console.log(`Created ${shortLoc} at ${ path.join(__dirname, loc) }`);
    }
  });
}

function writeDir(loc, shortLoc) {
  // Check if the directory exists
  fs.access(path.join(__dirname, loc), fs.constants.R_OK, (err) => {
    if (err) {
      // Indicates that it doesn't exist. Will create it
      fs.mkdirSync(path.join(__dirname, loc));
      console.log(`Created ${shortLoc} at ${ path.join(__dirname, loc) }`);
    }
  });
}
