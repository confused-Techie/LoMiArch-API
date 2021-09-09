// TODO:
// create tag
// delete tag
// add itme to tag; should take single item or array

const path = require('path');

module.exports.deleteTag = function(name, tag) {
  deleteTag(name, tag);
}

module.exports.createTag = function(name, colour, uuidToAdd, media) {
  createTag(name, colour, uuidToAdd, media);
}

module.exports.addTag = function() {

}

function deleteTag(name, tag) {
  // Rather simple we just remove the tag requested from the full tag
  try {
    // Since tag is a two dimensional array we can't use indexof and will loop
    var tagIndex;
    tag.forEach((item, index) => {
      if (name == item[0]) {
        tagIndex = index;
      }
    });

    if (tagIndex != '') {
      let removedItem = tag.splice(tagIndex, 1);
      console.log(`Removed ${removedItem[0]} Successfully from Tag DB`);
    } else {
      console.log('Was unable to find Tag within Tag DB...');
      console.log('Failed to remove requested Tag...');
    }
  } catch(ex) {
    console.log(`An Error Occured Removing Tag from DB: ${ex}`);
  }

}

function createTag(name, colour) {

}

function addTag() {

}
