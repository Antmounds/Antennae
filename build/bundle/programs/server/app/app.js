var require = meteorInstall({"imports":{"api":{"collections":{"collections.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// imports/api/collections/collections.js                                                                            //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
    defaultValue: "My_Collection",
    index: true,
    unique: true
  },
  "collection_name": {
    type: String,
    label: "Collection Name",
    optional: false,
    defaultValue: "My Collection",
    index: true
  },
  "collection_type": {
    type: String,
    label: "Collection type",
    optional: false,
    allowedValues: ["face", "voice"],
    defaultValue: "face"
  },
  "print_count": {
    type: Number,
    label: "Print count",
    optional: true,
    defaultValue: 0
  },
  "private": {
    type: Boolean,
    label: "Collection privacy",
    optional: true,
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
  print_count: 1,
  private: 1,
  created: 1,
  updated: 1
}; // Collections.helpers({
//   // A collections is considered to be private if "private" is set to true
//   isPrivate() {
//     return this.private;
//   }
// });
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"methods.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// imports/api/collections/methods.js                                                                                //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
    check(newCol.collection_name, String);
    newCol.collection_id = newCol.collection_name.replace(/ /g, "__");
    newCol.private = true;
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
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publications.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// imports/api/collections/publications.js                                                                           //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"prints":{"methods.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// imports/api/prints/methods.js                                                                                     //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
    newPrint.print_adder = this.userId || null;
    newPrint.print_collection_id = col._id || null;
    newPrint.print_name = newPrint.name.replace(/ /g, "__");
    newPrint.print_img = newPrint.img; // console.log(newPrint);

    if (!newPrint) {
      throw new Meteor.Error('invalid-print', 'submitted print is invalid!');
    }

    ;
    Prints.simpleSchema().clean(newPrint); // index a face into a collection

    let faceParams = {
      CollectionId: col.collection_id,
      ExternalImageId: newPrint.print_name,
      Image: {
        "Bytes": new Buffer.from(newPrint.print_img.split(",")[1], "base64")
      },
      DetectionAttributes: ["ALL"]
    };
    console.log(1);
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
    let print = Prints.findOne(printId);
    let col = Collections.findOne(print.print_collection_id);
    console.log(print);

    if (!print) {
      throw new Meteor.Error('no-print', 'No print found with given id!');
    } else {
      let params = {
        CollectionId: col.collection_id,
        FaceIds: [print.print_id]
      };
      let printRequest = rekognition.deleteFaces(params).promise().catch(error => {
        throw new Meteor.Error(error.code, error.message, error);
        return error;
      });
      printRequest.then(values => {
        let oldPrint = Prints.remove(print._id);

        if (oldPrint) {
          console.log(`deleted face: ${printId}`);
        } else {
          console.log(printId);
          throw new Meteor.Error('remove-print-error', `error removing print: ${printId}`);
        }

        ;
        return values;
      });
      return `removed print: ${printId}`;
    }

    ;
  }

}); // Define a rule to limit method calls

let deletePrintRule = {
  type: 'method',
  name: 'print.delete'
}; // Add the rule, allowing up to 1 scan every 1 seconds

DDPRateLimiter.addRule(deletePrintRule, 1, 1000);
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"prints.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// imports/api/prints/prints.js                                                                                      //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
  "print_collection_id": {
    type: String,
    label: "Print collection mongo _id",
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
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publications.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// imports/api/prints/publications.js                                                                                //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"searches":{"methods.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// imports/api/searches/methods.js                                                                                   //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
let Random;
module.watch(require("meteor/random"), {
  Random(v) {
    Random = v;
  }

}, 2);
let Collections;
module.watch(require("../collections/collections.js"), {
  Collections(v) {
    Collections = v;
  }

}, 3);
let Prints;
module.watch(require("../prints/prints.js"), {
  Prints(v) {
    Prints = v;
  }

}, 4);
let Searches;
module.watch(require("./searches.js"), {
  Searches(v) {
    Searches = v;
  }

}, 5);
AWS.config.region = 'us-east-1';
var rekognition = new AWS.Rekognition();
var s3 = new AWS.S3();
Meteor.methods({
  "getDashboardStats"() {
    let dashboardStats = {};
    dashboardStats.collections = Collections.find({}).count();
    dashboardStats.faces = Prints.find().count(); // dashboardStats.faces = Collections.aggregate(
    // 	   [
    // 	     {
    // 	       $group:
    // 			{
    // 				_id: "$collection_id",
    // 				// face_count: { $sum: "$print_count" },
    // 				count: { $sum: 1 }
    // 			}
    // 	     },
    // 	     {
    // 	     	$project:
    // 	     	{
    // 	     		_id: 1,
    // 	     		count: 1
    // 	     	}
    // 	     }
    // 	   ]
    // 	);

    dashboardStats.searches = Searches.find({}).count();
    dashboardStats.matches = Searches.find({
      'search_results.persons': {
        $ne: []
      }
    }).count();
    dashboardStats.matchPercent = Math.round(dashboardStats.matches / dashboardStats.searches * 100 * 10) / 10 || 0;
    console.log(dashboardStats.faces);
    return dashboardStats;
  },

  "search.face"(searchData) {
    return Promise.asyncApply(() => {
      //return 1;
      // if(!Meteor.user){
      // 	throw new Meteor.Error('not-logged-in','must be logged-in to perform search');
      // 	return false;
      // }
      // let matchThreshold = matchThreshold;
      check(searchData.matchThreshold, Number);
      console.log("ANALYZING IMAGE...");
      var t0 = new Date().getTime();
      let imgBytes = new Buffer.from(searchData.img.split(",")[1], "base64");
      let imgFileName = `uploads/images/${Random.id()}.jpg`;
      let uploadBucket = "antennae";
      let s3Params = {
        ACL: 'private',
        Body: imgBytes,
        Bucket: uploadBucket,
        ContentEncoding: 'base64',
        ContentType: 'image/jpeg',
        Key: imgFileName,
        Metadata: {
          'Content-Type': 'image/jpeg'
        },
        Tagging: `Name=${imgFileName}&Application=Antennae&Owner=Antmounds`
      }; // console.log(s3Params);

      let s3Results = Promise.await(s3.putObject(s3Params).promise().catch(error => {
        throw new Meteor.Error(error.code, error.message, error);
        return error;
      }).then(value => {
        // console.log(value);
        return value;
      }));
      console.log(s3Results); // get signed url for image valid for 1 day

      s3Params = {
        Bucket: uploadBucket,
        Key: imgFileName,
        Expires: 86400 // 1-day url expiration

      };
      let s3SignedUrl = s3.getSignedUrl("getObject", s3Params);
      console.log(s3SignedUrl); // let colId = Meteor.user().profile.collections;

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
          // "Bytes": imgBytes,
          "S3Object": {
            "Bucket": uploadBucket,
            "Name": imgFileName
          }
        },
        "MinConfidence": 50
      };
      let labelParams = {
        "Image": {
          // "Bytes": imgBytes,
          "S3Object": {
            "Bucket": uploadBucket,
            "Name": imgFileName
          }
        },
        "MaxLabels": 20,
        "MinConfidence": 75
      };
      let faceParams = {
        "Image": {
          // "Bytes": imgBytes,
          "S3Object": {
            "Bucket": uploadBucket,
            "Name": imgFileName
          }
        },
        "Attributes": ["ALL"]
      };
      let celebrityParams = {
        "Image": {
          // "Bytes": imgBytes,
          "S3Object": {
            "Bucket": uploadBucket,
            "Name": imgFileName
          }
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
          "FaceMatchThreshold": searchData.matchThreshold || 95,
          "MaxFaces": 2,
          "Image": {
            "S3Object": {
              "Bucket": uploadBucket,
              "Name": imgFileName
            }
          }
        };
        console.log(rekognitionParams);
        let rekognitionRequest = rekognition.searchFacesByImage(rekognitionParams);
        allPromises.push(rekognitionRequest.promise().catch(error => {
          throw new Meteor.Error(error.code, error.message, error);
          return error;
        }));
        console.log(colId.collection_id);
      }); // Fulfill promises in parallel


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
            console.log(values[i].FaceMatches[0].Face.FaceId);
            let colId = Prints.findOne({
              print_id: values[i].FaceMatches[0].Face.FaceId
            }, {
              fields: {
                print_collection_id: 1
              }
            }).print_collection_id;
            let tag = {
              collection: Collections.findOne(colId, {
                fields: {
                  collection_name: 1
                }
              }).collection_name,
              image_id: values[i].FaceMatches[0].Face.ExternalImageId.replace(/__/g, " "),
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
          persons: persons,
          url: s3SignedUrl
        };
        let search = {
          search_image: s3SignedUrl,
          station_name: searchData.stationName,
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
        console.log('finally'); // console.log(this);
      });
      console.log(response);
      let t1 = new Date().getTime();
      console.log(`Request took ${t1 - t0} ms`);
      return response;
    });
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
  name: 'search.face'
}; // Add the rule, allowing up to 1 scan every 5 seconds

DDPRateLimiter.addRule(runScanRule, 1, 5000);
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publications.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// imports/api/searches/publications.js                                                                              //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"searches.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// imports/api/searches/searches.js                                                                                  //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
  "station_name": {
    type: String,
    label: "Station search performed at",
    optional: true,
    defaultValue: "Station 1"
  },
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
  station_name: 1,
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
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"startup":{"server":{"fixtures.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// imports/startup/server/fixtures.js                                                                                //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
  console.log("syncing aws collections...");
  let colParams = {};
  let colRequest = rekognition.listCollections();
  let promise = colRequest.promise(); // colParams = {
  //            "CollectionId": "macies"
  //         };
  //   let test =      rekognition.describeCollection(colParams).promise().catch(error => { throw new Meteor.Error(error.code, error.message, error); return error; }).then(result => {
  //           console.log(result);
  //           return result;
  //         });
  //     console.log(test);

  let cols = promise.then(result => {
    console.log(result);

    if (result && result.CollectionIds.length > 0) {
      _.each(result.CollectionIds, function (colId) {
        let awsCol = {
          collection_id: colId,
          collection_name: colId.replace("__", " "),
          collection_type: "face",
          private: true
        }; // describe collection to get face count

        colParams = {
          "CollectionId": colId
        };
        let colResults = rekognition.describeCollection(colParams).promise().catch(error => {
          throw new Meteor.Error(error.code, error.message, error);
          return error;
        }).then(result => {
          awsCol.print_count = result.FaceCount;
          console.log(`${colId} collection has ${result.FaceCount} faces`);
          console.log(awsCol);
          let existingCol = Collections.upsert({
            collection_id: colId
          }, {
            $set: awsCol
          });
          console.log(`upserted collection: ${JSON.stringify(existingCol)}`);
        });
        console.log(colResults); // Now try getting existing faces for each collection

        let faceParams = {
          CollectionId: colId
        };
        let faceRequest = rekognition.listFaces(faceParams);
        let promise = faceRequest.promise();
        let faces = promise.then(result => {
          if (result && result.Faces.length > 0) {
            let collection_id = Collections.findOne({
              collection_id: colId
            })._id;

            _.each(result.Faces, face => {
              let awsFace = {
                print_id: face.FaceId,
                print_name: face.ExternalImageId.replace("__", " ") || face.ImageId,
                print_type: "face",
                print_collection_id: collection_id,
                print_details: face,
                print_adder: "root"
              };
              Prints.simpleSchema().clean(awsFace);
              let existingFace = Prints.upsert({
                print_id: face.FaceId
              }, {
                $set: awsFace
              });
              console.log(`upserted print: ${JSON.stringify(existingFace)}`);
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
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// imports/startup/server/index.js                                                                                   //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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

server_mode = Meteor.isProduction ? "PRODUCTION" : "DEVELOPMENT"; // console.log('index.js: ' + server_mode + "-->" + JSON.stringify(Meteor.settings));

Meteor.methods({
  info() {
    return `release: ${process.env.VERSION || '0.X'}-lite - version: ${process.env.VERSION || '0.X'} - build: ${process.env.BUILD || 'dev'} - hostname: ${os.hostname()}`;
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
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"register-api.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// imports/startup/server/register-api.js                                                                            //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
module.watch(require("../../api/collections/methods.js"));
module.watch(require("../../api/collections/publications.js"));
module.watch(require("../../api/searches/methods.js"));
module.watch(require("../../api/searches/publications.js"));
module.watch(require("../../api/prints/methods.js"));
module.watch(require("../../api/prints/publications.js"));
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"accounts-config.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// imports/startup/accounts-config.js                                                                                //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"server":{"main.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// server/main.js                                                                                                    //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
module.watch(require("../imports/startup/server"));
Meteor.startup(() => {// code to run on server at startup
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/server/main.js");
//# sourceURL=meteor://💻app/app/app.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvY29sbGVjdGlvbnMvY29sbGVjdGlvbnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL2NvbGxlY3Rpb25zL21ldGhvZHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL2NvbGxlY3Rpb25zL3B1YmxpY2F0aW9ucy5qcyIsIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvcHJpbnRzL21ldGhvZHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL3ByaW50cy9wcmludHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL3ByaW50cy9wdWJsaWNhdGlvbnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL3NlYXJjaGVzL21ldGhvZHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL3NlYXJjaGVzL3B1YmxpY2F0aW9ucy5qcyIsIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvc2VhcmNoZXMvc2VhcmNoZXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvc3RhcnR1cC9zZXJ2ZXIvZml4dHVyZXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvc3RhcnR1cC9zZXJ2ZXIvaW5kZXguanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvc3RhcnR1cC9zZXJ2ZXIvcmVnaXN0ZXItYXBpLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9pbXBvcnRzL3N0YXJ0dXAvYWNjb3VudHMtY29uZmlnLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9zZXJ2ZXIvbWFpbi5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnQiLCJDb2xsZWN0aW9ucyIsIk1vbmdvIiwid2F0Y2giLCJyZXF1aXJlIiwidiIsIlNpbXBsZVNjaGVtYSIsIk1ldGVvciIsIkNvbGxlY3Rpb24iLCJkZW55IiwiaW5zZXJ0IiwidXBkYXRlIiwicmVtb3ZlIiwiU2NoZW1hIiwidHlwZSIsIlN0cmluZyIsImxhYmVsIiwib3B0aW9uYWwiLCJkZWZhdWx0VmFsdWUiLCJpbmRleCIsInVuaXF1ZSIsImFsbG93ZWRWYWx1ZXMiLCJOdW1iZXIiLCJCb29sZWFuIiwiRGF0ZSIsImF1dG9WYWx1ZSIsImlzSW5zZXJ0IiwiaXNVcGRhdGUiLCJhdHRhY2hTY2hlbWEiLCJwdWJsaWNGaWVsZHMiLCJjb2xsZWN0aW9uX2lkIiwiY29sbGVjdGlvbl9uYW1lIiwiY29sbGVjdGlvbl90eXBlIiwicHJpbnRfY291bnQiLCJwcml2YXRlIiwiY3JlYXRlZCIsInVwZGF0ZWQiLCJERFBSYXRlTGltaXRlciIsIkFXUyIsImRlZmF1bHQiLCJjb25maWciLCJyZWdpb24iLCJyZWtvZ25pdGlvbiIsIlJla29nbml0aW9uIiwibWV0aG9kcyIsIm5ld0NvbCIsImNoZWNrIiwicmVwbGFjZSIsImNvbnNvbGUiLCJsb2ciLCJjb2xsZWN0aW9uUGFyYW1zIiwiQ29sbGVjdGlvbklkIiwiY29sbGVjdGlvblJlcXVlc3QiLCJjcmVhdGVDb2xsZWN0aW9uIiwicHJvbWlzZSIsImNhdGNoIiwiZXJyb3IiLCJFcnJvciIsImNvZGUiLCJtZXNzYWdlIiwidGhlbiIsInZhbHVlcyIsImNvbCIsImNvbElkIiwiZmluZE9uZSIsInBhcmFtcyIsImRlbGV0ZUNvbGxlY3Rpb24iLCJvbGRDb2wiLCJfaWQiLCJwdWJsaXNoIiwiY29sbGVjdGlvbklkIiwiZmluZCIsInNvcnQiLCJmaWVsZHMiLCJzdWJzY3JpYmVUb0NvbGxlY3Rpb25zUnVsZSIsIm5hbWUiLCJhZGRSdWxlIiwiUHJpbnRzIiwibmV3UHJpbnQiLCJjb2xsZWN0aW9uIiwicHJpbnRfYWRkZXIiLCJ1c2VySWQiLCJwcmludF9jb2xsZWN0aW9uX2lkIiwicHJpbnRfbmFtZSIsInByaW50X2ltZyIsImltZyIsInNpbXBsZVNjaGVtYSIsImNsZWFuIiwiZmFjZVBhcmFtcyIsIkV4dGVybmFsSW1hZ2VJZCIsIkltYWdlIiwiQnVmZmVyIiwiZnJvbSIsInNwbGl0IiwiRGV0ZWN0aW9uQXR0cmlidXRlcyIsImZhY2VSZXF1ZXN0IiwiaW5kZXhGYWNlcyIsImluZGV4RmFjZSIsInJlc3VsdCIsInByaW50X2lkIiwiRmFjZVJlY29yZHMiLCJGYWNlIiwiRmFjZUlkIiwicHJpbnQiLCJwcmludElkIiwiRmFjZUlkcyIsInByaW50UmVxdWVzdCIsImRlbGV0ZUZhY2VzIiwib2xkUHJpbnQiLCJkZWxldGVQcmludFJ1bGUiLCJPYmplY3QiLCJibGFja2JveCIsInByaW50X3R5cGUiLCJwcmludF9kZXRhaWxzIiwic2VsZWN0b3IiLCJzdWJzY3JpYmVUb1ByaW50c1J1bGUiLCJSYW5kb20iLCJTZWFyY2hlcyIsInMzIiwiUzMiLCJkYXNoYm9hcmRTdGF0cyIsImNvbGxlY3Rpb25zIiwiY291bnQiLCJmYWNlcyIsInNlYXJjaGVzIiwibWF0Y2hlcyIsIiRuZSIsIm1hdGNoUGVyY2VudCIsIk1hdGgiLCJyb3VuZCIsInNlYXJjaERhdGEiLCJtYXRjaFRocmVzaG9sZCIsInQwIiwiZ2V0VGltZSIsImltZ0J5dGVzIiwiaW1nRmlsZU5hbWUiLCJpZCIsInVwbG9hZEJ1Y2tldCIsInMzUGFyYW1zIiwiQUNMIiwiQm9keSIsIkJ1Y2tldCIsIkNvbnRlbnRFbmNvZGluZyIsIkNvbnRlbnRUeXBlIiwiS2V5IiwiTWV0YWRhdGEiLCJUYWdnaW5nIiwiczNSZXN1bHRzIiwicHV0T2JqZWN0IiwidmFsdWUiLCJFeHBpcmVzIiwiczNTaWduZWRVcmwiLCJnZXRTaWduZWRVcmwiLCJjb2xJZHMiLCJmZXRjaCIsIm1vZGVyYXRpb25QYXJhbXMiLCJsYWJlbFBhcmFtcyIsImNlbGVicml0eVBhcmFtcyIsIm1vZGVyYXRpb25SZXF1ZXN0IiwiZGV0ZWN0TW9kZXJhdGlvbkxhYmVscyIsImxhYmVsUmVxdWVzdCIsImRldGVjdExhYmVscyIsImRldGVjdEZhY2VzIiwiY2VsZWJyaXR5UmVxdWVzdCIsInJlY29nbml6ZUNlbGVicml0aWVzIiwiYWxsUHJvbWlzZXMiLCJwdXNoIiwiXyIsImVhY2giLCJyZWtvZ25pdGlvblBhcmFtcyIsInJla29nbml0aW9uUmVxdWVzdCIsInNlYXJjaEZhY2VzQnlJbWFnZSIsInJlc3BvbnNlIiwiUHJvbWlzZSIsImFsbCIsIkpTT04iLCJzdHJpbmdpZnkiLCJpIiwicGVyc29ucyIsIkZhY2VNYXRjaGVzIiwidGFnIiwiaW1hZ2VfaWQiLCJmYWNlX2lkIiwic2ltaWxhcml0eSIsIlNpbWlsYXJpdHkiLCJ0MSIsInNlYXJjaF9yZXN1bHRzIiwibW9kZXJhdGlvbiIsIk1vZGVyYXRpb25MYWJlbHMiLCJsYWJlbHMiLCJMYWJlbHMiLCJmYWNlRGV0YWlscyIsIkZhY2VEZXRhaWxzIiwiY2VsZWJyaXR5IiwiQ2VsZWJyaXR5RmFjZXMiLCJ1cmwiLCJzZWFyY2giLCJzZWFyY2hfaW1hZ2UiLCJzdGF0aW9uX25hbWUiLCJzdGF0aW9uTmFtZSIsInNhdmVTZWFyY2giLCJyZWFzb24iLCJkZXRhaWxzIiwiZmluYWxseSIsInNlYXJjaElkIiwicnVuU2NhblJ1bGUiLCJzdWJzY3JpYmVUb1NlYXJjaGVzUnVsZSIsImlzU2VydmVyIiwic3RhcnR1cCIsIl9lbnN1cmVJbmRleCIsInNlYXJjaF90eXBlIiwic2VhcmNoX2NvbGxlY3Rpb25zIiwiY29sUGFyYW1zIiwiY29sUmVxdWVzdCIsImxpc3RDb2xsZWN0aW9ucyIsImNvbHMiLCJDb2xsZWN0aW9uSWRzIiwibGVuZ3RoIiwiYXdzQ29sIiwiY29sUmVzdWx0cyIsImRlc2NyaWJlQ29sbGVjdGlvbiIsIkZhY2VDb3VudCIsImV4aXN0aW5nQ29sIiwidXBzZXJ0IiwiJHNldCIsImxpc3RGYWNlcyIsIkZhY2VzIiwiZmFjZSIsImF3c0ZhY2UiLCJJbWFnZUlkIiwiZXhpc3RpbmdGYWNlIiwiSFRUUCIsIm9zIiwic2VydmVyX21vZGUiLCJpc1Byb2R1Y3Rpb24iLCJpbmZvIiwicHJvY2VzcyIsImVudiIsIlZFUlNJT04iLCJCVUlMRCIsImhvc3RuYW1lIiwiZ2V0RGF0YSIsInJlc3VsdHMiLCJjYWxsIiwiZGF0YSIsImhlYWRlcnMiLCJlIiwib25Db25uZWN0aW9uIiwiY29ubmVjdGlvbiIsImNsaWVudEFkZHIiLCJjbGllbnRBZGRyZXNzIiwiaHR0cEhlYWRlcnMiLCJBY2NvdW50cyIsIkFjY291bnRzQ29tbW9uIiwiQWNjb3VudHNDbGllbnQiLCJpc0NsaWVudCIsInVpIiwicGFzc3dvcmRTaWdudXBGaWVsZHMiLCJvbkNyZWF0ZVVzZXIiLCJvcHRpb25zIiwidXNlciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBQUEsT0FBT0MsTUFBUCxDQUFjO0FBQUNDLGVBQVksTUFBSUE7QUFBakIsQ0FBZDtBQUE2QyxJQUFJQyxLQUFKO0FBQVVILE9BQU9JLEtBQVAsQ0FBYUMsUUFBUSxjQUFSLENBQWIsRUFBcUM7QUFBQ0YsUUFBTUcsQ0FBTixFQUFRO0FBQUNILFlBQU1HLENBQU47QUFBUTs7QUFBbEIsQ0FBckMsRUFBeUQsQ0FBekQ7QUFBNEQsSUFBSUMsWUFBSjtBQUFpQlAsT0FBT0ksS0FBUCxDQUFhQyxRQUFRLDZCQUFSLENBQWIsRUFBb0Q7QUFBQ0UsZUFBYUQsQ0FBYixFQUFlO0FBQUNDLG1CQUFhRCxDQUFiO0FBQWU7O0FBQWhDLENBQXBELEVBQXNGLENBQXRGO0FBSzdILE1BQU1KLGNBQWMsSUFBSU0sT0FBT0MsVUFBWCxDQUFzQixhQUF0QixDQUFwQjtBQUVQO0FBQ0FQLFlBQVlRLElBQVosQ0FBaUI7QUFDZkMsV0FBUztBQUFFLFdBQU8sSUFBUDtBQUFjLEdBRFY7O0FBRWZDLFdBQVM7QUFBRSxXQUFPLElBQVA7QUFBYyxHQUZWOztBQUdmQyxXQUFTO0FBQUUsV0FBTyxJQUFQO0FBQWM7O0FBSFYsQ0FBakI7QUFNQVgsWUFBWVksTUFBWixHQUFxQixJQUFJUCxZQUFKLENBQWlCO0FBQ3BDO0FBQ0EsbUJBQWlCO0FBQ2ZRLFVBQU1DLE1BRFM7QUFFZkMsV0FBTyxlQUZRO0FBR2ZDLGNBQVUsS0FISztBQUlmQyxrQkFBYyxlQUpDO0FBS2ZDLFdBQU8sSUFMUTtBQU1mQyxZQUFRO0FBTk8sR0FGbUI7QUFVcEMscUJBQW1C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LENBQWIsRUFBNkM7QUFBQ3lQLGlCQUFleFAsQ0FBZixFQUFpQjtBQUFDd1AscUJBQWV4UCxDQUFmO0FBQWlCOztBQUFwQyxDQUE3QyxFQUFtRixDQUFuRjtBQUFzRixJQUFJeVAsY0FBSjtBQUFtQi9QLE9BQU9JLEtBQVAsQ0FBYUMsUUFBUSxzQkFBUixDQUFiLEVBQTZDO0FBQUMwUCxpQkFBZXpQLENBQWYsRUFBaUI7QUFBQ3lQLHFCQUFlelAsQ0FBZjtBQUFpQjs7QUFBcEMsQ0FBN0MsRUFBbUYsQ0FBbkY7O0FBS25OLElBQUlFLE9BQU93UCxRQUFYLEVBQXFCO0FBQ3BCSCxXQUFTSSxFQUFULENBQVl4TixNQUFaLENBQW1CO0FBQ2pCeU4sMEJBQXNCO0FBREwsR0FBbkI7QUFHQTs7QUFFRCxJQUFJMVAsT0FBT3dNLFFBQVgsRUFBcUI7QUFDcEIvSixVQUFRQyxHQUFSLENBQVkseUJBQVo7QUFDQTJNLFdBQVNNLFlBQVQsQ0FBc0IsQ0FBQ0MsT0FBRCxFQUFVQyxJQUFWLEtBQW1CO0FBQ3hDO0FBRUFwTixZQUFRQyxHQUFSLENBQVksV0FBV21OLElBQXZCO0FBQ0FwTixZQUFRQyxHQUFSLENBQVksY0FBY2tOLE9BQTFCLEVBSndDLENBS3hDOztBQUNBbk4sWUFBUUMsR0FBUixDQUFZbU4sSUFBWixFQU53QyxDQU94Qzs7QUFDQXBOLFlBQVFDLEdBQVIsQ0FBWWtOLE9BQVosRUFSd0MsQ0FVckM7O0FBQ0gsV0FBT0MsSUFBUDtBQUNBLEdBWkQ7QUFhQSxDOzs7Ozs7Ozs7OztBQzFCRHJRLE9BQU9JLEtBQVAsQ0FBYUMsUUFBUSwyQkFBUixDQUFiO0FBY0FHLE9BQU95TSxPQUFQLENBQWUsTUFBTSxDQUNuQjtBQUNELENBRkQsRSIsImZpbGUiOiIvYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTW9uZ28gfSBmcm9tICdtZXRlb3IvbW9uZ28nO1xuaW1wb3J0IHsgU2ltcGxlU2NoZW1hIH0gZnJvbSAnbWV0ZW9yL2FsZGVlZDpzaW1wbGUtc2NoZW1hJztcblxuXG5cbmV4cG9ydCBjb25zdCBDb2xsZWN0aW9ucyA9IG5ldyBNZXRlb3IuQ29sbGVjdGlvbignY29sbGVjdGlvbnMnKTtcblxuLy8gRGVueSBhbGwgY2xpZW50LXNpZGUgdXBkYXRlcyBzaW5jZSB3ZSB3aWxsIGJlIHVzaW5nIG1ldGhvZHMgdG8gbWFuYWdlIHRoaXMgY29sbGVjdGlvblxuQ29sbGVjdGlvbnMuZGVueSh7XG4gIGluc2VydCgpIHsgcmV0dXJuIHRydWU7IH0sXG4gIHVwZGF0ZSgpIHsgcmV0dXJuIHRydWU7IH0sXG4gIHJlbW92ZSgpIHsgcmV0dXJuIHRydWU7IH0sXG59KTtcblxuQ29sbGVjdGlvbnMuU2NoZW1hID0gbmV3IFNpbXBsZVNjaGVtYSh7XG4gIC8vIE91ciBzY2hlbWEgcnVsZXMgd2lsbCBnbyBoZXJlLlxuICBcImNvbGxlY3Rpb25faWRcIjoge1xuICAgIHR5cGU6IFN0cmluZyxcbiAgICBsYWJlbDogXCJDb2xsZWN0aW9uIElEXCIsXG4gICAgb3B0aW9uYWw6IGZhbHNlLFxuICAgIGRlZmF1bHRWYWx1ZTogXCJNeV9Db2xsZWN0aW9uXCIsXG4gICAgaW5kZXg6IHRydWUsXG4gICAgdW5pcXVlOiB0cnVlXG4gIH0sXG4gIFwiY29sbGVjdGlvbl9uYW1lXCI6IHtcbiAgICB0eXBlOiBTdHJpbmcsXG4gICAgbGFiZWw6IFwiQ29sbGVjdGlvbiBOYW1lXCIsXG4gICAgb3B0aW9uYWw6IGZhbHNlLFxuICAgIGRlZmF1bHRWYWx1ZTogXCJNeSBDb2xsZWN0aW9uXCIsXG4gICAgaW5kZXg6IHRydWVcbiAgfSxcbiAgXCJjb2xsZWN0aW9uX3R5cGVcIjoge1xuICAgIHR5cGU6IFN0cmluZyxcbiAgICBsYWJlbDogXCJDb2xsZWN0aW9uIHR5cGVcIixcbiAgICBvcHRpb25hbDogZmFsc2UsXG4gICAgYWxsb3dlZFZhbHVlczogW1wiZmFjZVwiLCBcInZvaWNlXCJdLFxuICAgIGRlZmF1bHRWYWx1ZTogXCJmYWNlXCJcbiAgfSxcbiAgXCJwcmludF9jb3VudFwiOiB7XG4gICAgdHlwZTogTnVtYmVyLFxuICAgIGxhYmVsOiBcIlByaW50IGNvdW50XCIsXG4gICAgb3B0aW9uYWw6IHRydWUsXG4gICAgZGVmYXVsdFZhbHVlOiAwXG4gIH0sXG4gIFwicHJpdmF0ZVwiOiB7XG4gICAgdHlwZTogQm9vbGVhbixcbiAgICBsYWJlbDogXCJDb2xsZWN0aW9uIHByaXZhY3lcIixcbiAgICBvcHRpb25hbDogdHJ1ZSxcbiAgICBkZWZhdWx0VmFsdWU6IHRydWVcbiAgfSxcbiAgXCJjcmVhdGVkXCI6IHtcbiAgICB0eXBlOiBEYXRlLFxuICAgIGxhYmVsOiBcIkRhdGUgY29sbGVjdGlvbiBhZGRlZCB0byBBbnRlbm5hZVwiLFxuICAgIGF1dG9WYWx1ZTogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoIHRoaXMuaXNJbnNlcnQgKSB7XG4gICAgICAgIHJldHVybiBuZXcgRGF0ZTtcbiAgICAgIH0gXG4gICAgfSxcbiAgICBvcHRpb25hbDogdHJ1ZVxuICB9LFxuICBcInVwZGF0ZWRcIjoge1xuICAgIHR5cGU6IERhdGUsXG4gICAgbGFiZWw6IFwiRGF0ZSBjb2xsZWN0aW9uIHVwZGF0ZWQgaW4gU3lzdGVtXCIsXG4gICAgYXV0b1ZhbHVlOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICggdGhpcy5pc1VwZGF0ZSApIHtcbiAgICAgICAgcmV0dXJuIG5ldyBEYXRlO1xuICAgICAgfSBcbiAgICB9LFxuICAgIG9wdGlvbmFsOiB0cnVlXG4gIH1cbn0pO1xuXG5Db2xsZWN0aW9ucy5hdHRhY2hTY2hlbWEoIENvbGxlY3Rpb25zLlNjaGVtYSApOyBcblxuXG5Db2xsZWN0aW9ucy5wdWJsaWNGaWVsZHMgPSB7XG4gIGNvbGxlY3Rpb25faWQ6IDEsXG4gIGNvbGxlY3Rpb25fbmFtZTogMSxcbiAgY29sbGVjdGlvbl90eXBlOiAxLFxuICBwcmludF9jb3VudDogMSxcbiAgcHJpdmF0ZTogMSxcbiAgY3JlYXRlZDogMSxcbiAgdXBkYXRlZDogMVxufTtcblxuLy8gQ29sbGVjdGlvbnMuaGVscGVycyh7XG4vLyAgIC8vIEEgY29sbGVjdGlvbnMgaXMgY29uc2lkZXJlZCB0byBiZSBwcml2YXRlIGlmIFwicHJpdmF0ZVwiIGlzIHNldCB0byB0cnVlXG4vLyAgIGlzUHJpdmF0ZSgpIHtcbi8vICAgICByZXR1cm4gdGhpcy5wcml2YXRlO1xuLy8gICB9XG4vLyB9KTsiLCJpbXBvcnQgeyBERFBSYXRlTGltaXRlciB9IGZyb20gJ21ldGVvci9kZHAtcmF0ZS1saW1pdGVyJztcbmltcG9ydCBBV1MgZnJvbSAnYXdzLXNkayc7XG5cbmltcG9ydCB7IENvbGxlY3Rpb25zIH0gZnJvbSAnLi9jb2xsZWN0aW9ucy5qcyc7XG5cbkFXUy5jb25maWcucmVnaW9uID0gJ3VzLWVhc3QtMSc7XG52YXIgcmVrb2duaXRpb24gPSBuZXcgQVdTLlJla29nbml0aW9uKCk7XG5cbk1ldGVvci5tZXRob2RzKHtcblx0XCJjb2xsZWN0aW9uLnNhdmVcIihuZXdDb2wpe1xuXHRcdGNoZWNrKG5ld0NvbC5jb2xsZWN0aW9uX25hbWUsIFN0cmluZyk7XG5cdFx0bmV3Q29sLmNvbGxlY3Rpb25faWQgPSBuZXdDb2wuY29sbGVjdGlvbl9uYW1lLnJlcGxhY2UoLyAvZyxcIl9fXCIpO1xuXHRcdG5ld0NvbC5wcml2YXRlID0gdHJ1ZTtcblx0XHRjb25zb2xlLmxvZyhuZXdDb2wpO1xuXHRcdGxldCBjb2xsZWN0aW9uUGFyYW1zID0ge1xuICBcdFx0XHRDb2xsZWN0aW9uSWQ6IG5ld0NvbC5jb2xsZWN0aW9uX2lkXG5cdFx0fTtcblx0XHRsZXQgY29sbGVjdGlvblJlcXVlc3QgPSByZWtvZ25pdGlvbi5jcmVhdGVDb2xsZWN0aW9uKGNvbGxlY3Rpb25QYXJhbXMpLnByb21pc2UoKS5jYXRjaChlcnJvciA9PiB7IHRocm93IG5ldyBNZXRlb3IuRXJyb3IoZXJyb3IuY29kZSwgZXJyb3IubWVzc2FnZSwgZXJyb3IpOyByZXR1cm4gZXJyb3I7IH0pO1xuXHRcdGNvbGxlY3Rpb25SZXF1ZXN0LnRoZW4odmFsdWVzID0+IHtyZXR1cm4gdmFsdWVzfSk7XG5cdFx0bGV0IGNvbCA9IENvbGxlY3Rpb25zLmluc2VydChuZXdDb2wpO1xuXHRcdGlmKGNvbCl7XG5cdFx0XHRjb25zb2xlLmxvZyhgYWRkZWQgY29sbGVjdGlvbjogJHtjb2x9YCk7XG5cdFx0fWVsc2V7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhuZXdDb2wpO1xuICAgICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcignYWRkLWNvbGxlY3Rpb24tZXJyb3InLGBlcnJvciBhZGRpbmcgY29sbGVjdGlvbjogJHtuZXdDb2x9YClcdFx0XG5cdFx0fVxuXHRcdHJldHVybiBgYWRkZWQgY29sbGVjdGlvbjogJHtjb2x9YDtcblx0fSxcblxuXHRcImNvbGxlY3Rpb24uZGVsZXRlXCIoY29sSWQpe1xuXHRcdGNoZWNrKGNvbElkLFN0cmluZyk7XG5cdFx0bGV0IGNvbCA9IENvbGxlY3Rpb25zLmZpbmRPbmUoY29sSWQpO1xuXHRcdGNvbnNvbGUubG9nKGNvbCk7XG5cdFx0aWYoIWNvbCl7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCduby1jb2xsZWN0aW9uJywnTm8gY29sbGVjdGlvbiBmb3VuZCB3aXRoIGdpdmVuIGlkIScpO1xuXHRcdH1lbHNle1xuXHRcdFx0bGV0IHBhcmFtcyA9IHtcblx0XHRcdFx0Q29sbGVjdGlvbklkOiBjb2wuY29sbGVjdGlvbl9pZFxuXHRcdFx0fTtcblx0XHRcdGxldCBjb2xsZWN0aW9uUmVxdWVzdCA9IHJla29nbml0aW9uLmRlbGV0ZUNvbGxlY3Rpb24ocGFyYW1zKS5wcm9taXNlKCkuY2F0Y2goZXJyb3IgPT4geyB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKGVycm9yLmNvZGUsIGVycm9yLm1lc3NhZ2UsIGVycm9yKTsgcmV0dXJuIGVycm9yOyB9KTtcblx0XHRcdGNvbGxlY3Rpb25SZXF1ZXN0LnRoZW4odmFsdWVzID0+IHtyZXR1cm4gdmFsdWVzfSk7XG5cdFx0XHRsZXQgb2xkQ29sID0gQ29sbGVjdGlvbnMucmVtb3ZlKGNvbC5faWQpO1xuXHRcdFx0aWYob2xkQ29sKXtcblx0XHRcdFx0Y29uc29sZS5sb2coYHJlbW92ZWQgY29sbGVjdGlvbjogJHtvbGRDb2x9YCk7XG5cdFx0XHR9ZWxzZXtcblx0ICAgICAgICAgICAgY29uc29sZS5sb2coY29sSWQpO1xuXHQgICAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdyZW1vdmUtY29sbGVjdGlvbi1lcnJvcicsYGVycm9yIHJlbW92aW5nIGNvbGxlY3Rpb246ICR7Y29sSWR9YClcdFx0XG5cdFx0XHR9O1xuXHRcdFx0cmV0dXJuIGByZW1vdmVkIGNvbGxlY3Rpb246ICR7Y29sSWR9YDtcblx0XHRcdFx0Ly8gbGV0IHByaW50ID0gQ29sbGVjdGlvbnMucmVtb3ZlKGNvbElkKTtcblx0XHRcdFx0Ly8gY29uc29sZS5sb2coYGRlbGV0ZWQgY29sbGVjdGlvbjogJHtjb2xJZH1gKTtcblx0XHRcdFx0Ly8gcmV0dXJuIGBkZWxldGVkIGNvbGxlY3Rpb246ICR7Y29sSWR9YDtcblx0XHR9O1xuXHR9XG59KVxuXG4vLyBEZWZpbmUgYSBydWxlIHRvIGxpbWl0IG1ldGhvZCBjYWxsc1xuLy8gbGV0IHJ1blNjYW5SdWxlID0ge1xuLy8gXHR0eXBlOiAnbWV0aG9kJyxcbi8vIFx0bmFtZTogJ21vbWVudC5zY2FuJ1xuLy8gfTtcbi8vIEFkZCB0aGUgcnVsZSwgYWxsb3dpbmcgdXAgdG8gMSBzY2FuIGV2ZXJ5IDEwIHNlY29uZHNcbi8vIEREUFJhdGVMaW1pdGVyLmFkZFJ1bGUocnVuU2NhblJ1bGUsIDEsIDEwMDAwKTsiLCJpbXBvcnQgeyBERFBSYXRlTGltaXRlciB9IGZyb20gJ21ldGVvci9kZHAtcmF0ZS1saW1pdGVyJztcblxuaW1wb3J0IHsgQ29sbGVjdGlvbnMgfSBmcm9tICcuL2NvbGxlY3Rpb25zLmpzJztcblxuXG5NZXRlb3IucHVibGlzaCgnY29sbGVjdGlvbnMuZ2V0JywgZnVuY3Rpb24oY29sbGVjdGlvbklkPScnKSB7XG5cdGNoZWNrKGNvbGxlY3Rpb25JZCxTdHJpbmcpO1xuXHRjb2xsZWN0aW9uSWQgPSBjb2xsZWN0aW9uSWQgfHwge307XG4gIFx0Ly8gY29uc29sZS5sb2coQ29sbGVjdGlvbnMuZmluZChjb2xsZWN0aW9uSWQpLmNvdW50KCkpO1xuXHRyZXR1cm4gQ29sbGVjdGlvbnMuZmluZChcblx0XHRjb2xsZWN0aW9uSWQsIFxuXHQgIHsgXG5cdCAgXHRzb3J0OiB7IGNyZWF0ZWQ6IC0xIH0gXG5cdH1cblx0LCB7XG5cdFx0ZmllbGRzOiBDb2xsZWN0aW9ucy5wdWJsaWNGaWVsZHNcblx0fSk7XG59KTtcblxuLy8gRGVmaW5lIGEgcnVsZSB0byBsaW1pdCBzdWJzY3JpcHRpb24gY2FsbHNcbnZhciBzdWJzY3JpYmVUb0NvbGxlY3Rpb25zUnVsZSA9IHtcbiAgdHlwZTogJ3N1YnNjcmlwdGlvbicsXG4gIG5hbWU6ICdjb2xsZWN0aW9ucy5nZXQnXG59XG4vLyBBZGQgdGhlIHJ1bGUsIGFsbG93aW5nIHVwIHRvIDEgc3Vic2NyaXB0aW9uIGV2ZXJ5IDUgc2Vjb25kcy5cbkREUFJhdGVMaW1pdGVyLmFkZFJ1bGUoc3Vic2NyaWJlVG9Db2xsZWN0aW9uc1J1bGUsIDEsIDUwMDApOyIsImltcG9ydCB7IEREUFJhdGVMaW1pdGVyIH0gZnJvbSAnbWV0ZW9yL2RkcC1yYXRlLWxpbWl0ZXInO1xuaW1wb3J0IEFXUyBmcm9tICdhd3Mtc2RrJztcblxuaW1wb3J0IHsgQ29sbGVjdGlvbnMgfSBmcm9tICcuLi9jb2xsZWN0aW9ucy9jb2xsZWN0aW9ucy5qcyc7XG5pbXBvcnQgeyBQcmludHMgfSBmcm9tICcuL3ByaW50cy5qcyc7XG5cbkFXUy5jb25maWcucmVnaW9uID0gJ3VzLWVhc3QtMSc7XG52YXIgcmVrb2duaXRpb24gPSBuZXcgQVdTLlJla29nbml0aW9uKCk7XG5cbk1ldGVvci5tZXRob2RzKHtcblx0XCJwcmludC5zYXZlXCIobmV3UHJpbnQpe1xuXHRcdGxldCBjb2wgPSBDb2xsZWN0aW9ucy5maW5kT25lKG5ld1ByaW50LmNvbGxlY3Rpb24pO1xuXHRcdGNvbnNvbGUubG9nKGNvbCk7XG5cdFx0aWYoIWNvbCl7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCduby1jb2xsZWN0aW9uJywnTm8gY29sbGVjdGlvbiBmb3VuZCB3aXRoIGdpdmVuIGlkIScpO1xuXHRcdH07XG5cdFx0bmV3UHJpbnQucHJpbnRfYWRkZXIgPSB0aGlzLnVzZXJJZCB8fCBudWxsO1xuXHRcdG5ld1ByaW50LnByaW50X2NvbGxlY3Rpb25faWQgPSBjb2wuX2lkIHx8IG51bGw7XG5cdFx0bmV3UHJpbnQucHJpbnRfbmFtZSA9IG5ld1ByaW50Lm5hbWUucmVwbGFjZSgvIC9nLFwiX19cIik7XG5cdFx0bmV3UHJpbnQucHJpbnRfaW1nID0gbmV3UHJpbnQuaW1nO1xuXHRcdC8vIGNvbnNvbGUubG9nKG5ld1ByaW50KTtcblx0XHRpZighbmV3UHJpbnQpe1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignaW52YWxpZC1wcmludCcsJ3N1Ym1pdHRlZCBwcmludCBpcyBpbnZhbGlkIScpO1xuXHRcdH07XG5cdFx0UHJpbnRzLnNpbXBsZVNjaGVtYSgpLmNsZWFuKG5ld1ByaW50KTtcbiAgICAgICAgLy8gaW5kZXggYSBmYWNlIGludG8gYSBjb2xsZWN0aW9uXG4gICAgICAgIGxldCBmYWNlUGFyYW1zID0ge1xuICAgICAgICAgIENvbGxlY3Rpb25JZDogY29sLmNvbGxlY3Rpb25faWQsXG4gICAgICAgICAgRXh0ZXJuYWxJbWFnZUlkOiBuZXdQcmludC5wcmludF9uYW1lLFxuXHRcdCAgSW1hZ2U6IHsgXG5cdFx0XHRcIkJ5dGVzXCI6IG5ldyBCdWZmZXIuZnJvbShuZXdQcmludC5wcmludF9pbWcuc3BsaXQoXCIsXCIpWzFdLCBcImJhc2U2NFwiKSxcblx0XHQgIH0sXG4gICAgICAgICAgRGV0ZWN0aW9uQXR0cmlidXRlczogW1wiQUxMXCJdXG4gICAgICAgIH07XG4gICAgICAgIGNvbnNvbGUubG9nKDEpO1xuICAgICAgICBsZXQgZmFjZVJlcXVlc3QgPSByZWtvZ25pdGlvbi5pbmRleEZhY2VzKGZhY2VQYXJhbXMpO1xuICAgICAgICBsZXQgcHJvbWlzZSA9IGZhY2VSZXF1ZXN0LnByb21pc2UoKTtcbiAgICAgICAgbGV0IGluZGV4RmFjZSA9IHByb21pc2UudGhlbihyZXN1bHQgPT4ge1xuICAgICAgICBcdC8vIGNvbnNvbGUubG9nKHJlc3VsdCk7XG4gICAgICAgIFx0bmV3UHJpbnQucHJpbnRfaWQgPSByZXN1bHQuRmFjZVJlY29yZHNbMF0uRmFjZS5GYWNlSWQ7XG5cdFx0XHRsZXQgcHJpbnQgPSBQcmludHMuaW5zZXJ0KG5ld1ByaW50KTtcbiAgICAgICAgXHRjb25zb2xlLmxvZyhgaW5zZXJ0ZWQ6ICR7cHJpbnR9YCk7XG4gICAgICAgIFx0cmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSkuY2F0Y2goZXJyb3IgPT4ge1xuICAgICAgICBcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoZXJyb3IuY29kZSwgZXJyb3IubWVzc2FnZSwgZXJyb3IpO1xuICAgICAgICBcdHJldHVybiBlcnJvcjtcbiAgICAgICAgfSk7XG5cdFx0cmV0dXJuIGluZGV4RmFjZTtcblx0fSxcblxuXHRcInByaW50LmRlbGV0ZVwiKHByaW50SWQpe1xuXHRcdGNoZWNrKHByaW50SWQsU3RyaW5nKTtcblx0XHRsZXQgcHJpbnQgPSBQcmludHMuZmluZE9uZShwcmludElkKTtcblx0XHRsZXQgY29sID0gQ29sbGVjdGlvbnMuZmluZE9uZShwcmludC5wcmludF9jb2xsZWN0aW9uX2lkKTtcblx0XHRjb25zb2xlLmxvZyhwcmludCk7XG5cdFx0aWYoIXByaW50KXtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ25vLXByaW50JywnTm8gcHJpbnQgZm91bmQgd2l0aCBnaXZlbiBpZCEnKTtcblx0XHR9ZWxzZXtcblx0XHRcdGxldCBwYXJhbXMgPSB7XG5cdFx0XHRcdENvbGxlY3Rpb25JZDogY29sLmNvbGxlY3Rpb25faWQsIFxuXHRcdFx0XHRGYWNlSWRzOiBbXG5cdFx0XHRcdFx0cHJpbnQucHJpbnRfaWRcblx0XHRcdFx0XVxuXHRcdFx0fTtcblx0XHRcdGxldCBwcmludFJlcXVlc3QgPSByZWtvZ25pdGlvbi5kZWxldGVGYWNlcyhwYXJhbXMpLnByb21pc2UoKS5jYXRjaChlcnJvciA9PiB7IHRocm93IG5ldyBNZXRlb3IuRXJyb3IoZXJyb3IuY29kZSwgZXJyb3IubWVzc2FnZSwgZXJyb3IpOyByZXR1cm4gZXJyb3I7IH0pO1xuXHRcdFx0cHJpbnRSZXF1ZXN0LnRoZW4odmFsdWVzID0+IHtcblx0XHRcdFx0bGV0IG9sZFByaW50ID0gUHJpbnRzLnJlbW92ZShwcmludC5faWQpO1xuXHRcdFx0XHRpZihvbGRQcmludCl7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2coYGRlbGV0ZWQgZmFjZTogJHtwcmludElkfWApO1xuXHRcdFx0XHR9ZWxzZXtcblx0XHQgICAgICAgICAgICBjb25zb2xlLmxvZyhwcmludElkKTtcblx0XHQgICAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdyZW1vdmUtcHJpbnQtZXJyb3InLGBlcnJvciByZW1vdmluZyBwcmludDogJHtwcmludElkfWApXHRcdFxuXHRcdFx0XHR9O1xuXHRcdFx0XHRyZXR1cm4gdmFsdWVzXG5cdFx0XHR9KTtcblx0XHRcdHJldHVybiBgcmVtb3ZlZCBwcmludDogJHtwcmludElkfWA7XG5cdFx0fTtcblx0fSxcbn0pXG5cbi8vIERlZmluZSBhIHJ1bGUgdG8gbGltaXQgbWV0aG9kIGNhbGxzXG5sZXQgZGVsZXRlUHJpbnRSdWxlID0ge1xuXHR0eXBlOiAnbWV0aG9kJyxcblx0bmFtZTogJ3ByaW50LmRlbGV0ZSdcbn07XG4vLyBBZGQgdGhlIHJ1bGUsIGFsbG93aW5nIHVwIHRvIDEgc2NhbiBldmVyeSAxIHNlY29uZHNcbkREUFJhdGVMaW1pdGVyLmFkZFJ1bGUoZGVsZXRlUHJpbnRSdWxlLCAxLCAxMDAwKTsiLCJpbXBvcnQgeyBNb25nbyB9IGZyb20gJ21ldGVvci9tb25nbyc7XG5pbXBvcnQgeyBTaW1wbGVTY2hlbWEgfSBmcm9tICdtZXRlb3IvYWxkZWVkOnNpbXBsZS1zY2hlbWEnO1xuXG5cblxuZXhwb3J0IGNvbnN0IFByaW50cyA9IG5ldyBNZXRlb3IuQ29sbGVjdGlvbigncHJpbnRzJyk7XG5cbi8vIERlbnkgYWxsIGNsaWVudC1zaWRlIHVwZGF0ZXMgc2luY2Ugd2Ugd2lsbCBiZSB1c2luZyBtZXRob2RzIHRvIG1hbmFnZSB0aGlzIGNvbGxlY3Rpb25cblByaW50cy5kZW55KHtcbiAgaW5zZXJ0KCkgeyByZXR1cm4gdHJ1ZTsgfSxcbiAgdXBkYXRlKCkgeyByZXR1cm4gdHJ1ZTsgfSxcbiAgcmVtb3ZlKCkgeyByZXR1cm4gdHJ1ZTsgfSxcbn0pO1xuXG5QcmludHMuU2NoZW1hID0gbmV3IFNpbXBsZVNjaGVtYSh7XG4gIC8vIE91ciBzY2hlbWEgcnVsZXMgd2lsbCBnbyBoZXJlLlxuICBcInByaW50X2lkXCI6IHtcbiAgICB0eXBlOiBTdHJpbmcsXG4gICAgbGFiZWw6IFwiUHJpbnQgSURcIixcbiAgICBvcHRpb25hbDogZmFsc2UsXG4gICAgZGVmYXVsdFZhbHVlOiBcIkFBQUEtQkJCQi1DQ0NDLTExMTEtMjIyMi0zMzMzXCIsXG4gICAgaW5kZXg6IHRydWUsXG4gICAgdW5pcXVlOiB0cnVlXG4gIH0sXG4gIFwicHJpbnRfbmFtZVwiOiB7XG4gICAgdHlwZTogU3RyaW5nLFxuICAgIGxhYmVsOiBcIlByaW50IE5hbWVcIixcbiAgICBvcHRpb25hbDogZmFsc2UsXG4gICAgZGVmYXVsdFZhbHVlOiBcIk5ldyBQZXJzb25cIlxuICB9LFxuICBcInByaW50X3R5cGVcIjoge1xuICAgIHR5cGU6IFN0cmluZyxcbiAgICBsYWJlbDogXCJQcmludCB0eXBlXCIsXG4gICAgb3B0aW9uYWw6IGZhbHNlLFxuICAgIGFsbG93ZWRWYWx1ZXM6IFtcImZhY2VcIiwgXCJ2b2ljZVwiLCBcImZpbmdlclwiXSxcbiAgICBkZWZhdWx0VmFsdWU6IFwiZmFjZVwiXG4gIH0sXG4gIFwicHJpbnRfY29sbGVjdGlvbl9pZFwiOiB7XG4gICAgdHlwZTogU3RyaW5nLFxuICAgIGxhYmVsOiBcIlByaW50IGNvbGxlY3Rpb24gbW9uZ28gX2lkXCIsXG4gICAgb3B0aW9uYWw6IGZhbHNlLFxuICAgIGRlZmF1bHRWYWx1ZTogXCJwZW9wbGVcIlxuICB9LFxuICBcInByaW50X2ltZ1wiOiB7XG4gICAgdHlwZTogU3RyaW5nLFxuICAgIGxhYmVsOiBcIlByaW50IGltZ1wiLFxuICAgIG9wdGlvbmFsOiB0cnVlLFxuICAgIGRlZmF1bHRWYWx1ZTogXCIvaW1nL2ZhY2UtaWQtMTAwLnBuZ1wiXG4gIH0sXG4gIFwicHJpbnRfZGV0YWlsc1wiOiB7XG4gICAgdHlwZTogT2JqZWN0LFxuICAgIGxhYmVsOiBcIlByaW50IGRldGFpbHNcIixcbiAgICBvcHRpb25hbDogdHJ1ZSxcbiAgICBibGFja2JveDogdHJ1ZVxuICB9LFxuICBcInByaW50X2FkZGVyXCI6IHtcbiAgICB0eXBlOiBTdHJpbmcsXG4gICAgbGFiZWw6IFwiVXNlciB3aG8gYWRkZWQgcHJpbnRcIixcbiAgICBvcHRpb25hbDogZmFsc2VcbiAgfSxcbiAgXCJjcmVhdGVkXCI6IHtcbiAgICB0eXBlOiBEYXRlLFxuICAgIGxhYmVsOiBcIkRhdGUgcHJpbnQgYWRkZWQgdG8gQW50ZW5uYWVcIixcbiAgICBhdXRvVmFsdWU6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCB0aGlzLmlzSW5zZXJ0ICkge1xuICAgICAgICByZXR1cm4gbmV3IERhdGU7XG4gICAgICB9IFxuICAgIH0sXG4gICAgb3B0aW9uYWw6IHRydWVcbiAgfSxcbiAgXCJ1cGRhdGVkXCI6IHtcbiAgICB0eXBlOiBEYXRlLFxuICAgIGxhYmVsOiBcIkRhdGUgcHJpbnQgdXBkYXRlZCBpbiBTeXN0ZW1cIixcbiAgICBhdXRvVmFsdWU6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCB0aGlzLmlzVXBkYXRlICkge1xuICAgICAgICByZXR1cm4gbmV3IERhdGU7XG4gICAgICB9IFxuICAgIH0sXG4gICAgb3B0aW9uYWw6IHRydWVcbiAgfVxufSk7XG5cblByaW50cy5hdHRhY2hTY2hlbWEoIFByaW50cy5TY2hlbWEgKTsgXG5cblxuUHJpbnRzLnB1YmxpY0ZpZWxkcyA9IHtcbiAgcHJpbnRfaWQ6IDEsXG4gIHByaW50X25hbWU6IDEsXG4gIHByaW50X3R5cGU6IDEsXG4gIHByaW50X2NvbGxlY3Rpb25faWQ6IDEsXG4gIHByaW50X2ltZzogMSxcbiAgcHJpbnRfZGV0YWlsczogMSxcbiAgcHJpbnRfYWRkZXI6IDEsXG4gIGNyZWF0ZWQ6IDEsXG4gIHVwZGF0ZWQ6IDFcbn07XG5cbi8vIFByaW50cy5oZWxwZXJzKHtcbi8vICAgLy8gQSBjb2xsZWN0aW9ucyBpcyBjb25zaWRlcmVkIHRvIGJlIHByaXZhdGUgaWYgXCJwcml2YXRlXCIgaXMgc2V0IHRvIHRydWVcbi8vICAgaXNQcml2YXRlKCkge1xuLy8gICAgIHJldHVybiB0aGlzLnByaXZhdGU7XG4vLyAgIH1cbi8vIH0pOyIsImltcG9ydCB7IEREUFJhdGVMaW1pdGVyIH0gZnJvbSAnbWV0ZW9yL2RkcC1yYXRlLWxpbWl0ZXInO1xuXG5pbXBvcnQgeyBQcmludHMgfSBmcm9tICcuL3ByaW50cy5qcyc7XG5cblxuTWV0ZW9yLnB1Ymxpc2goJ3ByaW50cy5nZXQnLCBmdW5jdGlvbihjb2xsZWN0aW9uSWQpIHtcblx0Y29sbGVjdGlvbklkID0gY29sbGVjdGlvbklkIHx8IFwiXCI7XG5cdGNoZWNrKGNvbGxlY3Rpb25JZCxTdHJpbmcpO1xuXHRsZXQgc2VsZWN0b3IgPSBjb2xsZWN0aW9uSWQgPyB7cHJpbnRfY29sbGVjdGlvbl9pZDogY29sbGVjdGlvbklkfSA6IHt9O1xuICBcdGNvbnNvbGUubG9nKHNlbGVjdG9yKTtcblx0cmV0dXJuIFByaW50cy5maW5kKFxuXHRcdHNlbGVjdG9yLCBcblx0ICB7IFxuXHQgIFx0c29ydDogeyBjcmVhdGVkOiAtMSB9IFxuXHR9XG5cdCwge1xuXHRcdGZpZWxkczogUHJpbnRzLnB1YmxpY0ZpZWxkc1xuXHR9KTtcbn0pO1xuXG4vLyBEZWZpbmUgYSBydWxlIHRvIGxpbWl0IHN1YnNjcmlwdGlvbiBjYWxsc1xudmFyIHN1YnNjcmliZVRvUHJpbnRzUnVsZSA9IHtcbiAgdHlwZTogJ3N1YnNjcmlwdGlvbicsXG4gIG5hbWU6ICdwcmludHMuZ2V0J1xufVxuLy8gQWRkIHRoZSBydWxlLCBhbGxvd2luZyB1cCB0byAxIHN1YnNjcmlwdGlvbiBldmVyeSA1IHNlY29uZHMuXG5ERFBSYXRlTGltaXRlci5hZGRSdWxlKHN1YnNjcmliZVRvUHJpbnRzUnVsZSwgMSwgNTAwMCk7IiwiaW1wb3J0IHsgRERQUmF0ZUxpbWl0ZXIgfSBmcm9tICdtZXRlb3IvZGRwLXJhdGUtbGltaXRlcic7XG5pbXBvcnQgQVdTIGZyb20gJ2F3cy1zZGsnO1xuaW1wb3J0IHsgUmFuZG9tIH0gZnJvbSAnbWV0ZW9yL3JhbmRvbSc7XG5cbmltcG9ydCB7IENvbGxlY3Rpb25zIH0gZnJvbSAnLi4vY29sbGVjdGlvbnMvY29sbGVjdGlvbnMuanMnO1xuaW1wb3J0IHsgUHJpbnRzIH0gZnJvbSAnLi4vcHJpbnRzL3ByaW50cy5qcyc7XG5pbXBvcnQgeyBTZWFyY2hlcyB9IGZyb20gJy4vc2VhcmNoZXMuanMnO1xuXG5BV1MuY29uZmlnLnJlZ2lvbiA9ICd1cy1lYXN0LTEnO1xudmFyIHJla29nbml0aW9uID0gbmV3IEFXUy5SZWtvZ25pdGlvbigpO1xudmFyIHMzID0gbmV3IEFXUy5TMygpO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdFwiZ2V0RGFzaGJvYXJkU3RhdHNcIigpe1xuXHRcdGxldCBkYXNoYm9hcmRTdGF0cyA9IHt9O1xuXHRcdGRhc2hib2FyZFN0YXRzLmNvbGxlY3Rpb25zID0gQ29sbGVjdGlvbnMuZmluZCh7fSkuY291bnQoKTtcblx0XHRkYXNoYm9hcmRTdGF0cy5mYWNlcyA9IFByaW50cy5maW5kKCkuY291bnQoKTtcblx0XHQvLyBkYXNoYm9hcmRTdGF0cy5mYWNlcyA9IENvbGxlY3Rpb25zLmFnZ3JlZ2F0ZShcblx0XHQvLyBcdCAgIFtcblx0XHQvLyBcdCAgICAge1xuXHRcdC8vIFx0ICAgICAgICRncm91cDpcblx0XHQvLyBcdFx0XHR7XG5cdFx0Ly8gXHRcdFx0XHRfaWQ6IFwiJGNvbGxlY3Rpb25faWRcIixcblx0XHQvLyBcdFx0XHRcdC8vIGZhY2VfY291bnQ6IHsgJHN1bTogXCIkcHJpbnRfY291bnRcIiB9LFxuXHRcdC8vIFx0XHRcdFx0Y291bnQ6IHsgJHN1bTogMSB9XG5cdFx0Ly8gXHRcdFx0fVxuXHRcdC8vIFx0ICAgICB9LFxuXHRcdC8vIFx0ICAgICB7XG5cdFx0Ly8gXHQgICAgIFx0JHByb2plY3Q6XG5cdFx0Ly8gXHQgICAgIFx0e1xuXHRcdC8vIFx0ICAgICBcdFx0X2lkOiAxLFxuXHRcdC8vIFx0ICAgICBcdFx0Y291bnQ6IDFcblx0XHQvLyBcdCAgICAgXHR9XG5cdFx0Ly8gXHQgICAgIH1cblx0XHQvLyBcdCAgIF1cblx0XHQvLyBcdCk7XG5cdFx0ZGFzaGJvYXJkU3RhdHMuc2VhcmNoZXMgPSBTZWFyY2hlcy5maW5kKHt9KS5jb3VudCgpO1xuXHRcdGRhc2hib2FyZFN0YXRzLm1hdGNoZXMgPSBTZWFyY2hlcy5maW5kKHsnc2VhcmNoX3Jlc3VsdHMucGVyc29ucyc6IHskbmU6IFtdfX0pLmNvdW50KCk7XG5cdFx0ZGFzaGJvYXJkU3RhdHMubWF0Y2hQZXJjZW50ID0gKE1hdGgucm91bmQoKGRhc2hib2FyZFN0YXRzLm1hdGNoZXMgLyBkYXNoYm9hcmRTdGF0cy5zZWFyY2hlcyAqIDEwMCkgKiAxMCkgLyAxMCkgfHwgMDtcblx0XHRjb25zb2xlLmxvZyhkYXNoYm9hcmRTdGF0cy5mYWNlcyk7XG5cdFx0cmV0dXJuIGRhc2hib2FyZFN0YXRzO1xuXHR9LFxuXG5cdGFzeW5jIFwic2VhcmNoLmZhY2VcIihzZWFyY2hEYXRhKXtcblx0XHQvL3JldHVybiAxO1xuXHRcdC8vIGlmKCFNZXRlb3IudXNlcil7XG5cdFx0Ly8gXHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdub3QtbG9nZ2VkLWluJywnbXVzdCBiZSBsb2dnZWQtaW4gdG8gcGVyZm9ybSBzZWFyY2gnKTtcblx0XHQvLyBcdHJldHVybiBmYWxzZTtcblx0XHQvLyB9XG5cdFx0Ly8gbGV0IG1hdGNoVGhyZXNob2xkID0gbWF0Y2hUaHJlc2hvbGQ7XG5cdFx0Y2hlY2soc2VhcmNoRGF0YS5tYXRjaFRocmVzaG9sZCwgTnVtYmVyKTtcblx0XHRjb25zb2xlLmxvZyhcIkFOQUxZWklORyBJTUFHRS4uLlwiKTtcblx0XHR2YXIgdDAgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcblx0XHRsZXQgaW1nQnl0ZXMgPSBuZXcgQnVmZmVyLmZyb20oc2VhcmNoRGF0YS5pbWcuc3BsaXQoXCIsXCIpWzFdLCBcImJhc2U2NFwiKTtcblx0XHRsZXQgaW1nRmlsZU5hbWUgPSBgdXBsb2Fkcy9pbWFnZXMvJHtSYW5kb20uaWQoKX0uanBnYDtcblx0XHRsZXQgdXBsb2FkQnVja2V0ID0gXCJhbnRlbm5hZVwiO1xuXHRcdGxldCBzM1BhcmFtcyA9IHtcblx0XHRcdEFDTDogJ3ByaXZhdGUnLFxuXHRcdFx0Qm9keTogaW1nQnl0ZXMsIFxuXHRcdFx0QnVja2V0OiB1cGxvYWRCdWNrZXQsIFxuXHRcdFx0Q29udGVudEVuY29kaW5nOiAnYmFzZTY0Jyxcblx0XHRcdENvbnRlbnRUeXBlOiAnaW1hZ2UvanBlZycsXG5cdFx0XHRLZXk6IGltZ0ZpbGVOYW1lLFxuXHRcdFx0TWV0YWRhdGE6IHtcblx0XHQgIFx0XHQnQ29udGVudC1UeXBlJzogJ2ltYWdlL2pwZWcnXG5cdFx0ICBcdH0sXG5cdFx0ICAgIFRhZ2dpbmc6IGBOYW1lPSR7aW1nRmlsZU5hbWV9JkFwcGxpY2F0aW9uPUFudGVubmFlJk93bmVyPUFudG1vdW5kc2Bcblx0XHQgfTtcblx0XHQvLyBjb25zb2xlLmxvZyhzM1BhcmFtcyk7XG5cdFx0bGV0IHMzUmVzdWx0cyA9IGF3YWl0IHMzLnB1dE9iamVjdChzM1BhcmFtcykucHJvbWlzZSgpLmNhdGNoKGVycm9yID0+IHsgdGhyb3cgbmV3IE1ldGVvci5FcnJvcihlcnJvci5jb2RlLCBlcnJvci5tZXNzYWdlLCBlcnJvcik7IHJldHVybiBlcnJvcjtcblx0XHR9KS50aGVuKCB2YWx1ZSA9PiB7XG5cdFx0XHQvLyBjb25zb2xlLmxvZyh2YWx1ZSk7XG5cdFx0XHRyZXR1cm4gdmFsdWU7XG5cdFx0fSk7XG5cdFx0Y29uc29sZS5sb2coczNSZXN1bHRzKTtcblx0XHQvLyBnZXQgc2lnbmVkIHVybCBmb3IgaW1hZ2UgdmFsaWQgZm9yIDEgZGF5XG5cdFx0czNQYXJhbXMgPSB7IFxuXHRcdCAgQnVja2V0OiB1cGxvYWRCdWNrZXQsIFxuXHRcdCAgS2V5OiBpbWdGaWxlTmFtZSxcblx0XHQgIEV4cGlyZXM6IDg2NDAwIC8vIDEtZGF5IHVybCBleHBpcmF0aW9uXG5cdFx0fTtcblx0XHRsZXQgczNTaWduZWRVcmwgPSBzMy5nZXRTaWduZWRVcmwoXCJnZXRPYmplY3RcIiwgczNQYXJhbXMpO1xuXHRcdGNvbnNvbGUubG9nKHMzU2lnbmVkVXJsKTtcblx0XHQvLyBsZXQgY29sSWQgPSBNZXRlb3IudXNlcigpLnByb2ZpbGUuY29sbGVjdGlvbnM7XG5cdFx0bGV0IGNvbElkcyA9IENvbGxlY3Rpb25zLmZpbmQoe2NvbGxlY3Rpb25fdHlwZTogJ2ZhY2UnfSwge2ZpZWxkczoge2NvbGxlY3Rpb25faWQ6IDF9fSkuZmV0Y2goKTtcblx0XHRjb25zb2xlLmxvZyhjb2xJZHMpO1xuXHRcdGxldCBtb2RlcmF0aW9uUGFyYW1zID0ge1xuXHRcdFx0XCJJbWFnZVwiOiB7IFxuXHRcdFx0XHQvLyBcIkJ5dGVzXCI6IGltZ0J5dGVzLFxuXHRcdFx0XHRcIlMzT2JqZWN0XCI6IHtcblx0XHRcdFx0XHRcIkJ1Y2tldFwiOiB1cGxvYWRCdWNrZXQsIFxuXHRcdFx0XHRcdFwiTmFtZVwiOiBpbWdGaWxlTmFtZVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0XCJNaW5Db25maWRlbmNlXCI6IDUwLFxuXHRcdH07XG5cdFx0bGV0IGxhYmVsUGFyYW1zID0ge1xuXHRcdFx0XCJJbWFnZVwiOiB7IFxuXHRcdFx0XHQvLyBcIkJ5dGVzXCI6IGltZ0J5dGVzLFxuXHRcdFx0XHRcIlMzT2JqZWN0XCI6IHtcblx0XHRcdFx0XHRcIkJ1Y2tldFwiOiB1cGxvYWRCdWNrZXQsIFxuXHRcdFx0XHRcdFwiTmFtZVwiOiBpbWdGaWxlTmFtZVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0XCJNYXhMYWJlbHNcIjogMjAsXG5cdFx0XHRcIk1pbkNvbmZpZGVuY2VcIjogNzUsXG5cdFx0fTtcblx0XHRsZXQgZmFjZVBhcmFtcyA9IHtcblx0XHRcdFwiSW1hZ2VcIjogeyBcblx0XHRcdFx0Ly8gXCJCeXRlc1wiOiBpbWdCeXRlcyxcblx0XHRcdFx0XCJTM09iamVjdFwiOiB7XG5cdFx0XHRcdFx0XCJCdWNrZXRcIjogdXBsb2FkQnVja2V0LCBcblx0XHRcdFx0XHRcIk5hbWVcIjogaW1nRmlsZU5hbWVcblx0XHRcdFx0fVxuXHRcdFx0fSxcbiAgXHRcdFx0XCJBdHRyaWJ1dGVzXCI6IFtcIkFMTFwiXSxcblx0XHR9O1xuXHRcdGxldCBjZWxlYnJpdHlQYXJhbXMgPSB7XG5cdFx0XHRcIkltYWdlXCI6IHsgXG5cdFx0XHRcdC8vIFwiQnl0ZXNcIjogaW1nQnl0ZXMsXG5cdFx0XHRcdFwiUzNPYmplY3RcIjoge1xuXHRcdFx0XHRcdFwiQnVja2V0XCI6IHVwbG9hZEJ1Y2tldCwgXG5cdFx0XHRcdFx0XCJOYW1lXCI6IGltZ0ZpbGVOYW1lXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0fTtcblx0XHQvLyBjcmVhdGUgcmVxdWVzdCBvYmplY3RzXG5cdFx0bGV0IG1vZGVyYXRpb25SZXF1ZXN0ID0gcmVrb2duaXRpb24uZGV0ZWN0TW9kZXJhdGlvbkxhYmVscyhtb2RlcmF0aW9uUGFyYW1zKTtcblx0XHRsZXQgbGFiZWxSZXF1ZXN0ID0gcmVrb2duaXRpb24uZGV0ZWN0TGFiZWxzKGxhYmVsUGFyYW1zKTtcblx0XHRsZXQgZmFjZVJlcXVlc3QgPSByZWtvZ25pdGlvbi5kZXRlY3RGYWNlcyhmYWNlUGFyYW1zKTtcblx0XHRsZXQgY2VsZWJyaXR5UmVxdWVzdCA9IHJla29nbml0aW9uLnJlY29nbml6ZUNlbGVicml0aWVzKGNlbGVicml0eVBhcmFtcyk7XG5cdFx0Ly8gY3JlYXRlIHByb21pc2VzXG5cdFx0bGV0IGFsbFByb21pc2VzID0gW107XG5cdFx0YWxsUHJvbWlzZXMucHVzaChtb2RlcmF0aW9uUmVxdWVzdC5wcm9taXNlKCkuY2F0Y2goZXJyb3IgPT4geyB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKGVycm9yLmNvZGUsIGVycm9yLm1lc3NhZ2UsIGVycm9yKTsgcmV0dXJuIGVycm9yOyB9KSk7XG5cdFx0YWxsUHJvbWlzZXMucHVzaChsYWJlbFJlcXVlc3QucHJvbWlzZSgpLmNhdGNoKGVycm9yID0+IHsgdGhyb3cgbmV3IE1ldGVvci5FcnJvcihlcnJvci5jb2RlLCBlcnJvci5tZXNzYWdlLCBlcnJvcik7IHJldHVybiBlcnJvcjsgfSkpO1xuXHRcdGFsbFByb21pc2VzLnB1c2goZmFjZVJlcXVlc3QucHJvbWlzZSgpLmNhdGNoKGVycm9yID0+IHsgdGhyb3cgbmV3IE1ldGVvci5FcnJvcihlcnJvci5jb2RlLCBlcnJvci5tZXNzYWdlLCBlcnJvcik7IHJldHVybiBlcnJvcjsgfSkpO1xuXHRcdGFsbFByb21pc2VzLnB1c2goY2VsZWJyaXR5UmVxdWVzdC5wcm9taXNlKCkuY2F0Y2goZXJyb3IgPT4geyB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKGVycm9yLmNvZGUsIGVycm9yLm1lc3NhZ2UsIGVycm9yKTsgcmV0dXJuIGVycm9yOyB9KSk7XG5cdFx0Xy5lYWNoKGNvbElkcywgKGNvbElkKSA9PiB7XG5cdFx0XHRsZXQgcmVrb2duaXRpb25QYXJhbXMgPSB7XG5cdFx0XHRcdFwiQ29sbGVjdGlvbklkXCI6IGNvbElkLmNvbGxlY3Rpb25faWQsXG5cdFx0XHRcdFwiRmFjZU1hdGNoVGhyZXNob2xkXCI6IHNlYXJjaERhdGEubWF0Y2hUaHJlc2hvbGQgfHwgOTUsXG5cdFx0XHRcdFwiTWF4RmFjZXNcIjogMixcblx0XHRcdFx0XCJJbWFnZVwiOiB7IFxuXHRcdFx0XHRcdFwiUzNPYmplY3RcIjoge1xuXHRcdFx0XHRcdFx0XCJCdWNrZXRcIjogdXBsb2FkQnVja2V0LCBcblx0XHRcdFx0XHRcdFwiTmFtZVwiOiBpbWdGaWxlTmFtZVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSxcblx0XHRcdH07XG5cdFx0XHRjb25zb2xlLmxvZyhyZWtvZ25pdGlvblBhcmFtcyk7XG5cdFx0XHRsZXQgcmVrb2duaXRpb25SZXF1ZXN0ID0gcmVrb2duaXRpb24uc2VhcmNoRmFjZXNCeUltYWdlKHJla29nbml0aW9uUGFyYW1zKTtcblx0XHRcdGFsbFByb21pc2VzLnB1c2gocmVrb2duaXRpb25SZXF1ZXN0LnByb21pc2UoKS5jYXRjaChlcnJvciA9PiB7IHRocm93IG5ldyBNZXRlb3IuRXJyb3IoZXJyb3IuY29kZSwgZXJyb3IubWVzc2FnZSwgZXJyb3IpOyByZXR1cm4gZXJyb3I7IH0pKTtcblx0XHRcdGNvbnNvbGUubG9nKGNvbElkLmNvbGxlY3Rpb25faWQpO1xuXHRcdH0pO1xuXHRcdC8vIEZ1bGZpbGwgcHJvbWlzZXMgaW4gcGFyYWxsZWxcblx0XHRsZXQgcmVzcG9uc2UgPSBQcm9taXNlLmFsbChcblx0XHRcdGFsbFByb21pc2VzXG5cdFx0KS50aGVuKHZhbHVlcyA9PiB7XG5cdFx0XHRjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeSh2YWx1ZXMpKTtcblx0XHRcdGNvbnNvbGUubG9nKHZhbHVlc1swXSk7XG5cdFx0XHRjb25zb2xlLmxvZyh2YWx1ZXNbMV0pO1xuXHRcdFx0Y29uc29sZS5sb2codmFsdWVzWzJdKTtcblx0XHRcdGNvbnNvbGUubG9nKHZhbHVlc1szXSk7XG5cdFx0XHQvL2NvbnNvbGUubG9nKHZhbHVlc1s0XSk7XG5cdFx0XHRsZXQgaSA9IDQ7XG5cdFx0XHRsZXQgcGVyc29ucyA9IFtdO1xuXHRcdFx0d2hpbGUodmFsdWVzW2ldKXtcblx0XHRcdFx0Y29uc29sZS5sb2codmFsdWVzW2ldKTtcblx0XHRcdFx0aWYgKHZhbHVlc1tpXS5GYWNlTWF0Y2hlc1swXSl7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2codmFsdWVzW2ldLkZhY2VNYXRjaGVzWzBdLkZhY2UuRmFjZUlkKTtcblx0XHRcdFx0XHRsZXQgY29sSWQgPSBQcmludHMuZmluZE9uZSh7cHJpbnRfaWQ6IHZhbHVlc1tpXS5GYWNlTWF0Y2hlc1swXS5GYWNlLkZhY2VJZH0sIHtmaWVsZHM6IHtwcmludF9jb2xsZWN0aW9uX2lkOiAxfX0pLnByaW50X2NvbGxlY3Rpb25faWQ7XG5cdFx0XHRcdFx0bGV0IHRhZyA9IHtcblx0XHRcdFx0XHRcdGNvbGxlY3Rpb246IENvbGxlY3Rpb25zLmZpbmRPbmUoY29sSWQsIHtmaWVsZHM6IHtjb2xsZWN0aW9uX25hbWU6IDF9fSkuY29sbGVjdGlvbl9uYW1lLFxuXHRcdFx0XHRcdFx0aW1hZ2VfaWQ6IHZhbHVlc1tpXS5GYWNlTWF0Y2hlc1swXS5GYWNlLkV4dGVybmFsSW1hZ2VJZC5yZXBsYWNlKC9fXy9nLFwiIFwiKSxcblx0XHRcdFx0XHRcdGZhY2VfaWQ6IHZhbHVlc1tpXS5GYWNlTWF0Y2hlc1swXS5GYWNlLkZhY2VJZCxcblx0XHRcdFx0XHRcdHNpbWlsYXJpdHk6IHZhbHVlc1tpXS5GYWNlTWF0Y2hlc1swXS5TaW1pbGFyaXR5LFxuXHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0cGVyc29ucy5wdXNoKHRhZyk7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2codGFnKTtcblx0XHRcdFx0fTtcblx0XHRcdFx0aSsrO1xuXHRcdFx0fTtcblx0XHRcdGxldCB0MSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXHRcdFx0Y29uc29sZS5sb2coYFJlc3BvbnNlIHRvb2sgJHt0MSAtIHQwfSBtc2ApO1xuXHRcdFx0bGV0IHNlYXJjaF9yZXN1bHRzID0ge1xuXHRcdFx0XHRcdG1vZGVyYXRpb246IHZhbHVlc1swXS5Nb2RlcmF0aW9uTGFiZWxzLFxuXHRcdFx0XHRcdGxhYmVsczogdmFsdWVzWzFdLkxhYmVscyxcblx0XHRcdFx0XHRmYWNlRGV0YWlsczogdmFsdWVzWzJdLkZhY2VEZXRhaWxzLFxuXHRcdFx0XHRcdGNlbGVicml0eTogdmFsdWVzWzNdLkNlbGVicml0eUZhY2VzLFxuXHRcdFx0XHRcdHBlcnNvbnM6IHBlcnNvbnMsXG5cdFx0XHRcdFx0dXJsOiBzM1NpZ25lZFVybFxuXHRcdFx0fTtcblx0XHRcdGxldCBzZWFyY2ggPSB7XG5cdFx0XHRcdFx0c2VhcmNoX2ltYWdlOiBzM1NpZ25lZFVybCxcblx0XHRcdFx0XHRzdGF0aW9uX25hbWU6IHNlYXJjaERhdGEuc3RhdGlvbk5hbWUsXG5cdFx0XHRcdFx0c2VhcmNoX3Jlc3VsdHM6IHNlYXJjaF9yZXN1bHRzXG5cdFx0XHR9O1xuXHRcdFx0bGV0IHNhdmVTZWFyY2ggPSBTZWFyY2hlcy5pbnNlcnQoc2VhcmNoKTtcblx0XHRcdGNvbnNvbGUubG9nKHNhdmVTZWFyY2gpO1xuXHRcdFx0cmV0dXJuIHNlYXJjaF9yZXN1bHRzO1xuXHRcdH0pLmNhdGNoKGVycm9yID0+IHtcblx0XHRcdGNvbnNvbGUubG9nKCdjYXVnaHQgZXJyb3IhJyk7XG5cdFx0XHRjb25zb2xlLmxvZyhlcnJvcik7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKGVycm9yLmVycm9yLCBlcnJvci5yZWFzb24sIGVycm9yLmRldGFpbHMpO1xuXHRcdH0pLmZpbmFsbHkoKCkgPT4ge1xuXHRcdFx0Y29uc29sZS5sb2coJ2ZpbmFsbHknKTtcblx0XHRcdC8vIGNvbnNvbGUubG9nKHRoaXMpO1xuXHRcdH0pO1xuXHRcdGNvbnNvbGUubG9nKHJlc3BvbnNlKTtcblx0XHRsZXQgdDEgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcblx0XHRjb25zb2xlLmxvZyhgUmVxdWVzdCB0b29rICR7dDEgLSB0MH0gbXNgKTtcblx0XHRyZXR1cm4gcmVzcG9uc2U7XG5cdH0sXG5cblx0XCJzZWFyY2guZGVsZXRlXCIoc2VhcmNoSWQpe1xuXHRcdGNoZWNrKHNlYXJjaElkLFN0cmluZyk7XG5cdFx0aWYoc2VhcmNoSWQpe1xuXHRcdFx0bGV0IHNlYXJjaCA9IFNlYXJjaGVzLnJlbW92ZShzZWFyY2hJZCk7XG5cdFx0XHRjb25zb2xlLmxvZyhgZGVsZXRlZCBzZWFyY2g6ICR7c2VhcmNoSWR9YCk7XG5cdFx0XHRyZXR1cm4gYGRlbGV0ZWQgc2VhcmNoOiAke3NlYXJjaElkfWA7XG5cdFx0fTtcblx0fVxufSlcblxuLy8gRGVmaW5lIGEgcnVsZSB0byBsaW1pdCBtZXRob2QgY2FsbHNcbmxldCBydW5TY2FuUnVsZSA9IHtcblx0dHlwZTogJ21ldGhvZCcsXG5cdG5hbWU6ICdzZWFyY2guZmFjZSdcbn07XG4vLyBBZGQgdGhlIHJ1bGUsIGFsbG93aW5nIHVwIHRvIDEgc2NhbiBldmVyeSA1IHNlY29uZHNcbkREUFJhdGVMaW1pdGVyLmFkZFJ1bGUocnVuU2NhblJ1bGUsIDEsIDUwMDApOyIsImltcG9ydCB7IEREUFJhdGVMaW1pdGVyIH0gZnJvbSAnbWV0ZW9yL2RkcC1yYXRlLWxpbWl0ZXInO1xuXG5pbXBvcnQgeyBTZWFyY2hlcyB9IGZyb20gJy4vc2VhcmNoZXMuanMnO1xuXG5cbk1ldGVvci5wdWJsaXNoKCdzZWFyY2hlcy5nZXQnLCBmdW5jdGlvbihzZWFyY2hJZD0nJykge1xuXHRjaGVjayhzZWFyY2hJZCxTdHJpbmcpO1xuXHRzZWFyY2hJZCA9IHNlYXJjaElkIHx8IHt9O1xuICBcdC8vIGNvbnNvbGUubG9nKFNlYXJjaGVzLmZpbmQoc2VhcmNoSWQpLmNvdW50KCkpO1xuXHRyZXR1cm4gU2VhcmNoZXMuZmluZChcblx0XHRzZWFyY2hJZCwgXG5cdCAgeyBcblx0ICBcdHNvcnQ6IHsgY3JlYXRlZDogLTEgfSBcblx0fVxuXHQsIHtcblx0XHRmaWVsZHM6IFNlYXJjaGVzLnB1YmxpY0ZpZWxkc1xuXHR9KTtcbn0pO1xuXG4vLyBEZWZpbmUgYSBydWxlIHRvIGxpbWl0IHN1YnNjcmlwdGlvbiBjYWxsc1xudmFyIHN1YnNjcmliZVRvU2VhcmNoZXNSdWxlID0ge1xuICB0eXBlOiAnc3Vic2NyaXB0aW9uJyxcbiAgbmFtZTogJ3NlYXJjaGVzLmdldCdcbn1cbi8vIEFkZCB0aGUgcnVsZSwgYWxsb3dpbmcgdXAgdG8gMSBzdWJzY3JpcHRpb24gZXZlcnkgNSBzZWNvbmRzLlxuRERQUmF0ZUxpbWl0ZXIuYWRkUnVsZShzdWJzY3JpYmVUb1NlYXJjaGVzUnVsZSwgMSwgNTAwMCk7IiwiaW1wb3J0IHsgTW9uZ28gfSBmcm9tICdtZXRlb3IvbW9uZ28nO1xuaW1wb3J0IHsgU2ltcGxlU2NoZW1hIH0gZnJvbSAnbWV0ZW9yL2FsZGVlZDpzaW1wbGUtc2NoZW1hJztcblxuXG5cbmV4cG9ydCBjb25zdCBTZWFyY2hlcyA9IG5ldyBNZXRlb3IuQ29sbGVjdGlvbignc2VhcmNoZXMnKTtcblxuLy8gRGVueSBhbGwgY2xpZW50LXNpZGUgdXBkYXRlcyBzaW5jZSB3ZSB3aWxsIGJlIHVzaW5nIG1ldGhvZHMgdG8gbWFuYWdlIHRoaXMgY29sbGVjdGlvblxuU2VhcmNoZXMuZGVueSh7XG4gIGluc2VydCgpIHsgcmV0dXJuIHRydWU7IH0sXG4gIHVwZGF0ZSgpIHsgcmV0dXJuIHRydWU7IH0sXG4gIHJlbW92ZSgpIHsgcmV0dXJuIHRydWU7IH0sXG59KTtcblxuU2VhcmNoZXMuU2NoZW1hID0gbmV3IFNpbXBsZVNjaGVtYSh7XG4gIFwic3RhdGlvbl9uYW1lXCI6IHtcbiAgICB0eXBlOiBTdHJpbmcsXG4gICAgbGFiZWw6IFwiU3RhdGlvbiBzZWFyY2ggcGVyZm9ybWVkIGF0XCIsXG4gICAgb3B0aW9uYWw6IHRydWUsXG4gICAgZGVmYXVsdFZhbHVlOiBcIlN0YXRpb24gMVwiXG4gIH0sXG4gIC8vIHNjaGVtYSBydWxlc1xuICBcInNlYXJjaF90eXBlXCI6IHtcbiAgICB0eXBlOiBbU3RyaW5nXSxcbiAgICBsYWJlbDogXCJTZWFyY2ggdHlwZXNcIixcbiAgICBvcHRpb25hbDogZmFsc2UsXG4gICAgYWxsb3dlZFZhbHVlczogW1wibW9kZXJhdGlvblwiLCBcImxhYmVsXCIsIFwiZmFjZVwiLCBcImNvbGxlY3Rpb25cIl0sXG4gICAgZGVmYXVsdFZhbHVlOiBbXCJtb2RlcmF0aW9uXCIsIFwibGFiZWxcIiwgXCJmYWNlXCJdXG4gIH0sXG4gIFwic2VhcmNoX2NvbGxlY3Rpb25zXCI6IHtcbiAgICB0eXBlOiBbU3RyaW5nXSxcbiAgICBsYWJlbDogXCJDb2xsZWN0aW9ucyB0byBzZWFyY2hcIixcbiAgICBvcHRpb25hbDogdHJ1ZSxcbiAgICBkZWZhdWx0VmFsdWU6IFtcIlwiXVxuICB9LFxuICBcInNlYXJjaF9pbWFnZVwiOiB7XG4gICAgdHlwZTogU3RyaW5nLFxuICAgIGxhYmVsOiBcIkltYWdlIHRvIHNlYXJjaFwiLFxuICAgIG9wdGlvbmFsOiB0cnVlLFxuICAgIGRlZmF1bHRWYWx1ZTogXCIvaW1nL2ZhY2UtaWQtMTAwLnBuZ1wiXG4gIH0sXG4gIFwic2VhcmNoX3Jlc3VsdHNcIjoge1xuICAgIHR5cGU6IE9iamVjdCxcbiAgICBsYWJlbDogXCJPYmplY3Qgb2Ygc2VhcmNoIHR5cGVzXCIsXG4gICAgb3B0aW9uYWw6IHRydWUsXG4gICAgYmxhY2tib3g6IHRydWUsXG4gICAgZGVmYXVsdFZhbHVlOiB7fVxuICB9LFxuICBcImZhY2VzXCI6IHtcbiAgICB0eXBlOiBbT2JqZWN0XSxcbiAgICBsYWJlbDogXCJGYWNlIG9iamVjdHMgZm91bmQgaW4gaW1hZ2VcIixcbiAgICBvcHRpb25hbDogdHJ1ZSxcbiAgICBibGFja2JveDogdHJ1ZSxcbiAgICBkZWZhdWx0VmFsdWU6IFtdXG4gIH0sXG4gIFwiY3JlYXRlZFwiOiB7XG4gICAgdHlwZTogRGF0ZSxcbiAgICBsYWJlbDogXCJEYXRlIHNlYXJjaCBwZXJmb3JtZWRcIixcbiAgICBhdXRvVmFsdWU6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCB0aGlzLmlzSW5zZXJ0ICkge1xuICAgICAgICByZXR1cm4gbmV3IERhdGU7XG4gICAgICB9IFxuICAgIH0sXG4gICAgb3B0aW9uYWw6IHRydWUsXG4gICAgLy9pbmRleDogdHJ1ZVxuICB9LFxuICBcInVwZGF0ZWRcIjoge1xuICAgIHR5cGU6IERhdGUsXG4gICAgbGFiZWw6IFwiRGF0ZSBzZWFyY2ggdXBkYXRlZFwiLFxuICAgIGF1dG9WYWx1ZTogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoIHRoaXMuaXNVcGRhdGUgKSB7XG4gICAgICAgIHJldHVybiBuZXcgRGF0ZTtcbiAgICAgIH0gXG4gICAgfSxcbiAgICBvcHRpb25hbDogdHJ1ZVxuICB9XG59KTtcblxuU2VhcmNoZXMuYXR0YWNoU2NoZW1hKCBTZWFyY2hlcy5TY2hlbWEgKTtcblxuaWYoTWV0ZW9yLmlzU2VydmVyKXtcbiAgTWV0ZW9yLnN0YXJ0dXAoKCkgPT4ge1xuICAgIFNlYXJjaGVzLl9lbnN1cmVJbmRleCh7XG4gICAgICAgIGNyZWF0ZWQ6IC0xLFxuICAgIH0pO1xuICAgIC8vIFNlYXJjaGVzLl9lbnN1cmVJbmRleCh7IHNlYXJjaF9pbWFnZTogMX0pO1xuICB9KTtcbn1cblxuU2VhcmNoZXMucHVibGljRmllbGRzID0ge1xuICBzdGF0aW9uX25hbWU6IDEsXG4gIHNlYXJjaF90eXBlOiAxLFxuICBzZWFyY2hfY29sbGVjdGlvbnM6IDEsXG4gIHNlYXJjaF9pbWFnZTogMSxcbiAgc2VhcmNoX3Jlc3VsdHM6IDEsXG4gIGNyZWF0ZWQ6IDEsXG4gIHVwZGF0ZWQ6IDFcbn07XG5cbi8vIFNlYXJjaGVzLmhlbHBlcnMoe1xuLy8gICAvLyBBIGNvbGxlY3Rpb25zIGlzIGNvbnNpZGVyZWQgdG8gYmUgcHJpdmF0ZSBpZiBcInByaXZhdGVcIiBpcyBzZXQgdG8gdHJ1ZVxuLy8gICBpc1ByaXZhdGUoKSB7XG4vLyAgICAgcmV0dXJuIHRoaXMucHJpdmF0ZTtcbi8vICAgfVxuLy8gfSk7IiwiaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5pbXBvcnQgeyBDb2xsZWN0aW9ucyB9IGZyb20gJy4uLy4uL2FwaS9jb2xsZWN0aW9ucy9jb2xsZWN0aW9ucy5qcyc7XG5pbXBvcnQgeyBQcmludHMgfSBmcm9tICcuLi8uLi9hcGkvcHJpbnRzL3ByaW50cy5qcyc7XG5pbXBvcnQgeyBTZWFyY2hlcyB9IGZyb20gJy4uLy4uL2FwaS9zZWFyY2hlcy9zZWFyY2hlcy5qcyc7XG5pbXBvcnQgQVdTIGZyb20gJ2F3cy1zZGsnO1xuXG5BV1MuY29uZmlnLnJlZ2lvbiA9ICd1cy1lYXN0LTEnO1xudmFyIHJla29nbml0aW9uID0gbmV3IEFXUy5SZWtvZ25pdGlvbigpO1xuXG4vLyBpZiB0aGUgZGF0YWJhc2UgaXMgZW1wdHkgb24gc2VydmVyIHN0YXJ0LCBjcmVhdGUgc29tZSBzYW1wbGUgZGF0YS5cblxuTWV0ZW9yLnN0YXJ0dXAoKCkgPT4ge1xuXG4gIGNvbnNvbGUubG9nKFwic3luY2luZyBhd3MgY29sbGVjdGlvbnMuLi5cIik7XG4gIGxldCBjb2xQYXJhbXMgPSB7fTtcbiAgbGV0IGNvbFJlcXVlc3QgPSByZWtvZ25pdGlvbi5saXN0Q29sbGVjdGlvbnMoKTtcbiAgbGV0IHByb21pc2UgPSBjb2xSZXF1ZXN0LnByb21pc2UoKTtcbi8vIGNvbFBhcmFtcyA9IHtcbi8vICAgICAgICAgICAgXCJDb2xsZWN0aW9uSWRcIjogXCJtYWNpZXNcIlxuLy8gICAgICAgICB9O1xuLy8gICBsZXQgdGVzdCA9ICAgICAgcmVrb2duaXRpb24uZGVzY3JpYmVDb2xsZWN0aW9uKGNvbFBhcmFtcykucHJvbWlzZSgpLmNhdGNoKGVycm9yID0+IHsgdGhyb3cgbmV3IE1ldGVvci5FcnJvcihlcnJvci5jb2RlLCBlcnJvci5tZXNzYWdlLCBlcnJvcik7IHJldHVybiBlcnJvcjsgfSkudGhlbihyZXN1bHQgPT4ge1xuLy8gICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3VsdCk7XG4vLyAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbi8vICAgICAgICAgfSk7XG4vLyAgICAgY29uc29sZS5sb2codGVzdCk7XG4gIGxldCBjb2xzID0gcHJvbWlzZS50aGVuKHJlc3VsdCA9PiB7XG4gICAgY29uc29sZS5sb2cocmVzdWx0KTtcbiAgICBpZihyZXN1bHQgJiYgcmVzdWx0LkNvbGxlY3Rpb25JZHMubGVuZ3RoID4gMCl7XG4gICAgICBfLmVhY2gocmVzdWx0LkNvbGxlY3Rpb25JZHMsIGZ1bmN0aW9uKGNvbElkKXtcbiAgICAgICAgbGV0IGF3c0NvbCA9IHtcbiAgICAgICAgICBjb2xsZWN0aW9uX2lkOiBjb2xJZCxcbiAgICAgICAgICBjb2xsZWN0aW9uX25hbWU6IGNvbElkLnJlcGxhY2UoXCJfX1wiLCBcIiBcIiksXG4gICAgICAgICAgY29sbGVjdGlvbl90eXBlOiBcImZhY2VcIixcbiAgICAgICAgICBwcml2YXRlOiB0cnVlXG4gICAgICAgIH07XG4gICAgICAgIC8vIGRlc2NyaWJlIGNvbGxlY3Rpb24gdG8gZ2V0IGZhY2UgY291bnRcbiAgICAgICAgY29sUGFyYW1zID0ge1xuICAgICAgICAgICBcIkNvbGxlY3Rpb25JZFwiOiBjb2xJZFxuICAgICAgICB9O1xuICAgICAgICBsZXQgY29sUmVzdWx0cyA9IHJla29nbml0aW9uLmRlc2NyaWJlQ29sbGVjdGlvbihjb2xQYXJhbXMpLnByb21pc2UoKS5jYXRjaChlcnJvciA9PiB7IHRocm93IG5ldyBNZXRlb3IuRXJyb3IoZXJyb3IuY29kZSwgZXJyb3IubWVzc2FnZSwgZXJyb3IpOyByZXR1cm4gZXJyb3I7IH0pLnRoZW4ocmVzdWx0ID0+IHtcbiAgICAgICAgICBhd3NDb2wucHJpbnRfY291bnQgPSByZXN1bHQuRmFjZUNvdW50O1xuICAgICAgICAgIGNvbnNvbGUubG9nKGAke2NvbElkfSBjb2xsZWN0aW9uIGhhcyAke3Jlc3VsdC5GYWNlQ291bnR9IGZhY2VzYCk7XG4gICAgICAgICAgY29uc29sZS5sb2coYXdzQ29sKTtcbiAgICAgICAgICBsZXQgZXhpc3RpbmdDb2wgPSBDb2xsZWN0aW9ucy51cHNlcnQoe2NvbGxlY3Rpb25faWQ6IGNvbElkfSwgeyRzZXQ6IGF3c0NvbH0pO1xuICAgICAgICAgIGNvbnNvbGUubG9nKGB1cHNlcnRlZCBjb2xsZWN0aW9uOiAke0pTT04uc3RyaW5naWZ5KGV4aXN0aW5nQ29sKX1gKTtcbiAgICAgICAgfSk7XG4gICAgY29uc29sZS5sb2coY29sUmVzdWx0cyk7XG4gICAgICAgIC8vIE5vdyB0cnkgZ2V0dGluZyBleGlzdGluZyBmYWNlcyBmb3IgZWFjaCBjb2xsZWN0aW9uXG4gICAgICAgIGxldCBmYWNlUGFyYW1zID0ge1xuICAgICAgICAgIENvbGxlY3Rpb25JZDogY29sSWRcbiAgICAgICAgfTtcbiAgICAgICAgbGV0IGZhY2VSZXF1ZXN0ID0gcmVrb2duaXRpb24ubGlzdEZhY2VzKGZhY2VQYXJhbXMpO1xuICAgICAgICBsZXQgcHJvbWlzZSA9IGZhY2VSZXF1ZXN0LnByb21pc2UoKTtcbiAgICAgICAgbGV0IGZhY2VzID0gcHJvbWlzZS50aGVuKHJlc3VsdCA9PiB7XG4gICAgICAgICAgaWYocmVzdWx0ICYmIHJlc3VsdC5GYWNlcy5sZW5ndGggPiAwKXtcbiAgICAgICAgICAgIGxldCBjb2xsZWN0aW9uX2lkID0gQ29sbGVjdGlvbnMuZmluZE9uZSh7Y29sbGVjdGlvbl9pZDogY29sSWR9KS5faWQ7XG4gICAgICAgICAgICBfLmVhY2gocmVzdWx0LkZhY2VzLCBmYWNlID0+IHtcbiAgICAgICAgICAgICAgbGV0IGF3c0ZhY2UgPSB7XG4gICAgICAgICAgICAgICAgcHJpbnRfaWQ6IGZhY2UuRmFjZUlkLFxuICAgICAgICAgICAgICAgIHByaW50X25hbWU6IGZhY2UuRXh0ZXJuYWxJbWFnZUlkLnJlcGxhY2UoXCJfX1wiLCBcIiBcIikgfHwgZmFjZS5JbWFnZUlkLFxuICAgICAgICAgICAgICAgIHByaW50X3R5cGU6IFwiZmFjZVwiLFxuICAgICAgICAgICAgICAgIHByaW50X2NvbGxlY3Rpb25faWQ6IGNvbGxlY3Rpb25faWQsXG4gICAgICAgICAgICAgICAgcHJpbnRfZGV0YWlsczogZmFjZSxcbiAgICAgICAgICAgICAgICBwcmludF9hZGRlcjogXCJyb290XCJcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgUHJpbnRzLnNpbXBsZVNjaGVtYSgpLmNsZWFuKGF3c0ZhY2UpO1xuICAgICAgICAgICAgICBsZXQgZXhpc3RpbmdGYWNlID0gUHJpbnRzLnVwc2VydCh7cHJpbnRfaWQ6IGZhY2UuRmFjZUlkfSwgeyRzZXQ6IGF3c0ZhY2V9KTtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coYHVwc2VydGVkIHByaW50OiAke0pTT04uc3RyaW5naWZ5KGV4aXN0aW5nRmFjZSl9YCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSk7XG5cbiAgLy8gaWYgKFByaW50cy5maW5kKCkuY291bnQoKSA8IDE1KSB7XG4gIC8vICAgY29uc29sZS5sb2coXCJzZWVkaW5nIHByaW50cy4uLlwiKTtcbiAgLy8gICBsZXQgc2VlZFByaW50cyA9IFtdXG4gIC8vICAgXy50aW1lcyg1LCAoKT0+e1xuICAvLyAgICAgbGV0IHByaW50ID0ge1xuICAvLyAgICAgICBwcmludF9hZGRlcjogdGhpcy51c2VySWQgfHwgXCJyb290XCIsXG4gIC8vICAgICAgIHByaW50X2NvbGxlY3Rpb246IFwicGVvcGxlXCIsXG4gIC8vICAgICAgIHByaW50X2NvbGxlY3Rpb25faWQ6IFwicGVvcGxlXCIsXG4gIC8vICAgICAgIHByaW50X25hbWU6IGZha2VyLmhlbHBlcnMudXNlckNhcmQoKS5uYW1lLFxuICAvLyAgICAgICBwcmludF9pZDogZmFrZXIucmFuZG9tLnV1aWQoKSxcbiAgLy8gICAgICAgcHJpbnRfaW1nOiBmYWtlci5pbWFnZS5hdmF0YXIoKVxuICAvLyAgICAgfTtcbiAgLy8gICAgIGxldCBwcmludElkID0gUHJpbnRzLmluc2VydChwcmludCk7XG4gIC8vICAgICBzZWVkUHJpbnRzLnB1c2gocHJpbnRJZCk7XG4gIC8vICAgfSk7XG4gIC8vICAgY29uc29sZS5sb2coc2VlZFByaW50cyk7XG5cbiAgLy8gfTtcbn0pOyIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNy1wcmVzZW50IEFudG1vdW5kcy5jb20sIEluYy4gb3IgaXRzIGFmZmlsaWF0ZXMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEdOVSBBZmZlcm8gR2VuZXJhbCBQdWJsaWMgTGljZW5zZSwgdmVyc2lvbiAzLjAgKHRoZSBcIkxpY2Vuc2VcIikuIFlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aFxuICogdGhlIExpY2Vuc2UuIEEgY29weSBvZiB0aGUgTGljZW5zZSBpcyBsb2NhdGVkIGF0XG4gKlxuICogICAgIGh0dHBzOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvYWdwbC0zLjAuZW4uaHRtbFxuICpcbiAqIG9yIGluIHRoZSBcImxpY2Vuc2VcIiBmaWxlIGFjY29tcGFueWluZyB0aGlzIGZpbGUuIFRoaXMgZmlsZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUlxuICogQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zXG4gKiBhbmQgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbmltcG9ydCB7IE1ldGVvciB9IGZyb20gJ21ldGVvci9tZXRlb3InO1xuaW1wb3J0IHsgSFRUUCB9IGZyb20gJ21ldGVvci9odHRwJztcbmltcG9ydCAnLi4vYWNjb3VudHMtY29uZmlnLmpzJztcbmltcG9ydCAnLi9maXh0dXJlcy5qcyc7XG4vLyBUaGlzIGRlZmluZXMgYWxsIHRoZSBjb2xsZWN0aW9ucywgcHVibGljYXRpb25zIGFuZCBtZXRob2RzIHRoYXQgdGhlIGFwcGxpY2F0aW9uIHByb3ZpZGVzXG4vLyBhcyBhbiBBUEkgdG8gdGhlIGNsaWVudC5cbmltcG9ydCAnLi9yZWdpc3Rlci1hcGkuanMnO1xuXG5jb25zdCBvcyA9IHJlcXVpcmUoJ29zJyk7XG5cblxuc2VydmVyX21vZGUgPSBNZXRlb3IuaXNQcm9kdWN0aW9uID8gXCJQUk9EVUNUSU9OXCIgOiBcIkRFVkVMT1BNRU5UXCI7XG4vLyBjb25zb2xlLmxvZygnaW5kZXguanM6ICcgKyBzZXJ2ZXJfbW9kZSArIFwiLS0+XCIgKyBKU09OLnN0cmluZ2lmeShNZXRlb3Iuc2V0dGluZ3MpKTtcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXG5cdGluZm8oKXtcblx0XHRyZXR1cm4gYHJlbGVhc2U6ICR7cHJvY2Vzcy5lbnYuVkVSU0lPTiB8fCAnMC5YJ30tbGl0ZSAtIHZlcnNpb246ICR7cHJvY2Vzcy5lbnYuVkVSU0lPTiB8fCAnMC5YJ30gLSBidWlsZDogJHtwcm9jZXNzLmVudi5CVUlMRCB8fCAnZGV2J30gLSBob3N0bmFtZTogJHtvcy5ob3N0bmFtZSgpfWA7XG5cdH0sXG5cblx0YXN5bmMgZ2V0RGF0YSgpeyAgICBcblx0XHR0cnl7XG5cdFx0XHR2YXIgcmVzcG9uc2UgPSB7fTtcblx0XHRcdGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBIVFRQLmNhbGwoJ0dFVCcsICdodHRwOi8vanNvbnBsYWNlaG9sZGVyLnR5cGljb2RlLmNvbS9wb3N0cycpO1x0XG5cdFx0XHRjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShyZXN1bHRzLmRhdGFbMF0pKTtcdFxuXHRcdFx0Y29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkocmVzdWx0cy5oZWFkZXJzKSk7XG5cdFx0XHRyZXNwb25zZS5jb2RlID0gdHJ1ZTtcblx0XHRcdHJlc3BvbnNlLmRhdGEgPSByZXN1bHRzO1xuXHRcdH0gY2F0Y2goZSl7XG5cdFx0XHRyZXNwb25zZSA9IGZhbHNlO1xuXHRcdFx0Y29uc29sZS5sb2coZSk7XG5cdFx0fSBmaW5hbGx5IHtcblx0XHRcdGNvbnNvbGUubG9nKFwiZmluYWxseS4uLlwiKVxuXHRcdFx0Ly90aHJvdyBuZXcgTWV0ZW9yLkVycm9yKFwiaW5hcHByb3ByaWF0ZS1waWNcIixcIlRoZSB1c2VyIGhhcyB0YWtlbiBhbiBpbmFwcHJvcHJpYXRlIHBpY3R1cmUuXCIpO1x0XG5cdFx0XHRyZXR1cm4gcmVzcG9uc2U7XG5cdFx0fVxuXHR9XG5cbn0pO1xuXG5NZXRlb3Iub25Db25uZWN0aW9uKChjb25uZWN0aW9uKT0+e1xuXHRsZXQgY2xpZW50QWRkciA9IGNvbm5lY3Rpb24uY2xpZW50QWRkcmVzcztcblx0bGV0IGhlYWRlcnMgPSBjb25uZWN0aW9uLmh0dHBIZWFkZXJzO1xuXHRjb25zb2xlLmxvZyhgY29ubmVjdGlvbiBmcm9tICR7Y2xpZW50QWRkcn1gKTtcblx0Ly8gY29uc29sZS5sb2coaGVhZGVycyk7XG59KSIsImltcG9ydCAnLi4vLi4vYXBpL2NvbGxlY3Rpb25zL21ldGhvZHMuanMnO1xuaW1wb3J0ICcuLi8uLi9hcGkvY29sbGVjdGlvbnMvcHVibGljYXRpb25zLmpzJztcbmltcG9ydCAnLi4vLi4vYXBpL3NlYXJjaGVzL21ldGhvZHMuanMnO1xuaW1wb3J0ICcuLi8uLi9hcGkvc2VhcmNoZXMvcHVibGljYXRpb25zLmpzJztcbmltcG9ydCAnLi4vLi4vYXBpL3ByaW50cy9tZXRob2RzLmpzJztcbmltcG9ydCAnLi4vLi4vYXBpL3ByaW50cy9wdWJsaWNhdGlvbnMuanMnOyIsImltcG9ydCB7IEFjY291bnRzIH0gZnJvbSAnbWV0ZW9yL2FjY291bnRzLWJhc2UnO1xuaW1wb3J0IHsgQWNjb3VudHNDb21tb24gfSBmcm9tICdtZXRlb3IvYWNjb3VudHMtYmFzZSdcbmltcG9ydCB7IEFjY291bnRzQ2xpZW50IH0gZnJvbSAnbWV0ZW9yL2FjY291bnRzLWJhc2UnXG5cblxuaWYgKE1ldGVvci5pc0NsaWVudCkge1xuXHRBY2NvdW50cy51aS5jb25maWcoe1xuXHQgIHBhc3N3b3JkU2lnbnVwRmllbGRzOiAnVVNFUk5BTUVfQU5EX0VNQUlMJyxcblx0fSk7XG59XG5cbmlmIChNZXRlb3IuaXNTZXJ2ZXIpIHtcblx0Y29uc29sZS5sb2coXCJhY2NvdW50cyBjb25maWcgbG9hZGVkIVwiKTtcblx0QWNjb3VudHMub25DcmVhdGVVc2VyKChvcHRpb25zLCB1c2VyKSA9PiB7XG5cdFx0Ly8gdXNlci5jcmVhdGVkID0gbmV3IERhdGUoKTtcblxuXHRcdGNvbnNvbGUubG9nKFwidXNlcjogXCIgKyB1c2VyKTtcblx0XHRjb25zb2xlLmxvZyhcIm9wdGlvbnM6IFwiICsgb3B0aW9ucyk7XG5cdFx0Ly8gdXNlciA9IEpTT04uc3RyaW5naWZ5KHVzZXIpO1xuXHRcdGNvbnNvbGUubG9nKHVzZXIpO1xuXHRcdC8vIG9wdGlvbnMgPSBKU09OLnN0cmluZ2lmeShvcHRpb25zKTtcblx0XHRjb25zb2xlLmxvZyhvcHRpb25zKTtcblxuXHQgICAgLy8gRG9uJ3QgZm9yZ2V0IHRvIHJldHVybiB0aGUgbmV3IHVzZXIgb2JqZWN0IGF0IHRoZSBlbmQhXG5cdFx0cmV0dXJuIHVzZXI7XG5cdH0pO1xufSIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNy1wcmVzZW50IEFudG1vdW5kcy5jb20sIEluYy4gb3IgaXRzIGFmZmlsaWF0ZXMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEdOVSBBZmZlcm8gR2VuZXJhbCBQdWJsaWMgTGljZW5zZSwgdmVyc2lvbiAzLjAgKHRoZSBcIkxpY2Vuc2VcIikuIFlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aFxuICogdGhlIExpY2Vuc2UuIEEgY29weSBvZiB0aGUgTGljZW5zZSBpcyBsb2NhdGVkIGF0XG4gKlxuICogICAgIGh0dHBzOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvYWdwbC0zLjAuZW4uaHRtbFxuICpcbiAqIG9yIGluIHRoZSBcImxpY2Vuc2VcIiBmaWxlIGFjY29tcGFueWluZyB0aGlzIGZpbGUuIFRoaXMgZmlsZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUlxuICogQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zXG4gKiBhbmQgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbmltcG9ydCAnLi4vaW1wb3J0cy9zdGFydHVwL3NlcnZlcic7XG5cbk1ldGVvci5zdGFydHVwKCgpID0+IHtcbiAgLy8gY29kZSB0byBydW4gb24gc2VydmVyIGF0IHN0YXJ0dXBcbn0pO1xuIl19
