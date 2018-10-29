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
module.link("meteor/mongo", {
  Mongo(v) {
    Mongo = v;
  }

}, 0);
let SimpleSchema;
module.link("meteor/aldeed:simple-schema", {
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
module.link("meteor/ddp-rate-limiter", {
  DDPRateLimiter(v) {
    DDPRateLimiter = v;
  }

}, 0);
let AWS;
module.link("aws-sdk", {
  default(v) {
    AWS = v;
  }

}, 1);
let Collections;
module.link("./collections.js", {
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
module.link("meteor/ddp-rate-limiter", {
  DDPRateLimiter(v) {
    DDPRateLimiter = v;
  }

}, 0);
let Collections;
module.link("./collections.js", {
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
module.link("meteor/ddp-rate-limiter", {
  DDPRateLimiter(v) {
    DDPRateLimiter = v;
  }

}, 0);
let AWS;
module.link("aws-sdk", {
  default(v) {
    AWS = v;
  }

}, 1);
let Collections;
module.link("../collections/collections.js", {
  Collections(v) {
    Collections = v;
  }

}, 2);
let Prints;
module.link("./prints.js", {
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
module.link("meteor/mongo", {
  Mongo(v) {
    Mongo = v;
  }

}, 0);
let SimpleSchema;
module.link("meteor/aldeed:simple-schema", {
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
module.link("meteor/ddp-rate-limiter", {
  DDPRateLimiter(v) {
    DDPRateLimiter = v;
  }

}, 0);
let Prints;
module.link("./prints.js", {
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
module.link("meteor/ddp-rate-limiter", {
  DDPRateLimiter(v) {
    DDPRateLimiter = v;
  }

}, 0);
let AWS;
module.link("aws-sdk", {
  default(v) {
    AWS = v;
  }

}, 1);
let Random;
module.link("meteor/random", {
  Random(v) {
    Random = v;
  }

}, 2);
let Collections;
module.link("../collections/collections.js", {
  Collections(v) {
    Collections = v;
  }

}, 3);
let Prints;
module.link("../prints/prints.js", {
  Prints(v) {
    Prints = v;
  }

}, 4);
let Searches;
module.link("./searches.js", {
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
module.link("meteor/ddp-rate-limiter", {
  DDPRateLimiter(v) {
    DDPRateLimiter = v;
  }

}, 0);
let Searches;
module.link("./searches.js", {
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
module.link("meteor/mongo", {
  Mongo(v) {
    Mongo = v;
  }

}, 0);
let SimpleSchema;
module.link("meteor/aldeed:simple-schema", {
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
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let Collections;
module.link("../../api/collections/collections.js", {
  Collections(v) {
    Collections = v;
  }

}, 1);
let Prints;
module.link("../../api/prints/prints.js", {
  Prints(v) {
    Prints = v;
  }

}, 2);
let Searches;
module.link("../../api/searches/searches.js", {
  Searches(v) {
    Searches = v;
  }

}, 3);
let AWS;
module.link("aws-sdk", {
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
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let HTTP;
module.link("meteor/http", {
  HTTP(v) {
    HTTP = v;
  }

}, 1);
module.link("../accounts-config.js");
module.link("./fixtures.js");
module.link("./register-api.js");

const os = require('os');

server_mode = Meteor.isProduction ? "PRODUCTION" : "DEVELOPMENT"; // console.log('index.js: ' + server_mode + "-->" + JSON.stringify(Meteor.settings));

Meteor.methods({
  info() {
    return `release: ${process.env.VERSION || '0.X'}-${process.env.RELEASE || 'free'} ~ version: ${process.env.VERSION || '0.X'} ~ build: ${process.env.BUILD || 'dev'} ~ hostname: ${os.hostname()}`;
  },

  getCode() {
    return Meteor.settings.private.key;
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
module.link("../../api/collections/methods.js");
module.link("../../api/collections/publications.js");
module.link("../../api/searches/methods.js");
module.link("../../api/searches/publications.js");
module.link("../../api/prints/methods.js");
module.link("../../api/prints/publications.js");
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"accounts-config.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// imports/startup/accounts-config.js                                                                                //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
let Accounts;
module.link("meteor/accounts-base", {
  Accounts(v) {
    Accounts = v;
  }

}, 0);
let AccountsCommon;
module.link("meteor/accounts-base", {
  AccountsCommon(v) {
    AccountsCommon = v;
  }

}, 1);
let AccountsClient;
module.link("meteor/accounts-base", {
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
module.link("../imports/startup/server");
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvY29sbGVjdGlvbnMvY29sbGVjdGlvbnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL2NvbGxlY3Rpb25zL21ldGhvZHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL2NvbGxlY3Rpb25zL3B1YmxpY2F0aW9ucy5qcyIsIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvcHJpbnRzL21ldGhvZHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL3ByaW50cy9wcmludHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL3ByaW50cy9wdWJsaWNhdGlvbnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL3NlYXJjaGVzL21ldGhvZHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL3NlYXJjaGVzL3B1YmxpY2F0aW9ucy5qcyIsIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvc2VhcmNoZXMvc2VhcmNoZXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvc3RhcnR1cC9zZXJ2ZXIvZml4dHVyZXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvc3RhcnR1cC9zZXJ2ZXIvaW5kZXguanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvc3RhcnR1cC9zZXJ2ZXIvcmVnaXN0ZXItYXBpLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9pbXBvcnRzL3N0YXJ0dXAvYWNjb3VudHMtY29uZmlnLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9zZXJ2ZXIvbWFpbi5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnQiLCJDb2xsZWN0aW9ucyIsIk1vbmdvIiwibGluayIsInYiLCJTaW1wbGVTY2hlbWEiLCJNZXRlb3IiLCJDb2xsZWN0aW9uIiwiZGVueSIsImluc2VydCIsInVwZGF0ZSIsInJlbW92ZSIsIlNjaGVtYSIsInR5cGUiLCJTdHJpbmciLCJsYWJlbCIsIm9wdGlvbmFsIiwiZGVmYXVsdFZhbHVlIiwiaW5kZXgiLCJ1bmlxdWUiLCJhbGxvd2VkVmFsdWVzIiwiTnVtYmVyIiwiQm9vbGVhbiIsIkRhdGUiLCJhdXRvVmFsdWUiLCJpc0luc2VydCIsImlzVXBkYXRlIiwiYXR0YWNoU2NoZW1hIiwicHVibGljRmllbGRzIiwiY29sbGVjdGlvbl9pZCIsImNvbGxlY3Rpb25fbmFtZSIsImNvbGxlY3Rpb25fdHlwZSIsInByaW50X2NvdW50IiwicHJpdmF0ZSIsImNyZWF0ZWQiLCJ1cGRhdGVkIiwiRERQUmF0ZUxpbWl0ZXIiLCJBV1MiLCJkZWZhdWx0IiwiY29uZmlnIiwicmVnaW9uIiwicmVrb2duaXRpb24iLCJSZWtvZ25pdGlvbiIsIm1ldGhvZHMiLCJuZXdDb2wiLCJjaGVjayIsInJlcGxhY2UiLCJjb25zb2xlIiwibG9nIiwiY29sbGVjdGlvblBhcmFtcyIsIkNvbGxlY3Rpb25JZCIsImNvbGxlY3Rpb25SZXF1ZXN0IiwiY3JlYXRlQ29sbGVjdGlvbiIsInByb21pc2UiLCJjYXRjaCIsImVycm9yIiwiRXJyb3IiLCJjb2RlIiwibWVzc2FnZSIsInRoZW4iLCJ2YWx1ZXMiLCJjb2wiLCJjb2xJZCIsImZpbmRPbmUiLCJwYXJhbXMiLCJkZWxldGVDb2xsZWN0aW9uIiwib2xkQ29sIiwiX2lkIiwicHVibGlzaCIsImNvbGxlY3Rpb25JZCIsImZpbmQiLCJzb3J0IiwiZmllbGRzIiwic3Vic2NyaWJlVG9Db2xsZWN0aW9uc1J1bGUiLCJuYW1lIiwiYWRkUnVsZSIsIlByaW50cyIsIm5ld1ByaW50IiwiY29sbGVjdGlvbiIsInByaW50X2FkZGVyIiwidXNlcklkIiwicHJpbnRfY29sbGVjdGlvbl9pZCIsInByaW50X25hbWUiLCJwcmludF9pbWciLCJpbWciLCJzaW1wbGVTY2hlbWEiLCJjbGVhbiIsImZhY2VQYXJhbXMiLCJFeHRlcm5hbEltYWdlSWQiLCJJbWFnZSIsIkJ1ZmZlciIsImZyb20iLCJzcGxpdCIsIkRldGVjdGlvbkF0dHJpYnV0ZXMiLCJmYWNlUmVxdWVzdCIsImluZGV4RmFjZXMiLCJpbmRleEZhY2UiLCJyZXN1bHQiLCJwcmludF9pZCIsIkZhY2VSZWNvcmRzIiwiRmFjZSIsIkZhY2VJZCIsInByaW50IiwicHJpbnRJZCIsIkZhY2VJZHMiLCJwcmludFJlcXVlc3QiLCJkZWxldGVGYWNlcyIsIm9sZFByaW50IiwiZGVsZXRlUHJpbnRSdWxlIiwiT2JqZWN0IiwiYmxhY2tib3giLCJwcmludF90eXBlIiwicHJpbnRfZGV0YWlscyIsInNlbGVjdG9yIiwic3Vic2NyaWJlVG9QcmludHNSdWxlIiwiUmFuZG9tIiwiU2VhcmNoZXMiLCJzMyIsIlMzIiwiZGFzaGJvYXJkU3RhdHMiLCJjb2xsZWN0aW9ucyIsImNvdW50IiwiZmFjZXMiLCJzZWFyY2hlcyIsIm1hdGNoZXMiLCIkbmUiLCJtYXRjaFBlcmNlbnQiLCJNYXRoIiwicm91bmQiLCJzZWFyY2hEYXRhIiwibWF0Y2hUaHJlc2hvbGQiLCJ0MCIsImdldFRpbWUiLCJpbWdCeXRlcyIsImltZ0ZpbGVOYW1lIiwiaWQiLCJ1cGxvYWRCdWNrZXQiLCJzM1BhcmFtcyIsIkFDTCIsIkJvZHkiLCJCdWNrZXQiLCJDb250ZW50RW5jb2RpbmciLCJDb250ZW50VHlwZSIsIktleSIsIk1ldGFkYXRhIiwiVGFnZ2luZyIsInMzUmVzdWx0cyIsInB1dE9iamVjdCIsInZhbHVlIiwiRXhwaXJlcyIsInMzU2lnbmVkVXJsIiwiZ2V0U2lnbmVkVXJsIiwiY29sSWRzIiwiZmV0Y2giLCJtb2RlcmF0aW9uUGFyYW1zIiwibGFiZWxQYXJhbXMiLCJjZWxlYnJpdHlQYXJhbXMiLCJtb2RlcmF0aW9uUmVxdWVzdCIsImRldGVjdE1vZGVyYXRpb25MYWJlbHMiLCJsYWJlbFJlcXVlc3QiLCJkZXRlY3RMYWJlbHMiLCJkZXRlY3RGYWNlcyIsImNlbGVicml0eVJlcXVlc3QiLCJyZWNvZ25pemVDZWxlYnJpdGllcyIsImFsbFByb21pc2VzIiwicHVzaCIsIl8iLCJlYWNoIiwicmVrb2duaXRpb25QYXJhbXMiLCJyZWtvZ25pdGlvblJlcXVlc3QiLCJzZWFyY2hGYWNlc0J5SW1hZ2UiLCJyZXNwb25zZSIsIlByb21pc2UiLCJhbGwiLCJKU09OIiwic3RyaW5naWZ5IiwiaSIsInBlcnNvbnMiLCJGYWNlTWF0Y2hlcyIsInRhZyIsImltYWdlX2lkIiwiZmFjZV9pZCIsInNpbWlsYXJpdHkiLCJTaW1pbGFyaXR5IiwidDEiLCJzZWFyY2hfcmVzdWx0cyIsIm1vZGVyYXRpb24iLCJNb2RlcmF0aW9uTGFiZWxzIiwibGFiZWxzIiwiTGFiZWxzIiwiZmFjZURldGFpbHMiLCJGYWNlRGV0YWlscyIsImNlbGVicml0eSIsIkNlbGVicml0eUZhY2VzIiwidXJsIiwic2VhcmNoIiwic2VhcmNoX2ltYWdlIiwic3RhdGlvbl9uYW1lIiwic3RhdGlvbk5hbWUiLCJzYXZlU2VhcmNoIiwicmVhc29uIiwiZGV0YWlscyIsImZpbmFsbHkiLCJzZWFyY2hJZCIsInJ1blNjYW5SdWxlIiwic3Vic2NyaWJlVG9TZWFyY2hlc1J1bGUiLCJpc1NlcnZlciIsInN0YXJ0dXAiLCJfZW5zdXJlSW5kZXgiLCJzZWFyY2hfdHlwZSIsInNlYXJjaF9jb2xsZWN0aW9ucyIsImNvbFBhcmFtcyIsImNvbFJlcXVlc3QiLCJsaXN0Q29sbGVjdGlvbnMiLCJjb2xzIiwiQ29sbGVjdGlvbklkcyIsImxlbmd0aCIsImF3c0NvbCIsImNvbFJlc3VsdHMiLCJkZXNjcmliZUNvbGxlY3Rpb24iLCJGYWNlQ291bnQiLCJleGlzdGluZ0NvbCIsInVwc2VydCIsIiRzZXQiLCJsaXN0RmFjZXMiLCJGYWNlcyIsImZhY2UiLCJhd3NGYWNlIiwiSW1hZ2VJZCIsImV4aXN0aW5nRmFjZSIsIkhUVFAiLCJvcyIsInJlcXVpcmUiLCJzZXJ2ZXJfbW9kZSIsImlzUHJvZHVjdGlvbiIsImluZm8iLCJwcm9jZXNzIiwiZW52IiwiVkVSU0lPTiIsIlJFTEVBU0UiLCJCVUlMRCIsImhvc3RuYW1lIiwiZ2V0Q29kZSIsInNldHRpbmdzIiwia2V5IiwiZ2V0RGF0YSIsInJlc3VsdHMiLCJjYWxsIiwiZGF0YSIsImhlYWRlcnMiLCJlIiwib25Db25uZWN0aW9uIiwiY29ubmVjdGlvbiIsImNsaWVudEFkZHIiLCJjbGllbnRBZGRyZXNzIiwiaHR0cEhlYWRlcnMiLCJBY2NvdW50cyIsIkFjY291bnRzQ29tbW9uIiwiQWNjb3VudHNDbGllbnQiLCJpc0NsaWVudCIsInVpIiwicGFzc3dvcmRTaWdudXBGaWVsZHMiLCJvbkNyZWF0ZVVzZXIiLCJvcHRpb25zIiwidXNlciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBQUEsTUFBTSxDQUFDQyxNQUFQLENBQWM7QUFBQ0MsYUFBVyxFQUFDLE1BQUlBO0FBQWpCLENBQWQ7QUFBNkMsSUFBSUMsS0FBSjtBQUFVSCxNQUFNLENBQUNJLElBQVAsQ0FBWSxjQUFaLEVBQTJCO0FBQUNELE9BQUssQ0FBQ0UsQ0FBRCxFQUFHO0FBQUNGLFNBQUssR0FBQ0UsQ0FBTjtBQUFROztBQUFsQixDQUEzQixFQUErQyxDQUEvQztBQUFrRCxJQUFJQyxZQUFKO0FBQWlCTixNQUFNLENBQUNJLElBQVAsQ0FBWSw2QkFBWixFQUEwQztBQUFDRSxjQUFZLENBQUNELENBQUQsRUFBRztBQUFDQyxnQkFBWSxHQUFDRCxDQUFiO0FBQWU7O0FBQWhDLENBQTFDLEVBQTRFLENBQTVFO0FBS25ILE1BQU1ILFdBQVcsR0FBRyxJQUFJSyxNQUFNLENBQUNDLFVBQVgsQ0FBc0IsYUFBdEIsQ0FBcEI7QUFFUDtBQUNBTixXQUFXLENBQUNPLElBQVosQ0FBaUI7QUFDZkMsUUFBTSxHQUFHO0FBQUUsV0FBTyxJQUFQO0FBQWMsR0FEVjs7QUFFZkMsUUFBTSxHQUFHO0FBQUUsV0FBTyxJQUFQO0FBQWMsR0FGVjs7QUFHZkMsUUFBTSxHQUFHO0FBQUUsV0FBTyxJQUFQO0FBQWM7O0FBSFYsQ0FBakI7QUFNQVYsV0FBVyxDQUFDVyxNQUFaLEdBQXFCLElBQUlQLFlBQUosQ0FBaUI7QUFDcEM7QUFDQSxtQkFBaUI7QUFDZlEsUUFBSSxFQUFFQyxNQURTO0FBRWZD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QVAsQ0FBWSxzQkFBWixFQUFtQztBQUFDK1AsZ0JBQWMsQ0FBQzlQLENBQUQsRUFBRztBQUFDOFAsa0JBQWMsR0FBQzlQLENBQWY7QUFBaUI7O0FBQXBDLENBQW5DLEVBQXlFLENBQXpFOztBQUsvTCxJQUFJRSxNQUFNLENBQUM2UCxRQUFYLEVBQXFCO0FBQ3BCSCxVQUFRLENBQUNJLEVBQVQsQ0FBWTdOLE1BQVosQ0FBbUI7QUFDakI4Tix3QkFBb0IsRUFBRTtBQURMLEdBQW5CO0FBR0E7O0FBRUQsSUFBSS9QLE1BQU0sQ0FBQ3dNLFFBQVgsRUFBcUI7QUFDcEIvSixTQUFPLENBQUNDLEdBQVIsQ0FBWSx5QkFBWjtBQUNBZ04sVUFBUSxDQUFDTSxZQUFULENBQXNCLENBQUNDLE9BQUQsRUFBVUMsSUFBVixLQUFtQjtBQUN4QztBQUVBek4sV0FBTyxDQUFDQyxHQUFSLENBQVksV0FBV3dOLElBQXZCO0FBQ0F6TixXQUFPLENBQUNDLEdBQVIsQ0FBWSxjQUFjdU4sT0FBMUIsRUFKd0MsQ0FLeEM7O0FBQ0F4TixXQUFPLENBQUNDLEdBQVIsQ0FBWXdOLElBQVosRUFOd0MsQ0FPeEM7O0FBQ0F6TixXQUFPLENBQUNDLEdBQVIsQ0FBWXVOLE9BQVosRUFSd0MsQ0FVckM7O0FBQ0gsV0FBT0MsSUFBUDtBQUNBLEdBWkQ7QUFhQSxDOzs7Ozs7Ozs7OztBQzFCRHpRLE1BQU0sQ0FBQ0ksSUFBUCxDQUFZLDJCQUFaO0FBY0FHLE1BQU0sQ0FBQ3lNLE9BQVAsQ0FBZSxNQUFNLENBQ25CO0FBQ0QsQ0FGRCxFIiwiZmlsZSI6Ii9hcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNb25nbyB9IGZyb20gJ21ldGVvci9tb25nbyc7XG5pbXBvcnQgeyBTaW1wbGVTY2hlbWEgfSBmcm9tICdtZXRlb3IvYWxkZWVkOnNpbXBsZS1zY2hlbWEnO1xuXG5cblxuZXhwb3J0IGNvbnN0IENvbGxlY3Rpb25zID0gbmV3IE1ldGVvci5Db2xsZWN0aW9uKCdjb2xsZWN0aW9ucycpO1xuXG4vLyBEZW55IGFsbCBjbGllbnQtc2lkZSB1cGRhdGVzIHNpbmNlIHdlIHdpbGwgYmUgdXNpbmcgbWV0aG9kcyB0byBtYW5hZ2UgdGhpcyBjb2xsZWN0aW9uXG5Db2xsZWN0aW9ucy5kZW55KHtcbiAgaW5zZXJ0KCkgeyByZXR1cm4gdHJ1ZTsgfSxcbiAgdXBkYXRlKCkgeyByZXR1cm4gdHJ1ZTsgfSxcbiAgcmVtb3ZlKCkgeyByZXR1cm4gdHJ1ZTsgfSxcbn0pO1xuXG5Db2xsZWN0aW9ucy5TY2hlbWEgPSBuZXcgU2ltcGxlU2NoZW1hKHtcbiAgLy8gT3VyIHNjaGVtYSBydWxlcyB3aWxsIGdvIGhlcmUuXG4gIFwiY29sbGVjdGlvbl9pZFwiOiB7XG4gICAgdHlwZTogU3RyaW5nLFxuICAgIGxhYmVsOiBcIkNvbGxlY3Rpb24gSURcIixcbiAgICBvcHRpb25hbDogZmFsc2UsXG4gICAgZGVmYXVsdFZhbHVlOiBcIk15X0NvbGxlY3Rpb25cIixcbiAgICBpbmRleDogdHJ1ZSxcbiAgICB1bmlxdWU6IHRydWVcbiAgfSxcbiAgXCJjb2xsZWN0aW9uX25hbWVcIjoge1xuICAgIHR5cGU6IFN0cmluZyxcbiAgICBsYWJlbDogXCJDb2xsZWN0aW9uIE5hbWVcIixcbiAgICBvcHRpb25hbDogZmFsc2UsXG4gICAgZGVmYXVsdFZhbHVlOiBcIk15IENvbGxlY3Rpb25cIixcbiAgICBpbmRleDogdHJ1ZVxuICB9LFxuICBcImNvbGxlY3Rpb25fdHlwZVwiOiB7XG4gICAgdHlwZTogU3RyaW5nLFxuICAgIGxhYmVsOiBcIkNvbGxlY3Rpb24gdHlwZVwiLFxuICAgIG9wdGlvbmFsOiBmYWxzZSxcbiAgICBhbGxvd2VkVmFsdWVzOiBbXCJmYWNlXCIsIFwidm9pY2VcIl0sXG4gICAgZGVmYXVsdFZhbHVlOiBcImZhY2VcIlxuICB9LFxuICBcInByaW50X2NvdW50XCI6IHtcbiAgICB0eXBlOiBOdW1iZXIsXG4gICAgbGFiZWw6IFwiUHJpbnQgY291bnRcIixcbiAgICBvcHRpb25hbDogdHJ1ZSxcbiAgICBkZWZhdWx0VmFsdWU6IDBcbiAgfSxcbiAgXCJwcml2YXRlXCI6IHtcbiAgICB0eXBlOiBCb29sZWFuLFxuICAgIGxhYmVsOiBcIkNvbGxlY3Rpb24gcHJpdmFjeVwiLFxuICAgIG9wdGlvbmFsOiB0cnVlLFxuICAgIGRlZmF1bHRWYWx1ZTogdHJ1ZVxuICB9LFxuICBcImNyZWF0ZWRcIjoge1xuICAgIHR5cGU6IERhdGUsXG4gICAgbGFiZWw6IFwiRGF0ZSBjb2xsZWN0aW9uIGFkZGVkIHRvIEFudGVubmFlXCIsXG4gICAgYXV0b1ZhbHVlOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICggdGhpcy5pc0luc2VydCApIHtcbiAgICAgICAgcmV0dXJuIG5ldyBEYXRlO1xuICAgICAgfSBcbiAgICB9LFxuICAgIG9wdGlvbmFsOiB0cnVlXG4gIH0sXG4gIFwidXBkYXRlZFwiOiB7XG4gICAgdHlwZTogRGF0ZSxcbiAgICBsYWJlbDogXCJEYXRlIGNvbGxlY3Rpb24gdXBkYXRlZCBpbiBTeXN0ZW1cIixcbiAgICBhdXRvVmFsdWU6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCB0aGlzLmlzVXBkYXRlICkge1xuICAgICAgICByZXR1cm4gbmV3IERhdGU7XG4gICAgICB9IFxuICAgIH0sXG4gICAgb3B0aW9uYWw6IHRydWVcbiAgfVxufSk7XG5cbkNvbGxlY3Rpb25zLmF0dGFjaFNjaGVtYSggQ29sbGVjdGlvbnMuU2NoZW1hICk7IFxuXG5cbkNvbGxlY3Rpb25zLnB1YmxpY0ZpZWxkcyA9IHtcbiAgY29sbGVjdGlvbl9pZDogMSxcbiAgY29sbGVjdGlvbl9uYW1lOiAxLFxuICBjb2xsZWN0aW9uX3R5cGU6IDEsXG4gIHByaW50X2NvdW50OiAxLFxuICBwcml2YXRlOiAxLFxuICBjcmVhdGVkOiAxLFxuICB1cGRhdGVkOiAxXG59O1xuXG4vLyBDb2xsZWN0aW9ucy5oZWxwZXJzKHtcbi8vICAgLy8gQSBjb2xsZWN0aW9ucyBpcyBjb25zaWRlcmVkIHRvIGJlIHByaXZhdGUgaWYgXCJwcml2YXRlXCIgaXMgc2V0IHRvIHRydWVcbi8vICAgaXNQcml2YXRlKCkge1xuLy8gICAgIHJldHVybiB0aGlzLnByaXZhdGU7XG4vLyAgIH1cbi8vIH0pOyIsImltcG9ydCB7IEREUFJhdGVMaW1pdGVyIH0gZnJvbSAnbWV0ZW9yL2RkcC1yYXRlLWxpbWl0ZXInO1xuaW1wb3J0IEFXUyBmcm9tICdhd3Mtc2RrJztcblxuaW1wb3J0IHsgQ29sbGVjdGlvbnMgfSBmcm9tICcuL2NvbGxlY3Rpb25zLmpzJztcblxuQVdTLmNvbmZpZy5yZWdpb24gPSAndXMtZWFzdC0xJztcbnZhciByZWtvZ25pdGlvbiA9IG5ldyBBV1MuUmVrb2duaXRpb24oKTtcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXHRcImNvbGxlY3Rpb24uc2F2ZVwiKG5ld0NvbCl7XG5cdFx0Y2hlY2sobmV3Q29sLmNvbGxlY3Rpb25fbmFtZSwgU3RyaW5nKTtcblx0XHRuZXdDb2wuY29sbGVjdGlvbl9pZCA9IG5ld0NvbC5jb2xsZWN0aW9uX25hbWUucmVwbGFjZSgvIC9nLFwiX19cIik7XG5cdFx0bmV3Q29sLnByaXZhdGUgPSB0cnVlO1xuXHRcdGNvbnNvbGUubG9nKG5ld0NvbCk7XG5cdFx0bGV0IGNvbGxlY3Rpb25QYXJhbXMgPSB7XG4gIFx0XHRcdENvbGxlY3Rpb25JZDogbmV3Q29sLmNvbGxlY3Rpb25faWRcblx0XHR9O1xuXHRcdGxldCBjb2xsZWN0aW9uUmVxdWVzdCA9IHJla29nbml0aW9uLmNyZWF0ZUNvbGxlY3Rpb24oY29sbGVjdGlvblBhcmFtcykucHJvbWlzZSgpLmNhdGNoKGVycm9yID0+IHsgdGhyb3cgbmV3IE1ldGVvci5FcnJvcihlcnJvci5jb2RlLCBlcnJvci5tZXNzYWdlLCBlcnJvcik7IHJldHVybiBlcnJvcjsgfSk7XG5cdFx0Y29sbGVjdGlvblJlcXVlc3QudGhlbih2YWx1ZXMgPT4ge3JldHVybiB2YWx1ZXN9KTtcblx0XHRsZXQgY29sID0gQ29sbGVjdGlvbnMuaW5zZXJ0KG5ld0NvbCk7XG5cdFx0aWYoY29sKXtcblx0XHRcdGNvbnNvbGUubG9nKGBhZGRlZCBjb2xsZWN0aW9uOiAke2NvbH1gKTtcblx0XHR9ZWxzZXtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKG5ld0NvbCk7XG4gICAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdhZGQtY29sbGVjdGlvbi1lcnJvcicsYGVycm9yIGFkZGluZyBjb2xsZWN0aW9uOiAke25ld0NvbH1gKVx0XHRcblx0XHR9XG5cdFx0cmV0dXJuIGBhZGRlZCBjb2xsZWN0aW9uOiAke2NvbH1gO1xuXHR9LFxuXG5cdFwiY29sbGVjdGlvbi5kZWxldGVcIihjb2xJZCl7XG5cdFx0Y2hlY2soY29sSWQsU3RyaW5nKTtcblx0XHRsZXQgY29sID0gQ29sbGVjdGlvbnMuZmluZE9uZShjb2xJZCk7XG5cdFx0Y29uc29sZS5sb2coY29sKTtcblx0XHRpZighY29sKXtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ25vLWNvbGxlY3Rpb24nLCdObyBjb2xsZWN0aW9uIGZvdW5kIHdpdGggZ2l2ZW4gaWQhJyk7XG5cdFx0fWVsc2V7XG5cdFx0XHRsZXQgcGFyYW1zID0ge1xuXHRcdFx0XHRDb2xsZWN0aW9uSWQ6IGNvbC5jb2xsZWN0aW9uX2lkXG5cdFx0XHR9O1xuXHRcdFx0bGV0IGNvbGxlY3Rpb25SZXF1ZXN0ID0gcmVrb2duaXRpb24uZGVsZXRlQ29sbGVjdGlvbihwYXJhbXMpLnByb21pc2UoKS5jYXRjaChlcnJvciA9PiB7IHRocm93IG5ldyBNZXRlb3IuRXJyb3IoZXJyb3IuY29kZSwgZXJyb3IubWVzc2FnZSwgZXJyb3IpOyByZXR1cm4gZXJyb3I7IH0pO1xuXHRcdFx0Y29sbGVjdGlvblJlcXVlc3QudGhlbih2YWx1ZXMgPT4ge3JldHVybiB2YWx1ZXN9KTtcblx0XHRcdGxldCBvbGRDb2wgPSBDb2xsZWN0aW9ucy5yZW1vdmUoY29sLl9pZCk7XG5cdFx0XHRpZihvbGRDb2wpe1xuXHRcdFx0XHRjb25zb2xlLmxvZyhgcmVtb3ZlZCBjb2xsZWN0aW9uOiAke29sZENvbH1gKTtcblx0XHRcdH1lbHNle1xuXHQgICAgICAgICAgICBjb25zb2xlLmxvZyhjb2xJZCk7XG5cdCAgICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ3JlbW92ZS1jb2xsZWN0aW9uLWVycm9yJyxgZXJyb3IgcmVtb3ZpbmcgY29sbGVjdGlvbjogJHtjb2xJZH1gKVx0XHRcblx0XHRcdH07XG5cdFx0XHRyZXR1cm4gYHJlbW92ZWQgY29sbGVjdGlvbjogJHtjb2xJZH1gO1xuXHRcdFx0XHQvLyBsZXQgcHJpbnQgPSBDb2xsZWN0aW9ucy5yZW1vdmUoY29sSWQpO1xuXHRcdFx0XHQvLyBjb25zb2xlLmxvZyhgZGVsZXRlZCBjb2xsZWN0aW9uOiAke2NvbElkfWApO1xuXHRcdFx0XHQvLyByZXR1cm4gYGRlbGV0ZWQgY29sbGVjdGlvbjogJHtjb2xJZH1gO1xuXHRcdH07XG5cdH1cbn0pXG5cbi8vIERlZmluZSBhIHJ1bGUgdG8gbGltaXQgbWV0aG9kIGNhbGxzXG4vLyBsZXQgcnVuU2NhblJ1bGUgPSB7XG4vLyBcdHR5cGU6ICdtZXRob2QnLFxuLy8gXHRuYW1lOiAnbW9tZW50LnNjYW4nXG4vLyB9O1xuLy8gQWRkIHRoZSBydWxlLCBhbGxvd2luZyB1cCB0byAxIHNjYW4gZXZlcnkgMTAgc2Vjb25kc1xuLy8gRERQUmF0ZUxpbWl0ZXIuYWRkUnVsZShydW5TY2FuUnVsZSwgMSwgMTAwMDApOyIsImltcG9ydCB7IEREUFJhdGVMaW1pdGVyIH0gZnJvbSAnbWV0ZW9yL2RkcC1yYXRlLWxpbWl0ZXInO1xuXG5pbXBvcnQgeyBDb2xsZWN0aW9ucyB9IGZyb20gJy4vY29sbGVjdGlvbnMuanMnO1xuXG5cbk1ldGVvci5wdWJsaXNoKCdjb2xsZWN0aW9ucy5nZXQnLCBmdW5jdGlvbihjb2xsZWN0aW9uSWQ9JycpIHtcblx0Y2hlY2soY29sbGVjdGlvbklkLFN0cmluZyk7XG5cdGNvbGxlY3Rpb25JZCA9IGNvbGxlY3Rpb25JZCB8fCB7fTtcbiAgXHQvLyBjb25zb2xlLmxvZyhDb2xsZWN0aW9ucy5maW5kKGNvbGxlY3Rpb25JZCkuY291bnQoKSk7XG5cdHJldHVybiBDb2xsZWN0aW9ucy5maW5kKFxuXHRcdGNvbGxlY3Rpb25JZCwgXG5cdCAgeyBcblx0ICBcdHNvcnQ6IHsgY3JlYXRlZDogLTEgfSBcblx0fVxuXHQsIHtcblx0XHRmaWVsZHM6IENvbGxlY3Rpb25zLnB1YmxpY0ZpZWxkc1xuXHR9KTtcbn0pO1xuXG4vLyBEZWZpbmUgYSBydWxlIHRvIGxpbWl0IHN1YnNjcmlwdGlvbiBjYWxsc1xudmFyIHN1YnNjcmliZVRvQ29sbGVjdGlvbnNSdWxlID0ge1xuICB0eXBlOiAnc3Vic2NyaXB0aW9uJyxcbiAgbmFtZTogJ2NvbGxlY3Rpb25zLmdldCdcbn1cbi8vIEFkZCB0aGUgcnVsZSwgYWxsb3dpbmcgdXAgdG8gMSBzdWJzY3JpcHRpb24gZXZlcnkgNSBzZWNvbmRzLlxuRERQUmF0ZUxpbWl0ZXIuYWRkUnVsZShzdWJzY3JpYmVUb0NvbGxlY3Rpb25zUnVsZSwgMSwgNTAwMCk7IiwiaW1wb3J0IHsgRERQUmF0ZUxpbWl0ZXIgfSBmcm9tICdtZXRlb3IvZGRwLXJhdGUtbGltaXRlcic7XG5pbXBvcnQgQVdTIGZyb20gJ2F3cy1zZGsnO1xuXG5pbXBvcnQgeyBDb2xsZWN0aW9ucyB9IGZyb20gJy4uL2NvbGxlY3Rpb25zL2NvbGxlY3Rpb25zLmpzJztcbmltcG9ydCB7IFByaW50cyB9IGZyb20gJy4vcHJpbnRzLmpzJztcblxuQVdTLmNvbmZpZy5yZWdpb24gPSAndXMtZWFzdC0xJztcbnZhciByZWtvZ25pdGlvbiA9IG5ldyBBV1MuUmVrb2duaXRpb24oKTtcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXHRcInByaW50LnNhdmVcIihuZXdQcmludCl7XG5cdFx0bGV0IGNvbCA9IENvbGxlY3Rpb25zLmZpbmRPbmUobmV3UHJpbnQuY29sbGVjdGlvbik7XG5cdFx0Y29uc29sZS5sb2coY29sKTtcblx0XHRpZighY29sKXtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ25vLWNvbGxlY3Rpb24nLCdObyBjb2xsZWN0aW9uIGZvdW5kIHdpdGggZ2l2ZW4gaWQhJyk7XG5cdFx0fTtcblx0XHRuZXdQcmludC5wcmludF9hZGRlciA9IHRoaXMudXNlcklkIHx8IG51bGw7XG5cdFx0bmV3UHJpbnQucHJpbnRfY29sbGVjdGlvbl9pZCA9IGNvbC5faWQgfHwgbnVsbDtcblx0XHRuZXdQcmludC5wcmludF9uYW1lID0gbmV3UHJpbnQubmFtZS5yZXBsYWNlKC8gL2csXCJfX1wiKTtcblx0XHRuZXdQcmludC5wcmludF9pbWcgPSBuZXdQcmludC5pbWc7XG5cdFx0Ly8gY29uc29sZS5sb2cobmV3UHJpbnQpO1xuXHRcdGlmKCFuZXdQcmludCl7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnZhbGlkLXByaW50Jywnc3VibWl0dGVkIHByaW50IGlzIGludmFsaWQhJyk7XG5cdFx0fTtcblx0XHRQcmludHMuc2ltcGxlU2NoZW1hKCkuY2xlYW4obmV3UHJpbnQpO1xuICAgICAgICAvLyBpbmRleCBhIGZhY2UgaW50byBhIGNvbGxlY3Rpb25cbiAgICAgICAgbGV0IGZhY2VQYXJhbXMgPSB7XG4gICAgICAgICAgQ29sbGVjdGlvbklkOiBjb2wuY29sbGVjdGlvbl9pZCxcbiAgICAgICAgICBFeHRlcm5hbEltYWdlSWQ6IG5ld1ByaW50LnByaW50X25hbWUsXG5cdFx0ICBJbWFnZTogeyBcblx0XHRcdFwiQnl0ZXNcIjogbmV3IEJ1ZmZlci5mcm9tKG5ld1ByaW50LnByaW50X2ltZy5zcGxpdChcIixcIilbMV0sIFwiYmFzZTY0XCIpLFxuXHRcdCAgfSxcbiAgICAgICAgICBEZXRlY3Rpb25BdHRyaWJ1dGVzOiBbXCJBTExcIl1cbiAgICAgICAgfTtcbiAgICAgICAgY29uc29sZS5sb2coMSk7XG4gICAgICAgIGxldCBmYWNlUmVxdWVzdCA9IHJla29nbml0aW9uLmluZGV4RmFjZXMoZmFjZVBhcmFtcyk7XG4gICAgICAgIGxldCBwcm9taXNlID0gZmFjZVJlcXVlc3QucHJvbWlzZSgpO1xuICAgICAgICBsZXQgaW5kZXhGYWNlID0gcHJvbWlzZS50aGVuKHJlc3VsdCA9PiB7XG4gICAgICAgIFx0Ly8gY29uc29sZS5sb2cocmVzdWx0KTtcbiAgICAgICAgXHRuZXdQcmludC5wcmludF9pZCA9IHJlc3VsdC5GYWNlUmVjb3Jkc1swXS5GYWNlLkZhY2VJZDtcblx0XHRcdGxldCBwcmludCA9IFByaW50cy5pbnNlcnQobmV3UHJpbnQpO1xuICAgICAgICBcdGNvbnNvbGUubG9nKGBpbnNlcnRlZDogJHtwcmludH1gKTtcbiAgICAgICAgXHRyZXR1cm4gcmVzdWx0O1xuICAgICAgICB9KS5jYXRjaChlcnJvciA9PiB7XG4gICAgICAgIFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcihlcnJvci5jb2RlLCBlcnJvci5tZXNzYWdlLCBlcnJvcik7XG4gICAgICAgIFx0cmV0dXJuIGVycm9yO1xuICAgICAgICB9KTtcblx0XHRyZXR1cm4gaW5kZXhGYWNlO1xuXHR9LFxuXG5cdFwicHJpbnQuZGVsZXRlXCIocHJpbnRJZCl7XG5cdFx0Y2hlY2socHJpbnRJZCxTdHJpbmcpO1xuXHRcdGxldCBwcmludCA9IFByaW50cy5maW5kT25lKHByaW50SWQpO1xuXHRcdGxldCBjb2wgPSBDb2xsZWN0aW9ucy5maW5kT25lKHByaW50LnByaW50X2NvbGxlY3Rpb25faWQpO1xuXHRcdGNvbnNvbGUubG9nKHByaW50KTtcblx0XHRpZighcHJpbnQpe1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignbm8tcHJpbnQnLCdObyBwcmludCBmb3VuZCB3aXRoIGdpdmVuIGlkIScpO1xuXHRcdH1lbHNle1xuXHRcdFx0bGV0IHBhcmFtcyA9IHtcblx0XHRcdFx0Q29sbGVjdGlvbklkOiBjb2wuY29sbGVjdGlvbl9pZCwgXG5cdFx0XHRcdEZhY2VJZHM6IFtcblx0XHRcdFx0XHRwcmludC5wcmludF9pZFxuXHRcdFx0XHRdXG5cdFx0XHR9O1xuXHRcdFx0bGV0IHByaW50UmVxdWVzdCA9IHJla29nbml0aW9uLmRlbGV0ZUZhY2VzKHBhcmFtcykucHJvbWlzZSgpLmNhdGNoKGVycm9yID0+IHsgdGhyb3cgbmV3IE1ldGVvci5FcnJvcihlcnJvci5jb2RlLCBlcnJvci5tZXNzYWdlLCBlcnJvcik7IHJldHVybiBlcnJvcjsgfSk7XG5cdFx0XHRwcmludFJlcXVlc3QudGhlbih2YWx1ZXMgPT4ge1xuXHRcdFx0XHRsZXQgb2xkUHJpbnQgPSBQcmludHMucmVtb3ZlKHByaW50Ll9pZCk7XG5cdFx0XHRcdGlmKG9sZFByaW50KXtcblx0XHRcdFx0XHRjb25zb2xlLmxvZyhgZGVsZXRlZCBmYWNlOiAke3ByaW50SWR9YCk7XG5cdFx0XHRcdH1lbHNle1xuXHRcdCAgICAgICAgICAgIGNvbnNvbGUubG9nKHByaW50SWQpO1xuXHRcdCAgICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ3JlbW92ZS1wcmludC1lcnJvcicsYGVycm9yIHJlbW92aW5nIHByaW50OiAke3ByaW50SWR9YClcdFx0XG5cdFx0XHRcdH07XG5cdFx0XHRcdHJldHVybiB2YWx1ZXNcblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuIGByZW1vdmVkIHByaW50OiAke3ByaW50SWR9YDtcblx0XHR9O1xuXHR9LFxufSlcblxuLy8gRGVmaW5lIGEgcnVsZSB0byBsaW1pdCBtZXRob2QgY2FsbHNcbmxldCBkZWxldGVQcmludFJ1bGUgPSB7XG5cdHR5cGU6ICdtZXRob2QnLFxuXHRuYW1lOiAncHJpbnQuZGVsZXRlJ1xufTtcbi8vIEFkZCB0aGUgcnVsZSwgYWxsb3dpbmcgdXAgdG8gMSBzY2FuIGV2ZXJ5IDEgc2Vjb25kc1xuRERQUmF0ZUxpbWl0ZXIuYWRkUnVsZShkZWxldGVQcmludFJ1bGUsIDEsIDEwMDApOyIsImltcG9ydCB7IE1vbmdvIH0gZnJvbSAnbWV0ZW9yL21vbmdvJztcbmltcG9ydCB7IFNpbXBsZVNjaGVtYSB9IGZyb20gJ21ldGVvci9hbGRlZWQ6c2ltcGxlLXNjaGVtYSc7XG5cblxuXG5leHBvcnQgY29uc3QgUHJpbnRzID0gbmV3IE1ldGVvci5Db2xsZWN0aW9uKCdwcmludHMnKTtcblxuLy8gRGVueSBhbGwgY2xpZW50LXNpZGUgdXBkYXRlcyBzaW5jZSB3ZSB3aWxsIGJlIHVzaW5nIG1ldGhvZHMgdG8gbWFuYWdlIHRoaXMgY29sbGVjdGlvblxuUHJpbnRzLmRlbnkoe1xuICBpbnNlcnQoKSB7IHJldHVybiB0cnVlOyB9LFxuICB1cGRhdGUoKSB7IHJldHVybiB0cnVlOyB9LFxuICByZW1vdmUoKSB7IHJldHVybiB0cnVlOyB9LFxufSk7XG5cblByaW50cy5TY2hlbWEgPSBuZXcgU2ltcGxlU2NoZW1hKHtcbiAgLy8gT3VyIHNjaGVtYSBydWxlcyB3aWxsIGdvIGhlcmUuXG4gIFwicHJpbnRfaWRcIjoge1xuICAgIHR5cGU6IFN0cmluZyxcbiAgICBsYWJlbDogXCJQcmludCBJRFwiLFxuICAgIG9wdGlvbmFsOiBmYWxzZSxcbiAgICBkZWZhdWx0VmFsdWU6IFwiQUFBQS1CQkJCLUNDQ0MtMTExMS0yMjIyLTMzMzNcIixcbiAgICBpbmRleDogdHJ1ZSxcbiAgICB1bmlxdWU6IHRydWVcbiAgfSxcbiAgXCJwcmludF9uYW1lXCI6IHtcbiAgICB0eXBlOiBTdHJpbmcsXG4gICAgbGFiZWw6IFwiUHJpbnQgTmFtZVwiLFxuICAgIG9wdGlvbmFsOiBmYWxzZSxcbiAgICBkZWZhdWx0VmFsdWU6IFwiTmV3IFBlcnNvblwiXG4gIH0sXG4gIFwicHJpbnRfdHlwZVwiOiB7XG4gICAgdHlwZTogU3RyaW5nLFxuICAgIGxhYmVsOiBcIlByaW50IHR5cGVcIixcbiAgICBvcHRpb25hbDogZmFsc2UsXG4gICAgYWxsb3dlZFZhbHVlczogW1wiZmFjZVwiLCBcInZvaWNlXCIsIFwiZmluZ2VyXCJdLFxuICAgIGRlZmF1bHRWYWx1ZTogXCJmYWNlXCJcbiAgfSxcbiAgXCJwcmludF9jb2xsZWN0aW9uX2lkXCI6IHtcbiAgICB0eXBlOiBTdHJpbmcsXG4gICAgbGFiZWw6IFwiUHJpbnQgY29sbGVjdGlvbiBtb25nbyBfaWRcIixcbiAgICBvcHRpb25hbDogZmFsc2UsXG4gICAgZGVmYXVsdFZhbHVlOiBcInBlb3BsZVwiXG4gIH0sXG4gIFwicHJpbnRfaW1nXCI6IHtcbiAgICB0eXBlOiBTdHJpbmcsXG4gICAgbGFiZWw6IFwiUHJpbnQgaW1nXCIsXG4gICAgb3B0aW9uYWw6IHRydWUsXG4gICAgZGVmYXVsdFZhbHVlOiBcIi9pbWcvZmFjZS1pZC0xMDAucG5nXCJcbiAgfSxcbiAgXCJwcmludF9kZXRhaWxzXCI6IHtcbiAgICB0eXBlOiBPYmplY3QsXG4gICAgbGFiZWw6IFwiUHJpbnQgZGV0YWlsc1wiLFxuICAgIG9wdGlvbmFsOiB0cnVlLFxuICAgIGJsYWNrYm94OiB0cnVlXG4gIH0sXG4gIFwicHJpbnRfYWRkZXJcIjoge1xuICAgIHR5cGU6IFN0cmluZyxcbiAgICBsYWJlbDogXCJVc2VyIHdobyBhZGRlZCBwcmludFwiLFxuICAgIG9wdGlvbmFsOiBmYWxzZVxuICB9LFxuICBcImNyZWF0ZWRcIjoge1xuICAgIHR5cGU6IERhdGUsXG4gICAgbGFiZWw6IFwiRGF0ZSBwcmludCBhZGRlZCB0byBBbnRlbm5hZVwiLFxuICAgIGF1dG9WYWx1ZTogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoIHRoaXMuaXNJbnNlcnQgKSB7XG4gICAgICAgIHJldHVybiBuZXcgRGF0ZTtcbiAgICAgIH0gXG4gICAgfSxcbiAgICBvcHRpb25hbDogdHJ1ZVxuICB9LFxuICBcInVwZGF0ZWRcIjoge1xuICAgIHR5cGU6IERhdGUsXG4gICAgbGFiZWw6IFwiRGF0ZSBwcmludCB1cGRhdGVkIGluIFN5c3RlbVwiLFxuICAgIGF1dG9WYWx1ZTogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoIHRoaXMuaXNVcGRhdGUgKSB7XG4gICAgICAgIHJldHVybiBuZXcgRGF0ZTtcbiAgICAgIH0gXG4gICAgfSxcbiAgICBvcHRpb25hbDogdHJ1ZVxuICB9XG59KTtcblxuUHJpbnRzLmF0dGFjaFNjaGVtYSggUHJpbnRzLlNjaGVtYSApOyBcblxuXG5QcmludHMucHVibGljRmllbGRzID0ge1xuICBwcmludF9pZDogMSxcbiAgcHJpbnRfbmFtZTogMSxcbiAgcHJpbnRfdHlwZTogMSxcbiAgcHJpbnRfY29sbGVjdGlvbl9pZDogMSxcbiAgcHJpbnRfaW1nOiAxLFxuICBwcmludF9kZXRhaWxzOiAxLFxuICBwcmludF9hZGRlcjogMSxcbiAgY3JlYXRlZDogMSxcbiAgdXBkYXRlZDogMVxufTtcblxuLy8gUHJpbnRzLmhlbHBlcnMoe1xuLy8gICAvLyBBIGNvbGxlY3Rpb25zIGlzIGNvbnNpZGVyZWQgdG8gYmUgcHJpdmF0ZSBpZiBcInByaXZhdGVcIiBpcyBzZXQgdG8gdHJ1ZVxuLy8gICBpc1ByaXZhdGUoKSB7XG4vLyAgICAgcmV0dXJuIHRoaXMucHJpdmF0ZTtcbi8vICAgfVxuLy8gfSk7IiwiaW1wb3J0IHsgRERQUmF0ZUxpbWl0ZXIgfSBmcm9tICdtZXRlb3IvZGRwLXJhdGUtbGltaXRlcic7XG5cbmltcG9ydCB7IFByaW50cyB9IGZyb20gJy4vcHJpbnRzLmpzJztcblxuXG5NZXRlb3IucHVibGlzaCgncHJpbnRzLmdldCcsIGZ1bmN0aW9uKGNvbGxlY3Rpb25JZCkge1xuXHRjb2xsZWN0aW9uSWQgPSBjb2xsZWN0aW9uSWQgfHwgXCJcIjtcblx0Y2hlY2soY29sbGVjdGlvbklkLFN0cmluZyk7XG5cdGxldCBzZWxlY3RvciA9IGNvbGxlY3Rpb25JZCA/IHtwcmludF9jb2xsZWN0aW9uX2lkOiBjb2xsZWN0aW9uSWR9IDoge307XG4gIFx0Y29uc29sZS5sb2coc2VsZWN0b3IpO1xuXHRyZXR1cm4gUHJpbnRzLmZpbmQoXG5cdFx0c2VsZWN0b3IsIFxuXHQgIHsgXG5cdCAgXHRzb3J0OiB7IGNyZWF0ZWQ6IC0xIH0gXG5cdH1cblx0LCB7XG5cdFx0ZmllbGRzOiBQcmludHMucHVibGljRmllbGRzXG5cdH0pO1xufSk7XG5cbi8vIERlZmluZSBhIHJ1bGUgdG8gbGltaXQgc3Vic2NyaXB0aW9uIGNhbGxzXG52YXIgc3Vic2NyaWJlVG9QcmludHNSdWxlID0ge1xuICB0eXBlOiAnc3Vic2NyaXB0aW9uJyxcbiAgbmFtZTogJ3ByaW50cy5nZXQnXG59XG4vLyBBZGQgdGhlIHJ1bGUsIGFsbG93aW5nIHVwIHRvIDEgc3Vic2NyaXB0aW9uIGV2ZXJ5IDUgc2Vjb25kcy5cbkREUFJhdGVMaW1pdGVyLmFkZFJ1bGUoc3Vic2NyaWJlVG9QcmludHNSdWxlLCAxLCA1MDAwKTsiLCJpbXBvcnQgeyBERFBSYXRlTGltaXRlciB9IGZyb20gJ21ldGVvci9kZHAtcmF0ZS1saW1pdGVyJztcbmltcG9ydCBBV1MgZnJvbSAnYXdzLXNkayc7XG5pbXBvcnQgeyBSYW5kb20gfSBmcm9tICdtZXRlb3IvcmFuZG9tJztcblxuaW1wb3J0IHsgQ29sbGVjdGlvbnMgfSBmcm9tICcuLi9jb2xsZWN0aW9ucy9jb2xsZWN0aW9ucy5qcyc7XG5pbXBvcnQgeyBQcmludHMgfSBmcm9tICcuLi9wcmludHMvcHJpbnRzLmpzJztcbmltcG9ydCB7IFNlYXJjaGVzIH0gZnJvbSAnLi9zZWFyY2hlcy5qcyc7XG5cbkFXUy5jb25maWcucmVnaW9uID0gJ3VzLWVhc3QtMSc7XG52YXIgcmVrb2duaXRpb24gPSBuZXcgQVdTLlJla29nbml0aW9uKCk7XG52YXIgczMgPSBuZXcgQVdTLlMzKCk7XG5cbk1ldGVvci5tZXRob2RzKHtcblx0XCJnZXREYXNoYm9hcmRTdGF0c1wiKCl7XG5cdFx0bGV0IGRhc2hib2FyZFN0YXRzID0ge307XG5cdFx0ZGFzaGJvYXJkU3RhdHMuY29sbGVjdGlvbnMgPSBDb2xsZWN0aW9ucy5maW5kKHt9KS5jb3VudCgpO1xuXHRcdGRhc2hib2FyZFN0YXRzLmZhY2VzID0gUHJpbnRzLmZpbmQoKS5jb3VudCgpO1xuXHRcdC8vIGRhc2hib2FyZFN0YXRzLmZhY2VzID0gQ29sbGVjdGlvbnMuYWdncmVnYXRlKFxuXHRcdC8vIFx0ICAgW1xuXHRcdC8vIFx0ICAgICB7XG5cdFx0Ly8gXHQgICAgICAgJGdyb3VwOlxuXHRcdC8vIFx0XHRcdHtcblx0XHQvLyBcdFx0XHRcdF9pZDogXCIkY29sbGVjdGlvbl9pZFwiLFxuXHRcdC8vIFx0XHRcdFx0Ly8gZmFjZV9jb3VudDogeyAkc3VtOiBcIiRwcmludF9jb3VudFwiIH0sXG5cdFx0Ly8gXHRcdFx0XHRjb3VudDogeyAkc3VtOiAxIH1cblx0XHQvLyBcdFx0XHR9XG5cdFx0Ly8gXHQgICAgIH0sXG5cdFx0Ly8gXHQgICAgIHtcblx0XHQvLyBcdCAgICAgXHQkcHJvamVjdDpcblx0XHQvLyBcdCAgICAgXHR7XG5cdFx0Ly8gXHQgICAgIFx0XHRfaWQ6IDEsXG5cdFx0Ly8gXHQgICAgIFx0XHRjb3VudDogMVxuXHRcdC8vIFx0ICAgICBcdH1cblx0XHQvLyBcdCAgICAgfVxuXHRcdC8vIFx0ICAgXVxuXHRcdC8vIFx0KTtcblx0XHRkYXNoYm9hcmRTdGF0cy5zZWFyY2hlcyA9IFNlYXJjaGVzLmZpbmQoe30pLmNvdW50KCk7XG5cdFx0ZGFzaGJvYXJkU3RhdHMubWF0Y2hlcyA9IFNlYXJjaGVzLmZpbmQoeydzZWFyY2hfcmVzdWx0cy5wZXJzb25zJzogeyRuZTogW119fSkuY291bnQoKTtcblx0XHRkYXNoYm9hcmRTdGF0cy5tYXRjaFBlcmNlbnQgPSAoTWF0aC5yb3VuZCgoZGFzaGJvYXJkU3RhdHMubWF0Y2hlcyAvIGRhc2hib2FyZFN0YXRzLnNlYXJjaGVzICogMTAwKSAqIDEwKSAvIDEwKSB8fCAwO1xuXHRcdGNvbnNvbGUubG9nKGRhc2hib2FyZFN0YXRzLmZhY2VzKTtcblx0XHRyZXR1cm4gZGFzaGJvYXJkU3RhdHM7XG5cdH0sXG5cblx0YXN5bmMgXCJzZWFyY2guZmFjZVwiKHNlYXJjaERhdGEpe1xuXHRcdC8vcmV0dXJuIDE7XG5cdFx0Ly8gaWYoIU1ldGVvci51c2VyKXtcblx0XHQvLyBcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ25vdC1sb2dnZWQtaW4nLCdtdXN0IGJlIGxvZ2dlZC1pbiB0byBwZXJmb3JtIHNlYXJjaCcpO1xuXHRcdC8vIFx0cmV0dXJuIGZhbHNlO1xuXHRcdC8vIH1cblx0XHQvLyBsZXQgbWF0Y2hUaHJlc2hvbGQgPSBtYXRjaFRocmVzaG9sZDtcblx0XHRjaGVjayhzZWFyY2hEYXRhLm1hdGNoVGhyZXNob2xkLCBOdW1iZXIpO1xuXHRcdGNvbnNvbGUubG9nKFwiQU5BTFlaSU5HIElNQUdFLi4uXCIpO1xuXHRcdHZhciB0MCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXHRcdGxldCBpbWdCeXRlcyA9IG5ldyBCdWZmZXIuZnJvbShzZWFyY2hEYXRhLmltZy5zcGxpdChcIixcIilbMV0sIFwiYmFzZTY0XCIpO1xuXHRcdGxldCBpbWdGaWxlTmFtZSA9IGB1cGxvYWRzL2ltYWdlcy8ke1JhbmRvbS5pZCgpfS5qcGdgO1xuXHRcdGxldCB1cGxvYWRCdWNrZXQgPSBcImFudGVubmFlXCI7XG5cdFx0bGV0IHMzUGFyYW1zID0ge1xuXHRcdFx0QUNMOiAncHJpdmF0ZScsXG5cdFx0XHRCb2R5OiBpbWdCeXRlcywgXG5cdFx0XHRCdWNrZXQ6IHVwbG9hZEJ1Y2tldCwgXG5cdFx0XHRDb250ZW50RW5jb2Rpbmc6ICdiYXNlNjQnLFxuXHRcdFx0Q29udGVudFR5cGU6ICdpbWFnZS9qcGVnJyxcblx0XHRcdEtleTogaW1nRmlsZU5hbWUsXG5cdFx0XHRNZXRhZGF0YToge1xuXHRcdCAgXHRcdCdDb250ZW50LVR5cGUnOiAnaW1hZ2UvanBlZydcblx0XHQgIFx0fSxcblx0XHQgICAgVGFnZ2luZzogYE5hbWU9JHtpbWdGaWxlTmFtZX0mQXBwbGljYXRpb249QW50ZW5uYWUmT3duZXI9QW50bW91bmRzYFxuXHRcdCB9O1xuXHRcdC8vIGNvbnNvbGUubG9nKHMzUGFyYW1zKTtcblx0XHRsZXQgczNSZXN1bHRzID0gYXdhaXQgczMucHV0T2JqZWN0KHMzUGFyYW1zKS5wcm9taXNlKCkuY2F0Y2goZXJyb3IgPT4geyB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKGVycm9yLmNvZGUsIGVycm9yLm1lc3NhZ2UsIGVycm9yKTsgcmV0dXJuIGVycm9yO1xuXHRcdH0pLnRoZW4oIHZhbHVlID0+IHtcblx0XHRcdC8vIGNvbnNvbGUubG9nKHZhbHVlKTtcblx0XHRcdHJldHVybiB2YWx1ZTtcblx0XHR9KTtcblx0XHRjb25zb2xlLmxvZyhzM1Jlc3VsdHMpO1xuXHRcdC8vIGdldCBzaWduZWQgdXJsIGZvciBpbWFnZSB2YWxpZCBmb3IgMSBkYXlcblx0XHRzM1BhcmFtcyA9IHsgXG5cdFx0ICBCdWNrZXQ6IHVwbG9hZEJ1Y2tldCwgXG5cdFx0ICBLZXk6IGltZ0ZpbGVOYW1lLFxuXHRcdCAgRXhwaXJlczogODY0MDAgLy8gMS1kYXkgdXJsIGV4cGlyYXRpb25cblx0XHR9O1xuXHRcdGxldCBzM1NpZ25lZFVybCA9IHMzLmdldFNpZ25lZFVybChcImdldE9iamVjdFwiLCBzM1BhcmFtcyk7XG5cdFx0Y29uc29sZS5sb2coczNTaWduZWRVcmwpO1xuXHRcdC8vIGxldCBjb2xJZCA9IE1ldGVvci51c2VyKCkucHJvZmlsZS5jb2xsZWN0aW9ucztcblx0XHRsZXQgY29sSWRzID0gQ29sbGVjdGlvbnMuZmluZCh7Y29sbGVjdGlvbl90eXBlOiAnZmFjZSd9LCB7ZmllbGRzOiB7Y29sbGVjdGlvbl9pZDogMX19KS5mZXRjaCgpO1xuXHRcdGNvbnNvbGUubG9nKGNvbElkcyk7XG5cdFx0bGV0IG1vZGVyYXRpb25QYXJhbXMgPSB7XG5cdFx0XHRcIkltYWdlXCI6IHsgXG5cdFx0XHRcdC8vIFwiQnl0ZXNcIjogaW1nQnl0ZXMsXG5cdFx0XHRcdFwiUzNPYmplY3RcIjoge1xuXHRcdFx0XHRcdFwiQnVja2V0XCI6IHVwbG9hZEJ1Y2tldCwgXG5cdFx0XHRcdFx0XCJOYW1lXCI6IGltZ0ZpbGVOYW1lXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRcIk1pbkNvbmZpZGVuY2VcIjogNTAsXG5cdFx0fTtcblx0XHRsZXQgbGFiZWxQYXJhbXMgPSB7XG5cdFx0XHRcIkltYWdlXCI6IHsgXG5cdFx0XHRcdC8vIFwiQnl0ZXNcIjogaW1nQnl0ZXMsXG5cdFx0XHRcdFwiUzNPYmplY3RcIjoge1xuXHRcdFx0XHRcdFwiQnVja2V0XCI6IHVwbG9hZEJ1Y2tldCwgXG5cdFx0XHRcdFx0XCJOYW1lXCI6IGltZ0ZpbGVOYW1lXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRcIk1heExhYmVsc1wiOiAyMCxcblx0XHRcdFwiTWluQ29uZmlkZW5jZVwiOiA3NSxcblx0XHR9O1xuXHRcdGxldCBmYWNlUGFyYW1zID0ge1xuXHRcdFx0XCJJbWFnZVwiOiB7IFxuXHRcdFx0XHQvLyBcIkJ5dGVzXCI6IGltZ0J5dGVzLFxuXHRcdFx0XHRcIlMzT2JqZWN0XCI6IHtcblx0XHRcdFx0XHRcIkJ1Y2tldFwiOiB1cGxvYWRCdWNrZXQsIFxuXHRcdFx0XHRcdFwiTmFtZVwiOiBpbWdGaWxlTmFtZVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuICBcdFx0XHRcIkF0dHJpYnV0ZXNcIjogW1wiQUxMXCJdLFxuXHRcdH07XG5cdFx0bGV0IGNlbGVicml0eVBhcmFtcyA9IHtcblx0XHRcdFwiSW1hZ2VcIjogeyBcblx0XHRcdFx0Ly8gXCJCeXRlc1wiOiBpbWdCeXRlcyxcblx0XHRcdFx0XCJTM09iamVjdFwiOiB7XG5cdFx0XHRcdFx0XCJCdWNrZXRcIjogdXBsb2FkQnVja2V0LCBcblx0XHRcdFx0XHRcIk5hbWVcIjogaW1nRmlsZU5hbWVcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHR9O1xuXHRcdC8vIGNyZWF0ZSByZXF1ZXN0IG9iamVjdHNcblx0XHRsZXQgbW9kZXJhdGlvblJlcXVlc3QgPSByZWtvZ25pdGlvbi5kZXRlY3RNb2RlcmF0aW9uTGFiZWxzKG1vZGVyYXRpb25QYXJhbXMpO1xuXHRcdGxldCBsYWJlbFJlcXVlc3QgPSByZWtvZ25pdGlvbi5kZXRlY3RMYWJlbHMobGFiZWxQYXJhbXMpO1xuXHRcdGxldCBmYWNlUmVxdWVzdCA9IHJla29nbml0aW9uLmRldGVjdEZhY2VzKGZhY2VQYXJhbXMpO1xuXHRcdGxldCBjZWxlYnJpdHlSZXF1ZXN0ID0gcmVrb2duaXRpb24ucmVjb2duaXplQ2VsZWJyaXRpZXMoY2VsZWJyaXR5UGFyYW1zKTtcblx0XHQvLyBjcmVhdGUgcHJvbWlzZXNcblx0XHRsZXQgYWxsUHJvbWlzZXMgPSBbXTtcblx0XHRhbGxQcm9taXNlcy5wdXNoKG1vZGVyYXRpb25SZXF1ZXN0LnByb21pc2UoKS5jYXRjaChlcnJvciA9PiB7IHRocm93IG5ldyBNZXRlb3IuRXJyb3IoZXJyb3IuY29kZSwgZXJyb3IubWVzc2FnZSwgZXJyb3IpOyByZXR1cm4gZXJyb3I7IH0pKTtcblx0XHRhbGxQcm9taXNlcy5wdXNoKGxhYmVsUmVxdWVzdC5wcm9taXNlKCkuY2F0Y2goZXJyb3IgPT4geyB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKGVycm9yLmNvZGUsIGVycm9yLm1lc3NhZ2UsIGVycm9yKTsgcmV0dXJuIGVycm9yOyB9KSk7XG5cdFx0YWxsUHJvbWlzZXMucHVzaChmYWNlUmVxdWVzdC5wcm9taXNlKCkuY2F0Y2goZXJyb3IgPT4geyB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKGVycm9yLmNvZGUsIGVycm9yLm1lc3NhZ2UsIGVycm9yKTsgcmV0dXJuIGVycm9yOyB9KSk7XG5cdFx0YWxsUHJvbWlzZXMucHVzaChjZWxlYnJpdHlSZXF1ZXN0LnByb21pc2UoKS5jYXRjaChlcnJvciA9PiB7IHRocm93IG5ldyBNZXRlb3IuRXJyb3IoZXJyb3IuY29kZSwgZXJyb3IubWVzc2FnZSwgZXJyb3IpOyByZXR1cm4gZXJyb3I7IH0pKTtcblx0XHRfLmVhY2goY29sSWRzLCAoY29sSWQpID0+IHtcblx0XHRcdGxldCByZWtvZ25pdGlvblBhcmFtcyA9IHtcblx0XHRcdFx0XCJDb2xsZWN0aW9uSWRcIjogY29sSWQuY29sbGVjdGlvbl9pZCxcblx0XHRcdFx0XCJGYWNlTWF0Y2hUaHJlc2hvbGRcIjogc2VhcmNoRGF0YS5tYXRjaFRocmVzaG9sZCB8fCA5NSxcblx0XHRcdFx0XCJNYXhGYWNlc1wiOiAyLFxuXHRcdFx0XHRcIkltYWdlXCI6IHsgXG5cdFx0XHRcdFx0XCJTM09iamVjdFwiOiB7XG5cdFx0XHRcdFx0XHRcIkJ1Y2tldFwiOiB1cGxvYWRCdWNrZXQsIFxuXHRcdFx0XHRcdFx0XCJOYW1lXCI6IGltZ0ZpbGVOYW1lXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LFxuXHRcdFx0fTtcblx0XHRcdGNvbnNvbGUubG9nKHJla29nbml0aW9uUGFyYW1zKTtcblx0XHRcdGxldCByZWtvZ25pdGlvblJlcXVlc3QgPSByZWtvZ25pdGlvbi5zZWFyY2hGYWNlc0J5SW1hZ2UocmVrb2duaXRpb25QYXJhbXMpO1xuXHRcdFx0YWxsUHJvbWlzZXMucHVzaChyZWtvZ25pdGlvblJlcXVlc3QucHJvbWlzZSgpLmNhdGNoKGVycm9yID0+IHsgdGhyb3cgbmV3IE1ldGVvci5FcnJvcihlcnJvci5jb2RlLCBlcnJvci5tZXNzYWdlLCBlcnJvcik7IHJldHVybiBlcnJvcjsgfSkpO1xuXHRcdFx0Y29uc29sZS5sb2coY29sSWQuY29sbGVjdGlvbl9pZCk7XG5cdFx0fSk7XG5cdFx0Ly8gRnVsZmlsbCBwcm9taXNlcyBpbiBwYXJhbGxlbFxuXHRcdGxldCByZXNwb25zZSA9IFByb21pc2UuYWxsKFxuXHRcdFx0YWxsUHJvbWlzZXNcblx0XHQpLnRoZW4odmFsdWVzID0+IHtcblx0XHRcdGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHZhbHVlcykpO1xuXHRcdFx0Y29uc29sZS5sb2codmFsdWVzWzBdKTtcblx0XHRcdGNvbnNvbGUubG9nKHZhbHVlc1sxXSk7XG5cdFx0XHRjb25zb2xlLmxvZyh2YWx1ZXNbMl0pO1xuXHRcdFx0Y29uc29sZS5sb2codmFsdWVzWzNdKTtcblx0XHRcdC8vY29uc29sZS5sb2codmFsdWVzWzRdKTtcblx0XHRcdGxldCBpID0gNDtcblx0XHRcdGxldCBwZXJzb25zID0gW107XG5cdFx0XHR3aGlsZSh2YWx1ZXNbaV0pe1xuXHRcdFx0XHRjb25zb2xlLmxvZyh2YWx1ZXNbaV0pO1xuXHRcdFx0XHRpZiAodmFsdWVzW2ldLkZhY2VNYXRjaGVzWzBdKXtcblx0XHRcdFx0XHRjb25zb2xlLmxvZyh2YWx1ZXNbaV0uRmFjZU1hdGNoZXNbMF0uRmFjZS5GYWNlSWQpO1xuXHRcdFx0XHRcdGxldCBjb2xJZCA9IFByaW50cy5maW5kT25lKHtwcmludF9pZDogdmFsdWVzW2ldLkZhY2VNYXRjaGVzWzBdLkZhY2UuRmFjZUlkfSwge2ZpZWxkczoge3ByaW50X2NvbGxlY3Rpb25faWQ6IDF9fSkucHJpbnRfY29sbGVjdGlvbl9pZDtcblx0XHRcdFx0XHRsZXQgdGFnID0ge1xuXHRcdFx0XHRcdFx0Y29sbGVjdGlvbjogQ29sbGVjdGlvbnMuZmluZE9uZShjb2xJZCwge2ZpZWxkczoge2NvbGxlY3Rpb25fbmFtZTogMX19KS5jb2xsZWN0aW9uX25hbWUsXG5cdFx0XHRcdFx0XHRpbWFnZV9pZDogdmFsdWVzW2ldLkZhY2VNYXRjaGVzWzBdLkZhY2UuRXh0ZXJuYWxJbWFnZUlkLnJlcGxhY2UoL19fL2csXCIgXCIpLFxuXHRcdFx0XHRcdFx0ZmFjZV9pZDogdmFsdWVzW2ldLkZhY2VNYXRjaGVzWzBdLkZhY2UuRmFjZUlkLFxuXHRcdFx0XHRcdFx0c2ltaWxhcml0eTogdmFsdWVzW2ldLkZhY2VNYXRjaGVzWzBdLlNpbWlsYXJpdHksXG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0XHRwZXJzb25zLnB1c2godGFnKTtcblx0XHRcdFx0XHRjb25zb2xlLmxvZyh0YWcpO1xuXHRcdFx0XHR9O1xuXHRcdFx0XHRpKys7XG5cdFx0XHR9O1xuXHRcdFx0bGV0IHQxID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG5cdFx0XHRjb25zb2xlLmxvZyhgUmVzcG9uc2UgdG9vayAke3QxIC0gdDB9IG1zYCk7XG5cdFx0XHRsZXQgc2VhcmNoX3Jlc3VsdHMgPSB7XG5cdFx0XHRcdFx0bW9kZXJhdGlvbjogdmFsdWVzWzBdLk1vZGVyYXRpb25MYWJlbHMsXG5cdFx0XHRcdFx0bGFiZWxzOiB2YWx1ZXNbMV0uTGFiZWxzLFxuXHRcdFx0XHRcdGZhY2VEZXRhaWxzOiB2YWx1ZXNbMl0uRmFjZURldGFpbHMsXG5cdFx0XHRcdFx0Y2VsZWJyaXR5OiB2YWx1ZXNbM10uQ2VsZWJyaXR5RmFjZXMsXG5cdFx0XHRcdFx0cGVyc29uczogcGVyc29ucyxcblx0XHRcdFx0XHR1cmw6IHMzU2lnbmVkVXJsXG5cdFx0XHR9O1xuXHRcdFx0bGV0IHNlYXJjaCA9IHtcblx0XHRcdFx0XHRzZWFyY2hfaW1hZ2U6IHMzU2lnbmVkVXJsLFxuXHRcdFx0XHRcdHN0YXRpb25fbmFtZTogc2VhcmNoRGF0YS5zdGF0aW9uTmFtZSxcblx0XHRcdFx0XHRzZWFyY2hfcmVzdWx0czogc2VhcmNoX3Jlc3VsdHNcblx0XHRcdH07XG5cdFx0XHRsZXQgc2F2ZVNlYXJjaCA9IFNlYXJjaGVzLmluc2VydChzZWFyY2gpO1xuXHRcdFx0Y29uc29sZS5sb2coc2F2ZVNlYXJjaCk7XG5cdFx0XHRyZXR1cm4gc2VhcmNoX3Jlc3VsdHM7XG5cdFx0fSkuY2F0Y2goZXJyb3IgPT4ge1xuXHRcdFx0Y29uc29sZS5sb2coJ2NhdWdodCBlcnJvciEnKTtcblx0XHRcdGNvbnNvbGUubG9nKGVycm9yKTtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoZXJyb3IuZXJyb3IsIGVycm9yLnJlYXNvbiwgZXJyb3IuZGV0YWlscyk7XG5cdFx0fSkuZmluYWxseSgoKSA9PiB7XG5cdFx0XHRjb25zb2xlLmxvZygnZmluYWxseScpO1xuXHRcdFx0Ly8gY29uc29sZS5sb2codGhpcyk7XG5cdFx0fSk7XG5cdFx0Y29uc29sZS5sb2cocmVzcG9uc2UpO1xuXHRcdGxldCB0MSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXHRcdGNvbnNvbGUubG9nKGBSZXF1ZXN0IHRvb2sgJHt0MSAtIHQwfSBtc2ApO1xuXHRcdHJldHVybiByZXNwb25zZTtcblx0fSxcblxuXHRcInNlYXJjaC5kZWxldGVcIihzZWFyY2hJZCl7XG5cdFx0Y2hlY2soc2VhcmNoSWQsU3RyaW5nKTtcblx0XHRpZihzZWFyY2hJZCl7XG5cdFx0XHRsZXQgc2VhcmNoID0gU2VhcmNoZXMucmVtb3ZlKHNlYXJjaElkKTtcblx0XHRcdGNvbnNvbGUubG9nKGBkZWxldGVkIHNlYXJjaDogJHtzZWFyY2hJZH1gKTtcblx0XHRcdHJldHVybiBgZGVsZXRlZCBzZWFyY2g6ICR7c2VhcmNoSWR9YDtcblx0XHR9O1xuXHR9XG59KVxuXG4vLyBEZWZpbmUgYSBydWxlIHRvIGxpbWl0IG1ldGhvZCBjYWxsc1xubGV0IHJ1blNjYW5SdWxlID0ge1xuXHR0eXBlOiAnbWV0aG9kJyxcblx0bmFtZTogJ3NlYXJjaC5mYWNlJ1xufTtcbi8vIEFkZCB0aGUgcnVsZSwgYWxsb3dpbmcgdXAgdG8gMSBzY2FuIGV2ZXJ5IDUgc2Vjb25kc1xuRERQUmF0ZUxpbWl0ZXIuYWRkUnVsZShydW5TY2FuUnVsZSwgMSwgNTAwMCk7IiwiaW1wb3J0IHsgRERQUmF0ZUxpbWl0ZXIgfSBmcm9tICdtZXRlb3IvZGRwLXJhdGUtbGltaXRlcic7XG5cbmltcG9ydCB7IFNlYXJjaGVzIH0gZnJvbSAnLi9zZWFyY2hlcy5qcyc7XG5cblxuTWV0ZW9yLnB1Ymxpc2goJ3NlYXJjaGVzLmdldCcsIGZ1bmN0aW9uKHNlYXJjaElkPScnKSB7XG5cdGNoZWNrKHNlYXJjaElkLFN0cmluZyk7XG5cdHNlYXJjaElkID0gc2VhcmNoSWQgfHwge307XG4gIFx0Ly8gY29uc29sZS5sb2coU2VhcmNoZXMuZmluZChzZWFyY2hJZCkuY291bnQoKSk7XG5cdHJldHVybiBTZWFyY2hlcy5maW5kKFxuXHRcdHNlYXJjaElkLCBcblx0ICB7IFxuXHQgIFx0c29ydDogeyBjcmVhdGVkOiAtMSB9IFxuXHR9XG5cdCwge1xuXHRcdGZpZWxkczogU2VhcmNoZXMucHVibGljRmllbGRzXG5cdH0pO1xufSk7XG5cbi8vIERlZmluZSBhIHJ1bGUgdG8gbGltaXQgc3Vic2NyaXB0aW9uIGNhbGxzXG52YXIgc3Vic2NyaWJlVG9TZWFyY2hlc1J1bGUgPSB7XG4gIHR5cGU6ICdzdWJzY3JpcHRpb24nLFxuICBuYW1lOiAnc2VhcmNoZXMuZ2V0J1xufVxuLy8gQWRkIHRoZSBydWxlLCBhbGxvd2luZyB1cCB0byAxIHN1YnNjcmlwdGlvbiBldmVyeSA1IHNlY29uZHMuXG5ERFBSYXRlTGltaXRlci5hZGRSdWxlKHN1YnNjcmliZVRvU2VhcmNoZXNSdWxlLCAxLCA1MDAwKTsiLCJpbXBvcnQgeyBNb25nbyB9IGZyb20gJ21ldGVvci9tb25nbyc7XG5pbXBvcnQgeyBTaW1wbGVTY2hlbWEgfSBmcm9tICdtZXRlb3IvYWxkZWVkOnNpbXBsZS1zY2hlbWEnO1xuXG5cblxuZXhwb3J0IGNvbnN0IFNlYXJjaGVzID0gbmV3IE1ldGVvci5Db2xsZWN0aW9uKCdzZWFyY2hlcycpO1xuXG4vLyBEZW55IGFsbCBjbGllbnQtc2lkZSB1cGRhdGVzIHNpbmNlIHdlIHdpbGwgYmUgdXNpbmcgbWV0aG9kcyB0byBtYW5hZ2UgdGhpcyBjb2xsZWN0aW9uXG5TZWFyY2hlcy5kZW55KHtcbiAgaW5zZXJ0KCkgeyByZXR1cm4gdHJ1ZTsgfSxcbiAgdXBkYXRlKCkgeyByZXR1cm4gdHJ1ZTsgfSxcbiAgcmVtb3ZlKCkgeyByZXR1cm4gdHJ1ZTsgfSxcbn0pO1xuXG5TZWFyY2hlcy5TY2hlbWEgPSBuZXcgU2ltcGxlU2NoZW1hKHtcbiAgXCJzdGF0aW9uX25hbWVcIjoge1xuICAgIHR5cGU6IFN0cmluZyxcbiAgICBsYWJlbDogXCJTdGF0aW9uIHNlYXJjaCBwZXJmb3JtZWQgYXRcIixcbiAgICBvcHRpb25hbDogdHJ1ZSxcbiAgICBkZWZhdWx0VmFsdWU6IFwiU3RhdGlvbiAxXCJcbiAgfSxcbiAgLy8gc2NoZW1hIHJ1bGVzXG4gIFwic2VhcmNoX3R5cGVcIjoge1xuICAgIHR5cGU6IFtTdHJpbmddLFxuICAgIGxhYmVsOiBcIlNlYXJjaCB0eXBlc1wiLFxuICAgIG9wdGlvbmFsOiBmYWxzZSxcbiAgICBhbGxvd2VkVmFsdWVzOiBbXCJtb2RlcmF0aW9uXCIsIFwibGFiZWxcIiwgXCJmYWNlXCIsIFwiY29sbGVjdGlvblwiXSxcbiAgICBkZWZhdWx0VmFsdWU6IFtcIm1vZGVyYXRpb25cIiwgXCJsYWJlbFwiLCBcImZhY2VcIl1cbiAgfSxcbiAgXCJzZWFyY2hfY29sbGVjdGlvbnNcIjoge1xuICAgIHR5cGU6IFtTdHJpbmddLFxuICAgIGxhYmVsOiBcIkNvbGxlY3Rpb25zIHRvIHNlYXJjaFwiLFxuICAgIG9wdGlvbmFsOiB0cnVlLFxuICAgIGRlZmF1bHRWYWx1ZTogW1wiXCJdXG4gIH0sXG4gIFwic2VhcmNoX2ltYWdlXCI6IHtcbiAgICB0eXBlOiBTdHJpbmcsXG4gICAgbGFiZWw6IFwiSW1hZ2UgdG8gc2VhcmNoXCIsXG4gICAgb3B0aW9uYWw6IHRydWUsXG4gICAgZGVmYXVsdFZhbHVlOiBcIi9pbWcvZmFjZS1pZC0xMDAucG5nXCJcbiAgfSxcbiAgXCJzZWFyY2hfcmVzdWx0c1wiOiB7XG4gICAgdHlwZTogT2JqZWN0LFxuICAgIGxhYmVsOiBcIk9iamVjdCBvZiBzZWFyY2ggdHlwZXNcIixcbiAgICBvcHRpb25hbDogdHJ1ZSxcbiAgICBibGFja2JveDogdHJ1ZSxcbiAgICBkZWZhdWx0VmFsdWU6IHt9XG4gIH0sXG4gIFwiZmFjZXNcIjoge1xuICAgIHR5cGU6IFtPYmplY3RdLFxuICAgIGxhYmVsOiBcIkZhY2Ugb2JqZWN0cyBmb3VuZCBpbiBpbWFnZVwiLFxuICAgIG9wdGlvbmFsOiB0cnVlLFxuICAgIGJsYWNrYm94OiB0cnVlLFxuICAgIGRlZmF1bHRWYWx1ZTogW11cbiAgfSxcbiAgXCJjcmVhdGVkXCI6IHtcbiAgICB0eXBlOiBEYXRlLFxuICAgIGxhYmVsOiBcIkRhdGUgc2VhcmNoIHBlcmZvcm1lZFwiLFxuICAgIGF1dG9WYWx1ZTogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoIHRoaXMuaXNJbnNlcnQgKSB7XG4gICAgICAgIHJldHVybiBuZXcgRGF0ZTtcbiAgICAgIH0gXG4gICAgfSxcbiAgICBvcHRpb25hbDogdHJ1ZSxcbiAgICAvL2luZGV4OiB0cnVlXG4gIH0sXG4gIFwidXBkYXRlZFwiOiB7XG4gICAgdHlwZTogRGF0ZSxcbiAgICBsYWJlbDogXCJEYXRlIHNlYXJjaCB1cGRhdGVkXCIsXG4gICAgYXV0b1ZhbHVlOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICggdGhpcy5pc1VwZGF0ZSApIHtcbiAgICAgICAgcmV0dXJuIG5ldyBEYXRlO1xuICAgICAgfSBcbiAgICB9LFxuICAgIG9wdGlvbmFsOiB0cnVlXG4gIH1cbn0pO1xuXG5TZWFyY2hlcy5hdHRhY2hTY2hlbWEoIFNlYXJjaGVzLlNjaGVtYSApO1xuXG5pZihNZXRlb3IuaXNTZXJ2ZXIpe1xuICBNZXRlb3Iuc3RhcnR1cCgoKSA9PiB7XG4gICAgU2VhcmNoZXMuX2Vuc3VyZUluZGV4KHtcbiAgICAgICAgY3JlYXRlZDogLTEsXG4gICAgfSk7XG4gICAgLy8gU2VhcmNoZXMuX2Vuc3VyZUluZGV4KHsgc2VhcmNoX2ltYWdlOiAxfSk7XG4gIH0pO1xufVxuXG5TZWFyY2hlcy5wdWJsaWNGaWVsZHMgPSB7XG4gIHN0YXRpb25fbmFtZTogMSxcbiAgc2VhcmNoX3R5cGU6IDEsXG4gIHNlYXJjaF9jb2xsZWN0aW9uczogMSxcbiAgc2VhcmNoX2ltYWdlOiAxLFxuICBzZWFyY2hfcmVzdWx0czogMSxcbiAgY3JlYXRlZDogMSxcbiAgdXBkYXRlZDogMVxufTtcblxuLy8gU2VhcmNoZXMuaGVscGVycyh7XG4vLyAgIC8vIEEgY29sbGVjdGlvbnMgaXMgY29uc2lkZXJlZCB0byBiZSBwcml2YXRlIGlmIFwicHJpdmF0ZVwiIGlzIHNldCB0byB0cnVlXG4vLyAgIGlzUHJpdmF0ZSgpIHtcbi8vICAgICByZXR1cm4gdGhpcy5wcml2YXRlO1xuLy8gICB9XG4vLyB9KTsiLCJpbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCB7IENvbGxlY3Rpb25zIH0gZnJvbSAnLi4vLi4vYXBpL2NvbGxlY3Rpb25zL2NvbGxlY3Rpb25zLmpzJztcbmltcG9ydCB7IFByaW50cyB9IGZyb20gJy4uLy4uL2FwaS9wcmludHMvcHJpbnRzLmpzJztcbmltcG9ydCB7IFNlYXJjaGVzIH0gZnJvbSAnLi4vLi4vYXBpL3NlYXJjaGVzL3NlYXJjaGVzLmpzJztcbmltcG9ydCBBV1MgZnJvbSAnYXdzLXNkayc7XG5cbkFXUy5jb25maWcucmVnaW9uID0gJ3VzLWVhc3QtMSc7XG52YXIgcmVrb2duaXRpb24gPSBuZXcgQVdTLlJla29nbml0aW9uKCk7XG5cbi8vIGlmIHRoZSBkYXRhYmFzZSBpcyBlbXB0eSBvbiBzZXJ2ZXIgc3RhcnQsIGNyZWF0ZSBzb21lIHNhbXBsZSBkYXRhLlxuXG5NZXRlb3Iuc3RhcnR1cCgoKSA9PiB7XG5cbiAgY29uc29sZS5sb2coXCJzeW5jaW5nIGF3cyBjb2xsZWN0aW9ucy4uLlwiKTtcbiAgbGV0IGNvbFBhcmFtcyA9IHt9O1xuICBsZXQgY29sUmVxdWVzdCA9IHJla29nbml0aW9uLmxpc3RDb2xsZWN0aW9ucygpO1xuICBsZXQgcHJvbWlzZSA9IGNvbFJlcXVlc3QucHJvbWlzZSgpO1xuLy8gY29sUGFyYW1zID0ge1xuLy8gICAgICAgICAgICBcIkNvbGxlY3Rpb25JZFwiOiBcIm1hY2llc1wiXG4vLyAgICAgICAgIH07XG4vLyAgIGxldCB0ZXN0ID0gICAgICByZWtvZ25pdGlvbi5kZXNjcmliZUNvbGxlY3Rpb24oY29sUGFyYW1zKS5wcm9taXNlKCkuY2F0Y2goZXJyb3IgPT4geyB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKGVycm9yLmNvZGUsIGVycm9yLm1lc3NhZ2UsIGVycm9yKTsgcmV0dXJuIGVycm9yOyB9KS50aGVuKHJlc3VsdCA9PiB7XG4vLyAgICAgICAgICAgY29uc29sZS5sb2cocmVzdWx0KTtcbi8vICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuLy8gICAgICAgICB9KTtcbi8vICAgICBjb25zb2xlLmxvZyh0ZXN0KTtcbiAgbGV0IGNvbHMgPSBwcm9taXNlLnRoZW4ocmVzdWx0ID0+IHtcbiAgICBjb25zb2xlLmxvZyhyZXN1bHQpO1xuICAgIGlmKHJlc3VsdCAmJiByZXN1bHQuQ29sbGVjdGlvbklkcy5sZW5ndGggPiAwKXtcbiAgICAgIF8uZWFjaChyZXN1bHQuQ29sbGVjdGlvbklkcywgZnVuY3Rpb24oY29sSWQpe1xuICAgICAgICBsZXQgYXdzQ29sID0ge1xuICAgICAgICAgIGNvbGxlY3Rpb25faWQ6IGNvbElkLFxuICAgICAgICAgIGNvbGxlY3Rpb25fbmFtZTogY29sSWQucmVwbGFjZShcIl9fXCIsIFwiIFwiKSxcbiAgICAgICAgICBjb2xsZWN0aW9uX3R5cGU6IFwiZmFjZVwiLFxuICAgICAgICAgIHByaXZhdGU6IHRydWVcbiAgICAgICAgfTtcbiAgICAgICAgLy8gZGVzY3JpYmUgY29sbGVjdGlvbiB0byBnZXQgZmFjZSBjb3VudFxuICAgICAgICBjb2xQYXJhbXMgPSB7XG4gICAgICAgICAgIFwiQ29sbGVjdGlvbklkXCI6IGNvbElkXG4gICAgICAgIH07XG4gICAgICAgIGxldCBjb2xSZXN1bHRzID0gcmVrb2duaXRpb24uZGVzY3JpYmVDb2xsZWN0aW9uKGNvbFBhcmFtcykucHJvbWlzZSgpLmNhdGNoKGVycm9yID0+IHsgdGhyb3cgbmV3IE1ldGVvci5FcnJvcihlcnJvci5jb2RlLCBlcnJvci5tZXNzYWdlLCBlcnJvcik7IHJldHVybiBlcnJvcjsgfSkudGhlbihyZXN1bHQgPT4ge1xuICAgICAgICAgIGF3c0NvbC5wcmludF9jb3VudCA9IHJlc3VsdC5GYWNlQ291bnQ7XG4gICAgICAgICAgY29uc29sZS5sb2coYCR7Y29sSWR9IGNvbGxlY3Rpb24gaGFzICR7cmVzdWx0LkZhY2VDb3VudH0gZmFjZXNgKTtcbiAgICAgICAgICBjb25zb2xlLmxvZyhhd3NDb2wpO1xuICAgICAgICAgIGxldCBleGlzdGluZ0NvbCA9IENvbGxlY3Rpb25zLnVwc2VydCh7Y29sbGVjdGlvbl9pZDogY29sSWR9LCB7JHNldDogYXdzQ29sfSk7XG4gICAgICAgICAgY29uc29sZS5sb2coYHVwc2VydGVkIGNvbGxlY3Rpb246ICR7SlNPTi5zdHJpbmdpZnkoZXhpc3RpbmdDb2wpfWApO1xuICAgICAgICB9KTtcbiAgICBjb25zb2xlLmxvZyhjb2xSZXN1bHRzKTtcbiAgICAgICAgLy8gTm93IHRyeSBnZXR0aW5nIGV4aXN0aW5nIGZhY2VzIGZvciBlYWNoIGNvbGxlY3Rpb25cbiAgICAgICAgbGV0IGZhY2VQYXJhbXMgPSB7XG4gICAgICAgICAgQ29sbGVjdGlvbklkOiBjb2xJZFxuICAgICAgICB9O1xuICAgICAgICBsZXQgZmFjZVJlcXVlc3QgPSByZWtvZ25pdGlvbi5saXN0RmFjZXMoZmFjZVBhcmFtcyk7XG4gICAgICAgIGxldCBwcm9taXNlID0gZmFjZVJlcXVlc3QucHJvbWlzZSgpO1xuICAgICAgICBsZXQgZmFjZXMgPSBwcm9taXNlLnRoZW4ocmVzdWx0ID0+IHtcbiAgICAgICAgICBpZihyZXN1bHQgJiYgcmVzdWx0LkZhY2VzLmxlbmd0aCA+IDApe1xuICAgICAgICAgICAgbGV0IGNvbGxlY3Rpb25faWQgPSBDb2xsZWN0aW9ucy5maW5kT25lKHtjb2xsZWN0aW9uX2lkOiBjb2xJZH0pLl9pZDtcbiAgICAgICAgICAgIF8uZWFjaChyZXN1bHQuRmFjZXMsIGZhY2UgPT4ge1xuICAgICAgICAgICAgICBsZXQgYXdzRmFjZSA9IHtcbiAgICAgICAgICAgICAgICBwcmludF9pZDogZmFjZS5GYWNlSWQsXG4gICAgICAgICAgICAgICAgcHJpbnRfbmFtZTogZmFjZS5FeHRlcm5hbEltYWdlSWQucmVwbGFjZShcIl9fXCIsIFwiIFwiKSB8fCBmYWNlLkltYWdlSWQsXG4gICAgICAgICAgICAgICAgcHJpbnRfdHlwZTogXCJmYWNlXCIsXG4gICAgICAgICAgICAgICAgcHJpbnRfY29sbGVjdGlvbl9pZDogY29sbGVjdGlvbl9pZCxcbiAgICAgICAgICAgICAgICBwcmludF9kZXRhaWxzOiBmYWNlLFxuICAgICAgICAgICAgICAgIHByaW50X2FkZGVyOiBcInJvb3RcIlxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICBQcmludHMuc2ltcGxlU2NoZW1hKCkuY2xlYW4oYXdzRmFjZSk7XG4gICAgICAgICAgICAgIGxldCBleGlzdGluZ0ZhY2UgPSBQcmludHMudXBzZXJ0KHtwcmludF9pZDogZmFjZS5GYWNlSWR9LCB7JHNldDogYXdzRmFjZX0pO1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgdXBzZXJ0ZWQgcHJpbnQ6ICR7SlNPTi5zdHJpbmdpZnkoZXhpc3RpbmdGYWNlKX1gKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9KTtcblxuICAvLyBpZiAoUHJpbnRzLmZpbmQoKS5jb3VudCgpIDwgMTUpIHtcbiAgLy8gICBjb25zb2xlLmxvZyhcInNlZWRpbmcgcHJpbnRzLi4uXCIpO1xuICAvLyAgIGxldCBzZWVkUHJpbnRzID0gW11cbiAgLy8gICBfLnRpbWVzKDUsICgpPT57XG4gIC8vICAgICBsZXQgcHJpbnQgPSB7XG4gIC8vICAgICAgIHByaW50X2FkZGVyOiB0aGlzLnVzZXJJZCB8fCBcInJvb3RcIixcbiAgLy8gICAgICAgcHJpbnRfY29sbGVjdGlvbjogXCJwZW9wbGVcIixcbiAgLy8gICAgICAgcHJpbnRfY29sbGVjdGlvbl9pZDogXCJwZW9wbGVcIixcbiAgLy8gICAgICAgcHJpbnRfbmFtZTogZmFrZXIuaGVscGVycy51c2VyQ2FyZCgpLm5hbWUsXG4gIC8vICAgICAgIHByaW50X2lkOiBmYWtlci5yYW5kb20udXVpZCgpLFxuICAvLyAgICAgICBwcmludF9pbWc6IGZha2VyLmltYWdlLmF2YXRhcigpXG4gIC8vICAgICB9O1xuICAvLyAgICAgbGV0IHByaW50SWQgPSBQcmludHMuaW5zZXJ0KHByaW50KTtcbiAgLy8gICAgIHNlZWRQcmludHMucHVzaChwcmludElkKTtcbiAgLy8gICB9KTtcbiAgLy8gICBjb25zb2xlLmxvZyhzZWVkUHJpbnRzKTtcblxuICAvLyB9O1xufSk7IiwiLypcbiAqIENvcHlyaWdodCAyMDE3LXByZXNlbnQgQW50bW91bmRzLmNvbSwgSW5jLiBvciBpdHMgYWZmaWxpYXRlcy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgR05VIEFmZmVybyBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlLCB2ZXJzaW9uIDMuMCAodGhlIFwiTGljZW5zZVwiKS4gWW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoXG4gKiB0aGUgTGljZW5zZS4gQSBjb3B5IG9mIHRoZSBMaWNlbnNlIGlzIGxvY2F0ZWQgYXRcbiAqXG4gKiAgICAgaHR0cHM6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy9hZ3BsLTMuMC5lbi5odG1sXG4gKlxuICogb3IgaW4gdGhlIFwibGljZW5zZVwiIGZpbGUgYWNjb21wYW55aW5nIHRoaXMgZmlsZS4gVGhpcyBmaWxlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SXG4gKiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnNcbiAqIGFuZCBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5pbXBvcnQgeyBIVFRQIH0gZnJvbSAnbWV0ZW9yL2h0dHAnO1xuaW1wb3J0ICcuLi9hY2NvdW50cy1jb25maWcuanMnO1xuaW1wb3J0ICcuL2ZpeHR1cmVzLmpzJztcbi8vIFRoaXMgZGVmaW5lcyBhbGwgdGhlIGNvbGxlY3Rpb25zLCBwdWJsaWNhdGlvbnMgYW5kIG1ldGhvZHMgdGhhdCB0aGUgYXBwbGljYXRpb24gcHJvdmlkZXNcbi8vIGFzIGFuIEFQSSB0byB0aGUgY2xpZW50LlxuaW1wb3J0ICcuL3JlZ2lzdGVyLWFwaS5qcyc7XG5cbmNvbnN0IG9zID0gcmVxdWlyZSgnb3MnKTtcblxuXG5zZXJ2ZXJfbW9kZSA9IE1ldGVvci5pc1Byb2R1Y3Rpb24gPyBcIlBST0RVQ1RJT05cIiA6IFwiREVWRUxPUE1FTlRcIjtcbi8vIGNvbnNvbGUubG9nKCdpbmRleC5qczogJyArIHNlcnZlcl9tb2RlICsgXCItLT5cIiArIEpTT04uc3RyaW5naWZ5KE1ldGVvci5zZXR0aW5ncykpO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cblx0aW5mbygpe1xuXHRcdHJldHVybiBgcmVsZWFzZTogJHtwcm9jZXNzLmVudi5WRVJTSU9OIHx8ICcwLlgnfS0ke3Byb2Nlc3MuZW52LlJFTEVBU0UgfHwgJ2ZyZWUnfSB+IHZlcnNpb246ICR7cHJvY2Vzcy5lbnYuVkVSU0lPTiB8fCAnMC5YJ30gfiBidWlsZDogJHtwcm9jZXNzLmVudi5CVUlMRCB8fCAnZGV2J30gfiBob3N0bmFtZTogJHtvcy5ob3N0bmFtZSgpfWA7XG5cdH0sXG5cblx0Z2V0Q29kZSgpe1xuXHRcdHJldHVybiBNZXRlb3Iuc2V0dGluZ3MucHJpdmF0ZS5rZXk7XG5cdH0sXG5cblx0YXN5bmMgZ2V0RGF0YSgpeyAgICBcblx0XHR0cnl7XG5cdFx0XHR2YXIgcmVzcG9uc2UgPSB7fTtcblx0XHRcdGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBIVFRQLmNhbGwoJ0dFVCcsICdodHRwOi8vanNvbnBsYWNlaG9sZGVyLnR5cGljb2RlLmNvbS9wb3N0cycpO1x0XG5cdFx0XHRjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShyZXN1bHRzLmRhdGFbMF0pKTtcdFxuXHRcdFx0Y29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkocmVzdWx0cy5oZWFkZXJzKSk7XG5cdFx0XHRyZXNwb25zZS5jb2RlID0gdHJ1ZTtcblx0XHRcdHJlc3BvbnNlLmRhdGEgPSByZXN1bHRzO1xuXHRcdH0gY2F0Y2goZSl7XG5cdFx0XHRyZXNwb25zZSA9IGZhbHNlO1xuXHRcdFx0Y29uc29sZS5sb2coZSk7XG5cdFx0fSBmaW5hbGx5IHtcblx0XHRcdGNvbnNvbGUubG9nKFwiZmluYWxseS4uLlwiKVxuXHRcdFx0Ly90aHJvdyBuZXcgTWV0ZW9yLkVycm9yKFwiaW5hcHByb3ByaWF0ZS1waWNcIixcIlRoZSB1c2VyIGhhcyB0YWtlbiBhbiBpbmFwcHJvcHJpYXRlIHBpY3R1cmUuXCIpO1x0XG5cdFx0XHRyZXR1cm4gcmVzcG9uc2U7XG5cdFx0fVxuXHR9XG5cbn0pO1xuXG5NZXRlb3Iub25Db25uZWN0aW9uKChjb25uZWN0aW9uKT0+e1xuXHRsZXQgY2xpZW50QWRkciA9IGNvbm5lY3Rpb24uY2xpZW50QWRkcmVzcztcblx0bGV0IGhlYWRlcnMgPSBjb25uZWN0aW9uLmh0dHBIZWFkZXJzO1xuXHRjb25zb2xlLmxvZyhgY29ubmVjdGlvbiBmcm9tICR7Y2xpZW50QWRkcn1gKTtcblx0Ly8gY29uc29sZS5sb2coaGVhZGVycyk7XG59KSIsImltcG9ydCAnLi4vLi4vYXBpL2NvbGxlY3Rpb25zL21ldGhvZHMuanMnO1xuaW1wb3J0ICcuLi8uLi9hcGkvY29sbGVjdGlvbnMvcHVibGljYXRpb25zLmpzJztcbmltcG9ydCAnLi4vLi4vYXBpL3NlYXJjaGVzL21ldGhvZHMuanMnO1xuaW1wb3J0ICcuLi8uLi9hcGkvc2VhcmNoZXMvcHVibGljYXRpb25zLmpzJztcbmltcG9ydCAnLi4vLi4vYXBpL3ByaW50cy9tZXRob2RzLmpzJztcbmltcG9ydCAnLi4vLi4vYXBpL3ByaW50cy9wdWJsaWNhdGlvbnMuanMnOyIsImltcG9ydCB7IEFjY291bnRzIH0gZnJvbSAnbWV0ZW9yL2FjY291bnRzLWJhc2UnO1xuaW1wb3J0IHsgQWNjb3VudHNDb21tb24gfSBmcm9tICdtZXRlb3IvYWNjb3VudHMtYmFzZSdcbmltcG9ydCB7IEFjY291bnRzQ2xpZW50IH0gZnJvbSAnbWV0ZW9yL2FjY291bnRzLWJhc2UnXG5cblxuaWYgKE1ldGVvci5pc0NsaWVudCkge1xuXHRBY2NvdW50cy51aS5jb25maWcoe1xuXHQgIHBhc3N3b3JkU2lnbnVwRmllbGRzOiAnVVNFUk5BTUVfQU5EX0VNQUlMJyxcblx0fSk7XG59XG5cbmlmIChNZXRlb3IuaXNTZXJ2ZXIpIHtcblx0Y29uc29sZS5sb2coXCJhY2NvdW50cyBjb25maWcgbG9hZGVkIVwiKTtcblx0QWNjb3VudHMub25DcmVhdGVVc2VyKChvcHRpb25zLCB1c2VyKSA9PiB7XG5cdFx0Ly8gdXNlci5jcmVhdGVkID0gbmV3IERhdGUoKTtcblxuXHRcdGNvbnNvbGUubG9nKFwidXNlcjogXCIgKyB1c2VyKTtcblx0XHRjb25zb2xlLmxvZyhcIm9wdGlvbnM6IFwiICsgb3B0aW9ucyk7XG5cdFx0Ly8gdXNlciA9IEpTT04uc3RyaW5naWZ5KHVzZXIpO1xuXHRcdGNvbnNvbGUubG9nKHVzZXIpO1xuXHRcdC8vIG9wdGlvbnMgPSBKU09OLnN0cmluZ2lmeShvcHRpb25zKTtcblx0XHRjb25zb2xlLmxvZyhvcHRpb25zKTtcblxuXHQgICAgLy8gRG9uJ3QgZm9yZ2V0IHRvIHJldHVybiB0aGUgbmV3IHVzZXIgb2JqZWN0IGF0IHRoZSBlbmQhXG5cdFx0cmV0dXJuIHVzZXI7XG5cdH0pO1xufSIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNy1wcmVzZW50IEFudG1vdW5kcy5jb20sIEluYy4gb3IgaXRzIGFmZmlsaWF0ZXMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEdOVSBBZmZlcm8gR2VuZXJhbCBQdWJsaWMgTGljZW5zZSwgdmVyc2lvbiAzLjAgKHRoZSBcIkxpY2Vuc2VcIikuIFlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aFxuICogdGhlIExpY2Vuc2UuIEEgY29weSBvZiB0aGUgTGljZW5zZSBpcyBsb2NhdGVkIGF0XG4gKlxuICogICAgIGh0dHBzOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvYWdwbC0zLjAuZW4uaHRtbFxuICpcbiAqIG9yIGluIHRoZSBcImxpY2Vuc2VcIiBmaWxlIGFjY29tcGFueWluZyB0aGlzIGZpbGUuIFRoaXMgZmlsZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUlxuICogQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zXG4gKiBhbmQgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbmltcG9ydCAnLi4vaW1wb3J0cy9zdGFydHVwL3NlcnZlcic7XG5cbk1ldGVvci5zdGFydHVwKCgpID0+IHtcbiAgLy8gY29kZSB0byBydW4gb24gc2VydmVyIGF0IHN0YXJ0dXBcbn0pO1xuIl19
