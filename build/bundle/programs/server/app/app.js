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
    defaultValue: "Collection ID",
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
    let col = Collections.insert(newCol);
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

    if (colId) {
      let print = Collections.remove(colId);
      console.log(`deleted collection: ${colId}`);
      return `deleted collection: ${colId}`;
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
    newPrint.print_adder = this.userId || "null";
    newPrint.print_collection = Collections.findOne(newPrint.collection).collection_id || "people";
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
      console.log(result);
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
  let selector = {// print_collection: collectionId
  }; // console.log(Collections.find(collectionId).count());

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
  "search.face"(picData, matchThreshold) {
    //return 1;
    // if(!Meteor.user){
    // 	throw new Meteor.Error('not-logged-in','must be logged-in to perform search');
    // 	return false;
    // }
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
    console.log(colIds); // let matchThreshold = matchThreshold;

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
            console.log(`collection has ${result.Faces.length} faces`);

            _.each(result.Faces, function (face) {
              let awsFace = {
                print_id: face.FaceId,
                print_name: face.ExternalImageId || face.ImageId,
                print_type: "face",
                print_collection: colId,
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
  });

  if (Prints.find().count() < 15) {
    console.log("seeding prints...");
    let seedPrints = [];

    _.times(5, () => {
      let print = {
        print_adder: this.userId || "deded",
        print_collection: "people",
        print_name: faker.helpers.userCard().name,
        print_id: faker.random.uuid(),
        print_img: faker.image.avatar()
      };
      let printId = Prints.insert(print);
      seedPrints.push(printId);
    });

    console.log(seedPrints);
  }

  ;
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
    return `version: 0.9.0 - build: ${process.env.BUILD || 'dev'} - hostname: ${os.hostname()}`;
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvY29sbGVjdGlvbnMvY29sbGVjdGlvbnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL2NvbGxlY3Rpb25zL21ldGhvZHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL2NvbGxlY3Rpb25zL3B1YmxpY2F0aW9ucy5qcyIsIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvcHJpbnRzL21ldGhvZHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL3ByaW50cy9wcmludHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL3ByaW50cy9wdWJsaWNhdGlvbnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL3NlYXJjaGVzL21ldGhvZHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL3NlYXJjaGVzL3B1YmxpY2F0aW9ucy5qcyIsIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvc2VhcmNoZXMvc2VhcmNoZXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvc3RhcnR1cC9zZXJ2ZXIvZml4dHVyZXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvc3RhcnR1cC9zZXJ2ZXIvaW5kZXguanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvc3RhcnR1cC9zZXJ2ZXIvcmVnaXN0ZXItYXBpLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9pbXBvcnRzL3N0YXJ0dXAvYWNjb3VudHMtY29uZmlnLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9zZXJ2ZXIvbWFpbi5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnQiLCJDb2xsZWN0aW9ucyIsIk1vbmdvIiwid2F0Y2giLCJyZXF1aXJlIiwidiIsIlNpbXBsZVNjaGVtYSIsIk1ldGVvciIsIkNvbGxlY3Rpb24iLCJkZW55IiwiaW5zZXJ0IiwidXBkYXRlIiwicmVtb3ZlIiwiU2NoZW1hIiwidHlwZSIsIlN0cmluZyIsImxhYmVsIiwib3B0aW9uYWwiLCJkZWZhdWx0VmFsdWUiLCJpbmRleCIsInVuaXF1ZSIsImFsbG93ZWRWYWx1ZXMiLCJCb29sZWFuIiwiRGF0ZSIsImF1dG9WYWx1ZSIsImlzSW5zZXJ0IiwiaXNVcGRhdGUiLCJhdHRhY2hTY2hlbWEiLCJwdWJsaWNGaWVsZHMiLCJjb2xsZWN0aW9uX2lkIiwiY29sbGVjdGlvbl9uYW1lIiwiY29sbGVjdGlvbl90eXBlIiwicHJpdmF0ZSIsImNyZWF0ZWQiLCJ1cGRhdGVkIiwiRERQUmF0ZUxpbWl0ZXIiLCJBV1MiLCJkZWZhdWx0IiwiY29uZmlnIiwicmVnaW9uIiwicmVrb2duaXRpb24iLCJSZWtvZ25pdGlvbiIsIm1ldGhvZHMiLCJuZXdDb2wiLCJjb25zb2xlIiwibG9nIiwiY29sIiwiY29sbGVjdGlvblBhcmFtcyIsIkNvbGxlY3Rpb25JZCIsImNvbGxlY3Rpb25SZXF1ZXN0IiwiY3JlYXRlQ29sbGVjdGlvbiIsInByb21pc2UiLCJjYXRjaCIsImVycm9yIiwiRXJyb3IiLCJjb2RlIiwibWVzc2FnZSIsInRoZW4iLCJ2YWx1ZXMiLCJjb2xJZCIsImNoZWNrIiwicHJpbnQiLCJwdWJsaXNoIiwiY29sbGVjdGlvbklkIiwiZmluZCIsInNvcnQiLCJmaWVsZHMiLCJzdWJzY3JpYmVUb0NvbGxlY3Rpb25zUnVsZSIsIm5hbWUiLCJhZGRSdWxlIiwiUHJpbnRzIiwibmV3UHJpbnQiLCJwcmludF9hZGRlciIsInVzZXJJZCIsInByaW50X2NvbGxlY3Rpb24iLCJmaW5kT25lIiwiY29sbGVjdGlvbiIsInByaW50X25hbWUiLCJyZXBsYWNlIiwicHJpbnRfaW1nIiwiaW1nIiwic2ltcGxlU2NoZW1hIiwiY2xlYW4iLCJmYWNlUGFyYW1zIiwiRXh0ZXJuYWxJbWFnZUlkIiwiSW1hZ2UiLCJCdWZmZXIiLCJmcm9tIiwic3BsaXQiLCJEZXRlY3Rpb25BdHRyaWJ1dGVzIiwiZmFjZVJlcXVlc3QiLCJpbmRleEZhY2VzIiwiaW5kZXhGYWNlIiwicmVzdWx0IiwicHJpbnRfaWQiLCJGYWNlUmVjb3JkcyIsIkZhY2UiLCJGYWNlSWQiLCJwcmludElkIiwiT2JqZWN0IiwiYmxhY2tib3giLCJwcmludF90eXBlIiwicHJpbnRfZGV0YWlscyIsInNlbGVjdG9yIiwic3Vic2NyaWJlVG9QcmludHNSdWxlIiwiU2VhcmNoZXMiLCJwaWNEYXRhIiwibWF0Y2hUaHJlc2hvbGQiLCJOdW1iZXIiLCJ0MCIsImdldFRpbWUiLCJpbWdCeXRlcyIsImNvbElkcyIsImZldGNoIiwibW9kZXJhdGlvblBhcmFtcyIsImxhYmVsUGFyYW1zIiwiY2VsZWJyaXR5UGFyYW1zIiwibW9kZXJhdGlvblJlcXVlc3QiLCJkZXRlY3RNb2RlcmF0aW9uTGFiZWxzIiwibGFiZWxSZXF1ZXN0IiwiZGV0ZWN0TGFiZWxzIiwiZGV0ZWN0RmFjZXMiLCJjZWxlYnJpdHlSZXF1ZXN0IiwicmVjb2duaXplQ2VsZWJyaXRpZXMiLCJhbGxQcm9taXNlcyIsInB1c2giLCJfIiwiZWFjaCIsInJla29nbml0aW9uUGFyYW1zIiwicmVrb2duaXRpb25SZXF1ZXN0Iiwic2VhcmNoRmFjZXNCeUltYWdlIiwicmVzcG9uc2UiLCJQcm9taXNlIiwiYWxsIiwiSlNPTiIsInN0cmluZ2lmeSIsImkiLCJwZXJzb25zIiwiRmFjZU1hdGNoZXMiLCJ0YWciLCJpbWFnZV9pZCIsImZhY2VfaWQiLCJzaW1pbGFyaXR5IiwiU2ltaWxhcml0eSIsInQxIiwic2VhcmNoX3Jlc3VsdHMiLCJtb2RlcmF0aW9uIiwiTW9kZXJhdGlvbkxhYmVscyIsImxhYmVscyIsIkxhYmVscyIsImZhY2VEZXRhaWxzIiwiRmFjZURldGFpbHMiLCJjZWxlYnJpdHkiLCJDZWxlYnJpdHlGYWNlcyIsInNlYXJjaCIsInNhdmVTZWFyY2giLCJyZWFzb24iLCJkZXRhaWxzIiwiZmluYWxseSIsInNlYXJjaElkIiwicnVuU2NhblJ1bGUiLCJzdWJzY3JpYmVUb1NlYXJjaGVzUnVsZSIsImlzU2VydmVyIiwic3RhcnR1cCIsIl9lbnN1cmVJbmRleCIsInNlYXJjaF9pZCIsInNlYXJjaF90eXBlIiwic2VhcmNoX2NvbGxlY3Rpb25zIiwic2VhcmNoX2ltYWdlIiwiY29sUGFyYW1zIiwiY29sUmVxdWVzdCIsImxpc3RDb2xsZWN0aW9ucyIsImNvbHMiLCJDb2xsZWN0aW9uSWRzIiwibGVuZ3RoIiwiYXdzQ29sIiwiZXhpc3RpbmdDb2wiLCJ1cHNlcnQiLCIkc2V0IiwibGlzdEZhY2VzIiwiZmFjZXMiLCJGYWNlcyIsImZhY2UiLCJhd3NGYWNlIiwiSW1hZ2VJZCIsImV4aXN0aW5nRmFjZSIsImNvdW50Iiwic2VlZFByaW50cyIsInRpbWVzIiwiZmFrZXIiLCJoZWxwZXJzIiwidXNlckNhcmQiLCJyYW5kb20iLCJ1dWlkIiwiaW1hZ2UiLCJhdmF0YXIiLCJIVFRQIiwib3MiLCJzZXJ2ZXJfbW9kZSIsImlzUHJvZHVjdGlvbiIsInNldHRpbmdzIiwiaW5mbyIsInByb2Nlc3MiLCJlbnYiLCJCVUlMRCIsImhvc3RuYW1lIiwiZ2V0RGF0YSIsInJlc3VsdHMiLCJjYWxsIiwiZGF0YSIsImhlYWRlcnMiLCJlIiwib25Db25uZWN0aW9uIiwiY29ubmVjdGlvbiIsImNsaWVudEFkZHIiLCJjbGllbnRBZGRyZXNzIiwiaHR0cEhlYWRlcnMiLCJBY2NvdW50cyIsIkFjY291bnRzQ29tbW9uIiwiQWNjb3VudHNDbGllbnQiLCJpc0NsaWVudCIsInVpIiwicGFzc3dvcmRTaWdudXBGaWVsZHMiLCJvbkNyZWF0ZVVzZXIiLCJvcHRpb25zIiwidXNlciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBQUEsT0FBT0MsTUFBUCxDQUFjO0FBQUNDLGVBQVksTUFBSUE7QUFBakIsQ0FBZDtBQUE2QyxJQUFJQyxLQUFKO0FBQVVILE9BQU9JLEtBQVAsQ0FBYUMsUUFBUSxjQUFSLENBQWIsRUFBcUM7QUFBQ0YsUUFBTUcsQ0FBTixFQUFRO0FBQUNILFlBQU1HLENBQU47QUFBUTs7QUFBbEIsQ0FBckMsRUFBeUQsQ0FBekQ7QUFBNEQsSUFBSUMsWUFBSjtBQUFpQlAs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O0FBQXBDLENBQTdDLEVBQW1GLENBQW5GOztBQUtuTixJQUFJRSxPQUFPcU4sUUFBWCxFQUFxQjtBQUNwQkgsV0FBU0ksRUFBVCxDQUFZdkwsTUFBWixDQUFtQjtBQUNqQndMLDBCQUFzQjtBQURMLEdBQW5CO0FBR0E7O0FBRUQsSUFBSXZOLE9BQU8ySixRQUFYLEVBQXFCO0FBQ3BCdEgsVUFBUUMsR0FBUixDQUFZLHlCQUFaO0FBQ0E0SyxXQUFTTSxZQUFULENBQXNCLENBQUNDLE9BQUQsRUFBVUMsSUFBVixLQUFtQjtBQUN4QztBQUVBckwsWUFBUUMsR0FBUixDQUFZLFdBQVdvTCxJQUF2QjtBQUNBckwsWUFBUUMsR0FBUixDQUFZLGNBQWNtTCxPQUExQixFQUp3QyxDQUt4Qzs7QUFDQXBMLFlBQVFDLEdBQVIsQ0FBWW9MLElBQVosRUFOd0MsQ0FPeEM7O0FBQ0FyTCxZQUFRQyxHQUFSLENBQVltTCxPQUFaLEVBUndDLENBVXJDOztBQUNILFdBQU9DLElBQVA7QUFDQSxHQVpEO0FBYUEsQzs7Ozs7Ozs7Ozs7QUMxQkRsTyxPQUFPSSxLQUFQLENBQWFDLFFBQVEsMkJBQVIsQ0FBYjtBQWNBRyxPQUFPNEosT0FBUCxDQUFlLE1BQU0sQ0FDbkI7QUFDRCxDQUZELEUiLCJmaWxlIjoiL2FwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1vbmdvIH0gZnJvbSAnbWV0ZW9yL21vbmdvJztcbmltcG9ydCB7IFNpbXBsZVNjaGVtYSB9IGZyb20gJ21ldGVvci9hbGRlZWQ6c2ltcGxlLXNjaGVtYSc7XG5cblxuXG5leHBvcnQgY29uc3QgQ29sbGVjdGlvbnMgPSBuZXcgTWV0ZW9yLkNvbGxlY3Rpb24oJ2NvbGxlY3Rpb25zJyk7XG5cbi8vIERlbnkgYWxsIGNsaWVudC1zaWRlIHVwZGF0ZXMgc2luY2Ugd2Ugd2lsbCBiZSB1c2luZyBtZXRob2RzIHRvIG1hbmFnZSB0aGlzIGNvbGxlY3Rpb25cbkNvbGxlY3Rpb25zLmRlbnkoe1xuICBpbnNlcnQoKSB7IHJldHVybiB0cnVlOyB9LFxuICB1cGRhdGUoKSB7IHJldHVybiB0cnVlOyB9LFxuICByZW1vdmUoKSB7IHJldHVybiB0cnVlOyB9LFxufSk7XG5cbkNvbGxlY3Rpb25zLlNjaGVtYSA9IG5ldyBTaW1wbGVTY2hlbWEoe1xuICAvLyBPdXIgc2NoZW1hIHJ1bGVzIHdpbGwgZ28gaGVyZS5cbiAgXCJjb2xsZWN0aW9uX2lkXCI6IHtcbiAgICB0eXBlOiBTdHJpbmcsXG4gICAgbGFiZWw6IFwiQ29sbGVjdGlvbiBJRFwiLFxuICAgIG9wdGlvbmFsOiBmYWxzZSxcbiAgICBkZWZhdWx0VmFsdWU6IFwiQ29sbGVjdGlvbiBJRFwiLFxuICAgIGluZGV4OiB0cnVlLFxuICAgIHVuaXF1ZTogdHJ1ZVxuICB9LFxuICBcImNvbGxlY3Rpb25fbmFtZVwiOiB7XG4gICAgdHlwZTogU3RyaW5nLFxuICAgIGxhYmVsOiBcIkNvbGxlY3Rpb24gTmFtZVwiLFxuICAgIG9wdGlvbmFsOiBmYWxzZSxcbiAgICBkZWZhdWx0VmFsdWU6IFwiTXlDb2xsZWN0aW9uXCIsXG4gICAgaW5kZXg6IHRydWVcbiAgfSxcbiAgXCJjb2xsZWN0aW9uX3R5cGVcIjoge1xuICAgIHR5cGU6IFN0cmluZyxcbiAgICBsYWJlbDogXCJDb2xsZWN0aW9uIHR5cGVcIixcbiAgICBvcHRpb25hbDogZmFsc2UsXG4gICAgYWxsb3dlZFZhbHVlczogW1wiZmFjZVwiLCBcInZvaWNlXCJdLFxuICAgIGRlZmF1bHRWYWx1ZTogXCJmYWNlXCJcbiAgfSxcbiAgXCJwcml2YXRlXCI6IHtcbiAgICB0eXBlOiBCb29sZWFuLFxuICAgIGxhYmVsOiBcIkNvbGxlY3Rpb24gcHJpdmFjeVwiLFxuICAgIG9wdGlvbmFsOiBmYWxzZSxcbiAgICBkZWZhdWx0VmFsdWU6IHRydWVcbiAgfSxcbiAgXCJjcmVhdGVkXCI6IHtcbiAgICB0eXBlOiBEYXRlLFxuICAgIGxhYmVsOiBcIkRhdGUgY29sbGVjdGlvbiBhZGRlZCB0byBBbnRlbm5hZVwiLFxuICAgIGF1dG9WYWx1ZTogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoIHRoaXMuaXNJbnNlcnQgKSB7XG4gICAgICAgIHJldHVybiBuZXcgRGF0ZTtcbiAgICAgIH0gXG4gICAgfSxcbiAgICBvcHRpb25hbDogdHJ1ZVxuICB9LFxuICBcInVwZGF0ZWRcIjoge1xuICAgIHR5cGU6IERhdGUsXG4gICAgbGFiZWw6IFwiRGF0ZSBjb2xsZWN0aW9uIHVwZGF0ZWQgaW4gU3lzdGVtXCIsXG4gICAgYXV0b1ZhbHVlOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICggdGhpcy5pc1VwZGF0ZSApIHtcbiAgICAgICAgcmV0dXJuIG5ldyBEYXRlO1xuICAgICAgfSBcbiAgICB9LFxuICAgIG9wdGlvbmFsOiB0cnVlXG4gIH1cbn0pO1xuXG5Db2xsZWN0aW9ucy5hdHRhY2hTY2hlbWEoIENvbGxlY3Rpb25zLlNjaGVtYSApOyBcblxuXG5Db2xsZWN0aW9ucy5wdWJsaWNGaWVsZHMgPSB7XG4gIGNvbGxlY3Rpb25faWQ6IDEsXG4gIGNvbGxlY3Rpb25fbmFtZTogMSxcbiAgY29sbGVjdGlvbl90eXBlOiAxLFxuICBwcml2YXRlOiAxLFxuICBjcmVhdGVkOiAxLFxuICB1cGRhdGVkOiAxXG59O1xuXG4vLyBDb2xsZWN0aW9ucy5oZWxwZXJzKHtcbi8vICAgLy8gQSBjb2xsZWN0aW9ucyBpcyBjb25zaWRlcmVkIHRvIGJlIHByaXZhdGUgaWYgXCJwcml2YXRlXCIgaXMgc2V0IHRvIHRydWVcbi8vICAgaXNQcml2YXRlKCkge1xuLy8gICAgIHJldHVybiB0aGlzLnByaXZhdGU7XG4vLyAgIH1cbi8vIH0pOyIsImltcG9ydCB7IEREUFJhdGVMaW1pdGVyIH0gZnJvbSAnbWV0ZW9yL2RkcC1yYXRlLWxpbWl0ZXInO1xuaW1wb3J0IEFXUyBmcm9tICdhd3Mtc2RrJztcblxuaW1wb3J0IHsgQ29sbGVjdGlvbnMgfSBmcm9tICcuL2NvbGxlY3Rpb25zLmpzJztcblxuQVdTLmNvbmZpZy5yZWdpb24gPSAndXMtZWFzdC0xJztcbnZhciByZWtvZ25pdGlvbiA9IG5ldyBBV1MuUmVrb2duaXRpb24oKTtcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXHRcImNvbGxlY3Rpb24uc2F2ZVwiKG5ld0NvbCl7XG5cdFx0Y29uc29sZS5sb2cobmV3Q29sKTtcblx0XHRsZXQgY29sID0gQ29sbGVjdGlvbnMuaW5zZXJ0KG5ld0NvbCk7XG5cdFx0bGV0IGNvbGxlY3Rpb25QYXJhbXMgPSB7XG4gIFx0XHRcdENvbGxlY3Rpb25JZDogbmV3Q29sLmNvbGxlY3Rpb25faWRcblx0XHR9O1xuXHRcdGxldCBjb2xsZWN0aW9uUmVxdWVzdCA9IHJla29nbml0aW9uLmNyZWF0ZUNvbGxlY3Rpb24oY29sbGVjdGlvblBhcmFtcykucHJvbWlzZSgpLmNhdGNoKGVycm9yID0+IHsgdGhyb3cgbmV3IE1ldGVvci5FcnJvcihlcnJvci5jb2RlLCBlcnJvci5tZXNzYWdlLCBlcnJvcik7IHJldHVybiBlcnJvcjsgfSk7XG5cdFx0Y29sbGVjdGlvblJlcXVlc3QudGhlbih2YWx1ZXMgPT4ge3JldHVybiB2YWx1ZXN9KTtcblx0XHRpZihjb2wpe1xuXHRcdFx0Y29uc29sZS5sb2coYGFkZGVkIGNvbGxlY3Rpb246ICR7Y29sfWApO1xuXHRcdH1lbHNle1xuICAgICAgICAgICAgY29uc29sZS5sb2cobmV3Q29sKTtcbiAgICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2FkZC1jb2xsZWN0aW9uLWVycm9yJyxgZXJyb3IgYWRkaW5nIGNvbGxlY3Rpb246ICR7bmV3Q29sfWApXHRcdFxuXHRcdH1cblx0XHRyZXR1cm4gYGFkZGVkIGNvbGxlY3Rpb246ICR7Y29sfWA7XG5cdH0sXG5cblx0XCJjb2xsZWN0aW9uLmRlbGV0ZVwiKGNvbElkKXtcblx0XHRjaGVjayhjb2xJZCxTdHJpbmcpO1xuXHRcdGlmKGNvbElkKXtcblx0XHRcdGxldCBwcmludCA9IENvbGxlY3Rpb25zLnJlbW92ZShjb2xJZCk7XG5cdFx0XHRjb25zb2xlLmxvZyhgZGVsZXRlZCBjb2xsZWN0aW9uOiAke2NvbElkfWApO1xuXHRcdFx0cmV0dXJuIGBkZWxldGVkIGNvbGxlY3Rpb246ICR7Y29sSWR9YDtcblx0XHR9O1xuXHR9XG59KVxuXG4vLyBEZWZpbmUgYSBydWxlIHRvIGxpbWl0IG1ldGhvZCBjYWxsc1xuLy8gbGV0IHJ1blNjYW5SdWxlID0ge1xuLy8gXHR0eXBlOiAnbWV0aG9kJyxcbi8vIFx0bmFtZTogJ21vbWVudC5zY2FuJ1xuLy8gfTtcbi8vIEFkZCB0aGUgcnVsZSwgYWxsb3dpbmcgdXAgdG8gMSBzY2FuIGV2ZXJ5IDEwIHNlY29uZHNcbi8vIEREUFJhdGVMaW1pdGVyLmFkZFJ1bGUocnVuU2NhblJ1bGUsIDEsIDEwMDAwKTsiLCJpbXBvcnQgeyBERFBSYXRlTGltaXRlciB9IGZyb20gJ21ldGVvci9kZHAtcmF0ZS1saW1pdGVyJztcblxuaW1wb3J0IHsgQ29sbGVjdGlvbnMgfSBmcm9tICcuL2NvbGxlY3Rpb25zLmpzJztcblxuXG5NZXRlb3IucHVibGlzaCgnY29sbGVjdGlvbnMuZ2V0JywgZnVuY3Rpb24oY29sbGVjdGlvbklkPScnKSB7XG5cdGNoZWNrKGNvbGxlY3Rpb25JZCxTdHJpbmcpO1xuXHRjb2xsZWN0aW9uSWQgPSBjb2xsZWN0aW9uSWQgfHwge307XG4gIFx0Ly8gY29uc29sZS5sb2coQ29sbGVjdGlvbnMuZmluZChjb2xsZWN0aW9uSWQpLmNvdW50KCkpO1xuXHRyZXR1cm4gQ29sbGVjdGlvbnMuZmluZChcblx0XHRjb2xsZWN0aW9uSWQsIFxuXHQgIHsgXG5cdCAgXHRzb3J0OiB7IGNyZWF0ZWQ6IC0xIH0gXG5cdH1cblx0LCB7XG5cdFx0ZmllbGRzOiBDb2xsZWN0aW9ucy5wdWJsaWNGaWVsZHNcblx0fSk7XG59KTtcblxuLy8gRGVmaW5lIGEgcnVsZSB0byBsaW1pdCBzdWJzY3JpcHRpb24gY2FsbHNcbnZhciBzdWJzY3JpYmVUb0NvbGxlY3Rpb25zUnVsZSA9IHtcbiAgdHlwZTogJ3N1YnNjcmlwdGlvbicsXG4gIG5hbWU6ICdjb2xsZWN0aW9ucy5nZXQnXG59XG4vLyBBZGQgdGhlIHJ1bGUsIGFsbG93aW5nIHVwIHRvIDEgc3Vic2NyaXB0aW9uIGV2ZXJ5IDUgc2Vjb25kcy5cbkREUFJhdGVMaW1pdGVyLmFkZFJ1bGUoc3Vic2NyaWJlVG9Db2xsZWN0aW9uc1J1bGUsIDEsIDUwMDApOyIsImltcG9ydCB7IEREUFJhdGVMaW1pdGVyIH0gZnJvbSAnbWV0ZW9yL2RkcC1yYXRlLWxpbWl0ZXInO1xuaW1wb3J0IEFXUyBmcm9tICdhd3Mtc2RrJztcblxuaW1wb3J0IHsgQ29sbGVjdGlvbnMgfSBmcm9tICcuLi9jb2xsZWN0aW9ucy9jb2xsZWN0aW9ucy5qcyc7XG5pbXBvcnQgeyBQcmludHMgfSBmcm9tICcuL3ByaW50cy5qcyc7XG5cbkFXUy5jb25maWcucmVnaW9uID0gJ3VzLWVhc3QtMSc7XG52YXIgcmVrb2duaXRpb24gPSBuZXcgQVdTLlJla29nbml0aW9uKCk7XG5cbk1ldGVvci5tZXRob2RzKHtcblx0XCJwcmludC5zYXZlXCIobmV3UHJpbnQpe1xuXHRcdG5ld1ByaW50LnByaW50X2FkZGVyID0gdGhpcy51c2VySWQgfHwgXCJudWxsXCI7XG5cdFx0bmV3UHJpbnQucHJpbnRfY29sbGVjdGlvbiA9IENvbGxlY3Rpb25zLmZpbmRPbmUobmV3UHJpbnQuY29sbGVjdGlvbikuY29sbGVjdGlvbl9pZCB8fCBcInBlb3BsZVwiO1xuXHRcdG5ld1ByaW50LnByaW50X25hbWUgPSBuZXdQcmludC5uYW1lLnJlcGxhY2UoLyAvZyxcIl9cIik7XG5cdFx0bmV3UHJpbnQucHJpbnRfaW1nID0gbmV3UHJpbnQuaW1nO1xuXHRcdC8vIGNvbnNvbGUubG9nKG5ld1ByaW50KTtcblx0XHRpZighbmV3UHJpbnQpe1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignaW52YWxpZC1wcmludCcsJ3N1Ym1pdHRlZCBwcmludCBpcyBpbnZhbGlkIScpO1xuXHRcdH07XG5cdFx0UHJpbnRzLnNpbXBsZVNjaGVtYSgpLmNsZWFuKG5ld1ByaW50KTtcbiAgICAgICAgLy8gaW5kZXggYSBmYWNlIGludG8gYSBjb2xsZWN0aW9uXG4gICAgICAgIGxldCBmYWNlUGFyYW1zID0ge1xuICAgICAgICAgIENvbGxlY3Rpb25JZDogbmV3UHJpbnQucHJpbnRfY29sbGVjdGlvbixcbiAgICAgICAgICBFeHRlcm5hbEltYWdlSWQ6IG5ld1ByaW50LnByaW50X25hbWUsXG5cdFx0ICBJbWFnZTogeyBcblx0XHRcdFwiQnl0ZXNcIjogbmV3IEJ1ZmZlci5mcm9tKG5ld1ByaW50LnByaW50X2ltZy5zcGxpdChcIixcIilbMV0sIFwiYmFzZTY0XCIpLFxuXHRcdCAgfSxcbiAgICAgICAgICBEZXRlY3Rpb25BdHRyaWJ1dGVzOiBbXCJBTExcIl1cbiAgICAgICAgfTtcbiAgICAgICAgbGV0IGZhY2VSZXF1ZXN0ID0gcmVrb2duaXRpb24uaW5kZXhGYWNlcyhmYWNlUGFyYW1zKTtcbiAgICAgICAgbGV0IHByb21pc2UgPSBmYWNlUmVxdWVzdC5wcm9taXNlKCk7XG4gICAgICAgIGxldCBpbmRleEZhY2UgPSBwcm9taXNlLnRoZW4ocmVzdWx0ID0+IHtcbiAgICAgICAgXHRjb25zb2xlLmxvZyhyZXN1bHQpO1xuICAgICAgICBcdG5ld1ByaW50LnByaW50X2lkID0gcmVzdWx0LkZhY2VSZWNvcmRzWzBdLkZhY2UuRmFjZUlkO1xuXHRcdFx0bGV0IHByaW50ID0gUHJpbnRzLmluc2VydChuZXdQcmludCk7XG4gICAgICAgIFx0Y29uc29sZS5sb2coYGluc2VydGVkOiAke3ByaW50fWApO1xuICAgICAgICBcdHJldHVybiByZXN1bHQ7XG4gICAgICAgIH0pLmNhdGNoKGVycm9yID0+IHtcbiAgICAgICAgXHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKGVycm9yLmNvZGUsIGVycm9yLm1lc3NhZ2UsIGVycm9yKTtcbiAgICAgICAgXHRyZXR1cm4gZXJyb3I7XG4gICAgICAgIH0pO1xuXHRcdHJldHVybiBpbmRleEZhY2U7XG5cdH0sXG5cblx0XCJwcmludC5kZWxldGVcIihwcmludElkKXtcblx0XHRjaGVjayhwcmludElkLFN0cmluZyk7XG5cdFx0aWYocHJpbnRJZCl7XG5cdFx0XHRsZXQgcHJpbnQgPSBQcmludHMucmVtb3ZlKHByaW50SWQpO1xuXHRcdFx0Y29uc29sZS5sb2coYGRlbGV0ZWQgZmFjZTogJHtwcmludElkfWApO1xuXHRcdFx0cmV0dXJuIGBkZWxldGVkIGZhY2U6ICR7cHJpbnRJZH1gO1xuXHRcdH07XG5cdH1cbn0pXG5cbi8vIERlZmluZSBhIHJ1bGUgdG8gbGltaXQgbWV0aG9kIGNhbGxzXG4vLyBsZXQgcnVuU2NhblJ1bGUgPSB7XG4vLyBcdHR5cGU6ICdtZXRob2QnLFxuLy8gXHRuYW1lOiAncHJpbnQuc2F2ZSdcbi8vIH07XG4vLyBBZGQgdGhlIHJ1bGUsIGFsbG93aW5nIHVwIHRvIDEgc2NhbiBldmVyeSAxMCBzZWNvbmRzXG4vLyBERFBSYXRlTGltaXRlci5hZGRSdWxlKHJ1blNjYW5SdWxlLCAxLCAxMDAwMCk7IiwiaW1wb3J0IHsgTW9uZ28gfSBmcm9tICdtZXRlb3IvbW9uZ28nO1xuaW1wb3J0IHsgU2ltcGxlU2NoZW1hIH0gZnJvbSAnbWV0ZW9yL2FsZGVlZDpzaW1wbGUtc2NoZW1hJztcblxuXG5cbmV4cG9ydCBjb25zdCBQcmludHMgPSBuZXcgTWV0ZW9yLkNvbGxlY3Rpb24oJ3ByaW50cycpO1xuXG4vLyBEZW55IGFsbCBjbGllbnQtc2lkZSB1cGRhdGVzIHNpbmNlIHdlIHdpbGwgYmUgdXNpbmcgbWV0aG9kcyB0byBtYW5hZ2UgdGhpcyBjb2xsZWN0aW9uXG5QcmludHMuZGVueSh7XG4gIGluc2VydCgpIHsgcmV0dXJuIHRydWU7IH0sXG4gIHVwZGF0ZSgpIHsgcmV0dXJuIHRydWU7IH0sXG4gIHJlbW92ZSgpIHsgcmV0dXJuIHRydWU7IH0sXG59KTtcblxuUHJpbnRzLlNjaGVtYSA9IG5ldyBTaW1wbGVTY2hlbWEoe1xuICAvLyBPdXIgc2NoZW1hIHJ1bGVzIHdpbGwgZ28gaGVyZS5cbiAgXCJwcmludF9pZFwiOiB7XG4gICAgdHlwZTogU3RyaW5nLFxuICAgIGxhYmVsOiBcIlByaW50IElEXCIsXG4gICAgb3B0aW9uYWw6IGZhbHNlLFxuICAgIGRlZmF1bHRWYWx1ZTogXCJBQUFBLUJCQkItQ0NDQy0xMTExLTIyMjItMzMzM1wiLFxuICAgIGluZGV4OiB0cnVlLFxuICAgIHVuaXF1ZTogdHJ1ZVxuICB9LFxuICBcInByaW50X25hbWVcIjoge1xuICAgIHR5cGU6IFN0cmluZyxcbiAgICBsYWJlbDogXCJQcmludCBOYW1lXCIsXG4gICAgb3B0aW9uYWw6IGZhbHNlLFxuICAgIGRlZmF1bHRWYWx1ZTogXCJOZXcgUGVyc29uXCJcbiAgfSxcbiAgXCJwcmludF90eXBlXCI6IHtcbiAgICB0eXBlOiBTdHJpbmcsXG4gICAgbGFiZWw6IFwiUHJpbnQgdHlwZVwiLFxuICAgIG9wdGlvbmFsOiBmYWxzZSxcbiAgICBhbGxvd2VkVmFsdWVzOiBbXCJmYWNlXCIsIFwidm9pY2VcIiwgXCJmaW5nZXJcIl0sXG4gICAgZGVmYXVsdFZhbHVlOiBcImZhY2VcIlxuICB9LFxuICBcInByaW50X2NvbGxlY3Rpb25cIjoge1xuICAgIHR5cGU6IFN0cmluZyxcbiAgICBsYWJlbDogXCJQcmludCBjb2xsZWN0aW9uXCIsXG4gICAgb3B0aW9uYWw6IGZhbHNlLFxuICAgIGRlZmF1bHRWYWx1ZTogXCJwZW9wbGVcIlxuICB9LFxuICBcInByaW50X2ltZ1wiOiB7XG4gICAgdHlwZTogU3RyaW5nLFxuICAgIGxhYmVsOiBcIlByaW50IGltZ1wiLFxuICAgIG9wdGlvbmFsOiB0cnVlLFxuICAgIGRlZmF1bHRWYWx1ZTogXCIvaW1nL2ZhY2UtaWQtMTAwLnBuZ1wiXG4gIH0sXG4gIFwicHJpbnRfZGV0YWlsc1wiOiB7XG4gICAgdHlwZTogT2JqZWN0LFxuICAgIGxhYmVsOiBcIlByaW50IGRldGFpbHNcIixcbiAgICBvcHRpb25hbDogdHJ1ZSxcbiAgICBibGFja2JveDogdHJ1ZVxuICB9LFxuICBcInByaW50X2FkZGVyXCI6IHtcbiAgICB0eXBlOiBTdHJpbmcsXG4gICAgbGFiZWw6IFwiVXNlciB3aG8gYWRkZWQgcHJpbnRcIixcbiAgICBvcHRpb25hbDogZmFsc2VcbiAgfSxcbiAgXCJjcmVhdGVkXCI6IHtcbiAgICB0eXBlOiBEYXRlLFxuICAgIGxhYmVsOiBcIkRhdGUgcHJpbnQgYWRkZWQgdG8gQW50ZW5uYWVcIixcbiAgICBhdXRvVmFsdWU6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCB0aGlzLmlzSW5zZXJ0ICkge1xuICAgICAgICByZXR1cm4gbmV3IERhdGU7XG4gICAgICB9IFxuICAgIH0sXG4gICAgb3B0aW9uYWw6IHRydWVcbiAgfSxcbiAgXCJ1cGRhdGVkXCI6IHtcbiAgICB0eXBlOiBEYXRlLFxuICAgIGxhYmVsOiBcIkRhdGUgcHJpbnQgdXBkYXRlZCBpbiBTeXN0ZW1cIixcbiAgICBhdXRvVmFsdWU6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCB0aGlzLmlzVXBkYXRlICkge1xuICAgICAgICByZXR1cm4gbmV3IERhdGU7XG4gICAgICB9IFxuICAgIH0sXG4gICAgb3B0aW9uYWw6IHRydWVcbiAgfVxufSk7XG5cblByaW50cy5hdHRhY2hTY2hlbWEoIFByaW50cy5TY2hlbWEgKTsgXG5cblxuUHJpbnRzLnB1YmxpY0ZpZWxkcyA9IHtcbiAgcHJpbnRfaWQ6IDEsXG4gIHByaW50X25hbWU6IDEsXG4gIHByaW50X3R5cGU6IDEsXG4gIHByaW50X2NvbGxlY3Rpb246IDEsXG4gIHByaW50X2ltZzogMSxcbiAgcHJpbnRfZGV0YWlsczogMSxcbiAgcHJpbnRfYWRkZXI6IDEsXG4gIGNyZWF0ZWQ6IDEsXG4gIHVwZGF0ZWQ6IDFcbn07XG5cbi8vIFByaW50cy5oZWxwZXJzKHtcbi8vICAgLy8gQSBjb2xsZWN0aW9ucyBpcyBjb25zaWRlcmVkIHRvIGJlIHByaXZhdGUgaWYgXCJwcml2YXRlXCIgaXMgc2V0IHRvIHRydWVcbi8vICAgaXNQcml2YXRlKCkge1xuLy8gICAgIHJldHVybiB0aGlzLnByaXZhdGU7XG4vLyAgIH1cbi8vIH0pOyIsImltcG9ydCB7IEREUFJhdGVMaW1pdGVyIH0gZnJvbSAnbWV0ZW9yL2RkcC1yYXRlLWxpbWl0ZXInO1xuXG5pbXBvcnQgeyBQcmludHMgfSBmcm9tICcuL3ByaW50cy5qcyc7XG5cblxuTWV0ZW9yLnB1Ymxpc2goJ3ByaW50cy5nZXQnLCBmdW5jdGlvbihjb2xsZWN0aW9uSWQpIHtcblx0Y29sbGVjdGlvbklkID0gY29sbGVjdGlvbklkIHx8IFwiXCI7XG5cdGNoZWNrKGNvbGxlY3Rpb25JZCxTdHJpbmcpO1xuXHRsZXQgc2VsZWN0b3IgPSB7XG5cdFx0Ly8gcHJpbnRfY29sbGVjdGlvbjogY29sbGVjdGlvbklkXG5cdH07XG4gIFx0Ly8gY29uc29sZS5sb2coQ29sbGVjdGlvbnMuZmluZChjb2xsZWN0aW9uSWQpLmNvdW50KCkpO1xuXHRyZXR1cm4gUHJpbnRzLmZpbmQoXG5cdFx0c2VsZWN0b3IsIFxuXHQgIHsgXG5cdCAgXHRzb3J0OiB7IGNyZWF0ZWQ6IC0xIH0gXG5cdH1cblx0LCB7XG5cdFx0ZmllbGRzOiBQcmludHMucHVibGljRmllbGRzXG5cdH0pO1xufSk7XG5cbi8vIERlZmluZSBhIHJ1bGUgdG8gbGltaXQgc3Vic2NyaXB0aW9uIGNhbGxzXG52YXIgc3Vic2NyaWJlVG9QcmludHNSdWxlID0ge1xuICB0eXBlOiAnc3Vic2NyaXB0aW9uJyxcbiAgbmFtZTogJ3ByaW50cy5nZXQnXG59XG4vLyBBZGQgdGhlIHJ1bGUsIGFsbG93aW5nIHVwIHRvIDEgc3Vic2NyaXB0aW9uIGV2ZXJ5IDUgc2Vjb25kcy5cbkREUFJhdGVMaW1pdGVyLmFkZFJ1bGUoc3Vic2NyaWJlVG9QcmludHNSdWxlLCAxLCA1MDAwKTsiLCJpbXBvcnQgeyBERFBSYXRlTGltaXRlciB9IGZyb20gJ21ldGVvci9kZHAtcmF0ZS1saW1pdGVyJztcbmltcG9ydCBBV1MgZnJvbSAnYXdzLXNkayc7XG5cbmltcG9ydCB7IENvbGxlY3Rpb25zIH0gZnJvbSAnLi4vY29sbGVjdGlvbnMvY29sbGVjdGlvbnMuanMnO1xuaW1wb3J0IHsgUHJpbnRzIH0gZnJvbSAnLi4vLi4vYXBpL3ByaW50cy9wcmludHMuanMnO1xuaW1wb3J0IHsgU2VhcmNoZXMgfSBmcm9tICcuL3NlYXJjaGVzLmpzJztcblxuQVdTLmNvbmZpZy5yZWdpb24gPSAndXMtZWFzdC0xJztcbnZhciByZWtvZ25pdGlvbiA9IG5ldyBBV1MuUmVrb2duaXRpb24oKTtcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXHRcInNlYXJjaC5mYWNlXCIocGljRGF0YSxtYXRjaFRocmVzaG9sZCl7XG5cdFx0Ly9yZXR1cm4gMTtcblx0XHQvLyBpZighTWV0ZW9yLnVzZXIpe1xuXHRcdC8vIFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignbm90LWxvZ2dlZC1pbicsJ211c3QgYmUgbG9nZ2VkLWluIHRvIHBlcmZvcm0gc2VhcmNoJyk7XG5cdFx0Ly8gXHRyZXR1cm4gZmFsc2U7XG5cdFx0Ly8gfVxuXHRcdGNoZWNrKG1hdGNoVGhyZXNob2xkLCBOdW1iZXIpO1xuXHRcdGNvbnNvbGUubG9nKFwiQU5BTFlaSU5HIElNQUdFLi4uXCIpO1xuXHRcdHZhciB0MCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXHRcdGxldCBpbWdCeXRlcyA9IG5ldyBCdWZmZXIuZnJvbShwaWNEYXRhLnNwbGl0KFwiLFwiKVsxXSwgXCJiYXNlNjRcIik7XG5cdFx0Ly8gbGV0IGNvbElkID0gTWV0ZW9yLnVzZXIoKS5wcm9maWxlLmNvbGxlY3Rpb25zO1xuXHRcdGxldCBjb2xJZHMgPSBDb2xsZWN0aW9ucy5maW5kKHtjb2xsZWN0aW9uX3R5cGU6ICdmYWNlJ30sIHtmaWVsZHM6IHtjb2xsZWN0aW9uX2lkOiAxfX0pLmZldGNoKCk7XG5cdFx0Y29uc29sZS5sb2coY29sSWRzKVxuXHRcdC8vIGxldCBtYXRjaFRocmVzaG9sZCA9IG1hdGNoVGhyZXNob2xkO1xuXHRcdGxldCBtb2RlcmF0aW9uUGFyYW1zID0ge1xuXHRcdFx0XCJJbWFnZVwiOiB7IFxuXHRcdFx0XHRcIkJ5dGVzXCI6IGltZ0J5dGVzLFxuXHRcdFx0fSxcblx0XHRcdFwiTWluQ29uZmlkZW5jZVwiOiA1MCxcblx0XHR9O1xuXHRcdGxldCBsYWJlbFBhcmFtcyA9IHtcblx0XHRcdFwiSW1hZ2VcIjogeyBcblx0XHRcdFx0XCJCeXRlc1wiOiBpbWdCeXRlcyxcblx0XHRcdH0sXG5cdFx0XHRcIk1heExhYmVsc1wiOiAyMCxcblx0XHRcdFwiTWluQ29uZmlkZW5jZVwiOiA3NSxcblx0XHR9O1xuXHRcdGxldCBmYWNlUGFyYW1zID0ge1xuXHRcdFx0XCJJbWFnZVwiOiB7IFxuXHRcdFx0XHRcIkJ5dGVzXCI6IGltZ0J5dGVzLFxuXHRcdFx0fSxcbiAgXHRcdFx0XCJBdHRyaWJ1dGVzXCI6IFtcIkFMTFwiXSxcblx0XHR9O1xuXHRcdGxldCBjZWxlYnJpdHlQYXJhbXMgPSB7XG5cdFx0XHRcIkltYWdlXCI6IHsgXG5cdFx0XHRcdFwiQnl0ZXNcIjogaW1nQnl0ZXMsXG5cdFx0XHR9LFxuXHRcdH07XG5cdFx0Ly8gY3JlYXRlIHJlcXVlc3Qgb2JqZWN0c1xuXHRcdGxldCBtb2RlcmF0aW9uUmVxdWVzdCA9IHJla29nbml0aW9uLmRldGVjdE1vZGVyYXRpb25MYWJlbHMobW9kZXJhdGlvblBhcmFtcyk7XG5cdFx0bGV0IGxhYmVsUmVxdWVzdCA9IHJla29nbml0aW9uLmRldGVjdExhYmVscyhsYWJlbFBhcmFtcyk7XG5cdFx0bGV0IGZhY2VSZXF1ZXN0ID0gcmVrb2duaXRpb24uZGV0ZWN0RmFjZXMoZmFjZVBhcmFtcyk7XG5cdFx0bGV0IGNlbGVicml0eVJlcXVlc3QgPSByZWtvZ25pdGlvbi5yZWNvZ25pemVDZWxlYnJpdGllcyhjZWxlYnJpdHlQYXJhbXMpO1xuXHRcdC8vIGNyZWF0ZSBwcm9taXNlc1xuXHRcdGxldCBhbGxQcm9taXNlcyA9IFtdO1xuXHRcdGFsbFByb21pc2VzLnB1c2gobW9kZXJhdGlvblJlcXVlc3QucHJvbWlzZSgpLmNhdGNoKGVycm9yID0+IHsgdGhyb3cgbmV3IE1ldGVvci5FcnJvcihlcnJvci5jb2RlLCBlcnJvci5tZXNzYWdlLCBlcnJvcik7IHJldHVybiBlcnJvcjsgfSkpO1xuXHRcdGFsbFByb21pc2VzLnB1c2gobGFiZWxSZXF1ZXN0LnByb21pc2UoKS5jYXRjaChlcnJvciA9PiB7IHRocm93IG5ldyBNZXRlb3IuRXJyb3IoZXJyb3IuY29kZSwgZXJyb3IubWVzc2FnZSwgZXJyb3IpOyByZXR1cm4gZXJyb3I7IH0pKTtcblx0XHRhbGxQcm9taXNlcy5wdXNoKGZhY2VSZXF1ZXN0LnByb21pc2UoKS5jYXRjaChlcnJvciA9PiB7IHRocm93IG5ldyBNZXRlb3IuRXJyb3IoZXJyb3IuY29kZSwgZXJyb3IubWVzc2FnZSwgZXJyb3IpOyByZXR1cm4gZXJyb3I7IH0pKTtcblx0XHRhbGxQcm9taXNlcy5wdXNoKGNlbGVicml0eVJlcXVlc3QucHJvbWlzZSgpLmNhdGNoKGVycm9yID0+IHsgdGhyb3cgbmV3IE1ldGVvci5FcnJvcihlcnJvci5jb2RlLCBlcnJvci5tZXNzYWdlLCBlcnJvcik7IHJldHVybiBlcnJvcjsgfSkpO1xuXHRcdF8uZWFjaChjb2xJZHMsIChjb2xJZCkgPT4ge1xuXHRcdFx0bGV0IHJla29nbml0aW9uUGFyYW1zID0ge1xuXHRcdFx0XHRcIkNvbGxlY3Rpb25JZFwiOiBjb2xJZC5jb2xsZWN0aW9uX2lkLFxuXHRcdFx0XHRcIkZhY2VNYXRjaFRocmVzaG9sZFwiOiBtYXRjaFRocmVzaG9sZCxcblx0XHRcdFx0XCJNYXhGYWNlc1wiOiAyLFxuXHRcdFx0XHRcIkltYWdlXCI6IHsgXG5cdFx0XHRcdFx0XCJCeXRlc1wiOiBpbWdCeXRlcyxcblx0XHRcdFx0fSxcblx0XHRcdH07XG5cdFx0XHRjb25zb2xlLmxvZyhyZWtvZ25pdGlvblBhcmFtcyk7XG5cdFx0XHRsZXQgcmVrb2duaXRpb25SZXF1ZXN0ID0gcmVrb2duaXRpb24uc2VhcmNoRmFjZXNCeUltYWdlKHJla29nbml0aW9uUGFyYW1zKTtcblx0XHRcdGFsbFByb21pc2VzLnB1c2gocmVrb2duaXRpb25SZXF1ZXN0LnByb21pc2UoKS5jYXRjaChlcnJvciA9PiB7IHRocm93IG5ldyBNZXRlb3IuRXJyb3IoZXJyb3IuY29kZSwgZXJyb3IubWVzc2FnZSwgZXJyb3IpOyByZXR1cm4gZXJyb3I7IH0pKTtcblx0XHRcdGNvbnNvbGUubG9nKGNvbElkLmNvbGxlY3Rpb25faWQpO1xuXHRcdH0pOy8vIHJla29nbml0aW9uUmVxdWVzdC5wcm9taXNlKCk7XG5cdFx0Ly8gRnVsZmlsbCBwcm9taXNlcyBpbiBwYXJhbGxlbFxuXHRcdGxldCByZXNwb25zZSA9IFByb21pc2UuYWxsKFxuXHRcdFx0YWxsUHJvbWlzZXNcblx0XHQpLnRoZW4odmFsdWVzID0+IHtcblx0XHRcdGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHZhbHVlcykpO1xuXHRcdFx0Y29uc29sZS5sb2codmFsdWVzWzBdKTtcblx0XHRcdGNvbnNvbGUubG9nKHZhbHVlc1sxXSk7XG5cdFx0XHRjb25zb2xlLmxvZyh2YWx1ZXNbMl0pO1xuXHRcdFx0Y29uc29sZS5sb2codmFsdWVzWzNdKTtcblx0XHRcdC8vY29uc29sZS5sb2codmFsdWVzWzRdKTtcblx0XHRcdGxldCBpID0gNDtcblx0XHRcdGxldCBwZXJzb25zID0gW107XG5cdFx0XHR3aGlsZSh2YWx1ZXNbaV0pe1xuXHRcdFx0XHRjb25zb2xlLmxvZyh2YWx1ZXNbaV0pO1xuXHRcdFx0XHRpZiAodmFsdWVzW2ldLkZhY2VNYXRjaGVzWzBdKXtcblx0XHRcdFx0XHRsZXQgdGFnID0ge1xuXHRcdFx0XHRcdFx0Y29sbGVjdGlvbjogUHJpbnRzLmZpbmRPbmUoe3ByaW50X2lkOiB2YWx1ZXNbaV0uRmFjZU1hdGNoZXNbMF0uRmFjZS5GYWNlSWR9LCB7ZmllbGRzOiB7cHJpbnRfY29sbGVjdGlvbjogMX19KSxcblx0XHRcdFx0XHRcdGltYWdlX2lkOiB2YWx1ZXNbaV0uRmFjZU1hdGNoZXNbMF0uRmFjZS5FeHRlcm5hbEltYWdlSWQsXG5cdFx0XHRcdFx0XHRmYWNlX2lkOiB2YWx1ZXNbaV0uRmFjZU1hdGNoZXNbMF0uRmFjZS5GYWNlSWQsXG5cdFx0XHRcdFx0XHRzaW1pbGFyaXR5OiB2YWx1ZXNbaV0uRmFjZU1hdGNoZXNbMF0uU2ltaWxhcml0eSxcblx0XHRcdFx0XHR9O1xuXHRcdFx0XHRcdHBlcnNvbnMucHVzaCh0YWcpO1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKHRhZyk7XG5cdFx0XHRcdH07XG5cdFx0XHRcdGkrKztcblx0XHRcdH07XG5cdFx0XHRsZXQgdDEgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcblx0XHRcdGNvbnNvbGUubG9nKGBSZXNwb25zZSB0b29rICR7dDEgLSB0MH0gbXNgKTtcblx0XHRcdGxldCBzZWFyY2hfcmVzdWx0cyA9IHtcblx0XHRcdFx0XHRtb2RlcmF0aW9uOiB2YWx1ZXNbMF0uTW9kZXJhdGlvbkxhYmVscyxcblx0XHRcdFx0XHRsYWJlbHM6IHZhbHVlc1sxXS5MYWJlbHMsXG5cdFx0XHRcdFx0ZmFjZURldGFpbHM6IHZhbHVlc1syXS5GYWNlRGV0YWlscyxcblx0XHRcdFx0XHRjZWxlYnJpdHk6IHZhbHVlc1szXS5DZWxlYnJpdHlGYWNlcyxcblx0XHRcdFx0XHRwZXJzb25zOiBwZXJzb25zLCAvLy5GYWNlTWF0Y2hlc1swXSxcblx0XHRcdH07XG5cdFx0XHRsZXQgc2VhcmNoID0ge1xuXHRcdFx0XHRcdC8vIHNlYXJjaF9pbWFnZTogcGljRGF0YSxcblx0XHRcdFx0XHRzZWFyY2hfcmVzdWx0czogc2VhcmNoX3Jlc3VsdHNcblx0XHRcdH07XG5cdFx0XHRsZXQgc2F2ZVNlYXJjaCA9IFNlYXJjaGVzLmluc2VydChzZWFyY2gpO1xuXHRcdFx0Y29uc29sZS5sb2coc2F2ZVNlYXJjaCk7XG5cdFx0XHRyZXR1cm4gc2VhcmNoX3Jlc3VsdHM7XG5cdFx0fSkuY2F0Y2goZXJyb3IgPT4ge1xuXHRcdFx0Y29uc29sZS5sb2coJ2NhdWdodCBlcnJvciEnKTtcblx0XHRcdGNvbnNvbGUubG9nKGVycm9yKTtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoZXJyb3IuZXJyb3IsIGVycm9yLnJlYXNvbiwgZXJyb3IuZGV0YWlscyk7XG5cdFx0fSkuZmluYWxseSgoKSA9PiB7XG5cdFx0XHRjb25zb2xlLmxvZygnZmluYWxseScpO1xuXHRcdFx0Y29uc29sZS5sb2codGhpcyk7XG5cdFx0fSk7XG5cdFx0Y29uc29sZS5sb2cocmVzcG9uc2UpO1xuXHRcdGxldCB0MSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXHRcdGNvbnNvbGUubG9nKGBSZXF1ZXN0IHRvb2sgJHt0MSAtIHQwfSBtc2ApO1xuXHRcdHJldHVybiByZXNwb25zZTtcblx0fSxcblxuXHRcInNlYXJjaC5kZWxldGVcIihzZWFyY2hJZCl7XG5cdFx0Y2hlY2soc2VhcmNoSWQsU3RyaW5nKTtcblx0XHRpZihzZWFyY2hJZCl7XG5cdFx0XHRsZXQgc2VhcmNoID0gU2VhcmNoZXMucmVtb3ZlKHNlYXJjaElkKTtcblx0XHRcdGNvbnNvbGUubG9nKGBkZWxldGVkIHNlYXJjaDogJHtzZWFyY2hJZH1gKTtcblx0XHRcdHJldHVybiBgZGVsZXRlZCBzZWFyY2g6ICR7c2VhcmNoSWR9YDtcblx0XHR9O1xuXHR9XG59KVxuXG4vLyBEZWZpbmUgYSBydWxlIHRvIGxpbWl0IG1ldGhvZCBjYWxsc1xubGV0IHJ1blNjYW5SdWxlID0ge1xuXHR0eXBlOiAnbWV0aG9kJyxcblx0bmFtZTogJ21vbWVudC5zY2FuJ1xufTtcbi8vIEFkZCB0aGUgcnVsZSwgYWxsb3dpbmcgdXAgdG8gMSBzY2FuIGV2ZXJ5IDEwIHNlY29uZHNcbkREUFJhdGVMaW1pdGVyLmFkZFJ1bGUocnVuU2NhblJ1bGUsIDEsIDEwMDAwKTsiLCJpbXBvcnQgeyBERFBSYXRlTGltaXRlciB9IGZyb20gJ21ldGVvci9kZHAtcmF0ZS1saW1pdGVyJztcblxuaW1wb3J0IHsgU2VhcmNoZXMgfSBmcm9tICcuL3NlYXJjaGVzLmpzJztcblxuXG5NZXRlb3IucHVibGlzaCgnc2VhcmNoZXMuZ2V0JywgZnVuY3Rpb24oc2VhcmNoSWQ9JycpIHtcblx0Y2hlY2soc2VhcmNoSWQsU3RyaW5nKTtcblx0c2VhcmNoSWQgPSBzZWFyY2hJZCB8fCB7fTtcbiAgXHQvLyBjb25zb2xlLmxvZyhTZWFyY2hlcy5maW5kKHNlYXJjaElkKS5jb3VudCgpKTtcblx0cmV0dXJuIFNlYXJjaGVzLmZpbmQoXG5cdFx0c2VhcmNoSWQsIFxuXHQgIHsgXG5cdCAgXHRzb3J0OiB7IGNyZWF0ZWQ6IC0xIH0gXG5cdH1cblx0LCB7XG5cdFx0ZmllbGRzOiBTZWFyY2hlcy5wdWJsaWNGaWVsZHNcblx0fSk7XG59KTtcblxuLy8gRGVmaW5lIGEgcnVsZSB0byBsaW1pdCBzdWJzY3JpcHRpb24gY2FsbHNcbnZhciBzdWJzY3JpYmVUb1NlYXJjaGVzUnVsZSA9IHtcbiAgdHlwZTogJ3N1YnNjcmlwdGlvbicsXG4gIG5hbWU6ICdzZWFyY2hlcy5nZXQnXG59XG4vLyBBZGQgdGhlIHJ1bGUsIGFsbG93aW5nIHVwIHRvIDEgc3Vic2NyaXB0aW9uIGV2ZXJ5IDUgc2Vjb25kcy5cbkREUFJhdGVMaW1pdGVyLmFkZFJ1bGUoc3Vic2NyaWJlVG9TZWFyY2hlc1J1bGUsIDEsIDUwMDApOyIsImltcG9ydCB7IE1vbmdvIH0gZnJvbSAnbWV0ZW9yL21vbmdvJztcbmltcG9ydCB7IFNpbXBsZVNjaGVtYSB9IGZyb20gJ21ldGVvci9hbGRlZWQ6c2ltcGxlLXNjaGVtYSc7XG5cblxuXG5leHBvcnQgY29uc3QgU2VhcmNoZXMgPSBuZXcgTWV0ZW9yLkNvbGxlY3Rpb24oJ3NlYXJjaGVzJyk7XG5cbi8vIERlbnkgYWxsIGNsaWVudC1zaWRlIHVwZGF0ZXMgc2luY2Ugd2Ugd2lsbCBiZSB1c2luZyBtZXRob2RzIHRvIG1hbmFnZSB0aGlzIGNvbGxlY3Rpb25cblNlYXJjaGVzLmRlbnkoe1xuICBpbnNlcnQoKSB7IHJldHVybiB0cnVlOyB9LFxuICB1cGRhdGUoKSB7IHJldHVybiB0cnVlOyB9LFxuICByZW1vdmUoKSB7IHJldHVybiB0cnVlOyB9LFxufSk7XG5cblNlYXJjaGVzLlNjaGVtYSA9IG5ldyBTaW1wbGVTY2hlbWEoe1xuICAvLyBzY2hlbWEgcnVsZXNcbiAgXCJzZWFyY2hfdHlwZVwiOiB7XG4gICAgdHlwZTogW1N0cmluZ10sXG4gICAgbGFiZWw6IFwiU2VhcmNoIHR5cGVzXCIsXG4gICAgb3B0aW9uYWw6IGZhbHNlLFxuICAgIGFsbG93ZWRWYWx1ZXM6IFtcIm1vZGVyYXRpb25cIiwgXCJsYWJlbFwiLCBcImZhY2VcIiwgXCJjb2xsZWN0aW9uXCJdLFxuICAgIGRlZmF1bHRWYWx1ZTogW1wibW9kZXJhdGlvblwiLCBcImxhYmVsXCIsIFwiZmFjZVwiXVxuICB9LFxuICBcInNlYXJjaF9jb2xsZWN0aW9uc1wiOiB7XG4gICAgdHlwZTogW1N0cmluZ10sXG4gICAgbGFiZWw6IFwiQ29sbGVjdGlvbnMgdG8gc2VhcmNoXCIsXG4gICAgb3B0aW9uYWw6IHRydWUsXG4gICAgZGVmYXVsdFZhbHVlOiBbXCJcIl1cbiAgfSxcbiAgXCJzZWFyY2hfaW1hZ2VcIjoge1xuICAgIHR5cGU6IFN0cmluZyxcbiAgICBsYWJlbDogXCJJbWFnZSB0byBzZWFyY2hcIixcbiAgICBvcHRpb25hbDogdHJ1ZSxcbiAgICBkZWZhdWx0VmFsdWU6IFwiL2ltZy9mYWNlLWlkLTEwMC5wbmdcIlxuICB9LFxuICBcInNlYXJjaF9yZXN1bHRzXCI6IHtcbiAgICB0eXBlOiBPYmplY3QsXG4gICAgbGFiZWw6IFwiT2JqZWN0IG9mIHNlYXJjaCB0eXBlc1wiLFxuICAgIG9wdGlvbmFsOiB0cnVlLFxuICAgIGJsYWNrYm94OiB0cnVlLFxuICAgIGRlZmF1bHRWYWx1ZToge31cbiAgfSxcbiAgXCJmYWNlc1wiOiB7XG4gICAgdHlwZTogW09iamVjdF0sXG4gICAgbGFiZWw6IFwiRmFjZSBvYmplY3RzIGZvdW5kIGluIGltYWdlXCIsXG4gICAgb3B0aW9uYWw6IHRydWUsXG4gICAgYmxhY2tib3g6IHRydWUsXG4gICAgZGVmYXVsdFZhbHVlOiBbXVxuICB9LFxuICBcImNyZWF0ZWRcIjoge1xuICAgIHR5cGU6IERhdGUsXG4gICAgbGFiZWw6IFwiRGF0ZSBzZWFyY2ggcGVyZm9ybWVkXCIsXG4gICAgYXV0b1ZhbHVlOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICggdGhpcy5pc0luc2VydCApIHtcbiAgICAgICAgcmV0dXJuIG5ldyBEYXRlO1xuICAgICAgfSBcbiAgICB9LFxuICAgIG9wdGlvbmFsOiB0cnVlLFxuICAgIC8vaW5kZXg6IHRydWVcbiAgfSxcbiAgXCJ1cGRhdGVkXCI6IHtcbiAgICB0eXBlOiBEYXRlLFxuICAgIGxhYmVsOiBcIkRhdGUgc2VhcmNoIHVwZGF0ZWRcIixcbiAgICBhdXRvVmFsdWU6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCB0aGlzLmlzVXBkYXRlICkge1xuICAgICAgICByZXR1cm4gbmV3IERhdGU7XG4gICAgICB9IFxuICAgIH0sXG4gICAgb3B0aW9uYWw6IHRydWVcbiAgfVxufSk7XG5cblNlYXJjaGVzLmF0dGFjaFNjaGVtYSggU2VhcmNoZXMuU2NoZW1hICk7XG5cbmlmKE1ldGVvci5pc1NlcnZlcil7XG4gIE1ldGVvci5zdGFydHVwKCgpID0+IHtcbiAgICBTZWFyY2hlcy5fZW5zdXJlSW5kZXgoe1xuICAgICAgICBjcmVhdGVkOiAtMSxcbiAgICB9KTtcbiAgICAvLyBTZWFyY2hlcy5fZW5zdXJlSW5kZXgoeyBzZWFyY2hfaW1hZ2U6IDF9KTtcbiAgfSk7XG59XG5cblNlYXJjaGVzLnB1YmxpY0ZpZWxkcyA9IHtcbiAgc2VhcmNoX2lkOiAxLFxuICBzZWFyY2hfdHlwZTogMSxcbiAgc2VhcmNoX2NvbGxlY3Rpb25zOiAxLFxuICBzZWFyY2hfaW1hZ2U6IDEsXG4gIHNlYXJjaF9yZXN1bHRzOiAxLFxuICBjcmVhdGVkOiAxLFxuICB1cGRhdGVkOiAxXG59O1xuXG4vLyBTZWFyY2hlcy5oZWxwZXJzKHtcbi8vICAgLy8gQSBjb2xsZWN0aW9ucyBpcyBjb25zaWRlcmVkIHRvIGJlIHByaXZhdGUgaWYgXCJwcml2YXRlXCIgaXMgc2V0IHRvIHRydWVcbi8vICAgaXNQcml2YXRlKCkge1xuLy8gICAgIHJldHVybiB0aGlzLnByaXZhdGU7XG4vLyAgIH1cbi8vIH0pOyIsImltcG9ydCB7IE1ldGVvciB9IGZyb20gJ21ldGVvci9tZXRlb3InO1xuaW1wb3J0IHsgQ29sbGVjdGlvbnMgfSBmcm9tICcuLi8uLi9hcGkvY29sbGVjdGlvbnMvY29sbGVjdGlvbnMuanMnO1xuaW1wb3J0IHsgUHJpbnRzIH0gZnJvbSAnLi4vLi4vYXBpL3ByaW50cy9wcmludHMuanMnO1xuaW1wb3J0IHsgU2VhcmNoZXMgfSBmcm9tICcuLi8uLi9hcGkvc2VhcmNoZXMvc2VhcmNoZXMuanMnO1xuaW1wb3J0IEFXUyBmcm9tICdhd3Mtc2RrJztcblxuQVdTLmNvbmZpZy5yZWdpb24gPSAndXMtZWFzdC0xJztcbnZhciByZWtvZ25pdGlvbiA9IG5ldyBBV1MuUmVrb2duaXRpb24oKTtcblxuLy8gaWYgdGhlIGRhdGFiYXNlIGlzIGVtcHR5IG9uIHNlcnZlciBzdGFydCwgY3JlYXRlIHNvbWUgc2FtcGxlIGRhdGEuXG5cbk1ldGVvci5zdGFydHVwKCgpID0+IHtcblxuICBjb25zb2xlLmxvZyhcImdldHRpbmcgYXdzIGNvbGxlY3Rpb25zLi4uXCIpO1xuICBsZXQgY29sUGFyYW1zPSB7fTtcbiAgbGV0IGNvbFJlcXVlc3QgPSByZWtvZ25pdGlvbi5saXN0Q29sbGVjdGlvbnMoY29sUGFyYW1zKTtcbiAgbGV0IHByb21pc2UgPSBjb2xSZXF1ZXN0LnByb21pc2UoKTtcbiAgbGV0IGNvbHMgPSBwcm9taXNlLnRoZW4ocmVzdWx0ID0+IHtcbiAgICBjb25zb2xlLmxvZyhyZXN1bHQpO1xuICAgIGlmKHJlc3VsdCAmJiByZXN1bHQuQ29sbGVjdGlvbklkcy5sZW5ndGggPiAwKXtcbiAgICAgIF8uZWFjaChyZXN1bHQuQ29sbGVjdGlvbklkcywgZnVuY3Rpb24oY29sSWQpe1xuICAgICAgICBsZXQgYXdzQ29sID0ge1xuICAgICAgICAgIGNvbGxlY3Rpb25faWQ6IGNvbElkLFxuICAgICAgICAgIGNvbGxlY3Rpb25fbmFtZTogY29sSWQsXG4gICAgICAgICAgY29sbGVjdGlvbl90eXBlOiBcImZhY2VcIixcbiAgICAgICAgICBwcml2YXRlOiB0cnVlXG4gICAgICAgIH07XG4gICAgICAgIGxldCBleGlzdGluZ0NvbCA9IENvbGxlY3Rpb25zLnVwc2VydCh7Y29sbGVjdGlvbl9pZDogY29sSWR9LCB7JHNldDogYXdzQ29sfSk7XG4gICAgICAgIGNvbnNvbGUubG9nKGB1cHNlcnRlZCBjb2xsZWN0aW9uOiAke0pTT04uc3RyaW5naWZ5KGV4aXN0aW5nQ29sKX1gKTtcbiAgICAgICAgLy8gTm93IHRyeSBnZXR0aW5nIGV4aXN0aW5nIGZhY2VzIGZvciBlYWNoIGNvbGxlY3Rpb25cbiAgICAgICAgbGV0IGZhY2VQYXJhbXMgPSB7XG4gICAgICAgICAgQ29sbGVjdGlvbklkOiBjb2xJZFxuICAgICAgICB9O1xuICAgICAgICBsZXQgZmFjZVJlcXVlc3QgPSByZWtvZ25pdGlvbi5saXN0RmFjZXMoZmFjZVBhcmFtcyk7XG4gICAgICAgIGxldCBwcm9taXNlID0gZmFjZVJlcXVlc3QucHJvbWlzZSgpO1xuICAgICAgICBsZXQgZmFjZXMgPSBwcm9taXNlLnRoZW4ocmVzdWx0ID0+IHtcbiAgICAgICAgICBpZihyZXN1bHQgJiYgcmVzdWx0LkZhY2VzLmxlbmd0aCA+IDApe1xuICAgICAgICAgICAgY29uc29sZS5sb2coYGNvbGxlY3Rpb24gaGFzICR7cmVzdWx0LkZhY2VzLmxlbmd0aH0gZmFjZXNgKTtcbiAgICAgICAgICAgIF8uZWFjaChyZXN1bHQuRmFjZXMsIGZ1bmN0aW9uKGZhY2Upe1xuICAgICAgICAgICAgICBsZXQgYXdzRmFjZSA9IHtcbiAgICAgICAgICAgICAgICBwcmludF9pZDogZmFjZS5GYWNlSWQsXG4gICAgICAgICAgICAgICAgcHJpbnRfbmFtZTogZmFjZS5FeHRlcm5hbEltYWdlSWQgfHwgZmFjZS5JbWFnZUlkLFxuICAgICAgICAgICAgICAgIHByaW50X3R5cGU6IFwiZmFjZVwiLFxuICAgICAgICAgICAgICAgIHByaW50X2NvbGxlY3Rpb246IGNvbElkLFxuICAgICAgICAgICAgICAgIHByaW50X2RldGFpbHM6IGZhY2UsXG4gICAgICAgICAgICAgICAgcHJpbnRfYWRkZXI6IFwicm9vdFwiXG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgIFByaW50cy5zaW1wbGVTY2hlbWEoKS5jbGVhbihhd3NGYWNlKTtcbiAgICAgICAgICAgICAgbGV0IGV4aXN0aW5nRmFjZSA9IFByaW50cy51cHNlcnQoe3ByaW50X2lkOiBmYWNlLkZhY2VJZH0sIHskc2V0OiBhd3NGYWNlfSk7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKGV4aXN0aW5nRmFjZSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSk7XG5cbiAgaWYgKFByaW50cy5maW5kKCkuY291bnQoKSA8IDE1KSB7XG4gICAgY29uc29sZS5sb2coXCJzZWVkaW5nIHByaW50cy4uLlwiKTtcbiAgICBsZXQgc2VlZFByaW50cyA9IFtdXG4gICAgXy50aW1lcyg1LCAoKT0+e1xuICAgICAgbGV0IHByaW50ID0ge1xuICAgICAgICBwcmludF9hZGRlcjogdGhpcy51c2VySWQgfHwgXCJkZWRlZFwiLFxuICAgICAgICBwcmludF9jb2xsZWN0aW9uOiBcInBlb3BsZVwiLFxuICAgICAgICBwcmludF9uYW1lOiBmYWtlci5oZWxwZXJzLnVzZXJDYXJkKCkubmFtZSxcbiAgICAgICAgcHJpbnRfaWQ6IGZha2VyLnJhbmRvbS51dWlkKCksXG4gICAgICAgIHByaW50X2ltZzogZmFrZXIuaW1hZ2UuYXZhdGFyKClcbiAgICAgIH07XG4gICAgICBsZXQgcHJpbnRJZCA9IFByaW50cy5pbnNlcnQocHJpbnQpO1xuICAgICAgc2VlZFByaW50cy5wdXNoKHByaW50SWQpO1xuICAgIH0pO1xuICAgIGNvbnNvbGUubG9nKHNlZWRQcmludHMpO1xuXG4gIH07XG59KTsiLCIvKlxuICogQ29weXJpZ2h0IDIwMTctcHJlc2VudCBBbnRtb3VuZHMuY29tLCBJbmMuIG9yIGl0cyBhZmZpbGlhdGVzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBHTlUgQWZmZXJvIEdlbmVyYWwgUHVibGljIExpY2Vuc2UsIHZlcnNpb24gMy4wICh0aGUgXCJMaWNlbnNlXCIpLiBZb3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGhcbiAqIHRoZSBMaWNlbnNlLiBBIGNvcHkgb2YgdGhlIExpY2Vuc2UgaXMgbG9jYXRlZCBhdFxuICpcbiAqICAgICBodHRwczovL3d3dy5nbnUub3JnL2xpY2Vuc2VzL2FncGwtMy4wLmVuLmh0bWxcbiAqXG4gKiBvciBpbiB0aGUgXCJsaWNlbnNlXCIgZmlsZSBhY2NvbXBhbnlpbmcgdGhpcyBmaWxlLiBUaGlzIGZpbGUgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1JcbiAqIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9uc1xuICogYW5kIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5pbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCB7IEhUVFAgfSBmcm9tICdtZXRlb3IvaHR0cCc7XG5pbXBvcnQgJy4uL2FjY291bnRzLWNvbmZpZy5qcyc7XG5pbXBvcnQgJy4vZml4dHVyZXMuanMnO1xuLy8gVGhpcyBkZWZpbmVzIGFsbCB0aGUgY29sbGVjdGlvbnMsIHB1YmxpY2F0aW9ucyBhbmQgbWV0aG9kcyB0aGF0IHRoZSBhcHBsaWNhdGlvbiBwcm92aWRlc1xuLy8gYXMgYW4gQVBJIHRvIHRoZSBjbGllbnQuXG5pbXBvcnQgJy4vcmVnaXN0ZXItYXBpLmpzJztcblxuY29uc3Qgb3MgPSByZXF1aXJlKCdvcycpO1xuXG5cbnNlcnZlcl9tb2RlID0gTWV0ZW9yLmlzUHJvZHVjdGlvbiA/IFwiUFJPRFVDVElPTlwiIDogXCJERVZFTE9QTUVOVFwiO1xuY29uc29sZS5sb2coJ2luZGV4LmpzOiAnICsgc2VydmVyX21vZGUgKyBcIi0tPlwiICsgSlNPTi5zdHJpbmdpZnkoTWV0ZW9yLnNldHRpbmdzKSk7XG5cbk1ldGVvci5tZXRob2RzKHtcblxuXHRpbmZvKCl7XG5cdFx0cmV0dXJuIGB2ZXJzaW9uOiAwLjkuMCAtIGJ1aWxkOiAke3Byb2Nlc3MuZW52LkJVSUxEIHx8ICdkZXYnfSAtIGhvc3RuYW1lOiAke29zLmhvc3RuYW1lKCl9YDtcblx0fSxcblxuXHRhc3luYyBnZXREYXRhKCl7ICAgIFxuXHRcdHRyeXtcblx0XHRcdHZhciByZXNwb25zZSA9IHt9O1xuXHRcdFx0Y29uc3QgcmVzdWx0cyA9IGF3YWl0IEhUVFAuY2FsbCgnR0VUJywgJ2h0dHA6Ly9qc29ucGxhY2Vob2xkZXIudHlwaWNvZGUuY29tL3Bvc3RzJyk7XHRcblx0XHRcdGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHJlc3VsdHMuZGF0YVswXSkpO1x0XG5cdFx0XHRjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShyZXN1bHRzLmhlYWRlcnMpKTtcblx0XHRcdHJlc3BvbnNlLmNvZGUgPSB0cnVlO1x0XHRcblx0XHRcdHJlc3BvbnNlLmRhdGEgPSByZXN1bHRzO1x0XG5cdFx0fSBjYXRjaChlKXtcblx0XHRcdHJlc3BvbnNlID0gZmFsc2U7XG5cdFx0XHRjb25zb2xlLmxvZyhlKTtcblx0XHR9IGZpbmFsbHkge1xuXHRcdFx0Y29uc29sZS5sb2coXCJmaW5hbGx5Li4uXCIpXG5cdFx0XHQvL3Rocm93IG5ldyBNZXRlb3IuRXJyb3IoXCJpbmFwcHJvcHJpYXRlLXBpY1wiLFwiVGhlIHVzZXIgaGFzIHRha2VuIGFuIGluYXBwcm9wcmlhdGUgcGljdHVyZS5cIik7XHRcblx0XHRcdHJldHVybiByZXNwb25zZTtcblx0XHR9XG5cdH1cblxufSk7XG5cbk1ldGVvci5vbkNvbm5lY3Rpb24oKGNvbm5lY3Rpb24pPT57XG5cdGxldCBjbGllbnRBZGRyID0gY29ubmVjdGlvbi5jbGllbnRBZGRyZXNzO1xuXHRsZXQgaGVhZGVycyA9IGNvbm5lY3Rpb24uaHR0cEhlYWRlcnM7XG5cdGNvbnNvbGUubG9nKGBjb25uZWN0aW9uIGZyb20gJHtjbGllbnRBZGRyfWApO1xuXHQvLyBjb25zb2xlLmxvZyhoZWFkZXJzKTtcbn0pIiwiaW1wb3J0ICcuLi8uLi9hcGkvY29sbGVjdGlvbnMvbWV0aG9kcy5qcyc7XG5pbXBvcnQgJy4uLy4uL2FwaS9jb2xsZWN0aW9ucy9wdWJsaWNhdGlvbnMuanMnO1xuaW1wb3J0ICcuLi8uLi9hcGkvc2VhcmNoZXMvbWV0aG9kcy5qcyc7XG5pbXBvcnQgJy4uLy4uL2FwaS9zZWFyY2hlcy9wdWJsaWNhdGlvbnMuanMnO1xuaW1wb3J0ICcuLi8uLi9hcGkvcHJpbnRzL21ldGhvZHMuanMnO1xuaW1wb3J0ICcuLi8uLi9hcGkvcHJpbnRzL3B1YmxpY2F0aW9ucy5qcyc7IiwiaW1wb3J0IHsgQWNjb3VudHMgfSBmcm9tICdtZXRlb3IvYWNjb3VudHMtYmFzZSc7XG5pbXBvcnQgeyBBY2NvdW50c0NvbW1vbiB9IGZyb20gJ21ldGVvci9hY2NvdW50cy1iYXNlJ1xuaW1wb3J0IHsgQWNjb3VudHNDbGllbnQgfSBmcm9tICdtZXRlb3IvYWNjb3VudHMtYmFzZSdcblxuXG5pZiAoTWV0ZW9yLmlzQ2xpZW50KSB7XG5cdEFjY291bnRzLnVpLmNvbmZpZyh7XG5cdCAgcGFzc3dvcmRTaWdudXBGaWVsZHM6ICdVU0VSTkFNRV9BTkRfRU1BSUwnLFxuXHR9KTtcbn1cblxuaWYgKE1ldGVvci5pc1NlcnZlcikge1xuXHRjb25zb2xlLmxvZyhcImFjY291bnRzIGNvbmZpZyBsb2FkZWQhXCIpO1xuXHRBY2NvdW50cy5vbkNyZWF0ZVVzZXIoKG9wdGlvbnMsIHVzZXIpID0+IHtcblx0XHQvLyB1c2VyLmNyZWF0ZWQgPSBuZXcgRGF0ZSgpO1xuXG5cdFx0Y29uc29sZS5sb2coXCJ1c2VyOiBcIiArIHVzZXIpO1xuXHRcdGNvbnNvbGUubG9nKFwib3B0aW9uczogXCIgKyBvcHRpb25zKTtcblx0XHQvLyB1c2VyID0gSlNPTi5zdHJpbmdpZnkodXNlcik7XG5cdFx0Y29uc29sZS5sb2codXNlcik7XG5cdFx0Ly8gb3B0aW9ucyA9IEpTT04uc3RyaW5naWZ5KG9wdGlvbnMpO1xuXHRcdGNvbnNvbGUubG9nKG9wdGlvbnMpO1xuXG5cdCAgICAvLyBEb24ndCBmb3JnZXQgdG8gcmV0dXJuIHRoZSBuZXcgdXNlciBvYmplY3QgYXQgdGhlIGVuZCFcblx0XHRyZXR1cm4gdXNlcjtcblx0fSk7XG59IiwiLypcbiAqIENvcHlyaWdodCAyMDE3LXByZXNlbnQgQW50bW91bmRzLmNvbSwgSW5jLiBvciBpdHMgYWZmaWxpYXRlcy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgR05VIEFmZmVybyBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlLCB2ZXJzaW9uIDMuMCAodGhlIFwiTGljZW5zZVwiKS4gWW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoXG4gKiB0aGUgTGljZW5zZS4gQSBjb3B5IG9mIHRoZSBMaWNlbnNlIGlzIGxvY2F0ZWQgYXRcbiAqXG4gKiAgICAgaHR0cHM6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy9hZ3BsLTMuMC5lbi5odG1sXG4gKlxuICogb3IgaW4gdGhlIFwibGljZW5zZVwiIGZpbGUgYWNjb21wYW55aW5nIHRoaXMgZmlsZS4gVGhpcyBmaWxlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SXG4gKiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnNcbiAqIGFuZCBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuaW1wb3J0ICcuLi9pbXBvcnRzL3N0YXJ0dXAvc2VydmVyJztcblxuTWV0ZW9yLnN0YXJ0dXAoKCkgPT4ge1xuICAvLyBjb2RlIHRvIHJ1biBvbiBzZXJ2ZXIgYXQgc3RhcnR1cFxufSk7XG4iXX0=
