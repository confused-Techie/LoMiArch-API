Currently the major Layout of the Backend is as follows:

- json
- json/tags.json
- json/albums.json
- media
- media/trash
- media/purgatory
- modules
- scripts
- settings
- settings/blacklist.json
- settings/notifications.json
- tests
- worker
- .env

### json

This is the location all json data will be saved, the data for all active pieces of media

### media

This is the root of where all media items should be saved. This can be a folder with the files following for a 'Directory'

As well as containing the default trash and purgatory folders

#### trash

This is where any media items that were deleted will reside

#### purgatory

This is where any media items that have become corrupt or are otherwise unsuitable for the media library will reside.

### modules

These are all low level modules that other services rely on are. Realistically things like the getDurationInMilliseconds.js should be moved there, but haven't yet.

### scripts

Any scripts that don't exist within the main running of the program are here, like prerun

### settings

Any set settings will end up residing here, but currently contain just the blacklist (any files that are in the trash or purgatory ) and notifications.json to hold all active notifications.

### worker

All the major workers will be here. 
