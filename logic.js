// This is under the new Reworked Moduler Worker Architecture

// Boiler plate imports
var express = require("express");
var app = express();
const path = require('path');

const { listen_port } = require('./modules/env_config.js');
//logger.log('critical', 'logic.js', 'Global', 'test');

// Personal Worker Import
var getDurationInMilliseconds = require('./worker/getDurationInMilliseconds.js');
var logger = require('./modules/logger.js');
var notification = require('./worker/notification_worker.js');
var jsonMedia = require('./worker/jsonMedia_worker.js');
var media = require('./worker/media_worker.js');

// Import the actual Json Data and allow it to live within the jsonMedia dependency
logger.log('notice', 'logic.js', 'Global', 'Attempting to Init the jsonMedia.importMedia()');
//console.log('Attempting to Init the jsonMedia.importMedia()');
jsonMedia.importMedia()
  .then(res => {

    // Now to import the Notification Worker
    logger.log('notice', 'logic.js', 'importMedia=>res', 'Attempting to Init the notification.initNotification()');
    notification.initNotification()
      .then(res => {

        // Now to start up the actual server, and declare handling of shutdown

        logger.log('notice', 'logic.js', 'initNotification=>res', 'Attempting to startup the Server');
        const server = app.listen(listen_port, () => logger.log('notice', 'logic.js', 'Global', `API Server running on port ${listen_port}...`));

        // Allow a graceful shutdown
        process.on('SIGTERM', () => {
          logger.log('emergency', 'logic.js', 'Global', 'SIGTERM Signal Received: Closing HTTP Server');
          server.close(() => {
            logger.log('emergency', 'logic.js', 'Global', 'HTTP Server Closed');
          });
        });

        process.on('SIGINT', () => {
          logger.log('emergency', 'logic.js', 'Global', 'SIGINT Signal Received: Closing HTTP Server');
          server.close(() => {
            logger.log('emergency', 'logic.js', 'Global', 'HTTP Server Closed');
          });
        });

      })
      .catch(err => {
        logger.log('emergency', 'logic.js', 'initNotification=>catch', err);
      });
  })
  .catch(err => {
    logger.log('emergency', 'logic.js', 'importMedia=>catch', err);
  });

// Define an error handler

function error(req, res, status, msg) {
  // As of now these will all be logged under 'error', but this function handles serverside and clientside errors.
  // Once the returns have status codes baked in this should check and only report serverside errors as 'error', and clientside under 'warning'
  // TODO:
  logger.log('error', 'logic.js', 'error()', msg);
  res.status(status);
  res.status(status).json(msg);
}

app.use(function(req, res, next) {
  // Middleware to help find the timing of functions
  const logStarted = (msg) => {
    logger.log('info', 'logic.js', 'logStarted', `${msg} [STARTED]`);
  };
  const logFinished = (msg, time) => {
    logger.log('info', 'logic.js', 'logFinished', `${msg} [FINISHED] ${time} ms`);
  };
  const logClosed = (msg, time) => {
    logger.log('info', 'logic.js', 'logClosed', `${msg} [CLOSED] ${time} ms`);
  };

  logStarted (`${req.method} ${req.originalUrl}`);

  const start = process.hrtime();

  res.on('finish', () => {
    const durationInMilliseconds = getDurationInMilliseconds.getDurationInMilliseconds(start);
    logFinished (`${req.method} ${req.originalUrl}`, durationInMilliseconds.toLocaleString());
  });

  res.on('close', () => {
    const durationInMilliseconds = getDurationInMilliseconds.getDurationInMilliseconds(start);
    logClosed (`${req.method} ${req.originalUrl}`, durationInMilliseconds.toLocaleString());
  });

  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-Width");
  next();
});

// API ENDPOINTS ------------------------------------------------------------

// SERVER KNOWLEDGE API ENDPOINT -----------------------------------

// Define different endpoint event handlers
// We can assume if we are getting any, then the listen successfully passed the init functions
app.get("/statuscheck", (req, res, next) => {
  var pjson = require('./package.json').version;
  res.json({status: "ok", version: pjson, app: "lomiarch-api" });
  logger.log('debug', 'logic.js', 'GET /statuscheck', `Responded to StatusCheck. Running Version: ${pjson}`);
});

// TAG API ENDPOINT ---------------------------------

app.get("/tags", (req, res, next) => {
  logger.log('debug', 'logic.js', 'GET /tags', "Tag return requested...");

  jsonMedia.getTags()
    .then(result => {
      res.json(result);
    })
    .catch(err => {
      // There should be error handling to change the status depending on the error
      return error(req, res, 500, err);
    });
});

app.delete("/deleteTag", (req, res, next) => {
  logger.log('debug', 'logic.js', 'DELETE /deleteTag', "Delete Tag Requested...");

  var tagName = req.params.tag;

  jsonMedia.deleteTag(tagName)
    .then(result => {
      res.json(result);
    })
    .catch(err => {
      return error(req, res, 500, err);
    });
});

app.get("/createTag", (req, res, next) => {
  var tagName = req.params.tagName;
  var tagColour = req.params.tagColour;

  logger.log('debug', 'logic.js', 'GET /createTag', "Tag Creation Requested...");

  jsonMedia.createTag(tagName, tagColour)
    .then(result => {
      res.json(result);
    })
    .catch(err => {
      return error(req, res, 500, err);
    });
});

app.get("/addTag", (req, res, next) => {
  var tagToAdd = req.query.tag;
  var uuid = req.query.uuid;

  console.log(`tagToAdd: ${tagToAdd}`);
  console.log(`uuid: ${uuid}`);

  logger.log('debug', 'logic.js', 'GET /addTag', 'Adding Tag to Media Requested...');

  jsonMedia.addTag(uuid, tagToAdd)
    .then(result => {
      res.json(result);
    })
    .catch(err => {
      return error(req, res, 500, err);
    });
});

app.get("/saveTag", (req, res, next) => {
  logger.log('debug', 'logic.js', 'GET /saveTag', 'Tag Save Requested...');

  jsonMedia.saveTag()
    .then(result => {
      res.json(result);
    })
    .catch(err => {
      return error(req, res, 500, err);
    });
});

// ALBUM API ENDPOINT ---------------------------------

app.get("/albums", (req, res, next) => {
  logger.log('debug', 'logic.js', 'GET /albums', 'Album return requested...');
  jsonMedia.getAlbums()
    .then(result => {
      res.json(result);
    })
    .catch(err => {
      return error(req, res, 500, err);
    });
});

app.get("/createAlbum", (req, res, next) => {
  logger.log('debug', 'logic.js', 'GET /createAlbum', 'Album Creation Requested...');
  var albumName = req.params.albumName;
  var albumPreview = req.params.albumPreview;

  // Since authentication is not configured the creator will not be considered and given a default value
  var albumCreator = 'user';

  jsonMedia.createAlbum(albumName, albumPreview, albumCreator)
    .then(result => {
      res.json(result);
    })
    .catch(err => {
      return error(req, res, 500, err);
    });
});

app.delete("/deleteAlbum", (req, res, next) => {
  var albumUUID = req.params.albumUUID;

  logger.log('debug', 'logic.js', 'DELETE /deleteAlbum', 'Album Deletion Requested...');

  jsonMedia.deleteAlbum(albumUUID)
    .then(result => {
      res.json(result);
    })
    .catch(err => {
      return error(req, res, 500, err);
    });
});

app.get("/saveAlbum", (req, res, next) => {
  logger.log('debug', 'logic.js', 'GET /saveAlbum', "Album Saving Requested...");

  jsonMedia.saveALbums()
    .then(result => {
      res.json(result);
    })
    .catch(err => {
      return error(req, res, 500, err);
    });
});

app.get("/editAlbum", (req, res, next) => {
  var albumUUID = req.params.albumUUID ? req.params.albumUUID : false;
  var albumName = req.params.newName ? req.params.newName : false;
  var albumPreview = req.params.newPreview ? req.params.newPreview : false;
  var albumAccess = req.params.newAccess ? req.params.newAccess : false;

  logger.log('debug', 'logic.js', 'GET /editAlbum', "Edit Album Requested");

  jsonMedia.editAlbum(albumUUID, albumName, albumPreview, albumAccess)
    .then(result => {
      res.json(result);
    })
    .catch(err => {
      return error(req, res, 500, err);
    });
});

app.get("/addToAlbum", (req, res, next) => {
  var mediaToAdd = req.params.mediaUUID;
  var albumToAdd = req.params.albumUUID;

  jsonMedia.contentAddAlbum(mediaToAdd, albumToAdd)
    .then(result => {
      res.json(result);
    })
    .catch(err => {
      return error(req, res, 500, err);
    });
});

// MEDIA API ENDPOINTS ----------------------------------

app.get("/details/:uuid?", (req, res, next) => {
  var uuid = req.params.uuid;

  logger.log('debug', 'logic.js', 'GET /details/:uuid?', `Content Details Requested: ${uuid}...`);
  jsonMedia.mediaDetails(uuid)
    .then(result => {
      res.json(result);
    })
    .catch(err => {
      // Again may need to include error checking
      return error(req, res, 500, err);
    });
});

app.get("/gallery/:type?", (req, res, next) => {
  var type = req.params.type;
  const page = parseInt(req.query.page);

  logger.log('debug', 'logic.js', 'GET /gallery/:type?', `Gallery Requested ${type}...`);

  jsonMedia.mediaCollection(type, page)
    .then(result => {
      res.json(result);
    })
    .catch(err => {
      return error(req, res, 400, err);
    });
});

app.get("/media/:id?", (req, res, next) => {
  var id = req.params.id;

  logger.log('debug', 'logic.js', 'GET /media/:id?', `Media Requested: ${id}...`);

  jsonMedia.mediaFile(id)
    .then(result => {
      res.sendFile(path.join(__dirname, String(result)));
      logger.log('debug', 'logic.js', 'GET /media/:id?', "Responding to Media Request...");
    })
    .catch(err => {
      // Again may need to include error checking
      return error(req, res, 400, err);
    });
});

app.delete("/media/:id?", (req, res, next) => {

  // This will need to do a few things
  // convert the UUID passed to an actual image file
  // delete the json file, and remove the json file from the db
  // copy the media file to purgatory or trash

  var id = req.params.id;

  logger.log('debug', 'logic.js', 'DELETE /media/:id?', `Media Deletion Requested via API: ${id}...`);

  // Since jsonMedia_worker has a faster method of determining weather a uuid is valid, and will give me the
  // physical path, we will invoke that first unlike validation_worker

  jsonMedia.mediaDetails(id)
    .then(jsonResult => {
      // Now with all the files data, we can remove the JSON data then the file
      jsonMedia.removeMedia(id, 'trash')
        .then(jsonRemoveResult => {
          media.deleteMedia(path.join(__dirname, `./${jsonResult.pod_loc}`), 'trash', `${jsonResult.uuid}.${jsonResult.exactType}`)
            .then(mediaRemoveResult => {
              // Now with the media fully deleted, and its JSON data inside the blacklist, we could create a notification
              // But the notification is better to be set by a variable. So we will just return
              res.json(`Successfully Moved ${id} to the Trash`);
            })
            .catch(err => {
              return error(req, res, 400, err);
            });
        })
        .catch(err => {
          return error(req, res, 400, err);
        });
    })
    .catch(err => {
      return error(req, res, 400, err);
    });
});

app.get("/import", (req, res, next) => {
  logger.log('debug', 'logic.js', 'GET /import', "Import Requested...");

  try {
    media.importMedia(jsonMedia.getMedia)
      .then(result => {
        res.json('Successfully Imported Items');
        logger.log('debug', 'logic.js', 'GET /import', 'Returned successful Json Object');
      })
      .catch(err => {
        return error(req, res, 500, err);
      });
  } catch(err) {
    return error(req, res, 400, err);
  }
});

// NOTIFICATION API ENDPOINT --------------------------------------------

app.get("/notifications/:id?", (req, res, next) => {
  var id = req.params.id;

  logger.log('debug', 'logic.js', 'GET /notifications/:id?', `Notification Requested: ${id}...`);

  if (!id) {
    // With no notification ID specified will return all
    logger.log('debug', 'logic.js', 'GET /notifications/:id?', `No Notification ID Specified, returning all...`);
    notification.getNotifications()
      .then(result => {
        res.json(result);
      })
      .catch(err => {
        return error(req, res, 500, err);
      });
  } else {
    // ID Specified
    notification.getNotification(id)
      .then(result => {
        res.json(result);
      })
      .catch(err => {
        return error(req, res, 500, err);
      });
  }
});

app.delete("/notifications/:id?", (req, res, next) => {
  var id = req.params.id;

  logger.log('debug', 'logic.js', 'DELETE /notifications/:id?', `Notification Deletion Requested: ${id}`);

  notification.deleteNotification(id)
    .then(result => {
      res.json(result);
    })
    .catch(err => {
      return error(req, res, 500, err);
    });
});

app.get("/UpdateNotification", (req, res, next) => {
  logger.log('debug', 'logic.js', 'GET /UpdateNotification', 'Notification Update Check Requested...');

  notification.updateNotification()
    .then(result => {
      res.json(result);
    })
    .catch(err => {
      return error(req, res, 500, err);
    });
});

app.get("/createNotification", (req, res, next) => {
  var notifyTitle = req.params.title;
  var notifyMessage = req.params.msg;
  var notifyPriority = req.params.priority;

  logger.log('debug', 'logic.js', 'GET /createNotification', `Create Notification Requested: ${notifyTitle}`);

  notification.newNotification(notifyTitle, notifyMessage, notifyPriority)
    .then(result => {
      res.json(result);
    })
    .catch(err => {
      return error(req, res, 500, err);
    });
});

app.get("/saveNotification", (req, res, next) => {
  logger.log('debug', 'logic.js', 'GET /saveNotification', 'Saving Notifications Requested...');

  notification.saveNotification()
    .then(result => {
      res.json(result);
    })
    .catch(err => {
      return error(req, res, 500, err);
    });
});

// COMPLEX WORKER API ENDPOINT ------------------------------------------

app.get("/validate", (req, res, next) => {

  logger.log('debug', 'logic.js', 'GET /validate', `Library Validation Requested.`);
  var validation = require('./worker/validation_worker.js');
  validation.validate(jsonMedia.getMedia(), notification, media, jsonMedia)
    .then(result => {
      res.json(result);
    })
    .catch(err => {
      return error(req, res, 500, err);
    });
});
