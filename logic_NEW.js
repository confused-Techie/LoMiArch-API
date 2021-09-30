// This is under the new Reworked Moduler Worker Architecture

// Boiler plate imports
var express = require("express");
var app = express();
const path = require('path');

// Personal Worker Import
var getDurationInMilliseconds = require('./worker/getDurationInMilliseconds.js');
var notification = require('./worker/notification_worker.js');
var jsonMedia = require('./worker/jsonMedia_worker.js');
var media = require('./worker/media_worker.js');

// Import the actual Json Data and allow it to live within the jsonMedia dependency
console.log('Attempting to Init the jsonMedia.importMedia()');
jsonMedia.importMedia()
  .then(res => {

    // Now to import the Notification Worker
    console.log('Attempting to Init the notification.initNotification()');
    notification.initNotification()
      .then(res => {

        // Now to start up the actual server, and declare handling of shutdown

        console.log('Attempting to startup the Server');
        const server = app.listen(5000, () => console.log('API Server running on port 5000...'));

        // Allow a graceful shutdown
        process.on('SIGTERM', () => {
          console.log('SIGTERM Signal Received: Closing HTTP Server');
          server.close(() => {
            console.log('HTTP Server Closed');
          });
        });

        process.on('SIGINT', () => {
          console.log('SIGINT Signal Received: Closing HTTP Server');
          server.close(() => {
            console.log('HTTP Server Closed');
          });
        });

      })
      .catch(err => {
        console.log(err);
      });
  })
  .catch(err => {
    console.log(err);
  });

// Define an error handler

function error(req, res, status, msg) {
  console.error(msg);
  res.status(status);
  res.status(status).json(msg);
}

app.use(function(req, res, next) {
  // Middleware to help find the timing of functions
  const logStarted = (msg) => {
    console.log(`${msg} [STARTED]`);
  };
  const logFinished = (msg, time) => {
    console.log(`${msg} [FINISHED] ${time} ms`);
  };
  const logClosed = (msg, time) => {
    console.log(`${msg} [CLOSED] ${time} ms`);
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

// Define different endpoint event handlers
// We can assume if we are getting any, then the listen successfully passed the init functions
app.get("/statuscheck", (req, res, next) => {
  var pjson = require('./package.json').version;
  res.json({status: "ok", version: pjson, app: "lomiarch-api" });
  console.log("Responded to StatusCheck. Running Version: " + pjson);
});

// Also available: deleteTag, createTag, addTag, saveTag
app.get("/tags", (req, res, next) => {
  console.log("Tag return requested...");

  jsonMedia.getTags()
    .then(result => {
      res.json(result);
    })
    .catch(err => {
      // There should be error handling to change the status depending on the error
      return error(req, res, 500, err);
    });
});

app.get("/albums", (req, res, next) => {
  console.log('Album return requested...');
  jsonMedia.getAlbums()
    .then(result => {
      res.json(result);
    })
    .catch(err => {
      return error(req, res, 500, err);
    });
});

app.get("/details/:uuid?", (req, res, next) => {
  var uuid = req.params.uuid;

  console.log(`Content Details Requested: ${uuid}...`);
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
  // TODO: Implment function in jsonMedia_worker
  var type = req.params.type;
  const page = parseInt(req.query.page);

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

  console.log(`Media Requested: ${id}...`);

  jsonMedia.mediaFile(id)
    .then(result => {
      res.sendFile(path.join(__dirname, String(result)));
      console.log("Responding to Media Request...");
    })
    .catch(err => {
      // Again may need to include error checking
      return error(req, res, 400, err);
    });
});

app.delete("/media/:id?", (req, res, next) => {
  // TODO: Refer to get method
});

app.get("/import", (req, res, next) => {
  // TODO
});

// Also Available: updateNotification, newNotification, saveNotification,
app.get("/notifications/:id?", (req, res, next) => {
  var id = req.params.id;

  console.log(`Notification Requested: ${id}...`);

  if (!id) {
    // With no notification ID specified will return all
    console.log(`No Notification ID Specified, returning all...`);
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

  console.log(`Notification Deletion Requested: ${id}`);

  notification.deleteNotification(id)
    .then(result => {
      res.json(result);
    })
    .catch(err => {
      return error(req, res, 500, err);
    });
});

app.get("/validate", (req, res, next) => {
  // TODO
});
