# Tag Worker

The Tag Worker is a Basic Worker dependent on the JSON Media Worker, since it has no reference to the actual JSON of the media. Only having reference to the Tags.

### Global Variables
  * tagdb: A Full Database Array of all the tags within the media.
  * tagImport: A Boolean of weather or not the tags have been imported. To Prevent null or incorrect responses.

### Global Error Codes
  * notImport: An error to return if the database hasn't been imported.
    * "Tags have not been initialized"

***

### Delete Tag

The ```deleteTag``` Function will return with a notImport error or other unadulterated errors. On successfully deleting the tag for the working Database and saving that database to the tags.json file will resolve the promise with ```Removed ${Name of Removed Item} Successfully from Tag DB```.

```deleteTag(name)```:
  * name: The friendly Name of the tag to delete.

*Note:* This should only ever be accessed through JSON Media Worker if the tag is to be removed from the actual Media Data.

***

### Create Tag

***

### Add Tag

***

### Get Tags

***

### Save Tag

***

### Init Tag 
