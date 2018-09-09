var require = meteorInstall({"imports":{"api":{"collections":{"collections.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/collections/collections.js                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  Collections: () => Collections
});
let Mongo;
module.watch(require("meteor/mongo"), {
  Mongo(v) {
    Mongo = v;
  }

}, 0);
let SimpleSchema;
module.watch(require("meteor/aldeed:simple-schema"), {
  SimpleSchema(v) {
    SimpleSchema = v;
  }

}, 1);
const Collections = new Meteor.Collection('collections');
// Deny all client-side updates since we will be using methods to manage this collection
Collections.deny({
  insert() {
    return true;
  },

  update() {
    return true;
  },

  remove() {
    return true;
  }

});
Collections.Schema = new SimpleSchema({
  // Our schema rules will go here.
  "collection_id": {
    type: String,
    label: "Collection ID",
    optional: false,
    defaultValue: "MyCollection",
    index: true,
    unique: true
  },
  "collection_name": {
    type: String,
    label: "Collection Name",
    optional: false,
    defaultValue: "MyCollection",
    index: true
  },
  "collection_type": {
    type: String,
    label: "Collection type",
    optional: false,
    allowedValues: ["face", "voice"],
    defaultValue: "face"
  },
  "private": {
    type: Boolean,
    label: "Collection privacy",
    optional: false,
    defaultValue: true
  },
  "created": {
    type: Date,
    label: "Date collection added to Antennae",
    autoValue: function () {
      if (this.isInsert) {
        return new Date();
      }
    },
    optional: true
  },
  "updated": {
    type: Date,
    label: "Date collection updated in System",
    autoValue: function () {
      if (this.isUpdate) {
        return new Date();
      }
    },
    optional: true
  }
});
Collections.attachSchema(Collections.Schema);
Collections.publicFields = {
  collection_id: 1,
  collection_name: 1,
  collection_type: 1,
  private: 1,
  created: 1,
  updated: 1
}; // Collections.helpers({
//   // A collections is considered to be private if "private" is set to true
//   isPrivate() {
//     return this.private;
//   }
// });
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"methods.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/collections/methods.js                                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let DDPRateLimiter;
module.watch(require("meteor/ddp-rate-limiter"), {
  DDPRateLimiter(v) {
    DDPRateLimiter = v;
  }

}, 0);
let AWS;
module.watch(require("aws-sdk"), {
  default(v) {
    AWS = v;
  }

}, 1);
let Collections;
module.watch(require("./collections.js"), {
  Collections(v) {
    Collections = v;
  }

}, 2);
AWS.config.region = 'us-east-1';
var rekognition = new AWS.Rekognition();
Meteor.methods({
  "collection.save"(newCol) {
    console.log(newCol);
    let collectionParams = {
      CollectionId: newCol.collection_id
    };
    let collectionRequest = rekognition.createCollection(collectionParams).promise().catch(error => {
      throw new Meteor.Error(error.code, error.message, error);
      return error;
    });
    collectionRequest.then(values => {
      return values;
    });
    let col = Collections.insert(newCol);

    if (col) {
      console.log(`added collection: ${col}`);
    } else {
      console.log(newCol);
      throw new Meteor.Error('add-collection-error', `error adding collection: ${newCol}`);
    }

    return `added collection: ${col}`;
  },

  "collection.delete"(colId) {
    check(colId, String);
    let col = Collections.findOne(colId);
    console.log(col);

    if (!col) {
      throw new Meteor.Error('no-collection', 'No collection found with given id!');
    } else {
      let params = {
        CollectionId: col.collection_id
      };
      let collectionRequest = rekognition.deleteCollection(params).promise().catch(error => {
        throw new Meteor.Error(error.code, error.message, error);
        return error;
      });
      collectionRequest.then(values => {
        return values;
      });
      let oldCol = Collections.remove(col._id);

      if (oldCol) {
        console.log(`removed collection: ${oldCol}`);
      } else {
        console.log(colId);
        throw new Meteor.Error('remove-collection-error', `error removing collection: ${colId}`);
      }

      ;
      return `removed collection: ${colId}`; // let print = Collections.remove(colId);
      // console.log(`deleted collection: ${colId}`);
      // return `deleted collection: ${colId}`;
    }

    ;
  }

}); // Define a rule to limit method calls
// let runScanRule = {
// 	type: 'method',
// 	name: 'moment.scan'
// };
// Add the rule, allowing up to 1 scan every 10 seconds
// DDPRateLimiter.addRule(runScanRule, 1, 10000);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publications.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/collections/publications.js                                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let DDPRateLimiter;
module.watch(require("meteor/ddp-rate-limiter"), {
  DDPRateLimiter(v) {
    DDPRateLimiter = v;
  }

}, 0);
let Collections;
module.watch(require("./collections.js"), {
  Collections(v) {
    Collections = v;
  }

}, 1);
Meteor.publish('collections.get', function (collectionId = '') {
  check(collectionId, String);
  collectionId = collectionId || {}; // console.log(Collections.find(collectionId).count());

  return Collections.find(collectionId, {
    sort: {
      created: -1
    }
  }, {
    fields: Collections.publicFields
  });
}); // Define a rule to limit subscription calls

var subscribeToCollectionsRule = {
  type: 'subscription',
  name: 'collections.get' // Add the rule, allowing up to 1 subscription every 5 seconds.

};
DDPRateLimiter.addRule(subscribeToCollectionsRule, 1, 5000);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"prints":{"methods.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/prints/methods.js                                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let DDPRateLimiter;
module.watch(require("meteor/ddp-rate-limiter"), {
  DDPRateLimiter(v) {
    DDPRateLimiter = v;
  }

}, 0);
let AWS;
module.watch(require("aws-sdk"), {
  default(v) {
    AWS = v;
  }

}, 1);
let Collections;
module.watch(require("../collections/collections.js"), {
  Collections(v) {
    Collections = v;
  }

}, 2);
let Prints;
module.watch(require("./prints.js"), {
  Prints(v) {
    Prints = v;
  }

}, 3);
AWS.config.region = 'us-east-1';
var rekognition = new AWS.Rekognition();
Meteor.methods({
  "print.save"(newPrint) {
    let col = Collections.findOne(newPrint.collection);
    console.log(col);

    if (!col) {
      throw new Meteor.Error('no-collection', 'No collection found with given id!');
    }

    ;
    newPrint.print_adder = this.userId || "null";
    newPrint.print_collection = col.collection_id || "people";
    newPrint.print_collection_id = col._id;
    newPrint.print_name = newPrint.name.replace(/ /g, "_");
    newPrint.print_img = newPrint.img; // console.log(newPrint);

    if (!newPrint) {
      throw new Meteor.Error('invalid-print', 'submitted print is invalid!');
    }

    ;
    Prints.simpleSchema().clean(newPrint); // index a face into a collection

    let faceParams = {
      CollectionId: newPrint.print_collection,
      ExternalImageId: newPrint.print_name,
      Image: {
        "Bytes": new Buffer.from(newPrint.print_img.split(",")[1], "base64")
      },
      DetectionAttributes: ["ALL"]
    };
    let faceRequest = rekognition.indexFaces(faceParams);
    let promise = faceRequest.promise();
    let indexFace = promise.then(result => {
      // console.log(result);
      newPrint.print_id = result.FaceRecords[0].Face.FaceId;
      let print = Prints.insert(newPrint);
      console.log(`inserted: ${print}`);
      return result;
    }).catch(error => {
      throw new Meteor.Error(error.code, error.message, error);
      return error;
    });
    return indexFace;
  },

  "print.delete"(printId) {
    check(printId, String);

    if (printId) {
      let print = Prints.remove(printId);
      console.log(`deleted face: ${printId}`);
      return `deleted face: ${printId}`;
    }

    ;
  },

  "print.count"(data) {
    console.log(data); // return 55;

    let colId = data || "";
    check(colId, String);

    if (colId) {
      let printCount = Prints.find({
        print_collection_id: colId
      }).count();
      console.log(printCount);
      return printCount;
    }

    ;
  }

}); // Define a rule to limit method calls
// let runScanRule = {
// 	type: 'method',
// 	name: 'print.save'
// };
// Add the rule, allowing up to 1 scan every 10 seconds
// DDPRateLimiter.addRule(runScanRule, 1, 10000);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"prints.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/prints/prints.js                                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  Prints: () => Prints
});
let Mongo;
module.watch(require("meteor/mongo"), {
  Mongo(v) {
    Mongo = v;
  }

}, 0);
let SimpleSchema;
module.watch(require("meteor/aldeed:simple-schema"), {
  SimpleSchema(v) {
    SimpleSchema = v;
  }

}, 1);
const Prints = new Meteor.Collection('prints');
// Deny all client-side updates since we will be using methods to manage this collection
Prints.deny({
  insert() {
    return true;
  },

  update() {
    return true;
  },

  remove() {
    return true;
  }

});
Prints.Schema = new SimpleSchema({
  // Our schema rules will go here.
  "print_id": {
    type: String,
    label: "Print ID",
    optional: false,
    defaultValue: "AAAA-BBBB-CCCC-1111-2222-3333",
    index: true,
    unique: true
  },
  "print_name": {
    type: String,
    label: "Print Name",
    optional: false,
    defaultValue: "New Person"
  },
  "print_type": {
    type: String,
    label: "Print type",
    optional: false,
    allowedValues: ["face", "voice", "finger"],
    defaultValue: "face"
  },
  "print_collection": {
    type: String,
    label: "Print collection",
    optional: false,
    defaultValue: "people"
  },
  "print_collection_id": {
    type: String,
    label: "Print collection ID",
    optional: false
  },
  "print_img": {
    type: String,
    label: "Print img",
    optional: true,
    defaultValue: "/img/face-id-100.png"
  },
  "print_details": {
    type: Object,
    label: "Print details",
    optional: true,
    blackbox: true
  },
  "print_adder": {
    type: String,
    label: "User who added print",
    optional: false
  },
  "created": {
    type: Date,
    label: "Date print added to Antennae",
    autoValue: function () {
      if (this.isInsert) {
        return new Date();
      }
    },
    optional: true
  },
  "updated": {
    type: Date,
    label: "Date print updated in System",
    autoValue: function () {
      if (this.isUpdate) {
        return new Date();
      }
    },
    optional: true
  }
});
Prints.attachSchema(Prints.Schema);
Prints.publicFields = {
  print_id: 1,
  print_name: 1,
  print_type: 1,
  print_collection: 1,
  print_collection_id: 1,
  print_img: 1,
  print_details: 1,
  print_adder: 1,
  created: 1,
  updated: 1
}; // Prints.helpers({
//   // A collections is considered to be private if "private" is set to true
//   isPrivate() {
//     return this.private;
//   }
// });
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publications.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/prints/publications.js                                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let DDPRateLimiter;
module.watch(require("meteor/ddp-rate-limiter"), {
  DDPRateLimiter(v) {
    DDPRateLimiter = v;
  }

}, 0);
let Prints;
module.watch(require("./prints.js"), {
  Prints(v) {
    Prints = v;
  }

}, 1);
Meteor.publish('prints.get', function (collectionId) {
  collectionId = collectionId || "";
  check(collectionId, String);
  let selector = collectionId ? {
    print_collection_id: collectionId
  } : {};
  console.log(selector);
  return Prints.find(selector, {
    sort: {
      created: -1
    }
  }, {
    fields: Prints.publicFields
  });
}); // Define a rule to limit subscription calls

var subscribeToPrintsRule = {
  type: 'subscription',
  name: 'prints.get' // Add the rule, allowing up to 1 subscription every 5 seconds.

};
DDPRateLimiter.addRule(subscribeToPrintsRule, 1, 5000);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"searches":{"methods.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/searches/methods.js                                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let DDPRateLimiter;
module.watch(require("meteor/ddp-rate-limiter"), {
  DDPRateLimiter(v) {
    DDPRateLimiter = v;
  }

}, 0);
let AWS;
module.watch(require("aws-sdk"), {
  default(v) {
    AWS = v;
  }

}, 1);
let Collections;
module.watch(require("../collections/collections.js"), {
  Collections(v) {
    Collections = v;
  }

}, 2);
let Prints;
module.watch(require("../../api/prints/prints.js"), {
  Prints(v) {
    Prints = v;
  }

}, 3);
let Searches;
module.watch(require("./searches.js"), {
  Searches(v) {
    Searches = v;
  }

}, 4);
AWS.config.region = 'us-east-1';
var rekognition = new AWS.Rekognition();
Meteor.methods({
  "search.face"(picData, matchThreshold = 98) {
    //return 1;
    // if(!Meteor.user){
    // 	throw new Meteor.Error('not-logged-in','must be logged-in to perform search');
    // 	return false;
    // }
    // let matchThreshold = matchThreshold;
    check(matchThreshold, Number);
    console.log("ANALYZING IMAGE...");
    var t0 = new Date().getTime();
    let imgBytes = new Buffer.from(picData.split(",")[1], "base64"); // let colId = Meteor.user().profile.collections;

    let colIds = Collections.find({
      collection_type: 'face'
    }, {
      fields: {
        collection_id: 1
      }
    }).fetch();
    console.log(colIds);
    let moderationParams = {
      "Image": {
        "Bytes": imgBytes
      },
      "MinConfidence": 50
    };
    let labelParams = {
      "Image": {
        "Bytes": imgBytes
      },
      "MaxLabels": 20,
      "MinConfidence": 75
    };
    let faceParams = {
      "Image": {
        "Bytes": imgBytes
      },
      "Attributes": ["ALL"]
    };
    let celebrityParams = {
      "Image": {
        "Bytes": imgBytes
      }
    }; // create request objects

    let moderationRequest = rekognition.detectModerationLabels(moderationParams);
    let labelRequest = rekognition.detectLabels(labelParams);
    let faceRequest = rekognition.detectFaces(faceParams);
    let celebrityRequest = rekognition.recognizeCelebrities(celebrityParams); // create promises

    let allPromises = [];
    allPromises.push(moderationRequest.promise().catch(error => {
      throw new Meteor.Error(error.code, error.message, error);
      return error;
    }));
    allPromises.push(labelRequest.promise().catch(error => {
      throw new Meteor.Error(error.code, error.message, error);
      return error;
    }));
    allPromises.push(faceRequest.promise().catch(error => {
      throw new Meteor.Error(error.code, error.message, error);
      return error;
    }));
    allPromises.push(celebrityRequest.promise().catch(error => {
      throw new Meteor.Error(error.code, error.message, error);
      return error;
    }));

    _.each(colIds, colId => {
      let rekognitionParams = {
        "CollectionId": colId.collection_id,
        "FaceMatchThreshold": matchThreshold,
        "MaxFaces": 2,
        "Image": {
          "Bytes": imgBytes
        }
      };
      console.log(rekognitionParams);
      let rekognitionRequest = rekognition.searchFacesByImage(rekognitionParams);
      allPromises.push(rekognitionRequest.promise().catch(error => {
        throw new Meteor.Error(error.code, error.message, error);
        return error;
      }));
      console.log(colId.collection_id);
    }); // rekognitionRequest.promise();
    // Fulfill promises in parallel


    let response = Promise.all(allPromises).then(values => {
      console.log(JSON.stringify(values));
      console.log(values[0]);
      console.log(values[1]);
      console.log(values[2]);
      console.log(values[3]); //console.log(values[4]);

      let i = 4;
      let persons = [];

      while (values[i]) {
        console.log(values[i]);

        if (values[i].FaceMatches[0]) {
          let tag = {
            collection: Prints.findOne({
              print_id: values[i].FaceMatches[0].Face.FaceId
            }, {
              fields: {
                print_collection: 1
              }
            }),
            image_id: values[i].FaceMatches[0].Face.ExternalImageId,
            face_id: values[i].FaceMatches[0].Face.FaceId,
            similarity: values[i].FaceMatches[0].Similarity
          };
          persons.push(tag);
          console.log(tag);
        }

        ;
        i++;
      }

      ;
      let t1 = new Date().getTime();
      console.log(`Response took ${t1 - t0} ms`);
      let search_results = {
        moderation: values[0].ModerationLabels,
        labels: values[1].Labels,
        faceDetails: values[2].FaceDetails,
        celebrity: values[3].CelebrityFaces,
        persons: persons //.FaceMatches[0],

      };
      let search = {
        // search_image: picData,
        search_results: search_results
      };
      let saveSearch = Searches.insert(search);
      console.log(saveSearch);
      return search_results;
    }).catch(error => {
      console.log('caught error!');
      console.log(error);
      throw new Meteor.Error(error.error, error.reason, error.details);
    }).finally(() => {
      console.log('finally');
      console.log(this);
    });
    console.log(response);
    let t1 = new Date().getTime();
    console.log(`Request took ${t1 - t0} ms`);
    return response;
  },

  "search.delete"(searchId) {
    check(searchId, String);

    if (searchId) {
      let search = Searches.remove(searchId);
      console.log(`deleted search: ${searchId}`);
      return `deleted search: ${searchId}`;
    }

    ;
  }

}); // Define a rule to limit method calls

let runScanRule = {
  type: 'method',
  name: 'moment.scan'
}; // Add the rule, allowing up to 1 scan every 10 seconds

DDPRateLimiter.addRule(runScanRule, 1, 10000);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publications.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/searches/publications.js                                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let DDPRateLimiter;
module.watch(require("meteor/ddp-rate-limiter"), {
  DDPRateLimiter(v) {
    DDPRateLimiter = v;
  }

}, 0);
let Searches;
module.watch(require("./searches.js"), {
  Searches(v) {
    Searches = v;
  }

}, 1);
Meteor.publish('searches.get', function (searchId = '') {
  check(searchId, String);
  searchId = searchId || {}; // console.log(Searches.find(searchId).count());

  return Searches.find(searchId, {
    sort: {
      created: -1
    }
  }, {
    fields: Searches.publicFields
  });
}); // Define a rule to limit subscription calls

var subscribeToSearchesRule = {
  type: 'subscription',
  name: 'searches.get' // Add the rule, allowing up to 1 subscription every 5 seconds.

};
DDPRateLimiter.addRule(subscribeToSearchesRule, 1, 5000);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"searches.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/searches/searches.js                                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  Searches: () => Searches
});
let Mongo;
module.watch(require("meteor/mongo"), {
  Mongo(v) {
    Mongo = v;
  }

}, 0);
let SimpleSchema;
module.watch(require("meteor/aldeed:simple-schema"), {
  SimpleSchema(v) {
    SimpleSchema = v;
  }

}, 1);
const Searches = new Meteor.Collection('searches');
// Deny all client-side updates since we will be using methods to manage this collection
Searches.deny({
  insert() {
    return true;
  },

  update() {
    return true;
  },

  remove() {
    return true;
  }

});
Searches.Schema = new SimpleSchema({
  // schema rules
  "search_type": {
    type: [String],
    label: "Search types",
    optional: false,
    allowedValues: ["moderation", "label", "face", "collection"],
    defaultValue: ["moderation", "label", "face"]
  },
  "search_collections": {
    type: [String],
    label: "Collections to search",
    optional: true,
    defaultValue: [""]
  },
  "search_image": {
    type: String,
    label: "Image to search",
    optional: true,
    defaultValue: "/img/face-id-100.png"
  },
  "search_results": {
    type: Object,
    label: "Object of search types",
    optional: true,
    blackbox: true,
    defaultValue: {}
  },
  "faces": {
    type: [Object],
    label: "Face objects found in image",
    optional: true,
    blackbox: true,
    defaultValue: []
  },
  "created": {
    type: Date,
    label: "Date search performed",
    autoValue: function () {
      if (this.isInsert) {
        return new Date();
      }
    },
    optional: true //index: true

  },
  "updated": {
    type: Date,
    label: "Date search updated",
    autoValue: function () {
      if (this.isUpdate) {
        return new Date();
      }
    },
    optional: true
  }
});
Searches.attachSchema(Searches.Schema);

if (Meteor.isServer) {
  Meteor.startup(() => {
    Searches._ensureIndex({
      created: -1
    }); // Searches._ensureIndex({ search_image: 1});

  });
}

Searches.publicFields = {
  search_id: 1,
  search_type: 1,
  search_collections: 1,
  search_image: 1,
  search_results: 1,
  created: 1,
  updated: 1
}; // Searches.helpers({
//   // A collections is considered to be private if "private" is set to true
//   isPrivate() {
//     return this.private;
//   }
// });
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"startup":{"server":{"fixtures.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/startup/server/fixtures.js                                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let Collections;
module.watch(require("../../api/collections/collections.js"), {
  Collections(v) {
    Collections = v;
  }

}, 1);
let Prints;
module.watch(require("../../api/prints/prints.js"), {
  Prints(v) {
    Prints = v;
  }

}, 2);
let Searches;
module.watch(require("../../api/searches/searches.js"), {
  Searches(v) {
    Searches = v;
  }

}, 3);
let AWS;
module.watch(require("aws-sdk"), {
  default(v) {
    AWS = v;
  }

}, 4);
AWS.config.region = 'us-east-1';
var rekognition = new AWS.Rekognition(); // if the database is empty on server start, create some sample data.

Meteor.startup(() => {
  console.log("getting aws collections...");
  let colParams = {};
  let colRequest = rekognition.listCollections(colParams);
  let promise = colRequest.promise();
  let cols = promise.then(result => {
    console.log(result);

    if (result && result.CollectionIds.length > 0) {
      _.each(result.CollectionIds, function (colId) {
        let awsCol = {
          collection_id: colId,
          collection_name: colId,
          collection_type: "face",
          private: true
        };
        let existingCol = Collections.upsert({
          collection_id: colId
        }, {
          $set: awsCol
        });
        console.log(`upserted collection: ${JSON.stringify(existingCol)}`); // Now try getting existing faces for each collection

        let faceParams = {
          CollectionId: colId
        };
        let faceRequest = rekognition.listFaces(faceParams);
        let promise = faceRequest.promise();
        let faces = promise.then(result => {
          if (result && result.Faces.length > 0) {
            console.log(`${colId} collection has ${result.Faces.length} faces`);

            _.each(result.Faces, function (face) {
              let awsFace = {
                print_id: face.FaceId,
                print_name: face.ExternalImageId || face.ImageId,
                print_type: "face",
                print_collection: colId,
                print_collection_id: Collections.findOne({
                  collection_id: colId
                })._id,
                print_details: face,
                print_adder: "root"
              };
              Prints.simpleSchema().clean(awsFace);
              let existingFace = Prints.upsert({
                print_id: face.FaceId
              }, {
                $set: awsFace
              });
              console.log(existingFace);
            });
          }
        });
      });
    }

    return result;
  }); // if (Prints.find().count() < 15) {
  //   console.log("seeding prints...");
  //   let seedPrints = []
  //   _.times(5, ()=>{
  //     let print = {
  //       print_adder: this.userId || "root",
  //       print_collection: "people",
  //       print_collection_id: "people",
  //       print_name: faker.helpers.userCard().name,
  //       print_id: faker.random.uuid(),
  //       print_img: faker.image.avatar()
  //     };
  //     let printId = Prints.insert(print);
  //     seedPrints.push(printId);
  //   });
  //   console.log(seedPrints);
  // };
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/startup/server/index.js                                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let HTTP;
module.watch(require("meteor/http"), {
  HTTP(v) {
    HTTP = v;
  }

}, 1);
module.watch(require("../accounts-config.js"));
module.watch(require("./fixtures.js"));
module.watch(require("./register-api.js"));

const os = require('os');

server_mode = Meteor.isProduction ? "PRODUCTION" : "DEVELOPMENT";
console.log('index.js: ' + server_mode + "-->" + JSON.stringify(Meteor.settings));
Meteor.methods({
  info() {
    return `version: 0.9.1 - build: ${process.env.BUILD || 'dev'} - hostname: ${os.hostname()}`;
  },

  getData() {
    return Promise.asyncApply(() => {
      try {
        var response = {};
        const results = Promise.await(HTTP.call('GET', 'http://jsonplaceholder.typicode.com/posts'));
        console.log(JSON.stringify(results.data[0]));
        console.log(JSON.stringify(results.headers));
        response.code = true;
        response.data = results;
      } catch (e) {
        response = false;
        console.log(e);
      } finally {
        console.log("finally..."); //throw new Meteor.Error("inappropriate-pic","The user has taken an inappropriate picture.");	

        return response;
      }
    });
  }

});
Meteor.onConnection(connection => {
  let clientAddr = connection.clientAddress;
  let headers = connection.httpHeaders;
  console.log(`connection from ${clientAddr}`); // console.log(headers);
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"register-api.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/startup/server/register-api.js                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("../../api/collections/methods.js"));
module.watch(require("../../api/collections/publications.js"));
module.watch(require("../../api/searches/methods.js"));
module.watch(require("../../api/searches/publications.js"));
module.watch(require("../../api/prints/methods.js"));
module.watch(require("../../api/prints/publications.js"));
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"accounts-config.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/startup/accounts-config.js                                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Accounts;
module.watch(require("meteor/accounts-base"), {
  Accounts(v) {
    Accounts = v;
  }

}, 0);
let AccountsCommon;
module.watch(require("meteor/accounts-base"), {
  AccountsCommon(v) {
    AccountsCommon = v;
  }

}, 1);
let AccountsClient;
module.watch(require("meteor/accounts-base"), {
  AccountsClient(v) {
    AccountsClient = v;
  }

}, 2);

if (Meteor.isClient) {
  Accounts.ui.config({
    passwordSignupFields: 'USERNAME_AND_EMAIL'
  });
}

if (Meteor.isServer) {
  console.log("accounts config loaded!");
  Accounts.onCreateUser((options, user) => {
    // user.created = new Date();
    console.log("user: " + user);
    console.log("options: " + options); // user = JSON.stringify(user);

    console.log(user); // options = JSON.stringify(options);

    console.log(options); // Don't forget to return the new user object at the end!

    return user;
  });
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"server":{"main.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/main.js                                                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("../imports/startup/server"));
Meteor.startup(() => {// code to run on server at startup
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/server/main.js");
//# sourceURL=meteor://💻app/app/app.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvY29sbGVjdGlvbnMvY29sbGVjdGlvbnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL2NvbGxlY3Rpb25zL21ldGhvZHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL2NvbGxlY3Rpb25zL3B1YmxpY2F0aW9ucy5qcyIsIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvcHJpbnRzL21ldGhvZHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL3ByaW50cy9wcmludHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL3ByaW50cy9wdWJsaWNhdGlvbnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL3NlYXJjaGVzL21ldGhvZHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL3NlYXJjaGVzL3B1YmxpY2F0aW9ucy5qcyIsIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvc2VhcmNoZXMvc2VhcmNoZXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvc3RhcnR1cC9zZXJ2ZXIvZml4dHVyZXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvc3RhcnR1cC9zZXJ2ZXIvaW5kZXguanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvc3RhcnR1cC9zZXJ2ZXIvcmVnaXN0ZXItYXBpLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9pbXBvcnRzL3N0YXJ0dXAvYWNjb3VudHMtY29uZmlnLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9zZXJ2ZXIvbWFpbi5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnQiLCJDb2xsZWN0aW9ucyIsIk1vbmdvIiwid2F0Y2giLCJyZXF1aXJlIiwidiIsIlNpbXBsZVNjaGVtYSIsIk1ldGVvciIsIkNvbGxlY3Rpb24iLCJkZW55IiwiaW5zZXJ0IiwidXBkYXRlIiwicmVtb3ZlIiwiU2NoZW1hIiwidHlwZSIsIlN0cmluZyIsImxhYmVsIiwib3B0aW9uYWwiLCJkZWZhdWx0VmFsdWUiLCJpbmRleCIsInVuaXF1ZSIsImFsbG93ZWRWYWx1ZXMiLCJCb29sZWFuIiwiRGF0ZSIsImF1dG9WYWx1ZSIsImlzSW5zZXJ0IiwiaXNVcGRhdGUiLCJhdHRhY2hTY2hlbWEiLCJwdWJsaWNGaWVsZHMiLCJjb2xsZWN0aW9uX2lkIiwiY29sbGVjdGlvbl9uYW1lIiwiY29sbGVjdGlvbl90eXBlIiwicHJpdmF0ZSIsImNyZWF0ZWQiLCJ1cGRhdGVkIiwiRERQUmF0ZUxpbWl0ZXIiLCJBV1MiLCJkZWZhdWx0IiwiY29uZmlnIiwicmVnaW9uIiwicmVrb2duaXRpb24iLCJSZWtvZ25pdGlvbiIsIm1ldGhvZHMiLCJuZXdDb2wiLCJjb25zb2xlIiwibG9nIiwiY29sbGVjdGlvblBhcmFtcyIsIkNvbGxlY3Rpb25JZCIsImNvbGxlY3Rpb25SZXF1ZXN0IiwiY3JlYXRlQ29sbGVjdGlvbiIsInByb21pc2UiLCJjYXRjaCIsImVycm9yIiwiRXJyb3IiLCJjb2RlIiwibWVzc2FnZSIsInRoZW4iLCJ2YWx1ZXMiLCJjb2wiLCJjb2xJZCIsImNoZWNrIiwiZmluZE9uZSIsInBhcmFtcyIsImRlbGV0ZUNvbGxlY3Rpb24iLCJvbGRDb2wiLCJfaWQiLCJwdWJsaXNoIiwiY29sbGVjdGlvbklkIiwiZmluZCIsInNvcnQiLCJmaWVsZHMiLCJzdWJzY3JpYmVUb0NvbGxlY3Rpb25zUnVsZSIsIm5hbWUiLCJhZGRSdWxlIiwiUHJpbnRzIiwibmV3UHJpbnQiLCJjb2xsZWN0aW9uIiwicHJpbnRfYWRkZXIiLCJ1c2VySWQiLCJwcmludF9jb2xsZWN0aW9uIiwicHJpbnRfY29sbGVjdGlvbl9pZCIsInByaW50X25hbWUiLCJyZXBsYWNlIiwicHJpbnRfaW1nIiwiaW1nIiwic2ltcGxlU2NoZW1hIiwiY2xlYW4iLCJmYWNlUGFyYW1zIiwiRXh0ZXJuYWxJbWFnZUlkIiwiSW1hZ2UiLCJCdWZmZXIiLCJmcm9tIiwic3BsaXQiLCJEZXRlY3Rpb25BdHRyaWJ1dGVzIiwiZmFjZVJlcXVlc3QiLCJpbmRleEZhY2VzIiwiaW5kZXhGYWNlIiwicmVzdWx0IiwicHJpbnRfaWQiLCJGYWNlUmVjb3JkcyIsIkZhY2UiLCJGYWNlSWQiLCJwcmludCIsInByaW50SWQiLCJkYXRhIiwicHJpbnRDb3VudCIsImNvdW50IiwiT2JqZWN0IiwiYmxhY2tib3giLCJwcmludF90eXBlIiwicHJpbnRfZGV0YWlscyIsInNlbGVjdG9yIiwic3Vic2NyaWJlVG9QcmludHNSdWxlIiwiU2VhcmNoZXMiLCJwaWNEYXRhIiwibWF0Y2hUaHJlc2hvbGQiLCJOdW1iZXIiLCJ0MCIsImdldFRpbWUiLCJpbWdCeXRlcyIsImNvbElkcyIsImZldGNoIiwibW9kZXJhdGlvblBhcmFtcyIsImxhYmVsUGFyYW1zIiwiY2VsZWJyaXR5UGFyYW1zIiwibW9kZXJhdGlvblJlcXVlc3QiLCJkZXRlY3RNb2RlcmF0aW9uTGFiZWxzIiwibGFiZWxSZXF1ZXN0IiwiZGV0ZWN0TGFiZWxzIiwiZGV0ZWN0RmFjZXMiLCJjZWxlYnJpdHlSZXF1ZXN0IiwicmVjb2duaXplQ2VsZWJyaXRpZXMiLCJhbGxQcm9taXNlcyIsInB1c2giLCJfIiwiZWFjaCIsInJla29nbml0aW9uUGFyYW1zIiwicmVrb2duaXRpb25SZXF1ZXN0Iiwic2VhcmNoRmFjZXNCeUltYWdlIiwicmVzcG9uc2UiLCJQcm9taXNlIiwiYWxsIiwiSlNPTiIsInN0cmluZ2lmeSIsImkiLCJwZXJzb25zIiwiRmFjZU1hdGNoZXMiLCJ0YWciLCJpbWFnZV9pZCIsImZhY2VfaWQiLCJzaW1pbGFyaXR5IiwiU2ltaWxhcml0eSIsInQxIiwic2VhcmNoX3Jlc3VsdHMiLCJtb2RlcmF0aW9uIiwiTW9kZXJhdGlvbkxhYmVscyIsImxhYmVscyIsIkxhYmVscyIsImZhY2VEZXRhaWxzIiwiRmFjZURldGFpbHMiLCJjZWxlYnJpdHkiLCJDZWxlYnJpdHlGYWNlcyIsInNlYXJjaCIsInNhdmVTZWFyY2giLCJyZWFzb24iLCJkZXRhaWxzIiwiZmluYWxseSIsInNlYXJjaElkIiwicnVuU2NhblJ1bGUiLCJzdWJzY3JpYmVUb1NlYXJjaGVzUnVsZSIsImlzU2VydmVyIiwic3RhcnR1cCIsIl9lbnN1cmVJbmRleCIsInNlYXJjaF9pZCIsInNlYXJjaF90eXBlIiwic2VhcmNoX2NvbGxlY3Rpb25zIiwic2VhcmNoX2ltYWdlIiwiY29sUGFyYW1zIiwiY29sUmVxdWVzdCIsImxpc3RDb2xsZWN0aW9ucyIsImNvbHMiLCJDb2xsZWN0aW9uSWRzIiwibGVuZ3RoIiwiYXdzQ29sIiwiZXhpc3RpbmdDb2wiLCJ1cHNlcnQiLCIkc2V0IiwibGlzdEZhY2VzIiwiZmFjZXMiLCJGYWNlcyIsImZhY2UiLCJhd3NGYWNlIiwiSW1hZ2VJZCIsImV4aXN0aW5nRmFjZSIsIkhUVFAiLCJvcyIsInNlcnZlcl9tb2RlIiwiaXNQcm9kdWN0aW9uIiwic2V0dGluZ3MiLCJpbmZvIiwicHJvY2VzcyIsImVudiIsIkJVSUxEIiwiaG9zdG5hbWUiLCJnZXREYXRhIiwicmVzdWx0cyIsImNhbGwiLCJoZWFkZXJzIiwiZSIsIm9uQ29ubmVjdGlvbiIsImNvbm5lY3Rpb24iLCJjbGllbnRBZGRyIiwiY2xpZW50QWRkcmVzcyIsImh0dHBIZWFkZXJzIiwiQWNjb3VudHMiLCJBY2NvdW50c0NvbW1vbiIsIkFjY291bnRzQ2xpZW50IiwiaXNDbGllbnQiLCJ1aSIsInBhc3N3b3JkU2lnbnVwRmllbGRzIiwib25DcmVhdGVVc2VyIiwib3B0aW9ucyIsInVzZXIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQUFBLE9BQU9DLE1BQVAsQ0FBYztBQUFDQyxlQUFZLE1BQUlBO0FBQWpCLENBQWQ7QUFBNkMsSUFBSUMsS0FBSjtBQUFVSCxPQUFPSSxLQUFQLENBQWFDLFFBQVEsY0FBUixDQUFiLEVBQXFDO0FBQUNGLFFBQU1HLENBQU4sRUFBUTtBQUFDSCxZQUFNRyxDQUFOO0FBQVE7O0FBQWxCLENBQXJDLEVBQXlELENBQXpEO0FBQTRELElBQUlDLFlBQUo7QUFBaUJQLE9BQU9J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O0FBQUNtTixxQkFBZW5OLENBQWY7QUFBaUI7O0FBQXBDLENBQTdDLEVBQW1GLENBQW5GOztBQUtuTixJQUFJRSxPQUFPa04sUUFBWCxFQUFxQjtBQUNwQkgsV0FBU0ksRUFBVCxDQUFZcEwsTUFBWixDQUFtQjtBQUNqQnFMLDBCQUFzQjtBQURMLEdBQW5CO0FBR0E7O0FBRUQsSUFBSXBOLE9BQU9tSyxRQUFYLEVBQXFCO0FBQ3BCOUgsVUFBUUMsR0FBUixDQUFZLHlCQUFaO0FBQ0F5SyxXQUFTTSxZQUFULENBQXNCLENBQUNDLE9BQUQsRUFBVUMsSUFBVixLQUFtQjtBQUN4QztBQUVBbEwsWUFBUUMsR0FBUixDQUFZLFdBQVdpTCxJQUF2QjtBQUNBbEwsWUFBUUMsR0FBUixDQUFZLGNBQWNnTCxPQUExQixFQUp3QyxDQUt4Qzs7QUFDQWpMLFlBQVFDLEdBQVIsQ0FBWWlMLElBQVosRUFOd0MsQ0FPeEM7O0FBQ0FsTCxZQUFRQyxHQUFSLENBQVlnTCxPQUFaLEVBUndDLENBVXJDOztBQUNILFdBQU9DLElBQVA7QUFDQSxHQVpEO0FBYUEsQzs7Ozs7Ozs7Ozs7QUMxQkQvTixPQUFPSSxLQUFQLENBQWFDLFFBQVEsMkJBQVIsQ0FBYjtBQWNBRyxPQUFPb0ssT0FBUCxDQUFlLE1BQU0sQ0FDbkI7QUFDRCxDQUZELEUiLCJmaWxlIjoiL2FwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1vbmdvIH0gZnJvbSAnbWV0ZW9yL21vbmdvJztcbmltcG9ydCB7IFNpbXBsZVNjaGVtYSB9IGZyb20gJ21ldGVvci9hbGRlZWQ6c2ltcGxlLXNjaGVtYSc7XG5cblxuXG5leHBvcnQgY29uc3QgQ29sbGVjdGlvbnMgPSBuZXcgTWV0ZW9yLkNvbGxlY3Rpb24oJ2NvbGxlY3Rpb25zJyk7XG5cbi8vIERlbnkgYWxsIGNsaWVudC1zaWRlIHVwZGF0ZXMgc2luY2Ugd2Ugd2lsbCBiZSB1c2luZyBtZXRob2RzIHRvIG1hbmFnZSB0aGlzIGNvbGxlY3Rpb25cbkNvbGxlY3Rpb25zLmRlbnkoe1xuICBpbnNlcnQoKSB7IHJldHVybiB0cnVlOyB9LFxuICB1cGRhdGUoKSB7IHJldHVybiB0cnVlOyB9LFxuICByZW1vdmUoKSB7IHJldHVybiB0cnVlOyB9LFxufSk7XG5cbkNvbGxlY3Rpb25zLlNjaGVtYSA9IG5ldyBTaW1wbGVTY2hlbWEoe1xuICAvLyBPdXIgc2NoZW1hIHJ1bGVzIHdpbGwgZ28gaGVyZS5cbiAgXCJjb2xsZWN0aW9uX2lkXCI6IHtcbiAgICB0eXBlOiBTdHJpbmcsXG4gICAgbGFiZWw6IFwiQ29sbGVjdGlvbiBJRFwiLFxuICAgIG9wdGlvbmFsOiBmYWxzZSxcbiAgICBkZWZhdWx0VmFsdWU6IFwiTXlDb2xsZWN0aW9uXCIsXG4gICAgaW5kZXg6IHRydWUsXG4gICAgdW5pcXVlOiB0cnVlXG4gIH0sXG4gIFwiY29sbGVjdGlvbl9uYW1lXCI6IHtcbiAgICB0eXBlOiBTdHJpbmcsXG4gICAgbGFiZWw6IFwiQ29sbGVjdGlvbiBOYW1lXCIsXG4gICAgb3B0aW9uYWw6IGZhbHNlLFxuICAgIGRlZmF1bHRWYWx1ZTogXCJNeUNvbGxlY3Rpb25cIixcbiAgICBpbmRleDogdHJ1ZVxuICB9LFxuICBcImNvbGxlY3Rpb25fdHlwZVwiOiB7XG4gICAgdHlwZTogU3RyaW5nLFxuICAgIGxhYmVsOiBcIkNvbGxlY3Rpb24gdHlwZVwiLFxuICAgIG9wdGlvbmFsOiBmYWxzZSxcbiAgICBhbGxvd2VkVmFsdWVzOiBbXCJmYWNlXCIsIFwidm9pY2VcIl0sXG4gICAgZGVmYXVsdFZhbHVlOiBcImZhY2VcIlxuICB9LFxuICBcInByaXZhdGVcIjoge1xuICAgIHR5cGU6IEJvb2xlYW4sXG4gICAgbGFiZWw6IFwiQ29sbGVjdGlvbiBwcml2YWN5XCIsXG4gICAgb3B0aW9uYWw6IGZhbHNlLFxuICAgIGRlZmF1bHRWYWx1ZTogdHJ1ZVxuICB9LFxuICBcImNyZWF0ZWRcIjoge1xuICAgIHR5cGU6IERhdGUsXG4gICAgbGFiZWw6IFwiRGF0ZSBjb2xsZWN0aW9uIGFkZGVkIHRvIEFudGVubmFlXCIsXG4gICAgYXV0b1ZhbHVlOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICggdGhpcy5pc0luc2VydCApIHtcbiAgICAgICAgcmV0dXJuIG5ldyBEYXRlO1xuICAgICAgfSBcbiAgICB9LFxuICAgIG9wdGlvbmFsOiB0cnVlXG4gIH0sXG4gIFwidXBkYXRlZFwiOiB7XG4gICAgdHlwZTogRGF0ZSxcbiAgICBsYWJlbDogXCJEYXRlIGNvbGxlY3Rpb24gdXBkYXRlZCBpbiBTeXN0ZW1cIixcbiAgICBhdXRvVmFsdWU6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCB0aGlzLmlzVXBkYXRlICkge1xuICAgICAgICByZXR1cm4gbmV3IERhdGU7XG4gICAgICB9IFxuICAgIH0sXG4gICAgb3B0aW9uYWw6IHRydWVcbiAgfVxufSk7XG5cbkNvbGxlY3Rpb25zLmF0dGFjaFNjaGVtYSggQ29sbGVjdGlvbnMuU2NoZW1hICk7IFxuXG5cbkNvbGxlY3Rpb25zLnB1YmxpY0ZpZWxkcyA9IHtcbiAgY29sbGVjdGlvbl9pZDogMSxcbiAgY29sbGVjdGlvbl9uYW1lOiAxLFxuICBjb2xsZWN0aW9uX3R5cGU6IDEsXG4gIHByaXZhdGU6IDEsXG4gIGNyZWF0ZWQ6IDEsXG4gIHVwZGF0ZWQ6IDFcbn07XG5cbi8vIENvbGxlY3Rpb25zLmhlbHBlcnMoe1xuLy8gICAvLyBBIGNvbGxlY3Rpb25zIGlzIGNvbnNpZGVyZWQgdG8gYmUgcHJpdmF0ZSBpZiBcInByaXZhdGVcIiBpcyBzZXQgdG8gdHJ1ZVxuLy8gICBpc1ByaXZhdGUoKSB7XG4vLyAgICAgcmV0dXJuIHRoaXMucHJpdmF0ZTtcbi8vICAgfVxuLy8gfSk7IiwiaW1wb3J0IHsgRERQUmF0ZUxpbWl0ZXIgfSBmcm9tICdtZXRlb3IvZGRwLXJhdGUtbGltaXRlcic7XG5pbXBvcnQgQVdTIGZyb20gJ2F3cy1zZGsnO1xuXG5pbXBvcnQgeyBDb2xsZWN0aW9ucyB9IGZyb20gJy4vY29sbGVjdGlvbnMuanMnO1xuXG5BV1MuY29uZmlnLnJlZ2lvbiA9ICd1cy1lYXN0LTEnO1xudmFyIHJla29nbml0aW9uID0gbmV3IEFXUy5SZWtvZ25pdGlvbigpO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdFwiY29sbGVjdGlvbi5zYXZlXCIobmV3Q29sKXtcblx0XHRjb25zb2xlLmxvZyhuZXdDb2wpO1xuXHRcdGxldCBjb2xsZWN0aW9uUGFyYW1zID0ge1xuICBcdFx0XHRDb2xsZWN0aW9uSWQ6IG5ld0NvbC5jb2xsZWN0aW9uX2lkXG5cdFx0fTtcblx0XHRsZXQgY29sbGVjdGlvblJlcXVlc3QgPSByZWtvZ25pdGlvbi5jcmVhdGVDb2xsZWN0aW9uKGNvbGxlY3Rpb25QYXJhbXMpLnByb21pc2UoKS5jYXRjaChlcnJvciA9PiB7IHRocm93IG5ldyBNZXRlb3IuRXJyb3IoZXJyb3IuY29kZSwgZXJyb3IubWVzc2FnZSwgZXJyb3IpOyByZXR1cm4gZXJyb3I7IH0pO1xuXHRcdGNvbGxlY3Rpb25SZXF1ZXN0LnRoZW4odmFsdWVzID0+IHtyZXR1cm4gdmFsdWVzfSk7XG5cdFx0bGV0IGNvbCA9IENvbGxlY3Rpb25zLmluc2VydChuZXdDb2wpO1xuXHRcdGlmKGNvbCl7XG5cdFx0XHRjb25zb2xlLmxvZyhgYWRkZWQgY29sbGVjdGlvbjogJHtjb2x9YCk7XG5cdFx0fWVsc2V7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhuZXdDb2wpO1xuICAgICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcignYWRkLWNvbGxlY3Rpb24tZXJyb3InLGBlcnJvciBhZGRpbmcgY29sbGVjdGlvbjogJHtuZXdDb2x9YClcdFx0XG5cdFx0fVxuXHRcdHJldHVybiBgYWRkZWQgY29sbGVjdGlvbjogJHtjb2x9YDtcblx0fSxcblxuXHRcImNvbGxlY3Rpb24uZGVsZXRlXCIoY29sSWQpe1xuXHRcdGNoZWNrKGNvbElkLFN0cmluZyk7XG5cdFx0bGV0IGNvbCA9IENvbGxlY3Rpb25zLmZpbmRPbmUoY29sSWQpO1xuXHRcdGNvbnNvbGUubG9nKGNvbCk7XG5cdFx0aWYoIWNvbCl7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCduby1jb2xsZWN0aW9uJywnTm8gY29sbGVjdGlvbiBmb3VuZCB3aXRoIGdpdmVuIGlkIScpO1xuXHRcdH1lbHNle1xuXHRcdFx0bGV0IHBhcmFtcyA9IHtcblx0XHRcdFx0Q29sbGVjdGlvbklkOiBjb2wuY29sbGVjdGlvbl9pZFxuXHRcdFx0fTtcblx0XHRcdGxldCBjb2xsZWN0aW9uUmVxdWVzdCA9IHJla29nbml0aW9uLmRlbGV0ZUNvbGxlY3Rpb24ocGFyYW1zKS5wcm9taXNlKCkuY2F0Y2goZXJyb3IgPT4geyB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKGVycm9yLmNvZGUsIGVycm9yLm1lc3NhZ2UsIGVycm9yKTsgcmV0dXJuIGVycm9yOyB9KTtcblx0XHRcdGNvbGxlY3Rpb25SZXF1ZXN0LnRoZW4odmFsdWVzID0+IHtyZXR1cm4gdmFsdWVzfSk7XG5cdFx0XHRsZXQgb2xkQ29sID0gQ29sbGVjdGlvbnMucmVtb3ZlKGNvbC5faWQpO1xuXHRcdFx0aWYob2xkQ29sKXtcblx0XHRcdFx0Y29uc29sZS5sb2coYHJlbW92ZWQgY29sbGVjdGlvbjogJHtvbGRDb2x9YCk7XG5cdFx0XHR9ZWxzZXtcblx0ICAgICAgICAgICAgY29uc29sZS5sb2coY29sSWQpO1xuXHQgICAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdyZW1vdmUtY29sbGVjdGlvbi1lcnJvcicsYGVycm9yIHJlbW92aW5nIGNvbGxlY3Rpb246ICR7Y29sSWR9YClcdFx0XG5cdFx0XHR9O1xuXHRcdFx0cmV0dXJuIGByZW1vdmVkIGNvbGxlY3Rpb246ICR7Y29sSWR9YDtcblx0XHRcdFx0Ly8gbGV0IHByaW50ID0gQ29sbGVjdGlvbnMucmVtb3ZlKGNvbElkKTtcblx0XHRcdFx0Ly8gY29uc29sZS5sb2coYGRlbGV0ZWQgY29sbGVjdGlvbjogJHtjb2xJZH1gKTtcblx0XHRcdFx0Ly8gcmV0dXJuIGBkZWxldGVkIGNvbGxlY3Rpb246ICR7Y29sSWR9YDtcblx0XHR9O1xuXHR9XG59KVxuXG4vLyBEZWZpbmUgYSBydWxlIHRvIGxpbWl0IG1ldGhvZCBjYWxsc1xuLy8gbGV0IHJ1blNjYW5SdWxlID0ge1xuLy8gXHR0eXBlOiAnbWV0aG9kJyxcbi8vIFx0bmFtZTogJ21vbWVudC5zY2FuJ1xuLy8gfTtcbi8vIEFkZCB0aGUgcnVsZSwgYWxsb3dpbmcgdXAgdG8gMSBzY2FuIGV2ZXJ5IDEwIHNlY29uZHNcbi8vIEREUFJhdGVMaW1pdGVyLmFkZFJ1bGUocnVuU2NhblJ1bGUsIDEsIDEwMDAwKTsiLCJpbXBvcnQgeyBERFBSYXRlTGltaXRlciB9IGZyb20gJ21ldGVvci9kZHAtcmF0ZS1saW1pdGVyJztcblxuaW1wb3J0IHsgQ29sbGVjdGlvbnMgfSBmcm9tICcuL2NvbGxlY3Rpb25zLmpzJztcblxuXG5NZXRlb3IucHVibGlzaCgnY29sbGVjdGlvbnMuZ2V0JywgZnVuY3Rpb24oY29sbGVjdGlvbklkPScnKSB7XG5cdGNoZWNrKGNvbGxlY3Rpb25JZCxTdHJpbmcpO1xuXHRjb2xsZWN0aW9uSWQgPSBjb2xsZWN0aW9uSWQgfHwge307XG4gIFx0Ly8gY29uc29sZS5sb2coQ29sbGVjdGlvbnMuZmluZChjb2xsZWN0aW9uSWQpLmNvdW50KCkpO1xuXHRyZXR1cm4gQ29sbGVjdGlvbnMuZmluZChcblx0XHRjb2xsZWN0aW9uSWQsIFxuXHQgIHsgXG5cdCAgXHRzb3J0OiB7IGNyZWF0ZWQ6IC0xIH0gXG5cdH1cblx0LCB7XG5cdFx0ZmllbGRzOiBDb2xsZWN0aW9ucy5wdWJsaWNGaWVsZHNcblx0fSk7XG59KTtcblxuLy8gRGVmaW5lIGEgcnVsZSB0byBsaW1pdCBzdWJzY3JpcHRpb24gY2FsbHNcbnZhciBzdWJzY3JpYmVUb0NvbGxlY3Rpb25zUnVsZSA9IHtcbiAgdHlwZTogJ3N1YnNjcmlwdGlvbicsXG4gIG5hbWU6ICdjb2xsZWN0aW9ucy5nZXQnXG59XG4vLyBBZGQgdGhlIHJ1bGUsIGFsbG93aW5nIHVwIHRvIDEgc3Vic2NyaXB0aW9uIGV2ZXJ5IDUgc2Vjb25kcy5cbkREUFJhdGVMaW1pdGVyLmFkZFJ1bGUoc3Vic2NyaWJlVG9Db2xsZWN0aW9uc1J1bGUsIDEsIDUwMDApOyIsImltcG9ydCB7IEREUFJhdGVMaW1pdGVyIH0gZnJvbSAnbWV0ZW9yL2RkcC1yYXRlLWxpbWl0ZXInO1xuaW1wb3J0IEFXUyBmcm9tICdhd3Mtc2RrJztcblxuaW1wb3J0IHsgQ29sbGVjdGlvbnMgfSBmcm9tICcuLi9jb2xsZWN0aW9ucy9jb2xsZWN0aW9ucy5qcyc7XG5pbXBvcnQgeyBQcmludHMgfSBmcm9tICcuL3ByaW50cy5qcyc7XG5cbkFXUy5jb25maWcucmVnaW9uID0gJ3VzLWVhc3QtMSc7XG52YXIgcmVrb2duaXRpb24gPSBuZXcgQVdTLlJla29nbml0aW9uKCk7XG5cbk1ldGVvci5tZXRob2RzKHtcblx0XCJwcmludC5zYXZlXCIobmV3UHJpbnQpe1xuXHRcdGxldCBjb2wgPSBDb2xsZWN0aW9ucy5maW5kT25lKG5ld1ByaW50LmNvbGxlY3Rpb24pO1xuXHRcdGNvbnNvbGUubG9nKGNvbCk7XG5cdFx0aWYoIWNvbCl7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCduby1jb2xsZWN0aW9uJywnTm8gY29sbGVjdGlvbiBmb3VuZCB3aXRoIGdpdmVuIGlkIScpO1xuXHRcdH07XG5cdFx0bmV3UHJpbnQucHJpbnRfYWRkZXIgPSB0aGlzLnVzZXJJZCB8fCBcIm51bGxcIjtcblx0XHRuZXdQcmludC5wcmludF9jb2xsZWN0aW9uID0gY29sLmNvbGxlY3Rpb25faWQgfHwgXCJwZW9wbGVcIjtcblx0XHRuZXdQcmludC5wcmludF9jb2xsZWN0aW9uX2lkID0gY29sLl9pZDtcblx0XHRuZXdQcmludC5wcmludF9uYW1lID0gbmV3UHJpbnQubmFtZS5yZXBsYWNlKC8gL2csXCJfXCIpO1xuXHRcdG5ld1ByaW50LnByaW50X2ltZyA9IG5ld1ByaW50LmltZztcblx0XHQvLyBjb25zb2xlLmxvZyhuZXdQcmludCk7XG5cdFx0aWYoIW5ld1ByaW50KXtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2ludmFsaWQtcHJpbnQnLCdzdWJtaXR0ZWQgcHJpbnQgaXMgaW52YWxpZCEnKTtcblx0XHR9O1xuXHRcdFByaW50cy5zaW1wbGVTY2hlbWEoKS5jbGVhbihuZXdQcmludCk7XG4gICAgICAgIC8vIGluZGV4IGEgZmFjZSBpbnRvIGEgY29sbGVjdGlvblxuICAgICAgICBsZXQgZmFjZVBhcmFtcyA9IHtcbiAgICAgICAgICBDb2xsZWN0aW9uSWQ6IG5ld1ByaW50LnByaW50X2NvbGxlY3Rpb24sXG4gICAgICAgICAgRXh0ZXJuYWxJbWFnZUlkOiBuZXdQcmludC5wcmludF9uYW1lLFxuXHRcdCAgSW1hZ2U6IHsgXG5cdFx0XHRcIkJ5dGVzXCI6IG5ldyBCdWZmZXIuZnJvbShuZXdQcmludC5wcmludF9pbWcuc3BsaXQoXCIsXCIpWzFdLCBcImJhc2U2NFwiKSxcblx0XHQgIH0sXG4gICAgICAgICAgRGV0ZWN0aW9uQXR0cmlidXRlczogW1wiQUxMXCJdXG4gICAgICAgIH07XG4gICAgICAgIGxldCBmYWNlUmVxdWVzdCA9IHJla29nbml0aW9uLmluZGV4RmFjZXMoZmFjZVBhcmFtcyk7XG4gICAgICAgIGxldCBwcm9taXNlID0gZmFjZVJlcXVlc3QucHJvbWlzZSgpO1xuICAgICAgICBsZXQgaW5kZXhGYWNlID0gcHJvbWlzZS50aGVuKHJlc3VsdCA9PiB7XG4gICAgICAgIFx0Ly8gY29uc29sZS5sb2cocmVzdWx0KTtcbiAgICAgICAgXHRuZXdQcmludC5wcmludF9pZCA9IHJlc3VsdC5GYWNlUmVjb3Jkc1swXS5GYWNlLkZhY2VJZDtcblx0XHRcdGxldCBwcmludCA9IFByaW50cy5pbnNlcnQobmV3UHJpbnQpO1xuICAgICAgICBcdGNvbnNvbGUubG9nKGBpbnNlcnRlZDogJHtwcmludH1gKTtcbiAgICAgICAgXHRyZXR1cm4gcmVzdWx0O1xuICAgICAgICB9KS5jYXRjaChlcnJvciA9PiB7XG4gICAgICAgIFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcihlcnJvci5jb2RlLCBlcnJvci5tZXNzYWdlLCBlcnJvcik7XG4gICAgICAgIFx0cmV0dXJuIGVycm9yO1xuICAgICAgICB9KTtcblx0XHRyZXR1cm4gaW5kZXhGYWNlO1xuXHR9LFxuXG5cdFwicHJpbnQuZGVsZXRlXCIocHJpbnRJZCl7XG5cdFx0Y2hlY2socHJpbnRJZCxTdHJpbmcpO1xuXHRcdGlmKHByaW50SWQpe1xuXHRcdFx0bGV0IHByaW50ID0gUHJpbnRzLnJlbW92ZShwcmludElkKTtcblx0XHRcdGNvbnNvbGUubG9nKGBkZWxldGVkIGZhY2U6ICR7cHJpbnRJZH1gKTtcblx0XHRcdHJldHVybiBgZGVsZXRlZCBmYWNlOiAke3ByaW50SWR9YDtcblx0XHR9O1xuXHR9LFxuXG5cdFwicHJpbnQuY291bnRcIihkYXRhKXtcblx0XHRcdGNvbnNvbGUubG9nKGRhdGEpO1xuXHRcdC8vIHJldHVybiA1NTtcblx0XHRsZXQgY29sSWQgPSAgZGF0YSB8fCBcIlwiO1xuXHRcdGNoZWNrKGNvbElkLFN0cmluZyk7XG5cdFx0aWYoY29sSWQpe1xuXHRcdFx0bGV0IHByaW50Q291bnQgPSBQcmludHMuZmluZCh7cHJpbnRfY29sbGVjdGlvbl9pZDogY29sSWR9KS5jb3VudCgpO1xuXHRcdFx0Y29uc29sZS5sb2cocHJpbnRDb3VudCk7XG5cdFx0XHRyZXR1cm4gcHJpbnRDb3VudDtcblx0XHR9O1xuXHR9LFxufSlcblxuLy8gRGVmaW5lIGEgcnVsZSB0byBsaW1pdCBtZXRob2QgY2FsbHNcbi8vIGxldCBydW5TY2FuUnVsZSA9IHtcbi8vIFx0dHlwZTogJ21ldGhvZCcsXG4vLyBcdG5hbWU6ICdwcmludC5zYXZlJ1xuLy8gfTtcbi8vIEFkZCB0aGUgcnVsZSwgYWxsb3dpbmcgdXAgdG8gMSBzY2FuIGV2ZXJ5IDEwIHNlY29uZHNcbi8vIEREUFJhdGVMaW1pdGVyLmFkZFJ1bGUocnVuU2NhblJ1bGUsIDEsIDEwMDAwKTsiLCJpbXBvcnQgeyBNb25nbyB9IGZyb20gJ21ldGVvci9tb25nbyc7XG5pbXBvcnQgeyBTaW1wbGVTY2hlbWEgfSBmcm9tICdtZXRlb3IvYWxkZWVkOnNpbXBsZS1zY2hlbWEnO1xuXG5cblxuZXhwb3J0IGNvbnN0IFByaW50cyA9IG5ldyBNZXRlb3IuQ29sbGVjdGlvbigncHJpbnRzJyk7XG5cbi8vIERlbnkgYWxsIGNsaWVudC1zaWRlIHVwZGF0ZXMgc2luY2Ugd2Ugd2lsbCBiZSB1c2luZyBtZXRob2RzIHRvIG1hbmFnZSB0aGlzIGNvbGxlY3Rpb25cblByaW50cy5kZW55KHtcbiAgaW5zZXJ0KCkgeyByZXR1cm4gdHJ1ZTsgfSxcbiAgdXBkYXRlKCkgeyByZXR1cm4gdHJ1ZTsgfSxcbiAgcmVtb3ZlKCkgeyByZXR1cm4gdHJ1ZTsgfSxcbn0pO1xuXG5QcmludHMuU2NoZW1hID0gbmV3IFNpbXBsZVNjaGVtYSh7XG4gIC8vIE91ciBzY2hlbWEgcnVsZXMgd2lsbCBnbyBoZXJlLlxuICBcInByaW50X2lkXCI6IHtcbiAgICB0eXBlOiBTdHJpbmcsXG4gICAgbGFiZWw6IFwiUHJpbnQgSURcIixcbiAgICBvcHRpb25hbDogZmFsc2UsXG4gICAgZGVmYXVsdFZhbHVlOiBcIkFBQUEtQkJCQi1DQ0NDLTExMTEtMjIyMi0zMzMzXCIsXG4gICAgaW5kZXg6IHRydWUsXG4gICAgdW5pcXVlOiB0cnVlXG4gIH0sXG4gIFwicHJpbnRfbmFtZVwiOiB7XG4gICAgdHlwZTogU3RyaW5nLFxuICAgIGxhYmVsOiBcIlByaW50IE5hbWVcIixcbiAgICBvcHRpb25hbDogZmFsc2UsXG4gICAgZGVmYXVsdFZhbHVlOiBcIk5ldyBQZXJzb25cIlxuICB9LFxuICBcInByaW50X3R5cGVcIjoge1xuICAgIHR5cGU6IFN0cmluZyxcbiAgICBsYWJlbDogXCJQcmludCB0eXBlXCIsXG4gICAgb3B0aW9uYWw6IGZhbHNlLFxuICAgIGFsbG93ZWRWYWx1ZXM6IFtcImZhY2VcIiwgXCJ2b2ljZVwiLCBcImZpbmdlclwiXSxcbiAgICBkZWZhdWx0VmFsdWU6IFwiZmFjZVwiXG4gIH0sXG4gIFwicHJpbnRfY29sbGVjdGlvblwiOiB7XG4gICAgdHlwZTogU3RyaW5nLFxuICAgIGxhYmVsOiBcIlByaW50IGNvbGxlY3Rpb25cIixcbiAgICBvcHRpb25hbDogZmFsc2UsXG4gICAgZGVmYXVsdFZhbHVlOiBcInBlb3BsZVwiXG4gIH0sXG4gIFwicHJpbnRfY29sbGVjdGlvbl9pZFwiOiB7XG4gICAgdHlwZTogU3RyaW5nLFxuICAgIGxhYmVsOiBcIlByaW50IGNvbGxlY3Rpb24gSURcIixcbiAgICBvcHRpb25hbDogZmFsc2VcbiAgfSxcbiAgXCJwcmludF9pbWdcIjoge1xuICAgIHR5cGU6IFN0cmluZyxcbiAgICBsYWJlbDogXCJQcmludCBpbWdcIixcbiAgICBvcHRpb25hbDogdHJ1ZSxcbiAgICBkZWZhdWx0VmFsdWU6IFwiL2ltZy9mYWNlLWlkLTEwMC5wbmdcIlxuICB9LFxuICBcInByaW50X2RldGFpbHNcIjoge1xuICAgIHR5cGU6IE9iamVjdCxcbiAgICBsYWJlbDogXCJQcmludCBkZXRhaWxzXCIsXG4gICAgb3B0aW9uYWw6IHRydWUsXG4gICAgYmxhY2tib3g6IHRydWVcbiAgfSxcbiAgXCJwcmludF9hZGRlclwiOiB7XG4gICAgdHlwZTogU3RyaW5nLFxuICAgIGxhYmVsOiBcIlVzZXIgd2hvIGFkZGVkIHByaW50XCIsXG4gICAgb3B0aW9uYWw6IGZhbHNlXG4gIH0sXG4gIFwiY3JlYXRlZFwiOiB7XG4gICAgdHlwZTogRGF0ZSxcbiAgICBsYWJlbDogXCJEYXRlIHByaW50IGFkZGVkIHRvIEFudGVubmFlXCIsXG4gICAgYXV0b1ZhbHVlOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICggdGhpcy5pc0luc2VydCApIHtcbiAgICAgICAgcmV0dXJuIG5ldyBEYXRlO1xuICAgICAgfSBcbiAgICB9LFxuICAgIG9wdGlvbmFsOiB0cnVlXG4gIH0sXG4gIFwidXBkYXRlZFwiOiB7XG4gICAgdHlwZTogRGF0ZSxcbiAgICBsYWJlbDogXCJEYXRlIHByaW50IHVwZGF0ZWQgaW4gU3lzdGVtXCIsXG4gICAgYXV0b1ZhbHVlOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICggdGhpcy5pc1VwZGF0ZSApIHtcbiAgICAgICAgcmV0dXJuIG5ldyBEYXRlO1xuICAgICAgfSBcbiAgICB9LFxuICAgIG9wdGlvbmFsOiB0cnVlXG4gIH1cbn0pO1xuXG5QcmludHMuYXR0YWNoU2NoZW1hKCBQcmludHMuU2NoZW1hICk7IFxuXG5cblByaW50cy5wdWJsaWNGaWVsZHMgPSB7XG4gIHByaW50X2lkOiAxLFxuICBwcmludF9uYW1lOiAxLFxuICBwcmludF90eXBlOiAxLFxuICBwcmludF9jb2xsZWN0aW9uOiAxLFxuICBwcmludF9jb2xsZWN0aW9uX2lkOiAxLFxuICBwcmludF9pbWc6IDEsXG4gIHByaW50X2RldGFpbHM6IDEsXG4gIHByaW50X2FkZGVyOiAxLFxuICBjcmVhdGVkOiAxLFxuICB1cGRhdGVkOiAxXG59O1xuXG4vLyBQcmludHMuaGVscGVycyh7XG4vLyAgIC8vIEEgY29sbGVjdGlvbnMgaXMgY29uc2lkZXJlZCB0byBiZSBwcml2YXRlIGlmIFwicHJpdmF0ZVwiIGlzIHNldCB0byB0cnVlXG4vLyAgIGlzUHJpdmF0ZSgpIHtcbi8vICAgICByZXR1cm4gdGhpcy5wcml2YXRlO1xuLy8gICB9XG4vLyB9KTsiLCJpbXBvcnQgeyBERFBSYXRlTGltaXRlciB9IGZyb20gJ21ldGVvci9kZHAtcmF0ZS1saW1pdGVyJztcblxuaW1wb3J0IHsgUHJpbnRzIH0gZnJvbSAnLi9wcmludHMuanMnO1xuXG5cbk1ldGVvci5wdWJsaXNoKCdwcmludHMuZ2V0JywgZnVuY3Rpb24oY29sbGVjdGlvbklkKSB7XG5cdGNvbGxlY3Rpb25JZCA9IGNvbGxlY3Rpb25JZCB8fCBcIlwiO1xuXHRjaGVjayhjb2xsZWN0aW9uSWQsU3RyaW5nKTtcblx0bGV0IHNlbGVjdG9yID0gY29sbGVjdGlvbklkID8ge3ByaW50X2NvbGxlY3Rpb25faWQ6IGNvbGxlY3Rpb25JZH0gOiB7fTtcbiAgXHRjb25zb2xlLmxvZyhzZWxlY3Rvcik7XG5cdHJldHVybiBQcmludHMuZmluZChcblx0XHRzZWxlY3RvciwgXG5cdCAgeyBcblx0ICBcdHNvcnQ6IHsgY3JlYXRlZDogLTEgfSBcblx0fVxuXHQsIHtcblx0XHRmaWVsZHM6IFByaW50cy5wdWJsaWNGaWVsZHNcblx0fSk7XG59KTtcblxuLy8gRGVmaW5lIGEgcnVsZSB0byBsaW1pdCBzdWJzY3JpcHRpb24gY2FsbHNcbnZhciBzdWJzY3JpYmVUb1ByaW50c1J1bGUgPSB7XG4gIHR5cGU6ICdzdWJzY3JpcHRpb24nLFxuICBuYW1lOiAncHJpbnRzLmdldCdcbn1cbi8vIEFkZCB0aGUgcnVsZSwgYWxsb3dpbmcgdXAgdG8gMSBzdWJzY3JpcHRpb24gZXZlcnkgNSBzZWNvbmRzLlxuRERQUmF0ZUxpbWl0ZXIuYWRkUnVsZShzdWJzY3JpYmVUb1ByaW50c1J1bGUsIDEsIDUwMDApOyIsImltcG9ydCB7IEREUFJhdGVMaW1pdGVyIH0gZnJvbSAnbWV0ZW9yL2RkcC1yYXRlLWxpbWl0ZXInO1xuaW1wb3J0IEFXUyBmcm9tICdhd3Mtc2RrJztcblxuaW1wb3J0IHsgQ29sbGVjdGlvbnMgfSBmcm9tICcuLi9jb2xsZWN0aW9ucy9jb2xsZWN0aW9ucy5qcyc7XG5pbXBvcnQgeyBQcmludHMgfSBmcm9tICcuLi8uLi9hcGkvcHJpbnRzL3ByaW50cy5qcyc7XG5pbXBvcnQgeyBTZWFyY2hlcyB9IGZyb20gJy4vc2VhcmNoZXMuanMnO1xuXG5BV1MuY29uZmlnLnJlZ2lvbiA9ICd1cy1lYXN0LTEnO1xudmFyIHJla29nbml0aW9uID0gbmV3IEFXUy5SZWtvZ25pdGlvbigpO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdFwic2VhcmNoLmZhY2VcIihwaWNEYXRhLG1hdGNoVGhyZXNob2xkPTk4KXtcblx0XHQvL3JldHVybiAxO1xuXHRcdC8vIGlmKCFNZXRlb3IudXNlcil7XG5cdFx0Ly8gXHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdub3QtbG9nZ2VkLWluJywnbXVzdCBiZSBsb2dnZWQtaW4gdG8gcGVyZm9ybSBzZWFyY2gnKTtcblx0XHQvLyBcdHJldHVybiBmYWxzZTtcblx0XHQvLyB9XG5cdFx0Ly8gbGV0IG1hdGNoVGhyZXNob2xkID0gbWF0Y2hUaHJlc2hvbGQ7XG5cdFx0Y2hlY2sobWF0Y2hUaHJlc2hvbGQsIE51bWJlcik7XG5cdFx0Y29uc29sZS5sb2coXCJBTkFMWVpJTkcgSU1BR0UuLi5cIik7XG5cdFx0dmFyIHQwID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG5cdFx0bGV0IGltZ0J5dGVzID0gbmV3IEJ1ZmZlci5mcm9tKHBpY0RhdGEuc3BsaXQoXCIsXCIpWzFdLCBcImJhc2U2NFwiKTtcblx0XHQvLyBsZXQgY29sSWQgPSBNZXRlb3IudXNlcigpLnByb2ZpbGUuY29sbGVjdGlvbnM7XG5cdFx0bGV0IGNvbElkcyA9IENvbGxlY3Rpb25zLmZpbmQoe2NvbGxlY3Rpb25fdHlwZTogJ2ZhY2UnfSwge2ZpZWxkczoge2NvbGxlY3Rpb25faWQ6IDF9fSkuZmV0Y2goKTtcblx0XHRjb25zb2xlLmxvZyhjb2xJZHMpXG5cdFx0bGV0IG1vZGVyYXRpb25QYXJhbXMgPSB7XG5cdFx0XHRcIkltYWdlXCI6IHsgXG5cdFx0XHRcdFwiQnl0ZXNcIjogaW1nQnl0ZXMsXG5cdFx0XHR9LFxuXHRcdFx0XCJNaW5Db25maWRlbmNlXCI6IDUwLFxuXHRcdH07XG5cdFx0bGV0IGxhYmVsUGFyYW1zID0ge1xuXHRcdFx0XCJJbWFnZVwiOiB7IFxuXHRcdFx0XHRcIkJ5dGVzXCI6IGltZ0J5dGVzLFxuXHRcdFx0fSxcblx0XHRcdFwiTWF4TGFiZWxzXCI6IDIwLFxuXHRcdFx0XCJNaW5Db25maWRlbmNlXCI6IDc1LFxuXHRcdH07XG5cdFx0bGV0IGZhY2VQYXJhbXMgPSB7XG5cdFx0XHRcIkltYWdlXCI6IHsgXG5cdFx0XHRcdFwiQnl0ZXNcIjogaW1nQnl0ZXMsXG5cdFx0XHR9LFxuICBcdFx0XHRcIkF0dHJpYnV0ZXNcIjogW1wiQUxMXCJdLFxuXHRcdH07XG5cdFx0bGV0IGNlbGVicml0eVBhcmFtcyA9IHtcblx0XHRcdFwiSW1hZ2VcIjogeyBcblx0XHRcdFx0XCJCeXRlc1wiOiBpbWdCeXRlcyxcblx0XHRcdH0sXG5cdFx0fTtcblx0XHQvLyBjcmVhdGUgcmVxdWVzdCBvYmplY3RzXG5cdFx0bGV0IG1vZGVyYXRpb25SZXF1ZXN0ID0gcmVrb2duaXRpb24uZGV0ZWN0TW9kZXJhdGlvbkxhYmVscyhtb2RlcmF0aW9uUGFyYW1zKTtcblx0XHRsZXQgbGFiZWxSZXF1ZXN0ID0gcmVrb2duaXRpb24uZGV0ZWN0TGFiZWxzKGxhYmVsUGFyYW1zKTtcblx0XHRsZXQgZmFjZVJlcXVlc3QgPSByZWtvZ25pdGlvbi5kZXRlY3RGYWNlcyhmYWNlUGFyYW1zKTtcblx0XHRsZXQgY2VsZWJyaXR5UmVxdWVzdCA9IHJla29nbml0aW9uLnJlY29nbml6ZUNlbGVicml0aWVzKGNlbGVicml0eVBhcmFtcyk7XG5cdFx0Ly8gY3JlYXRlIHByb21pc2VzXG5cdFx0bGV0IGFsbFByb21pc2VzID0gW107XG5cdFx0YWxsUHJvbWlzZXMucHVzaChtb2RlcmF0aW9uUmVxdWVzdC5wcm9taXNlKCkuY2F0Y2goZXJyb3IgPT4geyB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKGVycm9yLmNvZGUsIGVycm9yLm1lc3NhZ2UsIGVycm9yKTsgcmV0dXJuIGVycm9yOyB9KSk7XG5cdFx0YWxsUHJvbWlzZXMucHVzaChsYWJlbFJlcXVlc3QucHJvbWlzZSgpLmNhdGNoKGVycm9yID0+IHsgdGhyb3cgbmV3IE1ldGVvci5FcnJvcihlcnJvci5jb2RlLCBlcnJvci5tZXNzYWdlLCBlcnJvcik7IHJldHVybiBlcnJvcjsgfSkpO1xuXHRcdGFsbFByb21pc2VzLnB1c2goZmFjZVJlcXVlc3QucHJvbWlzZSgpLmNhdGNoKGVycm9yID0+IHsgdGhyb3cgbmV3IE1ldGVvci5FcnJvcihlcnJvci5jb2RlLCBlcnJvci5tZXNzYWdlLCBlcnJvcik7IHJldHVybiBlcnJvcjsgfSkpO1xuXHRcdGFsbFByb21pc2VzLnB1c2goY2VsZWJyaXR5UmVxdWVzdC5wcm9taXNlKCkuY2F0Y2goZXJyb3IgPT4geyB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKGVycm9yLmNvZGUsIGVycm9yLm1lc3NhZ2UsIGVycm9yKTsgcmV0dXJuIGVycm9yOyB9KSk7XG5cdFx0Xy5lYWNoKGNvbElkcywgKGNvbElkKSA9PiB7XG5cdFx0XHRsZXQgcmVrb2duaXRpb25QYXJhbXMgPSB7XG5cdFx0XHRcdFwiQ29sbGVjdGlvbklkXCI6IGNvbElkLmNvbGxlY3Rpb25faWQsXG5cdFx0XHRcdFwiRmFjZU1hdGNoVGhyZXNob2xkXCI6IG1hdGNoVGhyZXNob2xkLFxuXHRcdFx0XHRcIk1heEZhY2VzXCI6IDIsXG5cdFx0XHRcdFwiSW1hZ2VcIjogeyBcblx0XHRcdFx0XHRcIkJ5dGVzXCI6IGltZ0J5dGVzLFxuXHRcdFx0XHR9LFxuXHRcdFx0fTtcblx0XHRcdGNvbnNvbGUubG9nKHJla29nbml0aW9uUGFyYW1zKTtcblx0XHRcdGxldCByZWtvZ25pdGlvblJlcXVlc3QgPSByZWtvZ25pdGlvbi5zZWFyY2hGYWNlc0J5SW1hZ2UocmVrb2duaXRpb25QYXJhbXMpO1xuXHRcdFx0YWxsUHJvbWlzZXMucHVzaChyZWtvZ25pdGlvblJlcXVlc3QucHJvbWlzZSgpLmNhdGNoKGVycm9yID0+IHsgdGhyb3cgbmV3IE1ldGVvci5FcnJvcihlcnJvci5jb2RlLCBlcnJvci5tZXNzYWdlLCBlcnJvcik7IHJldHVybiBlcnJvcjsgfSkpO1xuXHRcdFx0Y29uc29sZS5sb2coY29sSWQuY29sbGVjdGlvbl9pZCk7XG5cdFx0fSk7Ly8gcmVrb2duaXRpb25SZXF1ZXN0LnByb21pc2UoKTtcblx0XHQvLyBGdWxmaWxsIHByb21pc2VzIGluIHBhcmFsbGVsXG5cdFx0bGV0IHJlc3BvbnNlID0gUHJvbWlzZS5hbGwoXG5cdFx0XHRhbGxQcm9taXNlc1xuXHRcdCkudGhlbih2YWx1ZXMgPT4ge1xuXHRcdFx0Y29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkodmFsdWVzKSk7XG5cdFx0XHRjb25zb2xlLmxvZyh2YWx1ZXNbMF0pO1xuXHRcdFx0Y29uc29sZS5sb2codmFsdWVzWzFdKTtcblx0XHRcdGNvbnNvbGUubG9nKHZhbHVlc1syXSk7XG5cdFx0XHRjb25zb2xlLmxvZyh2YWx1ZXNbM10pO1xuXHRcdFx0Ly9jb25zb2xlLmxvZyh2YWx1ZXNbNF0pO1xuXHRcdFx0bGV0IGkgPSA0O1xuXHRcdFx0bGV0IHBlcnNvbnMgPSBbXTtcblx0XHRcdHdoaWxlKHZhbHVlc1tpXSl7XG5cdFx0XHRcdGNvbnNvbGUubG9nKHZhbHVlc1tpXSk7XG5cdFx0XHRcdGlmICh2YWx1ZXNbaV0uRmFjZU1hdGNoZXNbMF0pe1xuXHRcdFx0XHRcdGxldCB0YWcgPSB7XG5cdFx0XHRcdFx0XHRjb2xsZWN0aW9uOiBQcmludHMuZmluZE9uZSh7cHJpbnRfaWQ6IHZhbHVlc1tpXS5GYWNlTWF0Y2hlc1swXS5GYWNlLkZhY2VJZH0sIHtmaWVsZHM6IHtwcmludF9jb2xsZWN0aW9uOiAxfX0pLFxuXHRcdFx0XHRcdFx0aW1hZ2VfaWQ6IHZhbHVlc1tpXS5GYWNlTWF0Y2hlc1swXS5GYWNlLkV4dGVybmFsSW1hZ2VJZCxcblx0XHRcdFx0XHRcdGZhY2VfaWQ6IHZhbHVlc1tpXS5GYWNlTWF0Y2hlc1swXS5GYWNlLkZhY2VJZCxcblx0XHRcdFx0XHRcdHNpbWlsYXJpdHk6IHZhbHVlc1tpXS5GYWNlTWF0Y2hlc1swXS5TaW1pbGFyaXR5LFxuXHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0cGVyc29ucy5wdXNoKHRhZyk7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2codGFnKTtcblx0XHRcdFx0fTtcblx0XHRcdFx0aSsrO1xuXHRcdFx0fTtcblx0XHRcdGxldCB0MSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXHRcdFx0Y29uc29sZS5sb2coYFJlc3BvbnNlIHRvb2sgJHt0MSAtIHQwfSBtc2ApO1xuXHRcdFx0bGV0IHNlYXJjaF9yZXN1bHRzID0ge1xuXHRcdFx0XHRcdG1vZGVyYXRpb246IHZhbHVlc1swXS5Nb2RlcmF0aW9uTGFiZWxzLFxuXHRcdFx0XHRcdGxhYmVsczogdmFsdWVzWzFdLkxhYmVscyxcblx0XHRcdFx0XHRmYWNlRGV0YWlsczogdmFsdWVzWzJdLkZhY2VEZXRhaWxzLFxuXHRcdFx0XHRcdGNlbGVicml0eTogdmFsdWVzWzNdLkNlbGVicml0eUZhY2VzLFxuXHRcdFx0XHRcdHBlcnNvbnM6IHBlcnNvbnMsIC8vLkZhY2VNYXRjaGVzWzBdLFxuXHRcdFx0fTtcblx0XHRcdGxldCBzZWFyY2ggPSB7XG5cdFx0XHRcdFx0Ly8gc2VhcmNoX2ltYWdlOiBwaWNEYXRhLFxuXHRcdFx0XHRcdHNlYXJjaF9yZXN1bHRzOiBzZWFyY2hfcmVzdWx0c1xuXHRcdFx0fTtcblx0XHRcdGxldCBzYXZlU2VhcmNoID0gU2VhcmNoZXMuaW5zZXJ0KHNlYXJjaCk7XG5cdFx0XHRjb25zb2xlLmxvZyhzYXZlU2VhcmNoKTtcblx0XHRcdHJldHVybiBzZWFyY2hfcmVzdWx0cztcblx0XHR9KS5jYXRjaChlcnJvciA9PiB7XG5cdFx0XHRjb25zb2xlLmxvZygnY2F1Z2h0IGVycm9yIScpO1xuXHRcdFx0Y29uc29sZS5sb2coZXJyb3IpO1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcihlcnJvci5lcnJvciwgZXJyb3IucmVhc29uLCBlcnJvci5kZXRhaWxzKTtcblx0XHR9KS5maW5hbGx5KCgpID0+IHtcblx0XHRcdGNvbnNvbGUubG9nKCdmaW5hbGx5Jyk7XG5cdFx0XHRjb25zb2xlLmxvZyh0aGlzKTtcblx0XHR9KTtcblx0XHRjb25zb2xlLmxvZyhyZXNwb25zZSk7XG5cdFx0bGV0IHQxID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG5cdFx0Y29uc29sZS5sb2coYFJlcXVlc3QgdG9vayAke3QxIC0gdDB9IG1zYCk7XG5cdFx0cmV0dXJuIHJlc3BvbnNlO1xuXHR9LFxuXG5cdFwic2VhcmNoLmRlbGV0ZVwiKHNlYXJjaElkKXtcblx0XHRjaGVjayhzZWFyY2hJZCxTdHJpbmcpO1xuXHRcdGlmKHNlYXJjaElkKXtcblx0XHRcdGxldCBzZWFyY2ggPSBTZWFyY2hlcy5yZW1vdmUoc2VhcmNoSWQpO1xuXHRcdFx0Y29uc29sZS5sb2coYGRlbGV0ZWQgc2VhcmNoOiAke3NlYXJjaElkfWApO1xuXHRcdFx0cmV0dXJuIGBkZWxldGVkIHNlYXJjaDogJHtzZWFyY2hJZH1gO1xuXHRcdH07XG5cdH1cbn0pXG5cbi8vIERlZmluZSBhIHJ1bGUgdG8gbGltaXQgbWV0aG9kIGNhbGxzXG5sZXQgcnVuU2NhblJ1bGUgPSB7XG5cdHR5cGU6ICdtZXRob2QnLFxuXHRuYW1lOiAnbW9tZW50LnNjYW4nXG59O1xuLy8gQWRkIHRoZSBydWxlLCBhbGxvd2luZyB1cCB0byAxIHNjYW4gZXZlcnkgMTAgc2Vjb25kc1xuRERQUmF0ZUxpbWl0ZXIuYWRkUnVsZShydW5TY2FuUnVsZSwgMSwgMTAwMDApOyIsImltcG9ydCB7IEREUFJhdGVMaW1pdGVyIH0gZnJvbSAnbWV0ZW9yL2RkcC1yYXRlLWxpbWl0ZXInO1xuXG5pbXBvcnQgeyBTZWFyY2hlcyB9IGZyb20gJy4vc2VhcmNoZXMuanMnO1xuXG5cbk1ldGVvci5wdWJsaXNoKCdzZWFyY2hlcy5nZXQnLCBmdW5jdGlvbihzZWFyY2hJZD0nJykge1xuXHRjaGVjayhzZWFyY2hJZCxTdHJpbmcpO1xuXHRzZWFyY2hJZCA9IHNlYXJjaElkIHx8IHt9O1xuICBcdC8vIGNvbnNvbGUubG9nKFNlYXJjaGVzLmZpbmQoc2VhcmNoSWQpLmNvdW50KCkpO1xuXHRyZXR1cm4gU2VhcmNoZXMuZmluZChcblx0XHRzZWFyY2hJZCwgXG5cdCAgeyBcblx0ICBcdHNvcnQ6IHsgY3JlYXRlZDogLTEgfSBcblx0fVxuXHQsIHtcblx0XHRmaWVsZHM6IFNlYXJjaGVzLnB1YmxpY0ZpZWxkc1xuXHR9KTtcbn0pO1xuXG4vLyBEZWZpbmUgYSBydWxlIHRvIGxpbWl0IHN1YnNjcmlwdGlvbiBjYWxsc1xudmFyIHN1YnNjcmliZVRvU2VhcmNoZXNSdWxlID0ge1xuICB0eXBlOiAnc3Vic2NyaXB0aW9uJyxcbiAgbmFtZTogJ3NlYXJjaGVzLmdldCdcbn1cbi8vIEFkZCB0aGUgcnVsZSwgYWxsb3dpbmcgdXAgdG8gMSBzdWJzY3JpcHRpb24gZXZlcnkgNSBzZWNvbmRzLlxuRERQUmF0ZUxpbWl0ZXIuYWRkUnVsZShzdWJzY3JpYmVUb1NlYXJjaGVzUnVsZSwgMSwgNTAwMCk7IiwiaW1wb3J0IHsgTW9uZ28gfSBmcm9tICdtZXRlb3IvbW9uZ28nO1xuaW1wb3J0IHsgU2ltcGxlU2NoZW1hIH0gZnJvbSAnbWV0ZW9yL2FsZGVlZDpzaW1wbGUtc2NoZW1hJztcblxuXG5cbmV4cG9ydCBjb25zdCBTZWFyY2hlcyA9IG5ldyBNZXRlb3IuQ29sbGVjdGlvbignc2VhcmNoZXMnKTtcblxuLy8gRGVueSBhbGwgY2xpZW50LXNpZGUgdXBkYXRlcyBzaW5jZSB3ZSB3aWxsIGJlIHVzaW5nIG1ldGhvZHMgdG8gbWFuYWdlIHRoaXMgY29sbGVjdGlvblxuU2VhcmNoZXMuZGVueSh7XG4gIGluc2VydCgpIHsgcmV0dXJuIHRydWU7IH0sXG4gIHVwZGF0ZSgpIHsgcmV0dXJuIHRydWU7IH0sXG4gIHJlbW92ZSgpIHsgcmV0dXJuIHRydWU7IH0sXG59KTtcblxuU2VhcmNoZXMuU2NoZW1hID0gbmV3IFNpbXBsZVNjaGVtYSh7XG4gIC8vIHNjaGVtYSBydWxlc1xuICBcInNlYXJjaF90eXBlXCI6IHtcbiAgICB0eXBlOiBbU3RyaW5nXSxcbiAgICBsYWJlbDogXCJTZWFyY2ggdHlwZXNcIixcbiAgICBvcHRpb25hbDogZmFsc2UsXG4gICAgYWxsb3dlZFZhbHVlczogW1wibW9kZXJhdGlvblwiLCBcImxhYmVsXCIsIFwiZmFjZVwiLCBcImNvbGxlY3Rpb25cIl0sXG4gICAgZGVmYXVsdFZhbHVlOiBbXCJtb2RlcmF0aW9uXCIsIFwibGFiZWxcIiwgXCJmYWNlXCJdXG4gIH0sXG4gIFwic2VhcmNoX2NvbGxlY3Rpb25zXCI6IHtcbiAgICB0eXBlOiBbU3RyaW5nXSxcbiAgICBsYWJlbDogXCJDb2xsZWN0aW9ucyB0byBzZWFyY2hcIixcbiAgICBvcHRpb25hbDogdHJ1ZSxcbiAgICBkZWZhdWx0VmFsdWU6IFtcIlwiXVxuICB9LFxuICBcInNlYXJjaF9pbWFnZVwiOiB7XG4gICAgdHlwZTogU3RyaW5nLFxuICAgIGxhYmVsOiBcIkltYWdlIHRvIHNlYXJjaFwiLFxuICAgIG9wdGlvbmFsOiB0cnVlLFxuICAgIGRlZmF1bHRWYWx1ZTogXCIvaW1nL2ZhY2UtaWQtMTAwLnBuZ1wiXG4gIH0sXG4gIFwic2VhcmNoX3Jlc3VsdHNcIjoge1xuICAgIHR5cGU6IE9iamVjdCxcbiAgICBsYWJlbDogXCJPYmplY3Qgb2Ygc2VhcmNoIHR5cGVzXCIsXG4gICAgb3B0aW9uYWw6IHRydWUsXG4gICAgYmxhY2tib3g6IHRydWUsXG4gICAgZGVmYXVsdFZhbHVlOiB7fVxuICB9LFxuICBcImZhY2VzXCI6IHtcbiAgICB0eXBlOiBbT2JqZWN0XSxcbiAgICBsYWJlbDogXCJGYWNlIG9iamVjdHMgZm91bmQgaW4gaW1hZ2VcIixcbiAgICBvcHRpb25hbDogdHJ1ZSxcbiAgICBibGFja2JveDogdHJ1ZSxcbiAgICBkZWZhdWx0VmFsdWU6IFtdXG4gIH0sXG4gIFwiY3JlYXRlZFwiOiB7XG4gICAgdHlwZTogRGF0ZSxcbiAgICBsYWJlbDogXCJEYXRlIHNlYXJjaCBwZXJmb3JtZWRcIixcbiAgICBhdXRvVmFsdWU6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCB0aGlzLmlzSW5zZXJ0ICkge1xuICAgICAgICByZXR1cm4gbmV3IERhdGU7XG4gICAgICB9IFxuICAgIH0sXG4gICAgb3B0aW9uYWw6IHRydWUsXG4gICAgLy9pbmRleDogdHJ1ZVxuICB9LFxuICBcInVwZGF0ZWRcIjoge1xuICAgIHR5cGU6IERhdGUsXG4gICAgbGFiZWw6IFwiRGF0ZSBzZWFyY2ggdXBkYXRlZFwiLFxuICAgIGF1dG9WYWx1ZTogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoIHRoaXMuaXNVcGRhdGUgKSB7XG4gICAgICAgIHJldHVybiBuZXcgRGF0ZTtcbiAgICAgIH0gXG4gICAgfSxcbiAgICBvcHRpb25hbDogdHJ1ZVxuICB9XG59KTtcblxuU2VhcmNoZXMuYXR0YWNoU2NoZW1hKCBTZWFyY2hlcy5TY2hlbWEgKTtcblxuaWYoTWV0ZW9yLmlzU2VydmVyKXtcbiAgTWV0ZW9yLnN0YXJ0dXAoKCkgPT4ge1xuICAgIFNlYXJjaGVzLl9lbnN1cmVJbmRleCh7XG4gICAgICAgIGNyZWF0ZWQ6IC0xLFxuICAgIH0pO1xuICAgIC8vIFNlYXJjaGVzLl9lbnN1cmVJbmRleCh7IHNlYXJjaF9pbWFnZTogMX0pO1xuICB9KTtcbn1cblxuU2VhcmNoZXMucHVibGljRmllbGRzID0ge1xuICBzZWFyY2hfaWQ6IDEsXG4gIHNlYXJjaF90eXBlOiAxLFxuICBzZWFyY2hfY29sbGVjdGlvbnM6IDEsXG4gIHNlYXJjaF9pbWFnZTogMSxcbiAgc2VhcmNoX3Jlc3VsdHM6IDEsXG4gIGNyZWF0ZWQ6IDEsXG4gIHVwZGF0ZWQ6IDFcbn07XG5cbi8vIFNlYXJjaGVzLmhlbHBlcnMoe1xuLy8gICAvLyBBIGNvbGxlY3Rpb25zIGlzIGNvbnNpZGVyZWQgdG8gYmUgcHJpdmF0ZSBpZiBcInByaXZhdGVcIiBpcyBzZXQgdG8gdHJ1ZVxuLy8gICBpc1ByaXZhdGUoKSB7XG4vLyAgICAgcmV0dXJuIHRoaXMucHJpdmF0ZTtcbi8vICAgfVxuLy8gfSk7IiwiaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5pbXBvcnQgeyBDb2xsZWN0aW9ucyB9IGZyb20gJy4uLy4uL2FwaS9jb2xsZWN0aW9ucy9jb2xsZWN0aW9ucy5qcyc7XG5pbXBvcnQgeyBQcmludHMgfSBmcm9tICcuLi8uLi9hcGkvcHJpbnRzL3ByaW50cy5qcyc7XG5pbXBvcnQgeyBTZWFyY2hlcyB9IGZyb20gJy4uLy4uL2FwaS9zZWFyY2hlcy9zZWFyY2hlcy5qcyc7XG5pbXBvcnQgQVdTIGZyb20gJ2F3cy1zZGsnO1xuXG5BV1MuY29uZmlnLnJlZ2lvbiA9ICd1cy1lYXN0LTEnO1xudmFyIHJla29nbml0aW9uID0gbmV3IEFXUy5SZWtvZ25pdGlvbigpO1xuXG4vLyBpZiB0aGUgZGF0YWJhc2UgaXMgZW1wdHkgb24gc2VydmVyIHN0YXJ0LCBjcmVhdGUgc29tZSBzYW1wbGUgZGF0YS5cblxuTWV0ZW9yLnN0YXJ0dXAoKCkgPT4ge1xuXG4gIGNvbnNvbGUubG9nKFwiZ2V0dGluZyBhd3MgY29sbGVjdGlvbnMuLi5cIik7XG4gIGxldCBjb2xQYXJhbXM9IHt9O1xuICBsZXQgY29sUmVxdWVzdCA9IHJla29nbml0aW9uLmxpc3RDb2xsZWN0aW9ucyhjb2xQYXJhbXMpO1xuICBsZXQgcHJvbWlzZSA9IGNvbFJlcXVlc3QucHJvbWlzZSgpO1xuICBsZXQgY29scyA9IHByb21pc2UudGhlbihyZXN1bHQgPT4ge1xuICAgIGNvbnNvbGUubG9nKHJlc3VsdCk7XG4gICAgaWYocmVzdWx0ICYmIHJlc3VsdC5Db2xsZWN0aW9uSWRzLmxlbmd0aCA+IDApe1xuICAgICAgXy5lYWNoKHJlc3VsdC5Db2xsZWN0aW9uSWRzLCBmdW5jdGlvbihjb2xJZCl7XG4gICAgICAgIGxldCBhd3NDb2wgPSB7XG4gICAgICAgICAgY29sbGVjdGlvbl9pZDogY29sSWQsXG4gICAgICAgICAgY29sbGVjdGlvbl9uYW1lOiBjb2xJZCxcbiAgICAgICAgICBjb2xsZWN0aW9uX3R5cGU6IFwiZmFjZVwiLFxuICAgICAgICAgIHByaXZhdGU6IHRydWVcbiAgICAgICAgfTtcbiAgICAgICAgbGV0IGV4aXN0aW5nQ29sID0gQ29sbGVjdGlvbnMudXBzZXJ0KHtjb2xsZWN0aW9uX2lkOiBjb2xJZH0sIHskc2V0OiBhd3NDb2x9KTtcbiAgICAgICAgY29uc29sZS5sb2coYHVwc2VydGVkIGNvbGxlY3Rpb246ICR7SlNPTi5zdHJpbmdpZnkoZXhpc3RpbmdDb2wpfWApO1xuICAgICAgICAvLyBOb3cgdHJ5IGdldHRpbmcgZXhpc3RpbmcgZmFjZXMgZm9yIGVhY2ggY29sbGVjdGlvblxuICAgICAgICBsZXQgZmFjZVBhcmFtcyA9IHtcbiAgICAgICAgICBDb2xsZWN0aW9uSWQ6IGNvbElkXG4gICAgICAgIH07XG4gICAgICAgIGxldCBmYWNlUmVxdWVzdCA9IHJla29nbml0aW9uLmxpc3RGYWNlcyhmYWNlUGFyYW1zKTtcbiAgICAgICAgbGV0IHByb21pc2UgPSBmYWNlUmVxdWVzdC5wcm9taXNlKCk7XG4gICAgICAgIGxldCBmYWNlcyA9IHByb21pc2UudGhlbihyZXN1bHQgPT4ge1xuICAgICAgICAgIGlmKHJlc3VsdCAmJiByZXN1bHQuRmFjZXMubGVuZ3RoID4gMCl7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgJHtjb2xJZH0gY29sbGVjdGlvbiBoYXMgJHtyZXN1bHQuRmFjZXMubGVuZ3RofSBmYWNlc2ApO1xuICAgICAgICAgICAgXy5lYWNoKHJlc3VsdC5GYWNlcywgZnVuY3Rpb24oZmFjZSl7XG4gICAgICAgICAgICAgIGxldCBhd3NGYWNlID0ge1xuICAgICAgICAgICAgICAgIHByaW50X2lkOiBmYWNlLkZhY2VJZCxcbiAgICAgICAgICAgICAgICBwcmludF9uYW1lOiBmYWNlLkV4dGVybmFsSW1hZ2VJZCB8fCBmYWNlLkltYWdlSWQsXG4gICAgICAgICAgICAgICAgcHJpbnRfdHlwZTogXCJmYWNlXCIsXG4gICAgICAgICAgICAgICAgcHJpbnRfY29sbGVjdGlvbjogY29sSWQsXG4gICAgICAgICAgICAgICAgcHJpbnRfY29sbGVjdGlvbl9pZDogQ29sbGVjdGlvbnMuZmluZE9uZSh7Y29sbGVjdGlvbl9pZDogY29sSWR9KS5faWQsXG4gICAgICAgICAgICAgICAgcHJpbnRfZGV0YWlsczogZmFjZSxcbiAgICAgICAgICAgICAgICBwcmludF9hZGRlcjogXCJyb290XCJcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgUHJpbnRzLnNpbXBsZVNjaGVtYSgpLmNsZWFuKGF3c0ZhY2UpO1xuICAgICAgICAgICAgICBsZXQgZXhpc3RpbmdGYWNlID0gUHJpbnRzLnVwc2VydCh7cHJpbnRfaWQ6IGZhY2UuRmFjZUlkfSwgeyRzZXQ6IGF3c0ZhY2V9KTtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coZXhpc3RpbmdGYWNlKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9KTtcblxuICAvLyBpZiAoUHJpbnRzLmZpbmQoKS5jb3VudCgpIDwgMTUpIHtcbiAgLy8gICBjb25zb2xlLmxvZyhcInNlZWRpbmcgcHJpbnRzLi4uXCIpO1xuICAvLyAgIGxldCBzZWVkUHJpbnRzID0gW11cbiAgLy8gICBfLnRpbWVzKDUsICgpPT57XG4gIC8vICAgICBsZXQgcHJpbnQgPSB7XG4gIC8vICAgICAgIHByaW50X2FkZGVyOiB0aGlzLnVzZXJJZCB8fCBcInJvb3RcIixcbiAgLy8gICAgICAgcHJpbnRfY29sbGVjdGlvbjogXCJwZW9wbGVcIixcbiAgLy8gICAgICAgcHJpbnRfY29sbGVjdGlvbl9pZDogXCJwZW9wbGVcIixcbiAgLy8gICAgICAgcHJpbnRfbmFtZTogZmFrZXIuaGVscGVycy51c2VyQ2FyZCgpLm5hbWUsXG4gIC8vICAgICAgIHByaW50X2lkOiBmYWtlci5yYW5kb20udXVpZCgpLFxuICAvLyAgICAgICBwcmludF9pbWc6IGZha2VyLmltYWdlLmF2YXRhcigpXG4gIC8vICAgICB9O1xuICAvLyAgICAgbGV0IHByaW50SWQgPSBQcmludHMuaW5zZXJ0KHByaW50KTtcbiAgLy8gICAgIHNlZWRQcmludHMucHVzaChwcmludElkKTtcbiAgLy8gICB9KTtcbiAgLy8gICBjb25zb2xlLmxvZyhzZWVkUHJpbnRzKTtcblxuICAvLyB9O1xufSk7IiwiLypcbiAqIENvcHlyaWdodCAyMDE3LXByZXNlbnQgQW50bW91bmRzLmNvbSwgSW5jLiBvciBpdHMgYWZmaWxpYXRlcy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgR05VIEFmZmVybyBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlLCB2ZXJzaW9uIDMuMCAodGhlIFwiTGljZW5zZVwiKS4gWW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoXG4gKiB0aGUgTGljZW5zZS4gQSBjb3B5IG9mIHRoZSBMaWNlbnNlIGlzIGxvY2F0ZWQgYXRcbiAqXG4gKiAgICAgaHR0cHM6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy9hZ3BsLTMuMC5lbi5odG1sXG4gKlxuICogb3IgaW4gdGhlIFwibGljZW5zZVwiIGZpbGUgYWNjb21wYW55aW5nIHRoaXMgZmlsZS4gVGhpcyBmaWxlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SXG4gKiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnNcbiAqIGFuZCBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5pbXBvcnQgeyBIVFRQIH0gZnJvbSAnbWV0ZW9yL2h0dHAnO1xuaW1wb3J0ICcuLi9hY2NvdW50cy1jb25maWcuanMnO1xuaW1wb3J0ICcuL2ZpeHR1cmVzLmpzJztcbi8vIFRoaXMgZGVmaW5lcyBhbGwgdGhlIGNvbGxlY3Rpb25zLCBwdWJsaWNhdGlvbnMgYW5kIG1ldGhvZHMgdGhhdCB0aGUgYXBwbGljYXRpb24gcHJvdmlkZXNcbi8vIGFzIGFuIEFQSSB0byB0aGUgY2xpZW50LlxuaW1wb3J0ICcuL3JlZ2lzdGVyLWFwaS5qcyc7XG5cbmNvbnN0IG9zID0gcmVxdWlyZSgnb3MnKTtcblxuXG5zZXJ2ZXJfbW9kZSA9IE1ldGVvci5pc1Byb2R1Y3Rpb24gPyBcIlBST0RVQ1RJT05cIiA6IFwiREVWRUxPUE1FTlRcIjtcbmNvbnNvbGUubG9nKCdpbmRleC5qczogJyArIHNlcnZlcl9tb2RlICsgXCItLT5cIiArIEpTT04uc3RyaW5naWZ5KE1ldGVvci5zZXR0aW5ncykpO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cblx0aW5mbygpe1xuXHRcdHJldHVybiBgdmVyc2lvbjogMC45LjEgLSBidWlsZDogJHtwcm9jZXNzLmVudi5CVUlMRCB8fCAnZGV2J30gLSBob3N0bmFtZTogJHtvcy5ob3N0bmFtZSgpfWA7XG5cdH0sXG5cblx0YXN5bmMgZ2V0RGF0YSgpeyAgICBcblx0XHR0cnl7XG5cdFx0XHR2YXIgcmVzcG9uc2UgPSB7fTtcblx0XHRcdGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBIVFRQLmNhbGwoJ0dFVCcsICdodHRwOi8vanNvbnBsYWNlaG9sZGVyLnR5cGljb2RlLmNvbS9wb3N0cycpO1x0XG5cdFx0XHRjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShyZXN1bHRzLmRhdGFbMF0pKTtcdFxuXHRcdFx0Y29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkocmVzdWx0cy5oZWFkZXJzKSk7XG5cdFx0XHRyZXNwb25zZS5jb2RlID0gdHJ1ZTtcdFx0XG5cdFx0XHRyZXNwb25zZS5kYXRhID0gcmVzdWx0cztcdFxuXHRcdH0gY2F0Y2goZSl7XG5cdFx0XHRyZXNwb25zZSA9IGZhbHNlO1xuXHRcdFx0Y29uc29sZS5sb2coZSk7XG5cdFx0fSBmaW5hbGx5IHtcblx0XHRcdGNvbnNvbGUubG9nKFwiZmluYWxseS4uLlwiKVxuXHRcdFx0Ly90aHJvdyBuZXcgTWV0ZW9yLkVycm9yKFwiaW5hcHByb3ByaWF0ZS1waWNcIixcIlRoZSB1c2VyIGhhcyB0YWtlbiBhbiBpbmFwcHJvcHJpYXRlIHBpY3R1cmUuXCIpO1x0XG5cdFx0XHRyZXR1cm4gcmVzcG9uc2U7XG5cdFx0fVxuXHR9XG5cbn0pO1xuXG5NZXRlb3Iub25Db25uZWN0aW9uKChjb25uZWN0aW9uKT0+e1xuXHRsZXQgY2xpZW50QWRkciA9IGNvbm5lY3Rpb24uY2xpZW50QWRkcmVzcztcblx0bGV0IGhlYWRlcnMgPSBjb25uZWN0aW9uLmh0dHBIZWFkZXJzO1xuXHRjb25zb2xlLmxvZyhgY29ubmVjdGlvbiBmcm9tICR7Y2xpZW50QWRkcn1gKTtcblx0Ly8gY29uc29sZS5sb2coaGVhZGVycyk7XG59KSIsImltcG9ydCAnLi4vLi4vYXBpL2NvbGxlY3Rpb25zL21ldGhvZHMuanMnO1xuaW1wb3J0ICcuLi8uLi9hcGkvY29sbGVjdGlvbnMvcHVibGljYXRpb25zLmpzJztcbmltcG9ydCAnLi4vLi4vYXBpL3NlYXJjaGVzL21ldGhvZHMuanMnO1xuaW1wb3J0ICcuLi8uLi9hcGkvc2VhcmNoZXMvcHVibGljYXRpb25zLmpzJztcbmltcG9ydCAnLi4vLi4vYXBpL3ByaW50cy9tZXRob2RzLmpzJztcbmltcG9ydCAnLi4vLi4vYXBpL3ByaW50cy9wdWJsaWNhdGlvbnMuanMnOyIsImltcG9ydCB7IEFjY291bnRzIH0gZnJvbSAnbWV0ZW9yL2FjY291bnRzLWJhc2UnO1xuaW1wb3J0IHsgQWNjb3VudHNDb21tb24gfSBmcm9tICdtZXRlb3IvYWNjb3VudHMtYmFzZSdcbmltcG9ydCB7IEFjY291bnRzQ2xpZW50IH0gZnJvbSAnbWV0ZW9yL2FjY291bnRzLWJhc2UnXG5cblxuaWYgKE1ldGVvci5pc0NsaWVudCkge1xuXHRBY2NvdW50cy51aS5jb25maWcoe1xuXHQgIHBhc3N3b3JkU2lnbnVwRmllbGRzOiAnVVNFUk5BTUVfQU5EX0VNQUlMJyxcblx0fSk7XG59XG5cbmlmIChNZXRlb3IuaXNTZXJ2ZXIpIHtcblx0Y29uc29sZS5sb2coXCJhY2NvdW50cyBjb25maWcgbG9hZGVkIVwiKTtcblx0QWNjb3VudHMub25DcmVhdGVVc2VyKChvcHRpb25zLCB1c2VyKSA9PiB7XG5cdFx0Ly8gdXNlci5jcmVhdGVkID0gbmV3IERhdGUoKTtcblxuXHRcdGNvbnNvbGUubG9nKFwidXNlcjogXCIgKyB1c2VyKTtcblx0XHRjb25zb2xlLmxvZyhcIm9wdGlvbnM6IFwiICsgb3B0aW9ucyk7XG5cdFx0Ly8gdXNlciA9IEpTT04uc3RyaW5naWZ5KHVzZXIpO1xuXHRcdGNvbnNvbGUubG9nKHVzZXIpO1xuXHRcdC8vIG9wdGlvbnMgPSBKU09OLnN0cmluZ2lmeShvcHRpb25zKTtcblx0XHRjb25zb2xlLmxvZyhvcHRpb25zKTtcblxuXHQgICAgLy8gRG9uJ3QgZm9yZ2V0IHRvIHJldHVybiB0aGUgbmV3IHVzZXIgb2JqZWN0IGF0IHRoZSBlbmQhXG5cdFx0cmV0dXJuIHVzZXI7XG5cdH0pO1xufSIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNy1wcmVzZW50IEFudG1vdW5kcy5jb20sIEluYy4gb3IgaXRzIGFmZmlsaWF0ZXMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEdOVSBBZmZlcm8gR2VuZXJhbCBQdWJsaWMgTGljZW5zZSwgdmVyc2lvbiAzLjAgKHRoZSBcIkxpY2Vuc2VcIikuIFlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aFxuICogdGhlIExpY2Vuc2UuIEEgY29weSBvZiB0aGUgTGljZW5zZSBpcyBsb2NhdGVkIGF0XG4gKlxuICogICAgIGh0dHBzOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvYWdwbC0zLjAuZW4uaHRtbFxuICpcbiAqIG9yIGluIHRoZSBcImxpY2Vuc2VcIiBmaWxlIGFjY29tcGFueWluZyB0aGlzIGZpbGUuIFRoaXMgZmlsZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUlxuICogQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zXG4gKiBhbmQgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbmltcG9ydCAnLi4vaW1wb3J0cy9zdGFydHVwL3NlcnZlcic7XG5cbk1ldGVvci5zdGFydHVwKCgpID0+IHtcbiAgLy8gY29kZSB0byBydW4gb24gc2VydmVyIGF0IHN0YXJ0dXBcbn0pO1xuIl19
