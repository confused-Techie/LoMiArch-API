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
