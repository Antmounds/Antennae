var require = meteorInstall({"imports":{"api":{"collections":{"collections.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// imports/api/collections/collections.js                                                                      //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"methods.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// imports/api/collections/methods.js                                                                          //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publications.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// imports/api/collections/publications.js                                                                     //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"prints":{"methods.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// imports/api/prints/methods.js                                                                               //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
    newPrint.print_name = newPrint.name;
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
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"prints.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// imports/api/prints/prints.js                                                                                //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publications.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// imports/api/prints/publications.js                                                                          //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"searches":{"methods.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// imports/api/searches/methods.js                                                                             //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
let Searches;
module.watch(require("./searches.js"), {
  Searches(v) {
    Searches = v;
  }

}, 2);
AWS.config.region = 'us-east-1';
var rekognition = new AWS.Rekognition();
Meteor.methods({
  "search.face"(picData) {
    //return 1;
    console.log("ANALYZING IMAGE...");
    var t0 = new Date().getTime();
    let imgBytes = new Buffer.from(picData.split(",")[1], "base64");
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
    let rekognitionParams = {
      "CollectionId": "AntPay",
      "FaceMatchThreshold": 98,
      "MaxFaces": 5,
      "Image": {
        "Bytes": imgBytes
      }
    }; // create request objects

    let moderationRequest = rekognition.detectModerationLabels(moderationParams);
    let labelRequest = rekognition.detectLabels(labelParams);
    let faceRequest = rekognition.detectFaces(faceParams);
    let rekognitionRequest = rekognition.searchFacesByImage(rekognitionParams); // create promises

    let promise1 = moderationRequest.promise();
    let promise2 = labelRequest.promise();
    let promise3 = faceRequest.promise();
    let promise4 = rekognitionRequest.promise(); // Fulfill promises in parallel

    let response = Promise.all([promise1.catch(error => {
      throw new Meteor.Error(error.code, error.message, error);
      return error;
    }), promise2.catch(error => {
      throw new Meteor.Error(error.code, error.message, error);
      return error;
    }), promise3.catch(error => {
      throw new Meteor.Error(error.code, error.message, error);
      return error;
    }), promise4.catch(error => {
      throw new Meteor.Error(error.code, error.message, error);
      return error;
    })]).then(values => {
      console.log(values[0]);
      console.log(values[1]);
      console.log(values[2]);
      console.log(values[3]);
      let t1 = new Date().getTime();
      console.log(`Response took ${t1 - t0} ms`);
      let search_results = {
        moderation: values[0].ModerationLabels,
        labels: values[1].Labels,
        faceDetails: values[2].FaceDetails,
        person: values[3].FaceMatches[0]
      };
      let search = {
        // search_image: picData,
        search_results: search_results
      };
      let saveSearch = Searches.insert(search);
      console.log(saveSearch);
      return values;
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
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publications.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// imports/api/searches/publications.js                                                                        //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"searches.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// imports/api/searches/searches.js                                                                            //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"startup":{"server":{"fixtures.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// imports/startup/server/fixtures.js                                                                          //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// imports/startup/server/index.js                                                                             //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"register-api.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// imports/startup/server/register-api.js                                                                      //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
module.watch(require("../../api/collections/methods.js"));
module.watch(require("../../api/collections/publications.js"));
module.watch(require("../../api/searches/methods.js"));
module.watch(require("../../api/searches/publications.js"));
module.watch(require("../../api/prints/methods.js"));
module.watch(require("../../api/prints/publications.js"));
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}},"server":{"main.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// server/main.js                                                                                              //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
module.watch(require("../imports/startup/server"));
Meteor.startup(() => {// code to run on server at startup
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/server/main.js");
//# sourceURL=meteor://💻app/app/app.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvY29sbGVjdGlvbnMvY29sbGVjdGlvbnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL2NvbGxlY3Rpb25zL21ldGhvZHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL2NvbGxlY3Rpb25zL3B1YmxpY2F0aW9ucy5qcyIsIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvcHJpbnRzL21ldGhvZHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL3ByaW50cy9wcmludHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL3ByaW50cy9wdWJsaWNhdGlvbnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL3NlYXJjaGVzL21ldGhvZHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL3NlYXJjaGVzL3B1YmxpY2F0aW9ucy5qcyIsIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvc2VhcmNoZXMvc2VhcmNoZXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvc3RhcnR1cC9zZXJ2ZXIvZml4dHVyZXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvc3RhcnR1cC9zZXJ2ZXIvaW5kZXguanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvc3RhcnR1cC9zZXJ2ZXIvcmVnaXN0ZXItYXBpLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9zZXJ2ZXIvbWFpbi5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnQiLCJDb2xsZWN0aW9ucyIsIk1vbmdvIiwid2F0Y2giLCJyZXF1aXJlIiwidiIsIlNpbXBsZVNjaGVtYSIsIk1ldGVvciIsIkNvbGxlY3Rpb24iLCJkZW55IiwiaW5zZXJ0IiwidXBkYXRlIiwicmVtb3ZlIiwiU2NoZW1hIiwidHlwZSIsIlN0cmluZyIsImxhYmVsIiwib3B0aW9uYWwiLCJkZWZhdWx0VmFsdWUiLCJpbmRleCIsInVuaXF1ZSIsImFsbG93ZWRWYWx1ZXMiLCJCb29sZWFuIiwiRGF0ZSIsImF1dG9WYWx1ZSIsImlzSW5zZXJ0IiwiaXNVcGRhdGUiLCJhdHRhY2hTY2hlbWEiLCJwdWJsaWNGaWVsZHMiLCJjb2xsZWN0aW9uX2lkIiwiY29sbGVjdGlvbl9uYW1lIiwiY29sbGVjdGlvbl90eXBlIiwicHJpdmF0ZSIsImNyZWF0ZWQiLCJ1cGRhdGVkIiwiRERQUmF0ZUxpbWl0ZXIiLCJBV1MiLCJkZWZhdWx0IiwiY29uZmlnIiwicmVnaW9uIiwicmVrb2duaXRpb24iLCJSZWtvZ25pdGlvbiIsIm1ldGhvZHMiLCJuZXdDb2wiLCJjb25zb2xlIiwibG9nIiwiY29sIiwiRXJyb3IiLCJjb2xJZCIsImNoZWNrIiwicHJpbnQiLCJwdWJsaXNoIiwiY29sbGVjdGlvbklkIiwiZmluZCIsInNvcnQiLCJmaWVsZHMiLCJzdWJzY3JpYmVUb0NvbGxlY3Rpb25zUnVsZSIsIm5hbWUiLCJhZGRSdWxlIiwiUHJpbnRzIiwibmV3UHJpbnQiLCJwcmludF9hZGRlciIsInVzZXJJZCIsInByaW50X2NvbGxlY3Rpb24iLCJmaW5kT25lIiwiY29sbGVjdGlvbiIsInByaW50X25hbWUiLCJwcmludF9pbWciLCJpbWciLCJzaW1wbGVTY2hlbWEiLCJjbGVhbiIsImZhY2VQYXJhbXMiLCJDb2xsZWN0aW9uSWQiLCJFeHRlcm5hbEltYWdlSWQiLCJJbWFnZSIsIkJ1ZmZlciIsImZyb20iLCJzcGxpdCIsIkRldGVjdGlvbkF0dHJpYnV0ZXMiLCJmYWNlUmVxdWVzdCIsImluZGV4RmFjZXMiLCJwcm9taXNlIiwiaW5kZXhGYWNlIiwidGhlbiIsInJlc3VsdCIsInByaW50X2lkIiwiRmFjZVJlY29yZHMiLCJGYWNlIiwiRmFjZUlkIiwiY2F0Y2giLCJlcnJvciIsImNvZGUiLCJtZXNzYWdlIiwicHJpbnRJZCIsIk9iamVjdCIsImJsYWNrYm94IiwicHJpbnRfdHlwZSIsInByaW50X2RldGFpbHMiLCJzZWxlY3RvciIsInN1YnNjcmliZVRvUHJpbnRzUnVsZSIsIlNlYXJjaGVzIiwicGljRGF0YSIsInQwIiwiZ2V0VGltZSIsImltZ0J5dGVzIiwibW9kZXJhdGlvblBhcmFtcyIsImxhYmVsUGFyYW1zIiwicmVrb2duaXRpb25QYXJhbXMiLCJtb2RlcmF0aW9uUmVxdWVzdCIsImRldGVjdE1vZGVyYXRpb25MYWJlbHMiLCJsYWJlbFJlcXVlc3QiLCJkZXRlY3RMYWJlbHMiLCJkZXRlY3RGYWNlcyIsInJla29nbml0aW9uUmVxdWVzdCIsInNlYXJjaEZhY2VzQnlJbWFnZSIsInByb21pc2UxIiwicHJvbWlzZTIiLCJwcm9taXNlMyIsInByb21pc2U0IiwicmVzcG9uc2UiLCJQcm9taXNlIiwiYWxsIiwidmFsdWVzIiwidDEiLCJzZWFyY2hfcmVzdWx0cyIsIm1vZGVyYXRpb24iLCJNb2RlcmF0aW9uTGFiZWxzIiwibGFiZWxzIiwiTGFiZWxzIiwiZmFjZURldGFpbHMiLCJGYWNlRGV0YWlscyIsInBlcnNvbiIsIkZhY2VNYXRjaGVzIiwic2VhcmNoIiwic2F2ZVNlYXJjaCIsInJlYXNvbiIsImRldGFpbHMiLCJmaW5hbGx5Iiwic2VhcmNoSWQiLCJydW5TY2FuUnVsZSIsInN1YnNjcmliZVRvU2VhcmNoZXNSdWxlIiwiaXNTZXJ2ZXIiLCJzdGFydHVwIiwiX2Vuc3VyZUluZGV4Iiwic2VhcmNoX2lkIiwic2VhcmNoX3R5cGUiLCJzZWFyY2hfY29sbGVjdGlvbnMiLCJzZWFyY2hfaW1hZ2UiLCJjb2xQYXJhbXMiLCJjb2xSZXF1ZXN0IiwibGlzdENvbGxlY3Rpb25zIiwiY29scyIsIkNvbGxlY3Rpb25JZHMiLCJsZW5ndGgiLCJfIiwiZWFjaCIsImF3c0NvbCIsImV4aXN0aW5nQ29sIiwidXBzZXJ0IiwiJHNldCIsIkpTT04iLCJzdHJpbmdpZnkiLCJsaXN0RmFjZXMiLCJmYWNlcyIsIkZhY2VzIiwiZmFjZSIsImF3c0ZhY2UiLCJJbWFnZUlkIiwiZXhpc3RpbmdGYWNlIiwiY291bnQiLCJzZWVkUHJpbnRzIiwidGltZXMiLCJmYWtlciIsImhlbHBlcnMiLCJ1c2VyQ2FyZCIsInJhbmRvbSIsInV1aWQiLCJpbWFnZSIsImF2YXRhciIsInB1c2giLCJIVFRQIiwib3MiLCJzZXJ2ZXJfbW9kZSIsImlzUHJvZHVjdGlvbiIsInNldHRpbmdzIiwiaW5mbyIsInByb2Nlc3MiLCJlbnYiLCJCVUlMRCIsImhvc3RuYW1lIiwiZ2V0RGF0YSIsInJlc3VsdHMiLCJjYWxsIiwiZGF0YSIsImhlYWRlcnMiLCJlIiwib25Db25uZWN0aW9uIiwiY29ubmVjdGlvbiIsImNsaWVudEFkZHIiLCJjbGllbnRBZGRyZXNzIiwiaHR0cEhlYWRlcnMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQUFBLE9BQU9DLE1BQVAsQ0FBYztBQUFDQyxlQUFZLE1BQUlBO0FBQWpCLENBQWQ7QUFBNkMsSUFBSUMsS0FBSjtBQUFVSCxPQUFPSSxLQUFQLENBQWFDLFFBQVEsY0FBUixDQUFiLEVBQXFDO0FBQUNGLFFBQU1HLENBQU4sRUFBUTtBQUFDSCxZQUFNRyxDQUFOO0FBQVE7O0FBQWxCLENBQXJDLEVBQXlELENBQXpEO0FBQTRELElBQUlDLFlBQUo7QUFBaUJQLE9BQU9JLEtBQVAsQ0FBYUMsUUFBUSw2QkFBUixDQUFiLEVBQW9EO0FBQUNFLGVBQWFELENBQWIsRUFBZTtBQUFDQyxtQkFBYUQsQ0FBYjtBQUFlOztBQUFoQyxDQUFwRCxFQUFzRixDQUF0RjtBQUs3SCxNQUFNSixjQUFjLElBQUlNLE9BQU9DLFVBQVgsQ0FBc0IsYUFBdEIsQ0FBcEI7QUFFUDtBQUNBUCxZQUFZUSxJQUFaLENBQWlCO0FBQ2ZDLFdBQVM7QUFBRSxXQUFPLElBQVA7QUFBYyxHQURWOztBQUVmQyxXQUFTO0FBQUUsV0FBTyxJQUFQO0FBQWMsR0FGVjs7QUFHZkMsV0FBUztBQUFFLFdBQU8sSUFBUDtBQUFjOztBQUhWLENBQWpCO0FBTUFYLFlBQVlZLE1BQVosR0FBcUIsSUFBSVAsWUFBSixDQUFpQjtBQUNwQztBQUNBLG1CQUFpQjtBQUNmUSxVQUFNQyxNQURTO0FBRWZDLFdBQU8sZUFGUTtB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QUFDQTNFLGlCQUFTNUIsSUFBVCxHQUFnQixJQUFoQjtBQUNBNEIsaUJBQVMwRSxJQUFULEdBQWdCRixPQUFoQjtBQUNBLE9BUEQsQ0FPRSxPQUFNSSxDQUFOLEVBQVE7QUFDVDVFLG1CQUFXLEtBQVg7QUFDQTNFLGdCQUFRQyxHQUFSLENBQVlzSixDQUFaO0FBQ0EsT0FWRCxTQVVVO0FBQ1R2SixnQkFBUUMsR0FBUixDQUFZLFlBQVosRUFEUyxDQUVUOztBQUNBLGVBQU8wRSxRQUFQO0FBQ0E7QUFDRCxLQWhCRDtBQUFBOztBQU5jLENBQWY7QUEwQkFoSCxPQUFPNkwsWUFBUCxDQUFxQkMsVUFBRCxJQUFjO0FBQ2pDLE1BQUlDLGFBQWFELFdBQVdFLGFBQTVCO0FBQ0EsTUFBSUwsVUFBVUcsV0FBV0csV0FBekI7QUFDQTVKLFVBQVFDLEdBQVIsQ0FBYSxtQkFBa0J5SixVQUFXLEVBQTFDLEVBSGlDLENBSWpDO0FBQ0EsQ0FMRCxFOzs7Ozs7Ozs7OztBQ3BEQXZNLE9BQU9JLEtBQVAsQ0FBYUMsUUFBUSxrQ0FBUixDQUFiO0FBQTBETCxPQUFPSSxLQUFQLENBQWFDLFFBQVEsdUNBQVIsQ0FBYjtBQUErREwsT0FBT0ksS0FBUCxDQUFhQyxRQUFRLCtCQUFSLENBQWI7QUFBdURMLE9BQU9JLEtBQVAsQ0FBYUMsUUFBUSxvQ0FBUixDQUFiO0FBQTRETCxPQUFPSSxLQUFQLENBQWFDLFFBQVEsNkJBQVIsQ0FBYjtBQUFxREwsT0FBT0ksS0FBUCxDQUFhQyxRQUFRLGtDQUFSLENBQWIsRTs7Ozs7Ozs7Ozs7QUNBalNMLE9BQU9JLEtBQVAsQ0FBYUMsUUFBUSwyQkFBUixDQUFiO0FBY0FHLE9BQU91SSxPQUFQLENBQWUsTUFBTSxDQUNuQjtBQUNELENBRkQsRSIsImZpbGUiOiIvYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTW9uZ28gfSBmcm9tICdtZXRlb3IvbW9uZ28nO1xuaW1wb3J0IHsgU2ltcGxlU2NoZW1hIH0gZnJvbSAnbWV0ZW9yL2FsZGVlZDpzaW1wbGUtc2NoZW1hJztcblxuXG5cbmV4cG9ydCBjb25zdCBDb2xsZWN0aW9ucyA9IG5ldyBNZXRlb3IuQ29sbGVjdGlvbignY29sbGVjdGlvbnMnKTtcblxuLy8gRGVueSBhbGwgY2xpZW50LXNpZGUgdXBkYXRlcyBzaW5jZSB3ZSB3aWxsIGJlIHVzaW5nIG1ldGhvZHMgdG8gbWFuYWdlIHRoaXMgY29sbGVjdGlvblxuQ29sbGVjdGlvbnMuZGVueSh7XG4gIGluc2VydCgpIHsgcmV0dXJuIHRydWU7IH0sXG4gIHVwZGF0ZSgpIHsgcmV0dXJuIHRydWU7IH0sXG4gIHJlbW92ZSgpIHsgcmV0dXJuIHRydWU7IH0sXG59KTtcblxuQ29sbGVjdGlvbnMuU2NoZW1hID0gbmV3IFNpbXBsZVNjaGVtYSh7XG4gIC8vIE91ciBzY2hlbWEgcnVsZXMgd2lsbCBnbyBoZXJlLlxuICBcImNvbGxlY3Rpb25faWRcIjoge1xuICAgIHR5cGU6IFN0cmluZyxcbiAgICBsYWJlbDogXCJDb2xsZWN0aW9uIElEXCIsXG4gICAgb3B0aW9uYWw6IGZhbHNlLFxuICAgIGRlZmF1bHRWYWx1ZTogXCJDb2xsZWN0aW9uIElEXCIsXG4gICAgaW5kZXg6IHRydWUsXG4gICAgdW5pcXVlOiB0cnVlXG4gIH0sXG4gIFwiY29sbGVjdGlvbl9uYW1lXCI6IHtcbiAgICB0eXBlOiBTdHJpbmcsXG4gICAgbGFiZWw6IFwiQ29sbGVjdGlvbiBOYW1lXCIsXG4gICAgb3B0aW9uYWw6IGZhbHNlLFxuICAgIGRlZmF1bHRWYWx1ZTogXCJNeUNvbGxlY3Rpb25cIixcbiAgICBpbmRleDogdHJ1ZVxuICB9LFxuICBcImNvbGxlY3Rpb25fdHlwZVwiOiB7XG4gICAgdHlwZTogU3RyaW5nLFxuICAgIGxhYmVsOiBcIkNvbGxlY3Rpb24gdHlwZVwiLFxuICAgIG9wdGlvbmFsOiBmYWxzZSxcbiAgICBhbGxvd2VkVmFsdWVzOiBbXCJmYWNlXCIsIFwidm9pY2VcIl0sXG4gICAgZGVmYXVsdFZhbHVlOiBcImZhY2VcIlxuICB9LFxuICBcInByaXZhdGVcIjoge1xuICAgIHR5cGU6IEJvb2xlYW4sXG4gICAgbGFiZWw6IFwiQ29sbGVjdGlvbiBwcml2YWN5XCIsXG4gICAgb3B0aW9uYWw6IGZhbHNlLFxuICAgIGRlZmF1bHRWYWx1ZTogdHJ1ZVxuICB9LFxuICBcImNyZWF0ZWRcIjoge1xuICAgIHR5cGU6IERhdGUsXG4gICAgbGFiZWw6IFwiRGF0ZSBjb2xsZWN0aW9uIGFkZGVkIHRvIEFudGVubmFlXCIsXG4gICAgYXV0b1ZhbHVlOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICggdGhpcy5pc0luc2VydCApIHtcbiAgICAgICAgcmV0dXJuIG5ldyBEYXRlO1xuICAgICAgfSBcbiAgICB9LFxuICAgIG9wdGlvbmFsOiB0cnVlXG4gIH0sXG4gIFwidXBkYXRlZFwiOiB7XG4gICAgdHlwZTogRGF0ZSxcbiAgICBsYWJlbDogXCJEYXRlIGNvbGxlY3Rpb24gdXBkYXRlZCBpbiBTeXN0ZW1cIixcbiAgICBhdXRvVmFsdWU6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCB0aGlzLmlzVXBkYXRlICkge1xuICAgICAgICByZXR1cm4gbmV3IERhdGU7XG4gICAgICB9IFxuICAgIH0sXG4gICAgb3B0aW9uYWw6IHRydWVcbiAgfVxufSk7XG5cbkNvbGxlY3Rpb25zLmF0dGFjaFNjaGVtYSggQ29sbGVjdGlvbnMuU2NoZW1hICk7IFxuXG5cbkNvbGxlY3Rpb25zLnB1YmxpY0ZpZWxkcyA9IHtcbiAgY29sbGVjdGlvbl9pZDogMSxcbiAgY29sbGVjdGlvbl9uYW1lOiAxLFxuICBjb2xsZWN0aW9uX3R5cGU6IDEsXG4gIHByaXZhdGU6IDEsXG4gIGNyZWF0ZWQ6IDEsXG4gIHVwZGF0ZWQ6IDFcbn07XG5cbi8vIENvbGxlY3Rpb25zLmhlbHBlcnMoe1xuLy8gICAvLyBBIGNvbGxlY3Rpb25zIGlzIGNvbnNpZGVyZWQgdG8gYmUgcHJpdmF0ZSBpZiBcInByaXZhdGVcIiBpcyBzZXQgdG8gdHJ1ZVxuLy8gICBpc1ByaXZhdGUoKSB7XG4vLyAgICAgcmV0dXJuIHRoaXMucHJpdmF0ZTtcbi8vICAgfVxuLy8gfSk7IiwiaW1wb3J0IHsgRERQUmF0ZUxpbWl0ZXIgfSBmcm9tICdtZXRlb3IvZGRwLXJhdGUtbGltaXRlcic7XG5pbXBvcnQgQVdTIGZyb20gJ2F3cy1zZGsnO1xuXG5pbXBvcnQgeyBDb2xsZWN0aW9ucyB9IGZyb20gJy4vY29sbGVjdGlvbnMuanMnO1xuXG5BV1MuY29uZmlnLnJlZ2lvbiA9ICd1cy1lYXN0LTEnO1xudmFyIHJla29nbml0aW9uID0gbmV3IEFXUy5SZWtvZ25pdGlvbigpO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdFwiY29sbGVjdGlvbi5zYXZlXCIobmV3Q29sKXtcblx0XHRjb25zb2xlLmxvZyhuZXdDb2wpO1xuXHRcdGxldCBjb2wgPSBDb2xsZWN0aW9ucy5pbnNlcnQobmV3Q29sKTtcblx0XHRpZihjb2wpe1xuXHRcdFx0Y29uc29sZS5sb2coYGFkZGVkIGNvbGxlY3Rpb246ICR7Y29sfWApO1xuXHRcdH1lbHNle1xuICAgICAgICAgICAgY29uc29sZS5sb2cobmV3Q29sKTtcbiAgICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2FkZC1jb2xsZWN0aW9uLWVycm9yJyxgZXJyb3IgYWRkaW5nIGNvbGxlY3Rpb246ICR7bmV3Q29sfWApXHRcdFxuXHRcdH1cblx0XHRyZXR1cm4gYGFkZGVkIGNvbGxlY3Rpb246ICR7Y29sfWA7XG5cdH0sXG5cblx0XCJjb2xsZWN0aW9uLmRlbGV0ZVwiKGNvbElkKXtcblx0XHRjaGVjayhjb2xJZCxTdHJpbmcpO1xuXHRcdGlmKGNvbElkKXtcblx0XHRcdGxldCBwcmludCA9IENvbGxlY3Rpb25zLnJlbW92ZShjb2xJZCk7XG5cdFx0XHRjb25zb2xlLmxvZyhgZGVsZXRlZCBjb2xsZWN0aW9uOiAke2NvbElkfWApO1xuXHRcdFx0cmV0dXJuIGBkZWxldGVkIGNvbGxlY3Rpb246ICR7Y29sSWR9YDtcblx0XHR9O1xuXHR9XG59KVxuXG4vLyBEZWZpbmUgYSBydWxlIHRvIGxpbWl0IG1ldGhvZCBjYWxsc1xuLy8gbGV0IHJ1blNjYW5SdWxlID0ge1xuLy8gXHR0eXBlOiAnbWV0aG9kJyxcbi8vIFx0bmFtZTogJ21vbWVudC5zY2FuJ1xuLy8gfTtcbi8vIEFkZCB0aGUgcnVsZSwgYWxsb3dpbmcgdXAgdG8gMSBzY2FuIGV2ZXJ5IDEwIHNlY29uZHNcbi8vIEREUFJhdGVMaW1pdGVyLmFkZFJ1bGUocnVuU2NhblJ1bGUsIDEsIDEwMDAwKTsiLCJpbXBvcnQgeyBERFBSYXRlTGltaXRlciB9IGZyb20gJ21ldGVvci9kZHAtcmF0ZS1saW1pdGVyJztcblxuaW1wb3J0IHsgQ29sbGVjdGlvbnMgfSBmcm9tICcuL2NvbGxlY3Rpb25zLmpzJztcblxuXG5NZXRlb3IucHVibGlzaCgnY29sbGVjdGlvbnMuZ2V0JywgZnVuY3Rpb24oY29sbGVjdGlvbklkPScnKSB7XG5cdGNoZWNrKGNvbGxlY3Rpb25JZCxTdHJpbmcpO1xuXHRjb2xsZWN0aW9uSWQgPSBjb2xsZWN0aW9uSWQgfHwge307XG4gIFx0Ly8gY29uc29sZS5sb2coQ29sbGVjdGlvbnMuZmluZChjb2xsZWN0aW9uSWQpLmNvdW50KCkpO1xuXHRyZXR1cm4gQ29sbGVjdGlvbnMuZmluZChcblx0XHRjb2xsZWN0aW9uSWQsIFxuXHQgIHsgXG5cdCAgXHRzb3J0OiB7IGNyZWF0ZWQ6IC0xIH0gXG5cdH1cblx0LCB7XG5cdFx0ZmllbGRzOiBDb2xsZWN0aW9ucy5wdWJsaWNGaWVsZHNcblx0fSk7XG59KTtcblxuLy8gRGVmaW5lIGEgcnVsZSB0byBsaW1pdCBzdWJzY3JpcHRpb24gY2FsbHNcbnZhciBzdWJzY3JpYmVUb0NvbGxlY3Rpb25zUnVsZSA9IHtcbiAgdHlwZTogJ3N1YnNjcmlwdGlvbicsXG4gIG5hbWU6ICdjb2xsZWN0aW9ucy5nZXQnXG59XG4vLyBBZGQgdGhlIHJ1bGUsIGFsbG93aW5nIHVwIHRvIDEgc3Vic2NyaXB0aW9uIGV2ZXJ5IDUgc2Vjb25kcy5cbkREUFJhdGVMaW1pdGVyLmFkZFJ1bGUoc3Vic2NyaWJlVG9Db2xsZWN0aW9uc1J1bGUsIDEsIDUwMDApOyIsImltcG9ydCB7IEREUFJhdGVMaW1pdGVyIH0gZnJvbSAnbWV0ZW9yL2RkcC1yYXRlLWxpbWl0ZXInO1xuaW1wb3J0IEFXUyBmcm9tICdhd3Mtc2RrJztcblxuaW1wb3J0IHsgQ29sbGVjdGlvbnMgfSBmcm9tICcuLi9jb2xsZWN0aW9ucy9jb2xsZWN0aW9ucy5qcyc7XG5pbXBvcnQgeyBQcmludHMgfSBmcm9tICcuL3ByaW50cy5qcyc7XG5cbkFXUy5jb25maWcucmVnaW9uID0gJ3VzLWVhc3QtMSc7XG52YXIgcmVrb2duaXRpb24gPSBuZXcgQVdTLlJla29nbml0aW9uKCk7XG5cbk1ldGVvci5tZXRob2RzKHtcblx0XCJwcmludC5zYXZlXCIobmV3UHJpbnQpe1xuXHRcdG5ld1ByaW50LnByaW50X2FkZGVyID0gdGhpcy51c2VySWQgfHwgXCJudWxsXCI7XG5cdFx0bmV3UHJpbnQucHJpbnRfY29sbGVjdGlvbiA9IENvbGxlY3Rpb25zLmZpbmRPbmUobmV3UHJpbnQuY29sbGVjdGlvbikuY29sbGVjdGlvbl9pZCB8fCBcInBlb3BsZVwiO1xuXHRcdG5ld1ByaW50LnByaW50X25hbWUgPSBuZXdQcmludC5uYW1lO1xuXHRcdG5ld1ByaW50LnByaW50X2ltZyA9IG5ld1ByaW50LmltZztcblx0XHQvLyBjb25zb2xlLmxvZyhuZXdQcmludCk7XG5cdFx0aWYoIW5ld1ByaW50KXtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2ludmFsaWQtcHJpbnQnLCdzdWJtaXR0ZWQgcHJpbnQgaXMgaW52YWxpZCEnKTtcblx0XHR9O1xuXHRcdFByaW50cy5zaW1wbGVTY2hlbWEoKS5jbGVhbihuZXdQcmludCk7XG4gICAgICAgIC8vIGluZGV4IGEgZmFjZSBpbnRvIGEgY29sbGVjdGlvblxuICAgICAgICBsZXQgZmFjZVBhcmFtcyA9IHtcbiAgICAgICAgICBDb2xsZWN0aW9uSWQ6IG5ld1ByaW50LnByaW50X2NvbGxlY3Rpb24sXG4gICAgICAgICAgRXh0ZXJuYWxJbWFnZUlkOiBuZXdQcmludC5wcmludF9uYW1lLFxuXHRcdCAgSW1hZ2U6IHsgXG5cdFx0XHRcIkJ5dGVzXCI6IG5ldyBCdWZmZXIuZnJvbShuZXdQcmludC5wcmludF9pbWcuc3BsaXQoXCIsXCIpWzFdLCBcImJhc2U2NFwiKSxcblx0XHQgIH0sXG4gICAgICAgICAgRGV0ZWN0aW9uQXR0cmlidXRlczogW1wiQUxMXCJdXG4gICAgICAgIH07XG4gICAgICAgIGxldCBmYWNlUmVxdWVzdCA9IHJla29nbml0aW9uLmluZGV4RmFjZXMoZmFjZVBhcmFtcyk7XG4gICAgICAgIGxldCBwcm9taXNlID0gZmFjZVJlcXVlc3QucHJvbWlzZSgpO1xuICAgICAgICBsZXQgaW5kZXhGYWNlID0gcHJvbWlzZS50aGVuKHJlc3VsdCA9PiB7XG4gICAgICAgIFx0Y29uc29sZS5sb2cocmVzdWx0KTtcbiAgICAgICAgXHRuZXdQcmludC5wcmludF9pZCA9IHJlc3VsdC5GYWNlUmVjb3Jkc1swXS5GYWNlLkZhY2VJZDtcblx0XHRcdGxldCBwcmludCA9IFByaW50cy5pbnNlcnQobmV3UHJpbnQpO1xuICAgICAgICBcdGNvbnNvbGUubG9nKGBpbnNlcnRlZDogJHtwcmludH1gKTtcbiAgICAgICAgXHRyZXR1cm4gcmVzdWx0O1xuICAgICAgICB9KS5jYXRjaChlcnJvciA9PiB7XG4gICAgICAgIFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcihlcnJvci5jb2RlLCBlcnJvci5tZXNzYWdlLCBlcnJvcik7XG4gICAgICAgIFx0cmV0dXJuIGVycm9yO1xuICAgICAgICB9KTtcblx0XHRyZXR1cm4gaW5kZXhGYWNlO1xuXHR9LFxuXG5cdFwicHJpbnQuZGVsZXRlXCIocHJpbnRJZCl7XG5cdFx0Y2hlY2socHJpbnRJZCxTdHJpbmcpO1xuXHRcdGlmKHByaW50SWQpe1xuXHRcdFx0bGV0IHByaW50ID0gUHJpbnRzLnJlbW92ZShwcmludElkKTtcblx0XHRcdGNvbnNvbGUubG9nKGBkZWxldGVkIGZhY2U6ICR7cHJpbnRJZH1gKTtcblx0XHRcdHJldHVybiBgZGVsZXRlZCBmYWNlOiAke3ByaW50SWR9YDtcblx0XHR9O1xuXHR9XG59KVxuXG4vLyBEZWZpbmUgYSBydWxlIHRvIGxpbWl0IG1ldGhvZCBjYWxsc1xuLy8gbGV0IHJ1blNjYW5SdWxlID0ge1xuLy8gXHR0eXBlOiAnbWV0aG9kJyxcbi8vIFx0bmFtZTogJ3ByaW50LnNhdmUnXG4vLyB9O1xuLy8gQWRkIHRoZSBydWxlLCBhbGxvd2luZyB1cCB0byAxIHNjYW4gZXZlcnkgMTAgc2Vjb25kc1xuLy8gRERQUmF0ZUxpbWl0ZXIuYWRkUnVsZShydW5TY2FuUnVsZSwgMSwgMTAwMDApOyIsImltcG9ydCB7IE1vbmdvIH0gZnJvbSAnbWV0ZW9yL21vbmdvJztcbmltcG9ydCB7IFNpbXBsZVNjaGVtYSB9IGZyb20gJ21ldGVvci9hbGRlZWQ6c2ltcGxlLXNjaGVtYSc7XG5cblxuXG5leHBvcnQgY29uc3QgUHJpbnRzID0gbmV3IE1ldGVvci5Db2xsZWN0aW9uKCdwcmludHMnKTtcblxuLy8gRGVueSBhbGwgY2xpZW50LXNpZGUgdXBkYXRlcyBzaW5jZSB3ZSB3aWxsIGJlIHVzaW5nIG1ldGhvZHMgdG8gbWFuYWdlIHRoaXMgY29sbGVjdGlvblxuUHJpbnRzLmRlbnkoe1xuICBpbnNlcnQoKSB7IHJldHVybiB0cnVlOyB9LFxuICB1cGRhdGUoKSB7IHJldHVybiB0cnVlOyB9LFxuICByZW1vdmUoKSB7IHJldHVybiB0cnVlOyB9LFxufSk7XG5cblByaW50cy5TY2hlbWEgPSBuZXcgU2ltcGxlU2NoZW1hKHtcbiAgLy8gT3VyIHNjaGVtYSBydWxlcyB3aWxsIGdvIGhlcmUuXG4gIFwicHJpbnRfaWRcIjoge1xuICAgIHR5cGU6IFN0cmluZyxcbiAgICBsYWJlbDogXCJQcmludCBJRFwiLFxuICAgIG9wdGlvbmFsOiBmYWxzZSxcbiAgICBkZWZhdWx0VmFsdWU6IFwiQUFBQS1CQkJCLUNDQ0MtMTExMS0yMjIyLTMzMzNcIixcbiAgICBpbmRleDogdHJ1ZSxcbiAgICB1bmlxdWU6IHRydWVcbiAgfSxcbiAgXCJwcmludF9uYW1lXCI6IHtcbiAgICB0eXBlOiBTdHJpbmcsXG4gICAgbGFiZWw6IFwiUHJpbnQgTmFtZVwiLFxuICAgIG9wdGlvbmFsOiBmYWxzZSxcbiAgICBkZWZhdWx0VmFsdWU6IFwiTmV3IFBlcnNvblwiXG4gIH0sXG4gIFwicHJpbnRfdHlwZVwiOiB7XG4gICAgdHlwZTogU3RyaW5nLFxuICAgIGxhYmVsOiBcIlByaW50IHR5cGVcIixcbiAgICBvcHRpb25hbDogZmFsc2UsXG4gICAgYWxsb3dlZFZhbHVlczogW1wiZmFjZVwiLCBcInZvaWNlXCIsIFwiZmluZ2VyXCJdLFxuICAgIGRlZmF1bHRWYWx1ZTogXCJmYWNlXCJcbiAgfSxcbiAgXCJwcmludF9jb2xsZWN0aW9uXCI6IHtcbiAgICB0eXBlOiBTdHJpbmcsXG4gICAgbGFiZWw6IFwiUHJpbnQgY29sbGVjdGlvblwiLFxuICAgIG9wdGlvbmFsOiBmYWxzZSxcbiAgICBkZWZhdWx0VmFsdWU6IFwicGVvcGxlXCJcbiAgfSxcbiAgXCJwcmludF9pbWdcIjoge1xuICAgIHR5cGU6IFN0cmluZyxcbiAgICBsYWJlbDogXCJQcmludCBpbWdcIixcbiAgICBvcHRpb25hbDogdHJ1ZSxcbiAgICBkZWZhdWx0VmFsdWU6IFwiL2ltZy9mYWNlLWlkLTEwMC5wbmdcIlxuICB9LFxuICBcInByaW50X2RldGFpbHNcIjoge1xuICAgIHR5cGU6IE9iamVjdCxcbiAgICBsYWJlbDogXCJQcmludCBkZXRhaWxzXCIsXG4gICAgb3B0aW9uYWw6IHRydWUsXG4gICAgYmxhY2tib3g6IHRydWVcbiAgfSxcbiAgXCJwcmludF9hZGRlclwiOiB7XG4gICAgdHlwZTogU3RyaW5nLFxuICAgIGxhYmVsOiBcIlVzZXIgd2hvIGFkZGVkIHByaW50XCIsXG4gICAgb3B0aW9uYWw6IGZhbHNlXG4gIH0sXG4gIFwiY3JlYXRlZFwiOiB7XG4gICAgdHlwZTogRGF0ZSxcbiAgICBsYWJlbDogXCJEYXRlIHByaW50IGFkZGVkIHRvIEFudGVubmFlXCIsXG4gICAgYXV0b1ZhbHVlOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICggdGhpcy5pc0luc2VydCApIHtcbiAgICAgICAgcmV0dXJuIG5ldyBEYXRlO1xuICAgICAgfSBcbiAgICB9LFxuICAgIG9wdGlvbmFsOiB0cnVlXG4gIH0sXG4gIFwidXBkYXRlZFwiOiB7XG4gICAgdHlwZTogRGF0ZSxcbiAgICBsYWJlbDogXCJEYXRlIHByaW50IHVwZGF0ZWQgaW4gU3lzdGVtXCIsXG4gICAgYXV0b1ZhbHVlOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICggdGhpcy5pc1VwZGF0ZSApIHtcbiAgICAgICAgcmV0dXJuIG5ldyBEYXRlO1xuICAgICAgfSBcbiAgICB9LFxuICAgIG9wdGlvbmFsOiB0cnVlXG4gIH1cbn0pO1xuXG5QcmludHMuYXR0YWNoU2NoZW1hKCBQcmludHMuU2NoZW1hICk7IFxuXG5cblByaW50cy5wdWJsaWNGaWVsZHMgPSB7XG4gIHByaW50X2lkOiAxLFxuICBwcmludF9uYW1lOiAxLFxuICBwcmludF90eXBlOiAxLFxuICBwcmludF9jb2xsZWN0aW9uOiAxLFxuICBwcmludF9pbWc6IDEsXG4gIHByaW50X2RldGFpbHM6IDEsXG4gIHByaW50X2FkZGVyOiAxLFxuICBjcmVhdGVkOiAxLFxuICB1cGRhdGVkOiAxXG59O1xuXG4vLyBQcmludHMuaGVscGVycyh7XG4vLyAgIC8vIEEgY29sbGVjdGlvbnMgaXMgY29uc2lkZXJlZCB0byBiZSBwcml2YXRlIGlmIFwicHJpdmF0ZVwiIGlzIHNldCB0byB0cnVlXG4vLyAgIGlzUHJpdmF0ZSgpIHtcbi8vICAgICByZXR1cm4gdGhpcy5wcml2YXRlO1xuLy8gICB9XG4vLyB9KTsiLCJpbXBvcnQgeyBERFBSYXRlTGltaXRlciB9IGZyb20gJ21ldGVvci9kZHAtcmF0ZS1saW1pdGVyJztcblxuaW1wb3J0IHsgUHJpbnRzIH0gZnJvbSAnLi9wcmludHMuanMnO1xuXG5cbk1ldGVvci5wdWJsaXNoKCdwcmludHMuZ2V0JywgZnVuY3Rpb24oY29sbGVjdGlvbklkKSB7XG5cdGNvbGxlY3Rpb25JZCA9IGNvbGxlY3Rpb25JZCB8fCBcIlwiO1xuXHRjaGVjayhjb2xsZWN0aW9uSWQsU3RyaW5nKTtcblx0bGV0IHNlbGVjdG9yID0ge1xuXHRcdC8vIHByaW50X2NvbGxlY3Rpb246IGNvbGxlY3Rpb25JZFxuXHR9O1xuICBcdC8vIGNvbnNvbGUubG9nKENvbGxlY3Rpb25zLmZpbmQoY29sbGVjdGlvbklkKS5jb3VudCgpKTtcblx0cmV0dXJuIFByaW50cy5maW5kKFxuXHRcdHNlbGVjdG9yLCBcblx0ICB7IFxuXHQgIFx0c29ydDogeyBjcmVhdGVkOiAtMSB9IFxuXHR9XG5cdCwge1xuXHRcdGZpZWxkczogUHJpbnRzLnB1YmxpY0ZpZWxkc1xuXHR9KTtcbn0pO1xuXG4vLyBEZWZpbmUgYSBydWxlIHRvIGxpbWl0IHN1YnNjcmlwdGlvbiBjYWxsc1xudmFyIHN1YnNjcmliZVRvUHJpbnRzUnVsZSA9IHtcbiAgdHlwZTogJ3N1YnNjcmlwdGlvbicsXG4gIG5hbWU6ICdwcmludHMuZ2V0J1xufVxuLy8gQWRkIHRoZSBydWxlLCBhbGxvd2luZyB1cCB0byAxIHN1YnNjcmlwdGlvbiBldmVyeSA1IHNlY29uZHMuXG5ERFBSYXRlTGltaXRlci5hZGRSdWxlKHN1YnNjcmliZVRvUHJpbnRzUnVsZSwgMSwgNTAwMCk7IiwiaW1wb3J0IHsgRERQUmF0ZUxpbWl0ZXIgfSBmcm9tICdtZXRlb3IvZGRwLXJhdGUtbGltaXRlcic7XG5pbXBvcnQgQVdTIGZyb20gJ2F3cy1zZGsnO1xuXG5pbXBvcnQgeyBTZWFyY2hlcyB9IGZyb20gJy4vc2VhcmNoZXMuanMnO1xuXG5BV1MuY29uZmlnLnJlZ2lvbiA9ICd1cy1lYXN0LTEnO1xudmFyIHJla29nbml0aW9uID0gbmV3IEFXUy5SZWtvZ25pdGlvbigpO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdFwic2VhcmNoLmZhY2VcIihwaWNEYXRhKXtcblx0XHQvL3JldHVybiAxO1xuXHRcdGNvbnNvbGUubG9nKFwiQU5BTFlaSU5HIElNQUdFLi4uXCIpO1xuXHRcdHZhciB0MCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXHRcdGxldCBpbWdCeXRlcyA9IG5ldyBCdWZmZXIuZnJvbShwaWNEYXRhLnNwbGl0KFwiLFwiKVsxXSwgXCJiYXNlNjRcIik7XG5cdFx0bGV0IG1vZGVyYXRpb25QYXJhbXMgPSB7XG5cdFx0XHRcIkltYWdlXCI6IHsgXG5cdFx0XHRcdFwiQnl0ZXNcIjogaW1nQnl0ZXMsXG5cdFx0XHR9LFxuXHRcdFx0XCJNaW5Db25maWRlbmNlXCI6IDUwLFxuXHRcdH07XG5cdFx0bGV0IGxhYmVsUGFyYW1zID0ge1xuXHRcdFx0XCJJbWFnZVwiOiB7IFxuXHRcdFx0XHRcIkJ5dGVzXCI6IGltZ0J5dGVzLFxuXHRcdFx0fSxcblx0XHRcdFwiTWF4TGFiZWxzXCI6IDIwLFxuXHRcdFx0XCJNaW5Db25maWRlbmNlXCI6IDc1LFxuXHRcdH07XG5cdFx0bGV0IGZhY2VQYXJhbXMgPSB7XG5cdFx0XHRcIkltYWdlXCI6IHsgXG5cdFx0XHRcdFwiQnl0ZXNcIjogaW1nQnl0ZXMsXG5cdFx0XHR9LFxuICBcdFx0XHRcIkF0dHJpYnV0ZXNcIjogW1wiQUxMXCJdLFxuXHRcdH07XG5cdFx0bGV0IHJla29nbml0aW9uUGFyYW1zID0ge1xuXHRcdFx0XCJDb2xsZWN0aW9uSWRcIjogXCJBbnRQYXlcIixcblx0XHRcdFwiRmFjZU1hdGNoVGhyZXNob2xkXCI6IDk4LFxuXHRcdFx0XCJNYXhGYWNlc1wiOiA1LFxuXHRcdFx0XCJJbWFnZVwiOiB7IFxuXHRcdFx0XHRcIkJ5dGVzXCI6IGltZ0J5dGVzLFxuXHRcdFx0fSxcblx0XHR9O1xuXHRcdC8vIGNyZWF0ZSByZXF1ZXN0IG9iamVjdHNcblx0XHRsZXQgbW9kZXJhdGlvblJlcXVlc3QgPSByZWtvZ25pdGlvbi5kZXRlY3RNb2RlcmF0aW9uTGFiZWxzKG1vZGVyYXRpb25QYXJhbXMpO1xuXHRcdGxldCBsYWJlbFJlcXVlc3QgPSByZWtvZ25pdGlvbi5kZXRlY3RMYWJlbHMobGFiZWxQYXJhbXMpO1xuXHRcdGxldCBmYWNlUmVxdWVzdCA9IHJla29nbml0aW9uLmRldGVjdEZhY2VzKGZhY2VQYXJhbXMpO1xuXHRcdGxldCByZWtvZ25pdGlvblJlcXVlc3QgPSByZWtvZ25pdGlvbi5zZWFyY2hGYWNlc0J5SW1hZ2UocmVrb2duaXRpb25QYXJhbXMpO1xuXHRcdC8vIGNyZWF0ZSBwcm9taXNlc1xuXHRcdGxldCBwcm9taXNlMSA9IG1vZGVyYXRpb25SZXF1ZXN0LnByb21pc2UoKTtcblx0XHRsZXQgcHJvbWlzZTIgPSBsYWJlbFJlcXVlc3QucHJvbWlzZSgpO1xuXHRcdGxldCBwcm9taXNlMyA9IGZhY2VSZXF1ZXN0LnByb21pc2UoKTtcblx0XHRsZXQgcHJvbWlzZTQgPSByZWtvZ25pdGlvblJlcXVlc3QucHJvbWlzZSgpO1xuXHRcdC8vIEZ1bGZpbGwgcHJvbWlzZXMgaW4gcGFyYWxsZWxcblx0XHRsZXQgcmVzcG9uc2UgPSBQcm9taXNlLmFsbChbXG5cdFx0XHRwcm9taXNlMS5jYXRjaChlcnJvciA9PiB7IHRocm93IG5ldyBNZXRlb3IuRXJyb3IoZXJyb3IuY29kZSwgZXJyb3IubWVzc2FnZSwgZXJyb3IpO3JldHVybiBlcnJvcjsgfSksXG5cdFx0XHRwcm9taXNlMi5jYXRjaChlcnJvciA9PiB7IHRocm93IG5ldyBNZXRlb3IuRXJyb3IoZXJyb3IuY29kZSwgZXJyb3IubWVzc2FnZSwgZXJyb3IpO3JldHVybiBlcnJvcjsgfSksXG5cdFx0XHRwcm9taXNlMy5jYXRjaChlcnJvciA9PiB7IHRocm93IG5ldyBNZXRlb3IuRXJyb3IoZXJyb3IuY29kZSwgZXJyb3IubWVzc2FnZSwgZXJyb3IpO3JldHVybiBlcnJvcjsgfSksXG5cdFx0XHRwcm9taXNlNC5jYXRjaChlcnJvciA9PiB7IHRocm93IG5ldyBNZXRlb3IuRXJyb3IoZXJyb3IuY29kZSwgZXJyb3IubWVzc2FnZSwgZXJyb3IpO3JldHVybiBlcnJvcjsgfSksXG5cdFx0XSkudGhlbih2YWx1ZXMgPT4ge1xuXHRcdFx0Y29uc29sZS5sb2codmFsdWVzWzBdKTtcblx0XHRcdGNvbnNvbGUubG9nKHZhbHVlc1sxXSk7XG5cdFx0XHRjb25zb2xlLmxvZyh2YWx1ZXNbMl0pO1xuXHRcdFx0Y29uc29sZS5sb2codmFsdWVzWzNdKTtcblx0XHRcdGxldCB0MSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXHRcdFx0Y29uc29sZS5sb2coYFJlc3BvbnNlIHRvb2sgJHt0MSAtIHQwfSBtc2ApO1xuXHRcdFx0bGV0IHNlYXJjaF9yZXN1bHRzID0ge1xuXHRcdFx0XHRtb2RlcmF0aW9uOiB2YWx1ZXNbMF0uTW9kZXJhdGlvbkxhYmVscyxcblx0XHRcdFx0bGFiZWxzOiB2YWx1ZXNbMV0uTGFiZWxzLFxuXHRcdFx0XHRmYWNlRGV0YWlsczogdmFsdWVzWzJdLkZhY2VEZXRhaWxzLFxuXHRcdFx0XHRwZXJzb246IHZhbHVlc1szXS5GYWNlTWF0Y2hlc1swXVxuXHRcdFx0fTtcblx0XHRcdGxldCBzZWFyY2ggPSB7XG5cdFx0XHRcdC8vIHNlYXJjaF9pbWFnZTogcGljRGF0YSxcblx0XHRcdFx0c2VhcmNoX3Jlc3VsdHM6IHNlYXJjaF9yZXN1bHRzXG5cdFx0XHR9O1xuXHRcdFx0bGV0IHNhdmVTZWFyY2ggPSBTZWFyY2hlcy5pbnNlcnQoc2VhcmNoKTtcblx0XHRcdGNvbnNvbGUubG9nKHNhdmVTZWFyY2gpO1xuXHRcdFx0cmV0dXJuIHZhbHVlcztcblx0XHR9KS5jYXRjaChlcnJvciA9PiB7XG5cdFx0XHRjb25zb2xlLmxvZygnY2F1Z2h0IGVycm9yIScpO1xuXHRcdFx0Y29uc29sZS5sb2coZXJyb3IpO1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcihlcnJvci5lcnJvciwgZXJyb3IucmVhc29uLCBlcnJvci5kZXRhaWxzKTtcblx0XHR9KS5maW5hbGx5KCgpID0+IHtcblx0XHRcdGNvbnNvbGUubG9nKCdmaW5hbGx5Jyk7XG5cdFx0XHRjb25zb2xlLmxvZyh0aGlzKTtcblx0XHR9KTtcblx0XHRjb25zb2xlLmxvZyhyZXNwb25zZSk7XG5cdFx0bGV0IHQxID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG5cdFx0Y29uc29sZS5sb2coYFJlcXVlc3QgdG9vayAke3QxIC0gdDB9IG1zYCk7XG5cdFx0cmV0dXJuIHJlc3BvbnNlO1xuXHR9LFxuXG5cdFwic2VhcmNoLmRlbGV0ZVwiKHNlYXJjaElkKXtcblx0XHRjaGVjayhzZWFyY2hJZCxTdHJpbmcpO1xuXHRcdGlmKHNlYXJjaElkKXtcblx0XHRcdGxldCBzZWFyY2ggPSBTZWFyY2hlcy5yZW1vdmUoc2VhcmNoSWQpO1xuXHRcdFx0Y29uc29sZS5sb2coYGRlbGV0ZWQgc2VhcmNoOiAke3NlYXJjaElkfWApO1xuXHRcdFx0cmV0dXJuIGBkZWxldGVkIHNlYXJjaDogJHtzZWFyY2hJZH1gO1xuXHRcdH07XG5cdH1cbn0pXG5cbi8vIERlZmluZSBhIHJ1bGUgdG8gbGltaXQgbWV0aG9kIGNhbGxzXG5sZXQgcnVuU2NhblJ1bGUgPSB7XG5cdHR5cGU6ICdtZXRob2QnLFxuXHRuYW1lOiAnbW9tZW50LnNjYW4nXG59O1xuLy8gQWRkIHRoZSBydWxlLCBhbGxvd2luZyB1cCB0byAxIHNjYW4gZXZlcnkgMTAgc2Vjb25kc1xuRERQUmF0ZUxpbWl0ZXIuYWRkUnVsZShydW5TY2FuUnVsZSwgMSwgMTAwMDApOyIsImltcG9ydCB7IEREUFJhdGVMaW1pdGVyIH0gZnJvbSAnbWV0ZW9yL2RkcC1yYXRlLWxpbWl0ZXInO1xuXG5pbXBvcnQgeyBTZWFyY2hlcyB9IGZyb20gJy4vc2VhcmNoZXMuanMnO1xuXG5cbk1ldGVvci5wdWJsaXNoKCdzZWFyY2hlcy5nZXQnLCBmdW5jdGlvbihzZWFyY2hJZD0nJykge1xuXHRjaGVjayhzZWFyY2hJZCxTdHJpbmcpO1xuXHRzZWFyY2hJZCA9IHNlYXJjaElkIHx8IHt9O1xuICBcdC8vIGNvbnNvbGUubG9nKFNlYXJjaGVzLmZpbmQoc2VhcmNoSWQpLmNvdW50KCkpO1xuXHRyZXR1cm4gU2VhcmNoZXMuZmluZChcblx0XHRzZWFyY2hJZCwgXG5cdCAgeyBcblx0ICBcdHNvcnQ6IHsgY3JlYXRlZDogLTEgfSBcblx0fVxuXHQsIHtcblx0XHRmaWVsZHM6IFNlYXJjaGVzLnB1YmxpY0ZpZWxkc1xuXHR9KTtcbn0pO1xuXG4vLyBEZWZpbmUgYSBydWxlIHRvIGxpbWl0IHN1YnNjcmlwdGlvbiBjYWxsc1xudmFyIHN1YnNjcmliZVRvU2VhcmNoZXNSdWxlID0ge1xuICB0eXBlOiAnc3Vic2NyaXB0aW9uJyxcbiAgbmFtZTogJ3NlYXJjaGVzLmdldCdcbn1cbi8vIEFkZCB0aGUgcnVsZSwgYWxsb3dpbmcgdXAgdG8gMSBzdWJzY3JpcHRpb24gZXZlcnkgNSBzZWNvbmRzLlxuRERQUmF0ZUxpbWl0ZXIuYWRkUnVsZShzdWJzY3JpYmVUb1NlYXJjaGVzUnVsZSwgMSwgNTAwMCk7IiwiaW1wb3J0IHsgTW9uZ28gfSBmcm9tICdtZXRlb3IvbW9uZ28nO1xuaW1wb3J0IHsgU2ltcGxlU2NoZW1hIH0gZnJvbSAnbWV0ZW9yL2FsZGVlZDpzaW1wbGUtc2NoZW1hJztcblxuXG5cbmV4cG9ydCBjb25zdCBTZWFyY2hlcyA9IG5ldyBNZXRlb3IuQ29sbGVjdGlvbignc2VhcmNoZXMnKTtcblxuLy8gRGVueSBhbGwgY2xpZW50LXNpZGUgdXBkYXRlcyBzaW5jZSB3ZSB3aWxsIGJlIHVzaW5nIG1ldGhvZHMgdG8gbWFuYWdlIHRoaXMgY29sbGVjdGlvblxuU2VhcmNoZXMuZGVueSh7XG4gIGluc2VydCgpIHsgcmV0dXJuIHRydWU7IH0sXG4gIHVwZGF0ZSgpIHsgcmV0dXJuIHRydWU7IH0sXG4gIHJlbW92ZSgpIHsgcmV0dXJuIHRydWU7IH0sXG59KTtcblxuU2VhcmNoZXMuU2NoZW1hID0gbmV3IFNpbXBsZVNjaGVtYSh7XG4gIC8vIHNjaGVtYSBydWxlc1xuICBcInNlYXJjaF90eXBlXCI6IHtcbiAgICB0eXBlOiBbU3RyaW5nXSxcbiAgICBsYWJlbDogXCJTZWFyY2ggdHlwZXNcIixcbiAgICBvcHRpb25hbDogZmFsc2UsXG4gICAgYWxsb3dlZFZhbHVlczogW1wibW9kZXJhdGlvblwiLCBcImxhYmVsXCIsIFwiZmFjZVwiLCBcImNvbGxlY3Rpb25cIl0sXG4gICAgZGVmYXVsdFZhbHVlOiBbXCJtb2RlcmF0aW9uXCIsIFwibGFiZWxcIiwgXCJmYWNlXCJdXG4gIH0sXG4gIFwic2VhcmNoX2NvbGxlY3Rpb25zXCI6IHtcbiAgICB0eXBlOiBbU3RyaW5nXSxcbiAgICBsYWJlbDogXCJDb2xsZWN0aW9ucyB0byBzZWFyY2hcIixcbiAgICBvcHRpb25hbDogdHJ1ZSxcbiAgICBkZWZhdWx0VmFsdWU6IFtcIlwiXVxuICB9LFxuICBcInNlYXJjaF9pbWFnZVwiOiB7XG4gICAgdHlwZTogU3RyaW5nLFxuICAgIGxhYmVsOiBcIkltYWdlIHRvIHNlYXJjaFwiLFxuICAgIG9wdGlvbmFsOiB0cnVlLFxuICAgIGRlZmF1bHRWYWx1ZTogXCIvaW1nL2ZhY2UtaWQtMTAwLnBuZ1wiXG4gIH0sXG4gIFwic2VhcmNoX3Jlc3VsdHNcIjoge1xuICAgIHR5cGU6IE9iamVjdCxcbiAgICBsYWJlbDogXCJPYmplY3Qgb2Ygc2VhcmNoIHR5cGVzXCIsXG4gICAgb3B0aW9uYWw6IHRydWUsXG4gICAgYmxhY2tib3g6IHRydWUsXG4gICAgZGVmYXVsdFZhbHVlOiB7fVxuICB9LFxuICBcImZhY2VzXCI6IHtcbiAgICB0eXBlOiBbT2JqZWN0XSxcbiAgICBsYWJlbDogXCJGYWNlIG9iamVjdHMgZm91bmQgaW4gaW1hZ2VcIixcbiAgICBvcHRpb25hbDogdHJ1ZSxcbiAgICBibGFja2JveDogdHJ1ZSxcbiAgICBkZWZhdWx0VmFsdWU6IFtdXG4gIH0sXG4gIFwiY3JlYXRlZFwiOiB7XG4gICAgdHlwZTogRGF0ZSxcbiAgICBsYWJlbDogXCJEYXRlIHNlYXJjaCBwZXJmb3JtZWRcIixcbiAgICBhdXRvVmFsdWU6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCB0aGlzLmlzSW5zZXJ0ICkge1xuICAgICAgICByZXR1cm4gbmV3IERhdGU7XG4gICAgICB9IFxuICAgIH0sXG4gICAgb3B0aW9uYWw6IHRydWUsXG4gICAgLy9pbmRleDogdHJ1ZVxuICB9LFxuICBcInVwZGF0ZWRcIjoge1xuICAgIHR5cGU6IERhdGUsXG4gICAgbGFiZWw6IFwiRGF0ZSBzZWFyY2ggdXBkYXRlZFwiLFxuICAgIGF1dG9WYWx1ZTogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoIHRoaXMuaXNVcGRhdGUgKSB7XG4gICAgICAgIHJldHVybiBuZXcgRGF0ZTtcbiAgICAgIH0gXG4gICAgfSxcbiAgICBvcHRpb25hbDogdHJ1ZVxuICB9XG59KTtcblxuU2VhcmNoZXMuYXR0YWNoU2NoZW1hKCBTZWFyY2hlcy5TY2hlbWEgKTtcblxuaWYoTWV0ZW9yLmlzU2VydmVyKXtcbiAgTWV0ZW9yLnN0YXJ0dXAoKCkgPT4ge1xuICAgIFNlYXJjaGVzLl9lbnN1cmVJbmRleCh7XG4gICAgICAgIGNyZWF0ZWQ6IC0xLFxuICAgIH0pO1xuICAgIC8vIFNlYXJjaGVzLl9lbnN1cmVJbmRleCh7IHNlYXJjaF9pbWFnZTogMX0pO1xuICB9KTtcbn1cblxuU2VhcmNoZXMucHVibGljRmllbGRzID0ge1xuICBzZWFyY2hfaWQ6IDEsXG4gIHNlYXJjaF90eXBlOiAxLFxuICBzZWFyY2hfY29sbGVjdGlvbnM6IDEsXG4gIHNlYXJjaF9pbWFnZTogMSxcbiAgc2VhcmNoX3Jlc3VsdHM6IDEsXG4gIGNyZWF0ZWQ6IDEsXG4gIHVwZGF0ZWQ6IDFcbn07XG5cbi8vIFNlYXJjaGVzLmhlbHBlcnMoe1xuLy8gICAvLyBBIGNvbGxlY3Rpb25zIGlzIGNvbnNpZGVyZWQgdG8gYmUgcHJpdmF0ZSBpZiBcInByaXZhdGVcIiBpcyBzZXQgdG8gdHJ1ZVxuLy8gICBpc1ByaXZhdGUoKSB7XG4vLyAgICAgcmV0dXJuIHRoaXMucHJpdmF0ZTtcbi8vICAgfVxuLy8gfSk7IiwiaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5pbXBvcnQgeyBDb2xsZWN0aW9ucyB9IGZyb20gJy4uLy4uL2FwaS9jb2xsZWN0aW9ucy9jb2xsZWN0aW9ucy5qcyc7XG5pbXBvcnQgeyBQcmludHMgfSBmcm9tICcuLi8uLi9hcGkvcHJpbnRzL3ByaW50cy5qcyc7XG5pbXBvcnQgeyBTZWFyY2hlcyB9IGZyb20gJy4uLy4uL2FwaS9zZWFyY2hlcy9zZWFyY2hlcy5qcyc7XG5pbXBvcnQgQVdTIGZyb20gJ2F3cy1zZGsnO1xuXG5BV1MuY29uZmlnLnJlZ2lvbiA9ICd1cy1lYXN0LTEnO1xudmFyIHJla29nbml0aW9uID0gbmV3IEFXUy5SZWtvZ25pdGlvbigpO1xuXG4vLyBpZiB0aGUgZGF0YWJhc2UgaXMgZW1wdHkgb24gc2VydmVyIHN0YXJ0LCBjcmVhdGUgc29tZSBzYW1wbGUgZGF0YS5cblxuTWV0ZW9yLnN0YXJ0dXAoKCkgPT4ge1xuXG4gIGNvbnNvbGUubG9nKFwiZ2V0dGluZyBhd3MgY29sbGVjdGlvbnMuLi5cIik7XG4gIGxldCBjb2xQYXJhbXM9IHt9O1xuICBsZXQgY29sUmVxdWVzdCA9IHJla29nbml0aW9uLmxpc3RDb2xsZWN0aW9ucyhjb2xQYXJhbXMpO1xuICBsZXQgcHJvbWlzZSA9IGNvbFJlcXVlc3QucHJvbWlzZSgpO1xuICBsZXQgY29scyA9IHByb21pc2UudGhlbihyZXN1bHQgPT4ge1xuICAgIGNvbnNvbGUubG9nKHJlc3VsdCk7XG4gICAgaWYocmVzdWx0ICYmIHJlc3VsdC5Db2xsZWN0aW9uSWRzLmxlbmd0aCA+IDApe1xuICAgICAgXy5lYWNoKHJlc3VsdC5Db2xsZWN0aW9uSWRzLCBmdW5jdGlvbihjb2xJZCl7XG4gICAgICAgIGxldCBhd3NDb2wgPSB7XG4gICAgICAgICAgY29sbGVjdGlvbl9pZDogY29sSWQsXG4gICAgICAgICAgY29sbGVjdGlvbl9uYW1lOiBjb2xJZCxcbiAgICAgICAgICBjb2xsZWN0aW9uX3R5cGU6IFwiZmFjZVwiLFxuICAgICAgICAgIHByaXZhdGU6IHRydWVcbiAgICAgICAgfTtcbiAgICAgICAgbGV0IGV4aXN0aW5nQ29sID0gQ29sbGVjdGlvbnMudXBzZXJ0KHtjb2xsZWN0aW9uX2lkOiBjb2xJZH0sIHskc2V0OiBhd3NDb2x9KTtcbiAgICAgICAgY29uc29sZS5sb2coYHVwc2VydGVkIGNvbGxlY3Rpb246ICR7SlNPTi5zdHJpbmdpZnkoZXhpc3RpbmdDb2wpfWApO1xuICAgICAgICAvLyBOb3cgdHJ5IGdldHRpbmcgZXhpc3RpbmcgZmFjZXMgZm9yIGVhY2ggY29sbGVjdGlvblxuICAgICAgICBsZXQgZmFjZVBhcmFtcyA9IHtcbiAgICAgICAgICBDb2xsZWN0aW9uSWQ6IGNvbElkXG4gICAgICAgIH07XG4gICAgICAgIGxldCBmYWNlUmVxdWVzdCA9IHJla29nbml0aW9uLmxpc3RGYWNlcyhmYWNlUGFyYW1zKTtcbiAgICAgICAgbGV0IHByb21pc2UgPSBmYWNlUmVxdWVzdC5wcm9taXNlKCk7XG4gICAgICAgIGxldCBmYWNlcyA9IHByb21pc2UudGhlbihyZXN1bHQgPT4ge1xuICAgICAgICAgIGlmKHJlc3VsdCAmJiByZXN1bHQuRmFjZXMubGVuZ3RoID4gMCl7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgY29sbGVjdGlvbiBoYXMgJHtyZXN1bHQuRmFjZXMubGVuZ3RofSBmYWNlc2ApO1xuICAgICAgICAgICAgXy5lYWNoKHJlc3VsdC5GYWNlcywgZnVuY3Rpb24oZmFjZSl7XG4gICAgICAgICAgICAgIGxldCBhd3NGYWNlID0ge1xuICAgICAgICAgICAgICAgIHByaW50X2lkOiBmYWNlLkZhY2VJZCxcbiAgICAgICAgICAgICAgICBwcmludF9uYW1lOiBmYWNlLkV4dGVybmFsSW1hZ2VJZCB8fCBmYWNlLkltYWdlSWQsXG4gICAgICAgICAgICAgICAgcHJpbnRfdHlwZTogXCJmYWNlXCIsXG4gICAgICAgICAgICAgICAgcHJpbnRfY29sbGVjdGlvbjogY29sSWQsXG4gICAgICAgICAgICAgICAgcHJpbnRfZGV0YWlsczogZmFjZSxcbiAgICAgICAgICAgICAgICBwcmludF9hZGRlcjogXCJyb290XCJcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgUHJpbnRzLnNpbXBsZVNjaGVtYSgpLmNsZWFuKGF3c0ZhY2UpO1xuICAgICAgICAgICAgICBsZXQgZXhpc3RpbmdGYWNlID0gUHJpbnRzLnVwc2VydCh7cHJpbnRfaWQ6IGZhY2UuRmFjZUlkfSwgeyRzZXQ6IGF3c0ZhY2V9KTtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coZXhpc3RpbmdGYWNlKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9KTtcblxuICBpZiAoUHJpbnRzLmZpbmQoKS5jb3VudCgpIDwgMTUpIHtcbiAgICBjb25zb2xlLmxvZyhcInNlZWRpbmcgcHJpbnRzLi4uXCIpO1xuICAgIGxldCBzZWVkUHJpbnRzID0gW11cbiAgICBfLnRpbWVzKDUsICgpPT57XG4gICAgICBsZXQgcHJpbnQgPSB7XG4gICAgICAgIHByaW50X2FkZGVyOiB0aGlzLnVzZXJJZCB8fCBcImRlZGVkXCIsXG4gICAgICAgIHByaW50X2NvbGxlY3Rpb246IFwicGVvcGxlXCIsXG4gICAgICAgIHByaW50X25hbWU6IGZha2VyLmhlbHBlcnMudXNlckNhcmQoKS5uYW1lLFxuICAgICAgICBwcmludF9pZDogZmFrZXIucmFuZG9tLnV1aWQoKSxcbiAgICAgICAgcHJpbnRfaW1nOiBmYWtlci5pbWFnZS5hdmF0YXIoKVxuICAgICAgfTtcbiAgICAgIGxldCBwcmludElkID0gUHJpbnRzLmluc2VydChwcmludCk7XG4gICAgICBzZWVkUHJpbnRzLnB1c2gocHJpbnRJZCk7XG4gICAgfSk7XG4gICAgY29uc29sZS5sb2coc2VlZFByaW50cyk7XG5cbiAgfTtcbn0pOyIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNy1wcmVzZW50IEFudG1vdW5kcy5jb20sIEluYy4gb3IgaXRzIGFmZmlsaWF0ZXMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEdOVSBBZmZlcm8gR2VuZXJhbCBQdWJsaWMgTGljZW5zZSwgdmVyc2lvbiAzLjAgKHRoZSBcIkxpY2Vuc2VcIikuIFlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aFxuICogdGhlIExpY2Vuc2UuIEEgY29weSBvZiB0aGUgTGljZW5zZSBpcyBsb2NhdGVkIGF0XG4gKlxuICogICAgIGh0dHBzOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvYWdwbC0zLjAuZW4uaHRtbFxuICpcbiAqIG9yIGluIHRoZSBcImxpY2Vuc2VcIiBmaWxlIGFjY29tcGFueWluZyB0aGlzIGZpbGUuIFRoaXMgZmlsZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUlxuICogQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zXG4gKiBhbmQgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbmltcG9ydCB7IE1ldGVvciB9IGZyb20gJ21ldGVvci9tZXRlb3InO1xuaW1wb3J0IHsgSFRUUCB9IGZyb20gJ21ldGVvci9odHRwJztcbi8vIGltcG9ydCAnLi4vYWNjb3VudHMtY29uZmlnLmpzJztcbmltcG9ydCAnLi9maXh0dXJlcy5qcyc7XG4vLyBUaGlzIGRlZmluZXMgYWxsIHRoZSBjb2xsZWN0aW9ucywgcHVibGljYXRpb25zIGFuZCBtZXRob2RzIHRoYXQgdGhlIGFwcGxpY2F0aW9uIHByb3ZpZGVzXG4vLyBhcyBhbiBBUEkgdG8gdGhlIGNsaWVudC5cbmltcG9ydCAnLi9yZWdpc3Rlci1hcGkuanMnO1xuXG5jb25zdCBvcyA9IHJlcXVpcmUoJ29zJyk7XG5cblxuc2VydmVyX21vZGUgPSBNZXRlb3IuaXNQcm9kdWN0aW9uID8gXCJQUk9EVUNUSU9OXCIgOiBcIkRFVkVMT1BNRU5UXCI7XG5jb25zb2xlLmxvZygnaW5kZXguanM6ICcgKyBzZXJ2ZXJfbW9kZSArIFwiLS0+XCIgKyBKU09OLnN0cmluZ2lmeShNZXRlb3Iuc2V0dGluZ3MpKTtcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXG5cdGluZm8oKXtcblx0XHRyZXR1cm4gYHZlcnNpb246IDAuOS4wIC0gYnVpbGQ6ICR7cHJvY2Vzcy5lbnYuQlVJTEQgfHwgJ2Rldid9IC0gaG9zdG5hbWU6ICR7b3MuaG9zdG5hbWUoKX1gO1xuXHR9LFxuXG5cdGFzeW5jIGdldERhdGEoKXsgICAgXG5cdFx0dHJ5e1xuXHRcdFx0dmFyIHJlc3BvbnNlID0ge307XG5cdFx0XHRjb25zdCByZXN1bHRzID0gYXdhaXQgSFRUUC5jYWxsKCdHRVQnLCAnaHR0cDovL2pzb25wbGFjZWhvbGRlci50eXBpY29kZS5jb20vcG9zdHMnKTtcdFxuXHRcdFx0Y29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkocmVzdWx0cy5kYXRhWzBdKSk7XHRcblx0XHRcdGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHJlc3VsdHMuaGVhZGVycykpO1xuXHRcdFx0cmVzcG9uc2UuY29kZSA9IHRydWU7XHRcdFxuXHRcdFx0cmVzcG9uc2UuZGF0YSA9IHJlc3VsdHM7XHRcblx0XHR9IGNhdGNoKGUpe1xuXHRcdFx0cmVzcG9uc2UgPSBmYWxzZTtcblx0XHRcdGNvbnNvbGUubG9nKGUpO1xuXHRcdH0gZmluYWxseSB7XG5cdFx0XHRjb25zb2xlLmxvZyhcImZpbmFsbHkuLi5cIilcblx0XHRcdC8vdGhyb3cgbmV3IE1ldGVvci5FcnJvcihcImluYXBwcm9wcmlhdGUtcGljXCIsXCJUaGUgdXNlciBoYXMgdGFrZW4gYW4gaW5hcHByb3ByaWF0ZSBwaWN0dXJlLlwiKTtcdFxuXHRcdFx0cmV0dXJuIHJlc3BvbnNlO1xuXHRcdH1cblx0fVxuXG59KTtcblxuTWV0ZW9yLm9uQ29ubmVjdGlvbigoY29ubmVjdGlvbik9Pntcblx0bGV0IGNsaWVudEFkZHIgPSBjb25uZWN0aW9uLmNsaWVudEFkZHJlc3M7XG5cdGxldCBoZWFkZXJzID0gY29ubmVjdGlvbi5odHRwSGVhZGVycztcblx0Y29uc29sZS5sb2coYGNvbm5lY3Rpb24gZnJvbSAke2NsaWVudEFkZHJ9YCk7XG5cdC8vIGNvbnNvbGUubG9nKGhlYWRlcnMpO1xufSkiLCJpbXBvcnQgJy4uLy4uL2FwaS9jb2xsZWN0aW9ucy9tZXRob2RzLmpzJztcbmltcG9ydCAnLi4vLi4vYXBpL2NvbGxlY3Rpb25zL3B1YmxpY2F0aW9ucy5qcyc7XG5pbXBvcnQgJy4uLy4uL2FwaS9zZWFyY2hlcy9tZXRob2RzLmpzJztcbmltcG9ydCAnLi4vLi4vYXBpL3NlYXJjaGVzL3B1YmxpY2F0aW9ucy5qcyc7XG5pbXBvcnQgJy4uLy4uL2FwaS9wcmludHMvbWV0aG9kcy5qcyc7XG5pbXBvcnQgJy4uLy4uL2FwaS9wcmludHMvcHVibGljYXRpb25zLmpzJzsiLCIvKlxuICogQ29weXJpZ2h0IDIwMTctcHJlc2VudCBBbnRtb3VuZHMuY29tLCBJbmMuIG9yIGl0cyBhZmZpbGlhdGVzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBHTlUgQWZmZXJvIEdlbmVyYWwgUHVibGljIExpY2Vuc2UsIHZlcnNpb24gMy4wICh0aGUgXCJMaWNlbnNlXCIpLiBZb3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGhcbiAqIHRoZSBMaWNlbnNlLiBBIGNvcHkgb2YgdGhlIExpY2Vuc2UgaXMgbG9jYXRlZCBhdFxuICpcbiAqICAgICBodHRwczovL3d3dy5nbnUub3JnL2xpY2Vuc2VzL2FncGwtMy4wLmVuLmh0bWxcbiAqXG4gKiBvciBpbiB0aGUgXCJsaWNlbnNlXCIgZmlsZSBhY2NvbXBhbnlpbmcgdGhpcyBmaWxlLiBUaGlzIGZpbGUgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1JcbiAqIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9uc1xuICogYW5kIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5pbXBvcnQgJy4uL2ltcG9ydHMvc3RhcnR1cC9zZXJ2ZXInO1xuXG5NZXRlb3Iuc3RhcnR1cCgoKSA9PiB7XG4gIC8vIGNvZGUgdG8gcnVuIG9uIHNlcnZlciBhdCBzdGFydHVwXG59KTtcbiJdfQ==
