## Modules

Modules are some of the lowest level components within the project. Allowing easy use of things like file system operations.

### * File Handler

The File Handler or ```/modules/file_handler.js``` creates easy interaction with the File System. Many times expecting or returning JSON Objects.

#### * Read File

The ```read_file``` function is a Promise that will return the data as JSON if present, otherwise will return a string "nodata". If it fails will reject with is unadulterated error.

```read_file( datapath, friendlyName)```:
  * datapath: The Path to the data. Requiring the Full Path.
  * friendlyName: Used for logging purposes only.

Ex.

```javascript
const path = require('path');
var file_handler = require('../modules/file_handler');

file_handler.read_file(path.join(__dirname, '../json/tags.json'), 'Tag Collection')
  .then(res => {

      if (res == 'nodata') {
        // The file was empty.
      } else {
        // The file has been returned as an Object.
      }
    })
    .catch(err => {
      console.log(err);
    });
```
***

#### * Write File

The ```write_file``` function is a Promise that will resolve with a string "SUCCESS" if successful in writing the file, otherwise will reject with the unadulterated error.

```write_file(dataPath, dataToWrite, friendlyName)```:
  * dataPath: The Full Path to the data.
  * dataToWrite: The raw data to write. Will have prettified ```JSON.stringify()``` applied to it.
  * friendlyName: Used for logging purposes only.

Ex.

```javascript
var tagdb = ' [exData, 0 ], [exData, 1]';

const path = require('path');
var file_handler = require('../modules/file_handler');

file_handler.write_file(path.join(__dirname, '../json/tags.json'), tagdb, 'TagCollection')
  .then(res => {
      // The data has been successfully resolved
      // And res == 'SUCCESS'
    })
    .catch(err => {
      console.log(err);
    });
```

***

#### * Delete File

This has not yet been implemented.
