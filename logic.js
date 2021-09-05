var express = require("express");
var app = express();
const path = require('path');

const import_worker = require("./worker/import_worker");

// Define data to replac with imported data.
var media, gallery, uuid, tag, album;
var notifyReady = false;

var notification = require('./worker/notification_worker');
var dbimport = require('./worker/dbimport_worker');

dbimport.setPath(path.join(__dirname, "./json"));
dbimport.on('ready', function() {

  console.log('Assigning Imported Data...');
  media = dbimport.getMedia();
  gallery = dbimport.getGallery();
  uuid = dbimport.getUUID();
  tag = dbimport.getTag();
  album = dbimport.getAlbum();

  // With the imported data ready, we can start the server
  const server = app.listen(5000, () => console.log('API Server running on port 5000...'));

  //console.log(tag);
  //console.log(album);
  //console.log(uuid);
  //console.log(gallery);
  //console.log(media);

  // Allow a graceful shutdown of the server.
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP Server');
    server.close(() => {
      console.log('HTTP Server closed');
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT signal received: Closing HTTP Server');
    server.close(() => {
      console.log('HTTP Server Closed');
    });
  });

});

dbimport.on('error', function(data) {
  console.log(data);
});

notification.initNotification();

notification.on('ready', function() {
  notifyReady = true;
});


// Define the error handler
function error(status, msg) {
  var err = new Error(msg);
  err.status = status;
  console.log(err);
  return err;
}

function errorV2(req, res, status, msg) {
  console.error(msg);
  res.status(status);
  res.status(status).json(msg);
}

const getDurationInMilliseconds = (start) => {
  const NS_PER_SEC = 1e9;
  const NS_TO_MS = 1e6;
  const diff = process.hrtime(start);

  return(diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS;
}

app.use(function(req, res, next) {

  // middleware to help find the timing of functions
  console.log(`${req.method} ${req.originalUrl} [STARTED]`);
  const start = process.hrtime();

  res.on('finish', () => {
    const durationInMilliseconds = getDurationInMilliseconds (start)
    console.log(`${req.method} ${req.originalUrl} [FINISHED] ${durationInMilliseconds.toLocaleString()} ms`);
  });
  res.on('close', () => {
    const durationInMilliseconds = getDurationInMilliseconds (start)
    console.log(`${req.method} ${req.originalUrl} [CLOSED] ${durationInMilliseconds.toLocaleString()} ms`);
  });

  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

// Define different endpoint event handlers
app.get("/statuscheck", (req, res, next) => {
  var pjson = require('./package.json').version;
  res.json({ status: "ok", version: pjson, app: "lomiarch-api" });
  console.log("Responded to StatusCheck. Running Version: "+ pjson);
});


app.get("/tags", (req, res, next) => {
  // reply with all tags

  console.log("Tag return requested...");

  try {
    res.json(tag);
  } catch(ex) {
    return errorV2(req, res, 500, ex);
  }

});


app.get("/albums", (req, res, next) => {
  // reply with all albums
  console.log("Album return requested...");

  try {
    res.json(album);
  } catch(ex) {
    return errorV2(req, res, 500, ex);
  }
});

app.get("/details/:uuid?", (req, res, next) => {
  var uuid = req.params.uuid;

  console.log(`Content Details Requested: ${uuid}...`);

  try {

    if (!uuid) return errorV2(req, res, 400, 'UUID Required for Detail Request');

    if (!~uuid.indexOf(uuid)) return errorV2(req, res, 400, 'Invalid UUID Value');

    media.forEach(function(item, index, array) {
      if (media[index].uuid == uuid) {
        res.json(media[index]);
        console.log("Returned Details Request");
      }
    });

  } catch(ex) {
    errorV2(req, res, 500, ex);
  }

});


app.get("/gallery/:type?", (req, res, next) => {
  var max_return = 10;
  var type = req.params.type;
  const page = parseInt(req.query.page);

  console.log("Dev Type: "+type);
  console.log("Dev Page: "+page);


  try {

    if (!type) return errorV2(req, res, 400, 'Gallery Type Required');

    //if (!~gallery.indexOf(type)) return errorV2(req, res, 406, 'Invalid Gallery Type');

    // This should handle the different types of gallery requests that can be made.
    var galReq = 'default'; // normal galleries are the default return for this API func

    tag.forEach(function(item, index, array) {
      if (type == tag[index][0]) {
        console.log(`Gallery type matches tag: ${type} || ${tag[index][0]}`);
        galReq = 'tag';
        // If the gallery request is of a tag, return tag media with galReq var
      }
    });

    // Support for Albums as a gallery type
    album.forEach(function(item, index, array) {
      if (type == album[index].uuid) {
        console.log(`Gallery type matches Album Name: ${type} || ${album[index].name}`);
        galReq = 'album';
      }
    });

    // TODO: Add support for different Galleries

    if (galReq == 'default') {
      if (!~gallery.indexOf(type)) return errorV2(req, res, 406, 'Invalid Gallery Type');
    }

    var uuid_collection = [];

    media.forEach(function(item, index, array) {

      if (galReq == 'default') {

        if (media[index].gallery.indexOf(type) != -1) {
          //custom json return
          temp_json = { link: `/media/${media[index].uuid}`, date_taken: `${media[index].date_taken}`, time_taken: media[index].time_taken, type: media[index].type };
          uuid_collection.push(temp_json);
        }
      } else if (galReq == 'tag') {
        if (media[index].tag.indexOf(type) != -1) {
          //custom json return
          temp_json = { link: `/media/${media[index].uuid}`, date_taken: `${media[index].date_taken}`, time_taken: media[index].time_taken, type: media[index].type };
          uuid_collection.push(temp_json);

        }
      } else if (galReq == 'album') {
        if (media[index].album.indexOf(type) != -1) {
          //cusotm json return
          temp_json = { link: `/media/${media[index].uuid}`, date_taken: `${media[index].date_taken}`, time_taken: media[index].time_taken, type: media[index].type };
          uuid_collection.push(temp_json);
        }
      }

    });

    uuid_collection.sort((a, b) => b.time_taken - a.time_taken);  // sorts the items by most recent to oldest
    var total_uuid_collection = uuid_collection.length;
    if (uuid_collection.length > max_return) {

      uuid_collection.splice(max_return * page, uuid_collection.length - (max_return * page) );
      // the above should prune the remining items after the last position on the current page
      if (page != 1) {
        uuid_collection.splice(0, max_return * (page - 1) );
        // if we are not on page one,
        // this should remove preceding items to the first item on the current page.
      }
    } // else can be returned normally as no pruning is needed.

    finalized_json = { total: total_uuid_collection, media: uuid_collection };
    res.json(finalized_json);
    console.log("Returned Collection");

  } catch(ex) {
    return errorV2(req, res, 500, ex);
  }
});



app.get("/media/:id?", (req, res, next) => {
  var id = req.params.id;

  if (!id) return errorV2(req, res, 400, 'Media ID Required');
  if (!~uuid.indexOf(id)) return errorV2(req, res, 406, 'Invalid Media Request');

  try {
    media.forEach(function(item, index, array) {
      if (media[index].uuid == id) {
        res.sendFile(path.join(__dirname, String(media[index].pod_loc)));
        console.log("Responding to media request");
      }
    });
  } catch(ex) {
    return errorV2(req, res, 500, ex);
  }

});


app.get("/import", (req, res, next) => {
  console.log(import_worker.importWorker(path));
  res.sendStatus(200);
});

app.get("/notifications", (req, res, next) => {

});


// this will be my faux redis database
var media_old = [
  { uuid: 1, pod_loc: "/media/my_library/hot.jpg", time_taken: 1627431060, date_taken: "Wednesday, July 28, 2021 12:11:00 AM", gallery: [ 'default'], tag: [ ], album: [ 'a2' ], type: 'image' },
  { uuid: 2, pod_loc: "/media/my_library/dog.jpg", time_taken: 1627344660, date_taken: "Tuesday, July 27, 2021 12:11:00 AM", gallery: [ 'default', 'favourite' ], tag: [ 'animals' ], album: [ 'a1' ], type: 'image' },
  { uuid: 3, pod_loc: "/media/my_library/server.jpg", time_taken: 1626739860, date_taken: "Tuesday, July 20, 2021 12:11:00 AM", gallery: [ 'default' ], tag: [ 'tech' ], album: [ 'a2' ], type: 'image' },
  { uuid: 4, pod_loc: "/media/my_library/switch.jpg", time_taken: 1626912660, date_taken: "Thursday, July 22, 2021 12:11:00 AM", gallery: [ 'default', 'favourite' ], tag: [ 'tech' ], album: [ 'a2' ], type: 'image' },
  { uuid: 5, pod_loc: "/media/my_library/art.jpg", time_taken: 1627410540, date_taken: "Tuesday, July 27, 2021 6:29:00 PM", gallery: [ 'default'], tag: [ 'art' ], album: [ 'a1' ], type: 'image' },
  { uuid: 6, pod_loc: "/media/my_library/bird.jpg", time_taken: 1622922360, date_taken: "Saturday, June 5, 2021 7:46:00 PM", gallery: [ 'default'], tag: [ 'animals' ], album: [ 'a1' ], type: 'image' },
  { uuid: 7, pod_loc: "/media/my_library/cat.jpg", time_taken: 1627259520, date_taken: "Monday, july 26, 2021 12:32:00 AM", gallery: [ 'default'], tag: [ 'animals' ], album: [ 'a2' ], type: 'image' },
  { uuid: 8, pod_loc: "/media/my_library/cute.jpg", time_taken: 1627411020, date_taken: "Tuesday, July 27, 2021 6:37:00 PM", gallery: [ 'default'], tag: [ 'animals' ], album: [ 'a1' ], type: 'image' },
  { uuid: 9, pod_loc: "/media/my_library/dog2.jpeg", time_taken: 1627411680, date_taken: "Tuesday, July 27, 2021 6:48:00 PM", gallery: [ 'default'], tag: [ 'animals' ], album: [ 'a1' ], type: 'image' },
  { uuid: 10, pod_loc: "/media/my_library/dragon.jpg", time_taken: 1625496180, date_taken: "Monday, July 5, 2021 2:43:00 PM", gallery: [ 'default'], tag: [ 'animals' ], album: [ 'a2' ], type: 'image' },
  { uuid: 11, pod_loc: "/media/my_library/drives.jpg", time_taken: 1626864900, date_taken: "Wednesday, July 21, 2021 10:55:00 AM", gallery: [ 'default'], tag: [ 'tech' ], album: [ 'a2' ], type: 'image' },
  { uuid: 12, pod_loc: "/media/my_library/ducky.jpeg", time_taken: 1623490680, date_taken: "Saturday, June 12, 2021 9:38:00 AM", gallery: [ 'default'], tag: [ ], album: [ 'a2' ], type: 'image' },
  { uuid: 13, pod_loc: "/media/my_library/ewaste.jpg", time_taken: 1623329160, date_taken: "Thursday, June 10, 2021 12:46:00 PM", gallery: [ 'default'], tag: [ 'tech' ], album: [ 'a2' ], type: 'image' },
  { uuid: 14, pod_loc: "/media/my_library/flowers.jpeg", time_taken: 1627411680, date_taken: "Tuesday, July 27, 2021 6:48:00 PM", gallery: [ 'default'], tag: [ 'flowers', 'nature' ], album: [ 'a1' ], type: 'image' },
  { uuid: 15, pod_loc: "/media/my_library/minecraft.jpg", time_taken: 1627411200, date_taken: "Tuesday, July 27, 2021 6:40:00 PM", gallery: [ 'default'], tag: [ 'tech' ], album: [ 'a1' ], type: 'image' },
  { uuid: 16, pod_loc: "/media/my_library/plane.jpg", time_taken: 1627411260, date_taken: "Tuesday, July 27, 2021 6:41:00 PM", gallery: [ 'default'], tag: [ 'nature' ], album: [ 'a1' ], type: 'image' },
  { uuid: 17, pod_loc: "/media/my_library/poolflower.jpeg", time_taken: 1627411680, date_taken: "Tuesday, July 27, 2021 6:48:00 PM", gallery: [ 'default'], tag: [ 'flowers', 'nature' ], album: [ 'a1' ], type: 'image' },
  { uuid: 18, pod_loc: "/media/my_library/printer.jpg", time_taken: 1626902520, date_taken: "Wednesday, July 21, 2021 9:22:00 PM", gallery: [ 'default'], tag: [ 'tech' ], album: [ 'a2' ], type: 'image' },
  { uuid: 19, pod_loc: "/media/my_library/ram.jpg", time_taken: 1627229400, date_taken: "Sunday, July 25, 2021 4:10:00 PM", gallery: [ 'default'], tag: [ 'tech' ], album: [ 'a2' ], type: 'image' },
  { uuid: 20, pod_loc: "/media/my_library/rose.jpeg", time_taken: 1627411740, date_taken: "Tuesday, July 27, 2021 6:49:00 PM", gallery: [ 'default', 'favourite' ], tag: [ 'flowers', 'nature' ], album: [ 'a1' ], type: 'image' },
  { uuid: 21, pod_loc: "/media/my_library/sculpt.jpg", time_taken: 1627411440, date_taken: "Tuesday, July 27, 2021 6:44:00 PM", gallery: [ 'default'], tag: [ 'art' ], album: [ 'a1' ], type: 'image' },
  { uuid: 22, pod_loc: "/media/my_library/shopping.jpg", time_taken: 1627411500, date_taken: "Tuesday, July 27, 2021 6:45:00 PM", gallery: [ 'default'], tag: [ 'art' ], album: [ 'a1' ], type: 'image' },
  { uuid: 23, pod_loc: "/media/my_library/shrimp.jpg", time_taken: 1627411140, date_taken: "Tuesday, July 27, 2021 11:39:00 AM", gallery: [ 'default'], tag: [ 'food' ], album: [ 'a1' ], type: 'image' },
  { uuid: 24, pod_loc: "/media/my_library/sunset.jpeg", time_taken: 1627411740, date_taken: "Tuesday, July 27, 2021, 6:49:00 PM", gallery: [ 'default'], tag: [ 'nature' ], album: [ 'a1' ], type: 'image' },
  { uuid: 25, pod_loc: "/media/my_library/sushi.jpg", time_taken: 1625510940, date_taken: "Monday, July 5, 2021 6:49:00 PM", gallery: [ 'default'], tag: [ 'food' ], album: [ 'a1' ], type: 'image' },
  { uuid: 26, pod_loc: "/media/my_library/yum.jpg", time_taken: 1625338140, date_taken: "Saturday, July 3, 2021 6:49:00 PM", gallery: [ 'default'], tag: [ 'food' ], album: [ 'a1' ], type: 'image' }
];

var uuid_old = [
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26'
];

var gallery_old = [
  'default', 'favourite'
];

var tag_old = [
  [ 'animals', '#9c23e8' ],
  [ 'tech', '#b00406' ],
  [ 'art', '#30fce8' ],
  [ 'flowers', '#238001' ],
  [ 'nature', '#f2d646' ],
  [ 'food', '#f78f2d' ]
];

var album_old = [
  { uuid: 'a1', name: "Angie's Photos", preview: '/media/2', access: [ 'andy' ] },
  { uuid: 'a2', name: "Andy's Photos", preview: '/media/4', access: [ 'andy' ] }
];
