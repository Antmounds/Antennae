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
    console.log(print);

    if (!print) {
      throw new Meteor.Error('no-print', 'No print found with given id!');
    } else {
      let params = {
        CollectionId: print.print_collection_id,
        FaceIds: [print.print_id]
      };
      let printRequest = rekognition.deleteFaces(params).promise().catch(error => {
        throw new Meteor.Error(error.code, error.message, error);
        return error;
      });
      printRequest.then(values => {
        return values;
      });
      let oldPrint = Prints.remove(print._id);

      if (oldPrint) {
        console.log(`deleted face: ${printId}`);
      } else {
        console.log(printId);
        throw new Meteor.Error('remove-print-error', `error removing print: ${printId}`);
      }

      ;
      return `removed print: ${printId}`; // if(printId){
      // 	let print = Prints.remove(printId);
      // 	console.log(`deleted face: ${printId}`);
      // 	return `deleted face: ${printId}`;
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
    //return 1;
    // if(!Meteor.user){
    // 	throw new Meteor.Error('not-logged-in','must be logged-in to perform search');
    // 	return false;
    // }
    // let matchThreshold = matchThreshold;
    check(searchData.matchThreshold, Number);
    console.log("ANALYZING IMAGE...");
    var t0 = new Date().getTime();
    let imgBytes = new Buffer.from(searchData.img.split(",")[1], "base64"); // let colId = Meteor.user().profile.collections;

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
        "FaceMatchThreshold": searchData.matchThreshold,
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
        persons: persons //.FaceMatches[0],

      };
      let search = {
        // search_image: searchData.img,
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
          collection_type: "face"
        }; // describe collection to get face count

        colParams = {
          "CollectionId": colId
        };
        rekognition.describeCollection(colParams).promise().catch(error => {
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
        }); // Now try getting existing faces for each collection

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

            _.each(result.Faces, function (face) {
              let awsFace = {
                print_id: face.FaceId,
                print_name: face.ExternalImageId.replace("_", " ") || face.ImageId,
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

server_mode = Meteor.isProduction ? "PRODUCTION" : "DEVELOPMENT";
console.log('index.js: ' + server_mode + "-->" + JSON.stringify(Meteor.settings));
Meteor.methods({
  info() {
    return `release: lite - version: 0.9 - build: ${process.env.BUILD || 'dev'} - hostname: ${os.hostname()}`;
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvY29sbGVjdGlvbnMvY29sbGVjdGlvbnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL2NvbGxlY3Rpb25zL21ldGhvZHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL2NvbGxlY3Rpb25zL3B1YmxpY2F0aW9ucy5qcyIsIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvcHJpbnRzL21ldGhvZHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL3ByaW50cy9wcmludHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL3ByaW50cy9wdWJsaWNhdGlvbnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL3NlYXJjaGVzL21ldGhvZHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL3NlYXJjaGVzL3B1YmxpY2F0aW9ucy5qcyIsIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvc2VhcmNoZXMvc2VhcmNoZXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvc3RhcnR1cC9zZXJ2ZXIvZml4dHVyZXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvc3RhcnR1cC9zZXJ2ZXIvaW5kZXguanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvc3RhcnR1cC9zZXJ2ZXIvcmVnaXN0ZXItYXBpLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9pbXBvcnRzL3N0YXJ0dXAvYWNjb3VudHMtY29uZmlnLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9zZXJ2ZXIvbWFpbi5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnQiLCJDb2xsZWN0aW9ucyIsIk1vbmdvIiwid2F0Y2giLCJyZXF1aXJlIiwidiIsIlNpbXBsZVNjaGVtYSIsIk1ldGVvciIsIkNvbGxlY3Rpb24iLCJkZW55IiwiaW5zZXJ0IiwidXBkYXRlIiwicmVtb3ZlIiwiU2NoZW1hIiwidHlwZSIsIlN0cmluZyIsImxhYmVsIiwib3B0aW9uYWwiLCJkZWZhdWx0VmFsdWUiLCJpbmRleCIsInVuaXF1ZSIsImFsbG93ZWRWYWx1ZXMiLCJOdW1iZXIiLCJCb29sZWFuIiwiRGF0ZSIsImF1dG9WYWx1ZSIsImlzSW5zZXJ0IiwiaXNVcGRhdGUiLCJhdHRhY2hTY2hlbWEiLCJwdWJsaWNGaWVsZHMiLCJjb2xsZWN0aW9uX2lkIiwiY29sbGVjdGlvbl9uYW1lIiwiY29sbGVjdGlvbl90eXBlIiwicHJpbnRfY291bnQiLCJwcml2YXRlIiwiY3JlYXRlZCIsInVwZGF0ZWQiLCJERFBSYXRlTGltaXRlciIsIkFXUyIsImRlZmF1bHQiLCJjb25maWciLCJyZWdpb24iLCJyZWtvZ25pdGlvbiIsIlJla29nbml0aW9uIiwibWV0aG9kcyIsIm5ld0NvbCIsImNoZWNrIiwicmVwbGFjZSIsImNvbnNvbGUiLCJsb2ciLCJjb2xsZWN0aW9uUGFyYW1zIiwiQ29sbGVjdGlvbklkIiwiY29sbGVjdGlvblJlcXVlc3QiLCJjcmVhdGVDb2xsZWN0aW9uIiwicHJvbWlzZSIsImNhdGNoIiwiZXJyb3IiLCJFcnJvciIsImNvZGUiLCJtZXNzYWdlIiwidGhlbiIsInZhbHVlcyIsImNvbCIsImNvbElkIiwiZmluZE9uZSIsInBhcmFtcyIsImRlbGV0ZUNvbGxlY3Rpb24iLCJvbGRDb2wiLCJfaWQiLCJwdWJsaXNoIiwiY29sbGVjdGlvbklkIiwiZmluZCIsInNvcnQiLCJmaWVsZHMiLCJzdWJzY3JpYmVUb0NvbGxlY3Rpb25zUnVsZSIsIm5hbWUiLCJhZGRSdWxlIiwiUHJpbnRzIiwibmV3UHJpbnQiLCJjb2xsZWN0aW9uIiwicHJpbnRfYWRkZXIiLCJ1c2VySWQiLCJwcmludF9jb2xsZWN0aW9uX2lkIiwicHJpbnRfbmFtZSIsInByaW50X2ltZyIsImltZyIsInNpbXBsZVNjaGVtYSIsImNsZWFuIiwiZmFjZVBhcmFtcyIsIkV4dGVybmFsSW1hZ2VJZCIsIkltYWdlIiwiQnVmZmVyIiwiZnJvbSIsInNwbGl0IiwiRGV0ZWN0aW9uQXR0cmlidXRlcyIsImZhY2VSZXF1ZXN0IiwiaW5kZXhGYWNlcyIsImluZGV4RmFjZSIsInJlc3VsdCIsInByaW50X2lkIiwiRmFjZVJlY29yZHMiLCJGYWNlIiwiRmFjZUlkIiwicHJpbnQiLCJwcmludElkIiwiRmFjZUlkcyIsInByaW50UmVxdWVzdCIsImRlbGV0ZUZhY2VzIiwib2xkUHJpbnQiLCJPYmplY3QiLCJibGFja2JveCIsInByaW50X3R5cGUiLCJwcmludF9kZXRhaWxzIiwic2VsZWN0b3IiLCJzdWJzY3JpYmVUb1ByaW50c1J1bGUiLCJTZWFyY2hlcyIsImRhc2hib2FyZFN0YXRzIiwiY29sbGVjdGlvbnMiLCJjb3VudCIsImZhY2VzIiwic2VhcmNoZXMiLCJtYXRjaGVzIiwiJG5lIiwibWF0Y2hQZXJjZW50IiwiTWF0aCIsInJvdW5kIiwic2VhcmNoRGF0YSIsIm1hdGNoVGhyZXNob2xkIiwidDAiLCJnZXRUaW1lIiwiaW1nQnl0ZXMiLCJjb2xJZHMiLCJmZXRjaCIsIm1vZGVyYXRpb25QYXJhbXMiLCJsYWJlbFBhcmFtcyIsImNlbGVicml0eVBhcmFtcyIsIm1vZGVyYXRpb25SZXF1ZXN0IiwiZGV0ZWN0TW9kZXJhdGlvbkxhYmVscyIsImxhYmVsUmVxdWVzdCIsImRldGVjdExhYmVscyIsImRldGVjdEZhY2VzIiwiY2VsZWJyaXR5UmVxdWVzdCIsInJlY29nbml6ZUNlbGVicml0aWVzIiwiYWxsUHJvbWlzZXMiLCJwdXNoIiwiXyIsImVhY2giLCJyZWtvZ25pdGlvblBhcmFtcyIsInJla29nbml0aW9uUmVxdWVzdCIsInNlYXJjaEZhY2VzQnlJbWFnZSIsInJlc3BvbnNlIiwiUHJvbWlzZSIsImFsbCIsIkpTT04iLCJzdHJpbmdpZnkiLCJpIiwicGVyc29ucyIsIkZhY2VNYXRjaGVzIiwidGFnIiwiaW1hZ2VfaWQiLCJmYWNlX2lkIiwic2ltaWxhcml0eSIsIlNpbWlsYXJpdHkiLCJ0MSIsInNlYXJjaF9yZXN1bHRzIiwibW9kZXJhdGlvbiIsIk1vZGVyYXRpb25MYWJlbHMiLCJsYWJlbHMiLCJMYWJlbHMiLCJmYWNlRGV0YWlscyIsIkZhY2VEZXRhaWxzIiwiY2VsZWJyaXR5IiwiQ2VsZWJyaXR5RmFjZXMiLCJzZWFyY2giLCJzdGF0aW9uX25hbWUiLCJzdGF0aW9uTmFtZSIsInNhdmVTZWFyY2giLCJyZWFzb24iLCJkZXRhaWxzIiwiZmluYWxseSIsInNlYXJjaElkIiwicnVuU2NhblJ1bGUiLCJzdWJzY3JpYmVUb1NlYXJjaGVzUnVsZSIsImlzU2VydmVyIiwic3RhcnR1cCIsIl9lbnN1cmVJbmRleCIsInNlYXJjaF90eXBlIiwic2VhcmNoX2NvbGxlY3Rpb25zIiwic2VhcmNoX2ltYWdlIiwiY29sUGFyYW1zIiwiY29sUmVxdWVzdCIsImxpc3RDb2xsZWN0aW9ucyIsImNvbHMiLCJDb2xsZWN0aW9uSWRzIiwibGVuZ3RoIiwiYXdzQ29sIiwiZGVzY3JpYmVDb2xsZWN0aW9uIiwiRmFjZUNvdW50IiwiZXhpc3RpbmdDb2wiLCJ1cHNlcnQiLCIkc2V0IiwibGlzdEZhY2VzIiwiRmFjZXMiLCJmYWNlIiwiYXdzRmFjZSIsIkltYWdlSWQiLCJleGlzdGluZ0ZhY2UiLCJIVFRQIiwib3MiLCJzZXJ2ZXJfbW9kZSIsImlzUHJvZHVjdGlvbiIsInNldHRpbmdzIiwiaW5mbyIsInByb2Nlc3MiLCJlbnYiLCJCVUlMRCIsImhvc3RuYW1lIiwiZ2V0RGF0YSIsInJlc3VsdHMiLCJjYWxsIiwiZGF0YSIsImhlYWRlcnMiLCJlIiwib25Db25uZWN0aW9uIiwiY29ubmVjdGlvbiIsImNsaWVudEFkZHIiLCJjbGllbnRBZGRyZXNzIiwiaHR0cEhlYWRlcnMiLCJBY2NvdW50cyIsIkFjY291bnRzQ29tbW9uIiwiQWNjb3VudHNDbGllbnQiLCJpc0NsaWVudCIsInVpIiwicGFzc3dvcmRTaWdudXBGaWVsZHMiLCJvbkNyZWF0ZVVzZXIiLCJvcHRpb25zIiwidXNlciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBQUEsT0FBT0MsTUFBUCxDQUFjO0FBQUNDLGVBQVksTUFB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LENBQTdDLEVBQXVFLENBQXZFO0FBQTBFLElBQUlnTyxjQUFKO0FBQW1CdE8sT0FBT0ksS0FBUCxDQUFhQyxRQUFRLHNCQUFSLENBQWIsRUFBNkM7QUFBQ2lPLGlCQUFlaE8sQ0FBZixFQUFpQjtBQUFDZ08scUJBQWVoTyxDQUFmO0FBQWlCOztBQUFwQyxDQUE3QyxFQUFtRixDQUFuRjtBQUFzRixJQUFJaU8sY0FBSjtBQUFtQnZPLE9BQU9JLEtBQVAsQ0FBYUMsUUFBUSxzQkFBUixDQUFiLEVBQTZDO0FBQUNrTyxpQkFBZWpPLENBQWYsRUFBaUI7QUFBQ2lPLHFCQUFlak8sQ0FBZjtBQUFpQjs7QUFBcEMsQ0FBN0MsRUFBbUYsQ0FBbkY7O0FBS25OLElBQUlFLE9BQU9nTyxRQUFYLEVBQXFCO0FBQ3BCSCxXQUFTSSxFQUFULENBQVloTSxNQUFaLENBQW1CO0FBQ2pCaU0sMEJBQXNCO0FBREwsR0FBbkI7QUFHQTs7QUFFRCxJQUFJbE8sT0FBT2dMLFFBQVgsRUFBcUI7QUFDcEJ2SSxVQUFRQyxHQUFSLENBQVkseUJBQVo7QUFDQW1MLFdBQVNNLFlBQVQsQ0FBc0IsQ0FBQ0MsT0FBRCxFQUFVQyxJQUFWLEtBQW1CO0FBQ3hDO0FBRUE1TCxZQUFRQyxHQUFSLENBQVksV0FBVzJMLElBQXZCO0FBQ0E1TCxZQUFRQyxHQUFSLENBQVksY0FBYzBMLE9BQTFCLEVBSndDLENBS3hDOztBQUNBM0wsWUFBUUMsR0FBUixDQUFZMkwsSUFBWixFQU53QyxDQU94Qzs7QUFDQTVMLFlBQVFDLEdBQVIsQ0FBWTBMLE9BQVosRUFSd0MsQ0FVckM7O0FBQ0gsV0FBT0MsSUFBUDtBQUNBLEdBWkQ7QUFhQSxDOzs7Ozs7Ozs7OztBQzFCRDdPLE9BQU9JLEtBQVAsQ0FBYUMsUUFBUSwyQkFBUixDQUFiO0FBY0FHLE9BQU9pTCxPQUFQLENBQWUsTUFBTSxDQUNuQjtBQUNELENBRkQsRSIsImZpbGUiOiIvYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTW9uZ28gfSBmcm9tICdtZXRlb3IvbW9uZ28nO1xuaW1wb3J0IHsgU2ltcGxlU2NoZW1hIH0gZnJvbSAnbWV0ZW9yL2FsZGVlZDpzaW1wbGUtc2NoZW1hJztcblxuXG5cbmV4cG9ydCBjb25zdCBDb2xsZWN0aW9ucyA9IG5ldyBNZXRlb3IuQ29sbGVjdGlvbignY29sbGVjdGlvbnMnKTtcblxuLy8gRGVueSBhbGwgY2xpZW50LXNpZGUgdXBkYXRlcyBzaW5jZSB3ZSB3aWxsIGJlIHVzaW5nIG1ldGhvZHMgdG8gbWFuYWdlIHRoaXMgY29sbGVjdGlvblxuQ29sbGVjdGlvbnMuZGVueSh7XG4gIGluc2VydCgpIHsgcmV0dXJuIHRydWU7IH0sXG4gIHVwZGF0ZSgpIHsgcmV0dXJuIHRydWU7IH0sXG4gIHJlbW92ZSgpIHsgcmV0dXJuIHRydWU7IH0sXG59KTtcblxuQ29sbGVjdGlvbnMuU2NoZW1hID0gbmV3IFNpbXBsZVNjaGVtYSh7XG4gIC8vIE91ciBzY2hlbWEgcnVsZXMgd2lsbCBnbyBoZXJlLlxuICBcImNvbGxlY3Rpb25faWRcIjoge1xuICAgIHR5cGU6IFN0cmluZyxcbiAgICBsYWJlbDogXCJDb2xsZWN0aW9uIElEXCIsXG4gICAgb3B0aW9uYWw6IGZhbHNlLFxuICAgIGRlZmF1bHRWYWx1ZTogXCJNeV9Db2xsZWN0aW9uXCIsXG4gICAgaW5kZXg6IHRydWUsXG4gICAgdW5pcXVlOiB0cnVlXG4gIH0sXG4gIFwiY29sbGVjdGlvbl9uYW1lXCI6IHtcbiAgICB0eXBlOiBTdHJpbmcsXG4gICAgbGFiZWw6IFwiQ29sbGVjdGlvbiBOYW1lXCIsXG4gICAgb3B0aW9uYWw6IGZhbHNlLFxuICAgIGRlZmF1bHRWYWx1ZTogXCJNeSBDb2xsZWN0aW9uXCIsXG4gICAgaW5kZXg6IHRydWVcbiAgfSxcbiAgXCJjb2xsZWN0aW9uX3R5cGVcIjoge1xuICAgIHR5cGU6IFN0cmluZyxcbiAgICBsYWJlbDogXCJDb2xsZWN0aW9uIHR5cGVcIixcbiAgICBvcHRpb25hbDogZmFsc2UsXG4gICAgYWxsb3dlZFZhbHVlczogW1wiZmFjZVwiLCBcInZvaWNlXCJdLFxuICAgIGRlZmF1bHRWYWx1ZTogXCJmYWNlXCJcbiAgfSxcbiAgXCJwcmludF9jb3VudFwiOiB7XG4gICAgdHlwZTogTnVtYmVyLFxuICAgIGxhYmVsOiBcIlByaW50IGNvdW50XCIsXG4gICAgb3B0aW9uYWw6IHRydWUsXG4gICAgZGVmYXVsdFZhbHVlOiAwXG4gIH0sXG4gIFwicHJpdmF0ZVwiOiB7XG4gICAgdHlwZTogQm9vbGVhbixcbiAgICBsYWJlbDogXCJDb2xsZWN0aW9uIHByaXZhY3lcIixcbiAgICBvcHRpb25hbDogdHJ1ZSxcbiAgICBkZWZhdWx0VmFsdWU6IHRydWVcbiAgfSxcbiAgXCJjcmVhdGVkXCI6IHtcbiAgICB0eXBlOiBEYXRlLFxuICAgIGxhYmVsOiBcIkRhdGUgY29sbGVjdGlvbiBhZGRlZCB0byBBbnRlbm5hZVwiLFxuICAgIGF1dG9WYWx1ZTogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoIHRoaXMuaXNJbnNlcnQgKSB7XG4gICAgICAgIHJldHVybiBuZXcgRGF0ZTtcbiAgICAgIH0gXG4gICAgfSxcbiAgICBvcHRpb25hbDogdHJ1ZVxuICB9LFxuICBcInVwZGF0ZWRcIjoge1xuICAgIHR5cGU6IERhdGUsXG4gICAgbGFiZWw6IFwiRGF0ZSBjb2xsZWN0aW9uIHVwZGF0ZWQgaW4gU3lzdGVtXCIsXG4gICAgYXV0b1ZhbHVlOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICggdGhpcy5pc1VwZGF0ZSApIHtcbiAgICAgICAgcmV0dXJuIG5ldyBEYXRlO1xuICAgICAgfSBcbiAgICB9LFxuICAgIG9wdGlvbmFsOiB0cnVlXG4gIH1cbn0pO1xuXG5Db2xsZWN0aW9ucy5hdHRhY2hTY2hlbWEoIENvbGxlY3Rpb25zLlNjaGVtYSApOyBcblxuXG5Db2xsZWN0aW9ucy5wdWJsaWNGaWVsZHMgPSB7XG4gIGNvbGxlY3Rpb25faWQ6IDEsXG4gIGNvbGxlY3Rpb25fbmFtZTogMSxcbiAgY29sbGVjdGlvbl90eXBlOiAxLFxuICBwcmludF9jb3VudDogMSxcbiAgcHJpdmF0ZTogMSxcbiAgY3JlYXRlZDogMSxcbiAgdXBkYXRlZDogMVxufTtcblxuLy8gQ29sbGVjdGlvbnMuaGVscGVycyh7XG4vLyAgIC8vIEEgY29sbGVjdGlvbnMgaXMgY29uc2lkZXJlZCB0byBiZSBwcml2YXRlIGlmIFwicHJpdmF0ZVwiIGlzIHNldCB0byB0cnVlXG4vLyAgIGlzUHJpdmF0ZSgpIHtcbi8vICAgICByZXR1cm4gdGhpcy5wcml2YXRlO1xuLy8gICB9XG4vLyB9KTsiLCJpbXBvcnQgeyBERFBSYXRlTGltaXRlciB9IGZyb20gJ21ldGVvci9kZHAtcmF0ZS1saW1pdGVyJztcbmltcG9ydCBBV1MgZnJvbSAnYXdzLXNkayc7XG5cbmltcG9ydCB7IENvbGxlY3Rpb25zIH0gZnJvbSAnLi9jb2xsZWN0aW9ucy5qcyc7XG5cbkFXUy5jb25maWcucmVnaW9uID0gJ3VzLWVhc3QtMSc7XG52YXIgcmVrb2duaXRpb24gPSBuZXcgQVdTLlJla29nbml0aW9uKCk7XG5cbk1ldGVvci5tZXRob2RzKHtcblx0XCJjb2xsZWN0aW9uLnNhdmVcIihuZXdDb2wpe1xuXHRcdGNoZWNrKG5ld0NvbC5jb2xsZWN0aW9uX25hbWUsIFN0cmluZyk7XG5cdFx0bmV3Q29sLmNvbGxlY3Rpb25faWQgPSBuZXdDb2wuY29sbGVjdGlvbl9uYW1lLnJlcGxhY2UoLyAvZyxcIl9fXCIpO1xuXHRcdG5ld0NvbC5wcml2YXRlID0gdHJ1ZTtcblx0XHRjb25zb2xlLmxvZyhuZXdDb2wpO1xuXHRcdGxldCBjb2xsZWN0aW9uUGFyYW1zID0ge1xuICBcdFx0XHRDb2xsZWN0aW9uSWQ6IG5ld0NvbC5jb2xsZWN0aW9uX2lkXG5cdFx0fTtcblx0XHRsZXQgY29sbGVjdGlvblJlcXVlc3QgPSByZWtvZ25pdGlvbi5jcmVhdGVDb2xsZWN0aW9uKGNvbGxlY3Rpb25QYXJhbXMpLnByb21pc2UoKS5jYXRjaChlcnJvciA9PiB7IHRocm93IG5ldyBNZXRlb3IuRXJyb3IoZXJyb3IuY29kZSwgZXJyb3IubWVzc2FnZSwgZXJyb3IpOyByZXR1cm4gZXJyb3I7IH0pO1xuXHRcdGNvbGxlY3Rpb25SZXF1ZXN0LnRoZW4odmFsdWVzID0+IHtyZXR1cm4gdmFsdWVzfSk7XG5cdFx0bGV0IGNvbCA9IENvbGxlY3Rpb25zLmluc2VydChuZXdDb2wpO1xuXHRcdGlmKGNvbCl7XG5cdFx0XHRjb25zb2xlLmxvZyhgYWRkZWQgY29sbGVjdGlvbjogJHtjb2x9YCk7XG5cdFx0fWVsc2V7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhuZXdDb2wpO1xuICAgICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcignYWRkLWNvbGxlY3Rpb24tZXJyb3InLGBlcnJvciBhZGRpbmcgY29sbGVjdGlvbjogJHtuZXdDb2x9YClcdFx0XG5cdFx0fVxuXHRcdHJldHVybiBgYWRkZWQgY29sbGVjdGlvbjogJHtjb2x9YDtcblx0fSxcblxuXHRcImNvbGxlY3Rpb24uZGVsZXRlXCIoY29sSWQpe1xuXHRcdGNoZWNrKGNvbElkLFN0cmluZyk7XG5cdFx0bGV0IGNvbCA9IENvbGxlY3Rpb25zLmZpbmRPbmUoY29sSWQpO1xuXHRcdGNvbnNvbGUubG9nKGNvbCk7XG5cdFx0aWYoIWNvbCl7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCduby1jb2xsZWN0aW9uJywnTm8gY29sbGVjdGlvbiBmb3VuZCB3aXRoIGdpdmVuIGlkIScpO1xuXHRcdH1lbHNle1xuXHRcdFx0bGV0IHBhcmFtcyA9IHtcblx0XHRcdFx0Q29sbGVjdGlvbklkOiBjb2wuY29sbGVjdGlvbl9pZFxuXHRcdFx0fTtcblx0XHRcdGxldCBjb2xsZWN0aW9uUmVxdWVzdCA9IHJla29nbml0aW9uLmRlbGV0ZUNvbGxlY3Rpb24ocGFyYW1zKS5wcm9taXNlKCkuY2F0Y2goZXJyb3IgPT4geyB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKGVycm9yLmNvZGUsIGVycm9yLm1lc3NhZ2UsIGVycm9yKTsgcmV0dXJuIGVycm9yOyB9KTtcblx0XHRcdGNvbGxlY3Rpb25SZXF1ZXN0LnRoZW4odmFsdWVzID0+IHtyZXR1cm4gdmFsdWVzfSk7XG5cdFx0XHRsZXQgb2xkQ29sID0gQ29sbGVjdGlvbnMucmVtb3ZlKGNvbC5faWQpO1xuXHRcdFx0aWYob2xkQ29sKXtcblx0XHRcdFx0Y29uc29sZS5sb2coYHJlbW92ZWQgY29sbGVjdGlvbjogJHtvbGRDb2x9YCk7XG5cdFx0XHR9ZWxzZXtcblx0ICAgICAgICAgICAgY29uc29sZS5sb2coY29sSWQpO1xuXHQgICAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdyZW1vdmUtY29sbGVjdGlvbi1lcnJvcicsYGVycm9yIHJlbW92aW5nIGNvbGxlY3Rpb246ICR7Y29sSWR9YClcdFx0XG5cdFx0XHR9O1xuXHRcdFx0cmV0dXJuIGByZW1vdmVkIGNvbGxlY3Rpb246ICR7Y29sSWR9YDtcblx0XHRcdFx0Ly8gbGV0IHByaW50ID0gQ29sbGVjdGlvbnMucmVtb3ZlKGNvbElkKTtcblx0XHRcdFx0Ly8gY29uc29sZS5sb2coYGRlbGV0ZWQgY29sbGVjdGlvbjogJHtjb2xJZH1gKTtcblx0XHRcdFx0Ly8gcmV0dXJuIGBkZWxldGVkIGNvbGxlY3Rpb246ICR7Y29sSWR9YDtcblx0XHR9O1xuXHR9XG59KVxuXG4vLyBEZWZpbmUgYSBydWxlIHRvIGxpbWl0IG1ldGhvZCBjYWxsc1xuLy8gbGV0IHJ1blNjYW5SdWxlID0ge1xuLy8gXHR0eXBlOiAnbWV0aG9kJyxcbi8vIFx0bmFtZTogJ21vbWVudC5zY2FuJ1xuLy8gfTtcbi8vIEFkZCB0aGUgcnVsZSwgYWxsb3dpbmcgdXAgdG8gMSBzY2FuIGV2ZXJ5IDEwIHNlY29uZHNcbi8vIEREUFJhdGVMaW1pdGVyLmFkZFJ1bGUocnVuU2NhblJ1bGUsIDEsIDEwMDAwKTsiLCJpbXBvcnQgeyBERFBSYXRlTGltaXRlciB9IGZyb20gJ21ldGVvci9kZHAtcmF0ZS1saW1pdGVyJztcblxuaW1wb3J0IHsgQ29sbGVjdGlvbnMgfSBmcm9tICcuL2NvbGxlY3Rpb25zLmpzJztcblxuXG5NZXRlb3IucHVibGlzaCgnY29sbGVjdGlvbnMuZ2V0JywgZnVuY3Rpb24oY29sbGVjdGlvbklkPScnKSB7XG5cdGNoZWNrKGNvbGxlY3Rpb25JZCxTdHJpbmcpO1xuXHRjb2xsZWN0aW9uSWQgPSBjb2xsZWN0aW9uSWQgfHwge307XG4gIFx0Ly8gY29uc29sZS5sb2coQ29sbGVjdGlvbnMuZmluZChjb2xsZWN0aW9uSWQpLmNvdW50KCkpO1xuXHRyZXR1cm4gQ29sbGVjdGlvbnMuZmluZChcblx0XHRjb2xsZWN0aW9uSWQsIFxuXHQgIHsgXG5cdCAgXHRzb3J0OiB7IGNyZWF0ZWQ6IC0xIH0gXG5cdH1cblx0LCB7XG5cdFx0ZmllbGRzOiBDb2xsZWN0aW9ucy5wdWJsaWNGaWVsZHNcblx0fSk7XG59KTtcblxuLy8gRGVmaW5lIGEgcnVsZSB0byBsaW1pdCBzdWJzY3JpcHRpb24gY2FsbHNcbnZhciBzdWJzY3JpYmVUb0NvbGxlY3Rpb25zUnVsZSA9IHtcbiAgdHlwZTogJ3N1YnNjcmlwdGlvbicsXG4gIG5hbWU6ICdjb2xsZWN0aW9ucy5nZXQnXG59XG4vLyBBZGQgdGhlIHJ1bGUsIGFsbG93aW5nIHVwIHRvIDEgc3Vic2NyaXB0aW9uIGV2ZXJ5IDUgc2Vjb25kcy5cbkREUFJhdGVMaW1pdGVyLmFkZFJ1bGUoc3Vic2NyaWJlVG9Db2xsZWN0aW9uc1J1bGUsIDEsIDUwMDApOyIsImltcG9ydCB7IEREUFJhdGVMaW1pdGVyIH0gZnJvbSAnbWV0ZW9yL2RkcC1yYXRlLWxpbWl0ZXInO1xuaW1wb3J0IEFXUyBmcm9tICdhd3Mtc2RrJztcblxuaW1wb3J0IHsgQ29sbGVjdGlvbnMgfSBmcm9tICcuLi9jb2xsZWN0aW9ucy9jb2xsZWN0aW9ucy5qcyc7XG5pbXBvcnQgeyBQcmludHMgfSBmcm9tICcuL3ByaW50cy5qcyc7XG5cbkFXUy5jb25maWcucmVnaW9uID0gJ3VzLWVhc3QtMSc7XG52YXIgcmVrb2duaXRpb24gPSBuZXcgQVdTLlJla29nbml0aW9uKCk7XG5cbk1ldGVvci5tZXRob2RzKHtcblx0XCJwcmludC5zYXZlXCIobmV3UHJpbnQpe1xuXHRcdGxldCBjb2wgPSBDb2xsZWN0aW9ucy5maW5kT25lKG5ld1ByaW50LmNvbGxlY3Rpb24pO1xuXHRcdGNvbnNvbGUubG9nKGNvbCk7XG5cdFx0aWYoIWNvbCl7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCduby1jb2xsZWN0aW9uJywnTm8gY29sbGVjdGlvbiBmb3VuZCB3aXRoIGdpdmVuIGlkIScpO1xuXHRcdH07XG5cdFx0bmV3UHJpbnQucHJpbnRfYWRkZXIgPSB0aGlzLnVzZXJJZCB8fCBudWxsO1xuXHRcdG5ld1ByaW50LnByaW50X2NvbGxlY3Rpb25faWQgPSBjb2wuX2lkIHx8IG51bGw7XG5cdFx0bmV3UHJpbnQucHJpbnRfbmFtZSA9IG5ld1ByaW50Lm5hbWUucmVwbGFjZSgvIC9nLFwiX19cIik7XG5cdFx0bmV3UHJpbnQucHJpbnRfaW1nID0gbmV3UHJpbnQuaW1nO1xuXHRcdC8vIGNvbnNvbGUubG9nKG5ld1ByaW50KTtcblx0XHRpZighbmV3UHJpbnQpe1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignaW52YWxpZC1wcmludCcsJ3N1Ym1pdHRlZCBwcmludCBpcyBpbnZhbGlkIScpO1xuXHRcdH07XG5cdFx0UHJpbnRzLnNpbXBsZVNjaGVtYSgpLmNsZWFuKG5ld1ByaW50KTtcbiAgICAgICAgLy8gaW5kZXggYSBmYWNlIGludG8gYSBjb2xsZWN0aW9uXG4gICAgICAgIGxldCBmYWNlUGFyYW1zID0ge1xuICAgICAgICAgIENvbGxlY3Rpb25JZDogY29sLmNvbGxlY3Rpb25faWQsXG4gICAgICAgICAgRXh0ZXJuYWxJbWFnZUlkOiBuZXdQcmludC5wcmludF9uYW1lLFxuXHRcdCAgSW1hZ2U6IHsgXG5cdFx0XHRcIkJ5dGVzXCI6IG5ldyBCdWZmZXIuZnJvbShuZXdQcmludC5wcmludF9pbWcuc3BsaXQoXCIsXCIpWzFdLCBcImJhc2U2NFwiKSxcblx0XHQgIH0sXG4gICAgICAgICAgRGV0ZWN0aW9uQXR0cmlidXRlczogW1wiQUxMXCJdXG4gICAgICAgIH07XG4gICAgICAgIGxldCBmYWNlUmVxdWVzdCA9IHJla29nbml0aW9uLmluZGV4RmFjZXMoZmFjZVBhcmFtcyk7XG4gICAgICAgIGxldCBwcm9taXNlID0gZmFjZVJlcXVlc3QucHJvbWlzZSgpO1xuICAgICAgICBsZXQgaW5kZXhGYWNlID0gcHJvbWlzZS50aGVuKHJlc3VsdCA9PiB7XG4gICAgICAgIFx0Ly8gY29uc29sZS5sb2cocmVzdWx0KTtcbiAgICAgICAgXHRuZXdQcmludC5wcmludF9pZCA9IHJlc3VsdC5GYWNlUmVjb3Jkc1swXS5GYWNlLkZhY2VJZDtcblx0XHRcdGxldCBwcmludCA9IFByaW50cy5pbnNlcnQobmV3UHJpbnQpO1xuICAgICAgICBcdGNvbnNvbGUubG9nKGBpbnNlcnRlZDogJHtwcmludH1gKTtcbiAgICAgICAgXHRyZXR1cm4gcmVzdWx0O1xuICAgICAgICB9KS5jYXRjaChlcnJvciA9PiB7XG4gICAgICAgIFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcihlcnJvci5jb2RlLCBlcnJvci5tZXNzYWdlLCBlcnJvcik7XG4gICAgICAgIFx0cmV0dXJuIGVycm9yO1xuICAgICAgICB9KTtcblx0XHRyZXR1cm4gaW5kZXhGYWNlO1xuXHR9LFxuXG5cdFwicHJpbnQuZGVsZXRlXCIocHJpbnRJZCl7XG5cdFx0Y2hlY2socHJpbnRJZCxTdHJpbmcpO1xuXHRcdGxldCBwcmludCA9IFByaW50cy5maW5kT25lKHByaW50SWQpO1xuXHRcdGNvbnNvbGUubG9nKHByaW50KTtcblx0XHRpZighcHJpbnQpe1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignbm8tcHJpbnQnLCdObyBwcmludCBmb3VuZCB3aXRoIGdpdmVuIGlkIScpO1xuXHRcdH1lbHNle1xuXHRcdFx0bGV0IHBhcmFtcyA9IHtcblx0XHRcdFx0Q29sbGVjdGlvbklkOiBwcmludC5wcmludF9jb2xsZWN0aW9uX2lkLCBcblx0XHRcdFx0RmFjZUlkczogW1xuXHRcdFx0XHRcdHByaW50LnByaW50X2lkXG5cdFx0XHRcdF1cblx0XHRcdH07XG5cdFx0XHRsZXQgcHJpbnRSZXF1ZXN0ID0gcmVrb2duaXRpb24uZGVsZXRlRmFjZXMocGFyYW1zKS5wcm9taXNlKCkuY2F0Y2goZXJyb3IgPT4geyB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKGVycm9yLmNvZGUsIGVycm9yLm1lc3NhZ2UsIGVycm9yKTsgcmV0dXJuIGVycm9yOyB9KTtcblx0XHRcdHByaW50UmVxdWVzdC50aGVuKHZhbHVlcyA9PiB7cmV0dXJuIHZhbHVlc30pO1xuXHRcdFx0bGV0IG9sZFByaW50ID0gUHJpbnRzLnJlbW92ZShwcmludC5faWQpO1xuXHRcdFx0aWYob2xkUHJpbnQpe1xuXHRcdFx0XHRjb25zb2xlLmxvZyhgZGVsZXRlZCBmYWNlOiAke3ByaW50SWR9YCk7XG5cdFx0XHR9ZWxzZXtcblx0ICAgICAgICAgICAgY29uc29sZS5sb2cocHJpbnRJZCk7XG5cdCAgICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ3JlbW92ZS1wcmludC1lcnJvcicsYGVycm9yIHJlbW92aW5nIHByaW50OiAke3ByaW50SWR9YClcdFx0XG5cdFx0XHR9O1xuXHRcdFx0cmV0dXJuIGByZW1vdmVkIHByaW50OiAke3ByaW50SWR9YDtcblx0XHQvLyBpZihwcmludElkKXtcblx0XHQvLyBcdGxldCBwcmludCA9IFByaW50cy5yZW1vdmUocHJpbnRJZCk7XG5cdFx0Ly8gXHRjb25zb2xlLmxvZyhgZGVsZXRlZCBmYWNlOiAke3ByaW50SWR9YCk7XG5cdFx0Ly8gXHRyZXR1cm4gYGRlbGV0ZWQgZmFjZTogJHtwcmludElkfWA7XG5cdFx0fTtcblx0fSxcbn0pXG5cbi8vIERlZmluZSBhIHJ1bGUgdG8gbGltaXQgbWV0aG9kIGNhbGxzXG4vLyBsZXQgcnVuU2NhblJ1bGUgPSB7XG4vLyBcdHR5cGU6ICdtZXRob2QnLFxuLy8gXHRuYW1lOiAncHJpbnQuc2F2ZSdcbi8vIH07XG4vLyBBZGQgdGhlIHJ1bGUsIGFsbG93aW5nIHVwIHRvIDEgc2NhbiBldmVyeSAxMCBzZWNvbmRzXG4vLyBERFBSYXRlTGltaXRlci5hZGRSdWxlKHJ1blNjYW5SdWxlLCAxLCAxMDAwMCk7IiwiaW1wb3J0IHsgTW9uZ28gfSBmcm9tICdtZXRlb3IvbW9uZ28nO1xuaW1wb3J0IHsgU2ltcGxlU2NoZW1hIH0gZnJvbSAnbWV0ZW9yL2FsZGVlZDpzaW1wbGUtc2NoZW1hJztcblxuXG5cbmV4cG9ydCBjb25zdCBQcmludHMgPSBuZXcgTWV0ZW9yLkNvbGxlY3Rpb24oJ3ByaW50cycpO1xuXG4vLyBEZW55IGFsbCBjbGllbnQtc2lkZSB1cGRhdGVzIHNpbmNlIHdlIHdpbGwgYmUgdXNpbmcgbWV0aG9kcyB0byBtYW5hZ2UgdGhpcyBjb2xsZWN0aW9uXG5QcmludHMuZGVueSh7XG4gIGluc2VydCgpIHsgcmV0dXJuIHRydWU7IH0sXG4gIHVwZGF0ZSgpIHsgcmV0dXJuIHRydWU7IH0sXG4gIHJlbW92ZSgpIHsgcmV0dXJuIHRydWU7IH0sXG59KTtcblxuUHJpbnRzLlNjaGVtYSA9IG5ldyBTaW1wbGVTY2hlbWEoe1xuICAvLyBPdXIgc2NoZW1hIHJ1bGVzIHdpbGwgZ28gaGVyZS5cbiAgXCJwcmludF9pZFwiOiB7XG4gICAgdHlwZTogU3RyaW5nLFxuICAgIGxhYmVsOiBcIlByaW50IElEXCIsXG4gICAgb3B0aW9uYWw6IGZhbHNlLFxuICAgIGRlZmF1bHRWYWx1ZTogXCJBQUFBLUJCQkItQ0NDQy0xMTExLTIyMjItMzMzM1wiLFxuICAgIGluZGV4OiB0cnVlLFxuICAgIHVuaXF1ZTogdHJ1ZVxuICB9LFxuICBcInByaW50X25hbWVcIjoge1xuICAgIHR5cGU6IFN0cmluZyxcbiAgICBsYWJlbDogXCJQcmludCBOYW1lXCIsXG4gICAgb3B0aW9uYWw6IGZhbHNlLFxuICAgIGRlZmF1bHRWYWx1ZTogXCJOZXcgUGVyc29uXCJcbiAgfSxcbiAgXCJwcmludF90eXBlXCI6IHtcbiAgICB0eXBlOiBTdHJpbmcsXG4gICAgbGFiZWw6IFwiUHJpbnQgdHlwZVwiLFxuICAgIG9wdGlvbmFsOiBmYWxzZSxcbiAgICBhbGxvd2VkVmFsdWVzOiBbXCJmYWNlXCIsIFwidm9pY2VcIiwgXCJmaW5nZXJcIl0sXG4gICAgZGVmYXVsdFZhbHVlOiBcImZhY2VcIlxuICB9LFxuICBcInByaW50X2NvbGxlY3Rpb25faWRcIjoge1xuICAgIHR5cGU6IFN0cmluZyxcbiAgICBsYWJlbDogXCJQcmludCBjb2xsZWN0aW9uIG1vbmdvIF9pZFwiLFxuICAgIG9wdGlvbmFsOiBmYWxzZSxcbiAgICBkZWZhdWx0VmFsdWU6IFwicGVvcGxlXCJcbiAgfSxcbiAgXCJwcmludF9pbWdcIjoge1xuICAgIHR5cGU6IFN0cmluZyxcbiAgICBsYWJlbDogXCJQcmludCBpbWdcIixcbiAgICBvcHRpb25hbDogdHJ1ZSxcbiAgICBkZWZhdWx0VmFsdWU6IFwiL2ltZy9mYWNlLWlkLTEwMC5wbmdcIlxuICB9LFxuICBcInByaW50X2RldGFpbHNcIjoge1xuICAgIHR5cGU6IE9iamVjdCxcbiAgICBsYWJlbDogXCJQcmludCBkZXRhaWxzXCIsXG4gICAgb3B0aW9uYWw6IHRydWUsXG4gICAgYmxhY2tib3g6IHRydWVcbiAgfSxcbiAgXCJwcmludF9hZGRlclwiOiB7XG4gICAgdHlwZTogU3RyaW5nLFxuICAgIGxhYmVsOiBcIlVzZXIgd2hvIGFkZGVkIHByaW50XCIsXG4gICAgb3B0aW9uYWw6IGZhbHNlXG4gIH0sXG4gIFwiY3JlYXRlZFwiOiB7XG4gICAgdHlwZTogRGF0ZSxcbiAgICBsYWJlbDogXCJEYXRlIHByaW50IGFkZGVkIHRvIEFudGVubmFlXCIsXG4gICAgYXV0b1ZhbHVlOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICggdGhpcy5pc0luc2VydCApIHtcbiAgICAgICAgcmV0dXJuIG5ldyBEYXRlO1xuICAgICAgfSBcbiAgICB9LFxuICAgIG9wdGlvbmFsOiB0cnVlXG4gIH0sXG4gIFwidXBkYXRlZFwiOiB7XG4gICAgdHlwZTogRGF0ZSxcbiAgICBsYWJlbDogXCJEYXRlIHByaW50IHVwZGF0ZWQgaW4gU3lzdGVtXCIsXG4gICAgYXV0b1ZhbHVlOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICggdGhpcy5pc1VwZGF0ZSApIHtcbiAgICAgICAgcmV0dXJuIG5ldyBEYXRlO1xuICAgICAgfSBcbiAgICB9LFxuICAgIG9wdGlvbmFsOiB0cnVlXG4gIH1cbn0pO1xuXG5QcmludHMuYXR0YWNoU2NoZW1hKCBQcmludHMuU2NoZW1hICk7IFxuXG5cblByaW50cy5wdWJsaWNGaWVsZHMgPSB7XG4gIHByaW50X2lkOiAxLFxuICBwcmludF9uYW1lOiAxLFxuICBwcmludF90eXBlOiAxLFxuICBwcmludF9jb2xsZWN0aW9uX2lkOiAxLFxuICBwcmludF9pbWc6IDEsXG4gIHByaW50X2RldGFpbHM6IDEsXG4gIHByaW50X2FkZGVyOiAxLFxuICBjcmVhdGVkOiAxLFxuICB1cGRhdGVkOiAxXG59O1xuXG4vLyBQcmludHMuaGVscGVycyh7XG4vLyAgIC8vIEEgY29sbGVjdGlvbnMgaXMgY29uc2lkZXJlZCB0byBiZSBwcml2YXRlIGlmIFwicHJpdmF0ZVwiIGlzIHNldCB0byB0cnVlXG4vLyAgIGlzUHJpdmF0ZSgpIHtcbi8vICAgICByZXR1cm4gdGhpcy5wcml2YXRlO1xuLy8gICB9XG4vLyB9KTsiLCJpbXBvcnQgeyBERFBSYXRlTGltaXRlciB9IGZyb20gJ21ldGVvci9kZHAtcmF0ZS1saW1pdGVyJztcblxuaW1wb3J0IHsgUHJpbnRzIH0gZnJvbSAnLi9wcmludHMuanMnO1xuXG5cbk1ldGVvci5wdWJsaXNoKCdwcmludHMuZ2V0JywgZnVuY3Rpb24oY29sbGVjdGlvbklkKSB7XG5cdGNvbGxlY3Rpb25JZCA9IGNvbGxlY3Rpb25JZCB8fCBcIlwiO1xuXHRjaGVjayhjb2xsZWN0aW9uSWQsU3RyaW5nKTtcblx0bGV0IHNlbGVjdG9yID0gY29sbGVjdGlvbklkID8ge3ByaW50X2NvbGxlY3Rpb25faWQ6IGNvbGxlY3Rpb25JZH0gOiB7fTtcbiAgXHRjb25zb2xlLmxvZyhzZWxlY3Rvcik7XG5cdHJldHVybiBQcmludHMuZmluZChcblx0XHRzZWxlY3RvciwgXG5cdCAgeyBcblx0ICBcdHNvcnQ6IHsgY3JlYXRlZDogLTEgfSBcblx0fVxuXHQsIHtcblx0XHRmaWVsZHM6IFByaW50cy5wdWJsaWNGaWVsZHNcblx0fSk7XG59KTtcblxuLy8gRGVmaW5lIGEgcnVsZSB0byBsaW1pdCBzdWJzY3JpcHRpb24gY2FsbHNcbnZhciBzdWJzY3JpYmVUb1ByaW50c1J1bGUgPSB7XG4gIHR5cGU6ICdzdWJzY3JpcHRpb24nLFxuICBuYW1lOiAncHJpbnRzLmdldCdcbn1cbi8vIEFkZCB0aGUgcnVsZSwgYWxsb3dpbmcgdXAgdG8gMSBzdWJzY3JpcHRpb24gZXZlcnkgNSBzZWNvbmRzLlxuRERQUmF0ZUxpbWl0ZXIuYWRkUnVsZShzdWJzY3JpYmVUb1ByaW50c1J1bGUsIDEsIDUwMDApOyIsImltcG9ydCB7IEREUFJhdGVMaW1pdGVyIH0gZnJvbSAnbWV0ZW9yL2RkcC1yYXRlLWxpbWl0ZXInO1xuaW1wb3J0IEFXUyBmcm9tICdhd3Mtc2RrJztcblxuaW1wb3J0IHsgQ29sbGVjdGlvbnMgfSBmcm9tICcuLi9jb2xsZWN0aW9ucy9jb2xsZWN0aW9ucy5qcyc7XG5pbXBvcnQgeyBQcmludHMgfSBmcm9tICcuLi8uLi9hcGkvcHJpbnRzL3ByaW50cy5qcyc7XG5pbXBvcnQgeyBTZWFyY2hlcyB9IGZyb20gJy4vc2VhcmNoZXMuanMnO1xuXG5BV1MuY29uZmlnLnJlZ2lvbiA9ICd1cy1lYXN0LTEnO1xudmFyIHJla29nbml0aW9uID0gbmV3IEFXUy5SZWtvZ25pdGlvbigpO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdFwiZ2V0RGFzaGJvYXJkU3RhdHNcIigpe1xuXHRcdGxldCBkYXNoYm9hcmRTdGF0cyA9IHt9O1xuXHRcdGRhc2hib2FyZFN0YXRzLmNvbGxlY3Rpb25zID0gQ29sbGVjdGlvbnMuZmluZCh7fSkuY291bnQoKTtcblx0XHRkYXNoYm9hcmRTdGF0cy5mYWNlcyA9IFByaW50cy5maW5kKCkuY291bnQoKTtcblx0XHQvLyBkYXNoYm9hcmRTdGF0cy5mYWNlcyA9IENvbGxlY3Rpb25zLmFnZ3JlZ2F0ZShcblx0XHQvLyBcdCAgIFtcblx0XHQvLyBcdCAgICAge1xuXHRcdC8vIFx0ICAgICAgICRncm91cDpcblx0XHQvLyBcdFx0XHR7XG5cdFx0Ly8gXHRcdFx0XHRfaWQ6IFwiJGNvbGxlY3Rpb25faWRcIixcblx0XHQvLyBcdFx0XHRcdC8vIGZhY2VfY291bnQ6IHsgJHN1bTogXCIkcHJpbnRfY291bnRcIiB9LFxuXHRcdC8vIFx0XHRcdFx0Y291bnQ6IHsgJHN1bTogMSB9XG5cdFx0Ly8gXHRcdFx0fVxuXHRcdC8vIFx0ICAgICB9LFxuXHRcdC8vIFx0ICAgICB7XG5cdFx0Ly8gXHQgICAgIFx0JHByb2plY3Q6XG5cdFx0Ly8gXHQgICAgIFx0e1xuXHRcdC8vIFx0ICAgICBcdFx0X2lkOiAxLFxuXHRcdC8vIFx0ICAgICBcdFx0Y291bnQ6IDFcblx0XHQvLyBcdCAgICAgXHR9XG5cdFx0Ly8gXHQgICAgIH1cblx0XHQvLyBcdCAgIF1cblx0XHQvLyBcdCk7XG5cdFx0ZGFzaGJvYXJkU3RhdHMuc2VhcmNoZXMgPSBTZWFyY2hlcy5maW5kKHt9KS5jb3VudCgpO1xuXHRcdGRhc2hib2FyZFN0YXRzLm1hdGNoZXMgPSBTZWFyY2hlcy5maW5kKHsnc2VhcmNoX3Jlc3VsdHMucGVyc29ucyc6IHskbmU6IFtdfX0pLmNvdW50KCk7XG5cdFx0ZGFzaGJvYXJkU3RhdHMubWF0Y2hQZXJjZW50ID0gKE1hdGgucm91bmQoKGRhc2hib2FyZFN0YXRzLm1hdGNoZXMgLyBkYXNoYm9hcmRTdGF0cy5zZWFyY2hlcyAqIDEwMCkgKiAxMCkgLyAxMCkgfHwgMDtcblx0XHRjb25zb2xlLmxvZyhkYXNoYm9hcmRTdGF0cy5mYWNlcyk7XG5cdFx0cmV0dXJuIGRhc2hib2FyZFN0YXRzO1xuXHR9LFxuXG5cdFwic2VhcmNoLmZhY2VcIihzZWFyY2hEYXRhKXtcblx0XHQvL3JldHVybiAxO1xuXHRcdC8vIGlmKCFNZXRlb3IudXNlcil7XG5cdFx0Ly8gXHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdub3QtbG9nZ2VkLWluJywnbXVzdCBiZSBsb2dnZWQtaW4gdG8gcGVyZm9ybSBzZWFyY2gnKTtcblx0XHQvLyBcdHJldHVybiBmYWxzZTtcblx0XHQvLyB9XG5cdFx0Ly8gbGV0IG1hdGNoVGhyZXNob2xkID0gbWF0Y2hUaHJlc2hvbGQ7XG5cdFx0Y2hlY2soc2VhcmNoRGF0YS5tYXRjaFRocmVzaG9sZCwgTnVtYmVyKTtcblx0XHRjb25zb2xlLmxvZyhcIkFOQUxZWklORyBJTUFHRS4uLlwiKTtcblx0XHR2YXIgdDAgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcblx0XHRsZXQgaW1nQnl0ZXMgPSBuZXcgQnVmZmVyLmZyb20oc2VhcmNoRGF0YS5pbWcuc3BsaXQoXCIsXCIpWzFdLCBcImJhc2U2NFwiKTtcblx0XHQvLyBsZXQgY29sSWQgPSBNZXRlb3IudXNlcigpLnByb2ZpbGUuY29sbGVjdGlvbnM7XG5cdFx0bGV0IGNvbElkcyA9IENvbGxlY3Rpb25zLmZpbmQoe2NvbGxlY3Rpb25fdHlwZTogJ2ZhY2UnfSwge2ZpZWxkczoge2NvbGxlY3Rpb25faWQ6IDF9fSkuZmV0Y2goKTtcblx0XHRjb25zb2xlLmxvZyhjb2xJZHMpXG5cdFx0bGV0IG1vZGVyYXRpb25QYXJhbXMgPSB7XG5cdFx0XHRcIkltYWdlXCI6IHsgXG5cdFx0XHRcdFwiQnl0ZXNcIjogaW1nQnl0ZXMsXG5cdFx0XHR9LFxuXHRcdFx0XCJNaW5Db25maWRlbmNlXCI6IDUwLFxuXHRcdH07XG5cdFx0bGV0IGxhYmVsUGFyYW1zID0ge1xuXHRcdFx0XCJJbWFnZVwiOiB7IFxuXHRcdFx0XHRcIkJ5dGVzXCI6IGltZ0J5dGVzLFxuXHRcdFx0fSxcblx0XHRcdFwiTWF4TGFiZWxzXCI6IDIwLFxuXHRcdFx0XCJNaW5Db25maWRlbmNlXCI6IDc1LFxuXHRcdH07XG5cdFx0bGV0IGZhY2VQYXJhbXMgPSB7XG5cdFx0XHRcIkltYWdlXCI6IHsgXG5cdFx0XHRcdFwiQnl0ZXNcIjogaW1nQnl0ZXMsXG5cdFx0XHR9LFxuICBcdFx0XHRcIkF0dHJpYnV0ZXNcIjogW1wiQUxMXCJdLFxuXHRcdH07XG5cdFx0bGV0IGNlbGVicml0eVBhcmFtcyA9IHtcblx0XHRcdFwiSW1hZ2VcIjogeyBcblx0XHRcdFx0XCJCeXRlc1wiOiBpbWdCeXRlcyxcblx0XHRcdH0sXG5cdFx0fTtcblx0XHQvLyBjcmVhdGUgcmVxdWVzdCBvYmplY3RzXG5cdFx0bGV0IG1vZGVyYXRpb25SZXF1ZXN0ID0gcmVrb2duaXRpb24uZGV0ZWN0TW9kZXJhdGlvbkxhYmVscyhtb2RlcmF0aW9uUGFyYW1zKTtcblx0XHRsZXQgbGFiZWxSZXF1ZXN0ID0gcmVrb2duaXRpb24uZGV0ZWN0TGFiZWxzKGxhYmVsUGFyYW1zKTtcblx0XHRsZXQgZmFjZVJlcXVlc3QgPSByZWtvZ25pdGlvbi5kZXRlY3RGYWNlcyhmYWNlUGFyYW1zKTtcblx0XHRsZXQgY2VsZWJyaXR5UmVxdWVzdCA9IHJla29nbml0aW9uLnJlY29nbml6ZUNlbGVicml0aWVzKGNlbGVicml0eVBhcmFtcyk7XG5cdFx0Ly8gY3JlYXRlIHByb21pc2VzXG5cdFx0bGV0IGFsbFByb21pc2VzID0gW107XG5cdFx0YWxsUHJvbWlzZXMucHVzaChtb2RlcmF0aW9uUmVxdWVzdC5wcm9taXNlKCkuY2F0Y2goZXJyb3IgPT4geyB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKGVycm9yLmNvZGUsIGVycm9yLm1lc3NhZ2UsIGVycm9yKTsgcmV0dXJuIGVycm9yOyB9KSk7XG5cdFx0YWxsUHJvbWlzZXMucHVzaChsYWJlbFJlcXVlc3QucHJvbWlzZSgpLmNhdGNoKGVycm9yID0+IHsgdGhyb3cgbmV3IE1ldGVvci5FcnJvcihlcnJvci5jb2RlLCBlcnJvci5tZXNzYWdlLCBlcnJvcik7IHJldHVybiBlcnJvcjsgfSkpO1xuXHRcdGFsbFByb21pc2VzLnB1c2goZmFjZVJlcXVlc3QucHJvbWlzZSgpLmNhdGNoKGVycm9yID0+IHsgdGhyb3cgbmV3IE1ldGVvci5FcnJvcihlcnJvci5jb2RlLCBlcnJvci5tZXNzYWdlLCBlcnJvcik7IHJldHVybiBlcnJvcjsgfSkpO1xuXHRcdGFsbFByb21pc2VzLnB1c2goY2VsZWJyaXR5UmVxdWVzdC5wcm9taXNlKCkuY2F0Y2goZXJyb3IgPT4geyB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKGVycm9yLmNvZGUsIGVycm9yLm1lc3NhZ2UsIGVycm9yKTsgcmV0dXJuIGVycm9yOyB9KSk7XG5cdFx0Xy5lYWNoKGNvbElkcywgKGNvbElkKSA9PiB7XG5cdFx0XHRsZXQgcmVrb2duaXRpb25QYXJhbXMgPSB7XG5cdFx0XHRcdFwiQ29sbGVjdGlvbklkXCI6IGNvbElkLmNvbGxlY3Rpb25faWQsXG5cdFx0XHRcdFwiRmFjZU1hdGNoVGhyZXNob2xkXCI6IHNlYXJjaERhdGEubWF0Y2hUaHJlc2hvbGQsXG5cdFx0XHRcdFwiTWF4RmFjZXNcIjogMixcblx0XHRcdFx0XCJJbWFnZVwiOiB7IFxuXHRcdFx0XHRcdFwiQnl0ZXNcIjogaW1nQnl0ZXMsXG5cdFx0XHRcdH0sXG5cdFx0XHR9O1xuXHRcdFx0Y29uc29sZS5sb2cocmVrb2duaXRpb25QYXJhbXMpO1xuXHRcdFx0bGV0IHJla29nbml0aW9uUmVxdWVzdCA9IHJla29nbml0aW9uLnNlYXJjaEZhY2VzQnlJbWFnZShyZWtvZ25pdGlvblBhcmFtcyk7XG5cdFx0XHRhbGxQcm9taXNlcy5wdXNoKHJla29nbml0aW9uUmVxdWVzdC5wcm9taXNlKCkuY2F0Y2goZXJyb3IgPT4geyB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKGVycm9yLmNvZGUsIGVycm9yLm1lc3NhZ2UsIGVycm9yKTsgcmV0dXJuIGVycm9yOyB9KSk7XG5cdFx0XHRjb25zb2xlLmxvZyhjb2xJZC5jb2xsZWN0aW9uX2lkKTtcblx0XHR9KTsvLyByZWtvZ25pdGlvblJlcXVlc3QucHJvbWlzZSgpO1xuXHRcdC8vIEZ1bGZpbGwgcHJvbWlzZXMgaW4gcGFyYWxsZWxcblx0XHRsZXQgcmVzcG9uc2UgPSBQcm9taXNlLmFsbChcblx0XHRcdGFsbFByb21pc2VzXG5cdFx0KS50aGVuKHZhbHVlcyA9PiB7XG5cdFx0XHRjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeSh2YWx1ZXMpKTtcblx0XHRcdGNvbnNvbGUubG9nKHZhbHVlc1swXSk7XG5cdFx0XHRjb25zb2xlLmxvZyh2YWx1ZXNbMV0pO1xuXHRcdFx0Y29uc29sZS5sb2codmFsdWVzWzJdKTtcblx0XHRcdGNvbnNvbGUubG9nKHZhbHVlc1szXSk7XG5cdFx0XHQvL2NvbnNvbGUubG9nKHZhbHVlc1s0XSk7XG5cdFx0XHRsZXQgaSA9IDQ7XG5cdFx0XHRsZXQgcGVyc29ucyA9IFtdO1xuXHRcdFx0d2hpbGUodmFsdWVzW2ldKXtcblx0XHRcdFx0Y29uc29sZS5sb2codmFsdWVzW2ldKTtcblx0XHRcdFx0aWYgKHZhbHVlc1tpXS5GYWNlTWF0Y2hlc1swXSl7XG5cdFx0XHRcdFx0bGV0IGNvbElkID0gUHJpbnRzLmZpbmRPbmUoe3ByaW50X2lkOiB2YWx1ZXNbaV0uRmFjZU1hdGNoZXNbMF0uRmFjZS5GYWNlSWR9LCB7ZmllbGRzOiB7cHJpbnRfY29sbGVjdGlvbl9pZDogMX19KS5wcmludF9jb2xsZWN0aW9uX2lkO1xuXHRcdFx0XHRcdGxldCB0YWcgPSB7XG5cdFx0XHRcdFx0XHRjb2xsZWN0aW9uOiBDb2xsZWN0aW9ucy5maW5kT25lKGNvbElkLCB7ZmllbGRzOiB7Y29sbGVjdGlvbl9uYW1lOiAxfX0pLmNvbGxlY3Rpb25fbmFtZSxcblx0XHRcdFx0XHRcdGltYWdlX2lkOiB2YWx1ZXNbaV0uRmFjZU1hdGNoZXNbMF0uRmFjZS5FeHRlcm5hbEltYWdlSWQucmVwbGFjZSgvX18vZyxcIiBcIiksXG5cdFx0XHRcdFx0XHRmYWNlX2lkOiB2YWx1ZXNbaV0uRmFjZU1hdGNoZXNbMF0uRmFjZS5GYWNlSWQsXG5cdFx0XHRcdFx0XHRzaW1pbGFyaXR5OiB2YWx1ZXNbaV0uRmFjZU1hdGNoZXNbMF0uU2ltaWxhcml0eSxcblx0XHRcdFx0XHR9O1xuXHRcdFx0XHRcdHBlcnNvbnMucHVzaCh0YWcpO1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKHRhZyk7XG5cdFx0XHRcdH07XG5cdFx0XHRcdGkrKztcblx0XHRcdH07XG5cdFx0XHRsZXQgdDEgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcblx0XHRcdGNvbnNvbGUubG9nKGBSZXNwb25zZSB0b29rICR7dDEgLSB0MH0gbXNgKTtcblx0XHRcdGxldCBzZWFyY2hfcmVzdWx0cyA9IHtcblx0XHRcdFx0XHRtb2RlcmF0aW9uOiB2YWx1ZXNbMF0uTW9kZXJhdGlvbkxhYmVscyxcblx0XHRcdFx0XHRsYWJlbHM6IHZhbHVlc1sxXS5MYWJlbHMsXG5cdFx0XHRcdFx0ZmFjZURldGFpbHM6IHZhbHVlc1syXS5GYWNlRGV0YWlscyxcblx0XHRcdFx0XHRjZWxlYnJpdHk6IHZhbHVlc1szXS5DZWxlYnJpdHlGYWNlcyxcblx0XHRcdFx0XHRwZXJzb25zOiBwZXJzb25zLCAvLy5GYWNlTWF0Y2hlc1swXSxcblx0XHRcdH07XG5cdFx0XHRsZXQgc2VhcmNoID0ge1xuXHRcdFx0XHRcdC8vIHNlYXJjaF9pbWFnZTogc2VhcmNoRGF0YS5pbWcsXG5cdFx0XHRcdFx0c3RhdGlvbl9uYW1lOiBzZWFyY2hEYXRhLnN0YXRpb25OYW1lLFxuXHRcdFx0XHRcdHNlYXJjaF9yZXN1bHRzOiBzZWFyY2hfcmVzdWx0c1xuXHRcdFx0fTtcblx0XHRcdGxldCBzYXZlU2VhcmNoID0gU2VhcmNoZXMuaW5zZXJ0KHNlYXJjaCk7XG5cdFx0XHRjb25zb2xlLmxvZyhzYXZlU2VhcmNoKTtcblx0XHRcdHJldHVybiBzZWFyY2hfcmVzdWx0cztcblx0XHR9KS5jYXRjaChlcnJvciA9PiB7XG5cdFx0XHRjb25zb2xlLmxvZygnY2F1Z2h0IGVycm9yIScpO1xuXHRcdFx0Y29uc29sZS5sb2coZXJyb3IpO1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcihlcnJvci5lcnJvciwgZXJyb3IucmVhc29uLCBlcnJvci5kZXRhaWxzKTtcblx0XHR9KS5maW5hbGx5KCgpID0+IHtcblx0XHRcdGNvbnNvbGUubG9nKCdmaW5hbGx5Jyk7XG5cdFx0XHRjb25zb2xlLmxvZyh0aGlzKTtcblx0XHR9KTtcblx0XHRjb25zb2xlLmxvZyhyZXNwb25zZSk7XG5cdFx0bGV0IHQxID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG5cdFx0Y29uc29sZS5sb2coYFJlcXVlc3QgdG9vayAke3QxIC0gdDB9IG1zYCk7XG5cdFx0cmV0dXJuIHJlc3BvbnNlO1xuXHR9LFxuXG5cdFwic2VhcmNoLmRlbGV0ZVwiKHNlYXJjaElkKXtcblx0XHRjaGVjayhzZWFyY2hJZCxTdHJpbmcpO1xuXHRcdGlmKHNlYXJjaElkKXtcblx0XHRcdGxldCBzZWFyY2ggPSBTZWFyY2hlcy5yZW1vdmUoc2VhcmNoSWQpO1xuXHRcdFx0Y29uc29sZS5sb2coYGRlbGV0ZWQgc2VhcmNoOiAke3NlYXJjaElkfWApO1xuXHRcdFx0cmV0dXJuIGBkZWxldGVkIHNlYXJjaDogJHtzZWFyY2hJZH1gO1xuXHRcdH07XG5cdH1cbn0pXG5cbi8vIERlZmluZSBhIHJ1bGUgdG8gbGltaXQgbWV0aG9kIGNhbGxzXG5sZXQgcnVuU2NhblJ1bGUgPSB7XG5cdHR5cGU6ICdtZXRob2QnLFxuXHRuYW1lOiAnbW9tZW50LnNjYW4nXG59O1xuLy8gQWRkIHRoZSBydWxlLCBhbGxvd2luZyB1cCB0byAxIHNjYW4gZXZlcnkgMTAgc2Vjb25kc1xuRERQUmF0ZUxpbWl0ZXIuYWRkUnVsZShydW5TY2FuUnVsZSwgMSwgMTAwMDApOyIsImltcG9ydCB7IEREUFJhdGVMaW1pdGVyIH0gZnJvbSAnbWV0ZW9yL2RkcC1yYXRlLWxpbWl0ZXInO1xuXG5pbXBvcnQgeyBTZWFyY2hlcyB9IGZyb20gJy4vc2VhcmNoZXMuanMnO1xuXG5cbk1ldGVvci5wdWJsaXNoKCdzZWFyY2hlcy5nZXQnLCBmdW5jdGlvbihzZWFyY2hJZD0nJykge1xuXHRjaGVjayhzZWFyY2hJZCxTdHJpbmcpO1xuXHRzZWFyY2hJZCA9IHNlYXJjaElkIHx8IHt9O1xuICBcdC8vIGNvbnNvbGUubG9nKFNlYXJjaGVzLmZpbmQoc2VhcmNoSWQpLmNvdW50KCkpO1xuXHRyZXR1cm4gU2VhcmNoZXMuZmluZChcblx0XHRzZWFyY2hJZCwgXG5cdCAgeyBcblx0ICBcdHNvcnQ6IHsgY3JlYXRlZDogLTEgfSBcblx0fVxuXHQsIHtcblx0XHRmaWVsZHM6IFNlYXJjaGVzLnB1YmxpY0ZpZWxkc1xuXHR9KTtcbn0pO1xuXG4vLyBEZWZpbmUgYSBydWxlIHRvIGxpbWl0IHN1YnNjcmlwdGlvbiBjYWxsc1xudmFyIHN1YnNjcmliZVRvU2VhcmNoZXNSdWxlID0ge1xuICB0eXBlOiAnc3Vic2NyaXB0aW9uJyxcbiAgbmFtZTogJ3NlYXJjaGVzLmdldCdcbn1cbi8vIEFkZCB0aGUgcnVsZSwgYWxsb3dpbmcgdXAgdG8gMSBzdWJzY3JpcHRpb24gZXZlcnkgNSBzZWNvbmRzLlxuRERQUmF0ZUxpbWl0ZXIuYWRkUnVsZShzdWJzY3JpYmVUb1NlYXJjaGVzUnVsZSwgMSwgNTAwMCk7IiwiaW1wb3J0IHsgTW9uZ28gfSBmcm9tICdtZXRlb3IvbW9uZ28nO1xuaW1wb3J0IHsgU2ltcGxlU2NoZW1hIH0gZnJvbSAnbWV0ZW9yL2FsZGVlZDpzaW1wbGUtc2NoZW1hJztcblxuXG5cbmV4cG9ydCBjb25zdCBTZWFyY2hlcyA9IG5ldyBNZXRlb3IuQ29sbGVjdGlvbignc2VhcmNoZXMnKTtcblxuLy8gRGVueSBhbGwgY2xpZW50LXNpZGUgdXBkYXRlcyBzaW5jZSB3ZSB3aWxsIGJlIHVzaW5nIG1ldGhvZHMgdG8gbWFuYWdlIHRoaXMgY29sbGVjdGlvblxuU2VhcmNoZXMuZGVueSh7XG4gIGluc2VydCgpIHsgcmV0dXJuIHRydWU7IH0sXG4gIHVwZGF0ZSgpIHsgcmV0dXJuIHRydWU7IH0sXG4gIHJlbW92ZSgpIHsgcmV0dXJuIHRydWU7IH0sXG59KTtcblxuU2VhcmNoZXMuU2NoZW1hID0gbmV3IFNpbXBsZVNjaGVtYSh7XG4gIFwic3RhdGlvbl9uYW1lXCI6IHtcbiAgICB0eXBlOiBTdHJpbmcsXG4gICAgbGFiZWw6IFwiU3RhdGlvbiBzZWFyY2ggcGVyZm9ybWVkIGF0XCIsXG4gICAgb3B0aW9uYWw6IHRydWUsXG4gICAgZGVmYXVsdFZhbHVlOiBcIlN0YXRpb24gMVwiXG4gIH0sXG4gIC8vIHNjaGVtYSBydWxlc1xuICBcInNlYXJjaF90eXBlXCI6IHtcbiAgICB0eXBlOiBbU3RyaW5nXSxcbiAgICBsYWJlbDogXCJTZWFyY2ggdHlwZXNcIixcbiAgICBvcHRpb25hbDogZmFsc2UsXG4gICAgYWxsb3dlZFZhbHVlczogW1wibW9kZXJhdGlvblwiLCBcImxhYmVsXCIsIFwiZmFjZVwiLCBcImNvbGxlY3Rpb25cIl0sXG4gICAgZGVmYXVsdFZhbHVlOiBbXCJtb2RlcmF0aW9uXCIsIFwibGFiZWxcIiwgXCJmYWNlXCJdXG4gIH0sXG4gIFwic2VhcmNoX2NvbGxlY3Rpb25zXCI6IHtcbiAgICB0eXBlOiBbU3RyaW5nXSxcbiAgICBsYWJlbDogXCJDb2xsZWN0aW9ucyB0byBzZWFyY2hcIixcbiAgICBvcHRpb25hbDogdHJ1ZSxcbiAgICBkZWZhdWx0VmFsdWU6IFtcIlwiXVxuICB9LFxuICBcInNlYXJjaF9pbWFnZVwiOiB7XG4gICAgdHlwZTogU3RyaW5nLFxuICAgIGxhYmVsOiBcIkltYWdlIHRvIHNlYXJjaFwiLFxuICAgIG9wdGlvbmFsOiB0cnVlLFxuICAgIGRlZmF1bHRWYWx1ZTogXCIvaW1nL2ZhY2UtaWQtMTAwLnBuZ1wiXG4gIH0sXG4gIFwic2VhcmNoX3Jlc3VsdHNcIjoge1xuICAgIHR5cGU6IE9iamVjdCxcbiAgICBsYWJlbDogXCJPYmplY3Qgb2Ygc2VhcmNoIHR5cGVzXCIsXG4gICAgb3B0aW9uYWw6IHRydWUsXG4gICAgYmxhY2tib3g6IHRydWUsXG4gICAgZGVmYXVsdFZhbHVlOiB7fVxuICB9LFxuICBcImZhY2VzXCI6IHtcbiAgICB0eXBlOiBbT2JqZWN0XSxcbiAgICBsYWJlbDogXCJGYWNlIG9iamVjdHMgZm91bmQgaW4gaW1hZ2VcIixcbiAgICBvcHRpb25hbDogdHJ1ZSxcbiAgICBibGFja2JveDogdHJ1ZSxcbiAgICBkZWZhdWx0VmFsdWU6IFtdXG4gIH0sXG4gIFwiY3JlYXRlZFwiOiB7XG4gICAgdHlwZTogRGF0ZSxcbiAgICBsYWJlbDogXCJEYXRlIHNlYXJjaCBwZXJmb3JtZWRcIixcbiAgICBhdXRvVmFsdWU6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCB0aGlzLmlzSW5zZXJ0ICkge1xuICAgICAgICByZXR1cm4gbmV3IERhdGU7XG4gICAgICB9IFxuICAgIH0sXG4gICAgb3B0aW9uYWw6IHRydWUsXG4gICAgLy9pbmRleDogdHJ1ZVxuICB9LFxuICBcInVwZGF0ZWRcIjoge1xuICAgIHR5cGU6IERhdGUsXG4gICAgbGFiZWw6IFwiRGF0ZSBzZWFyY2ggdXBkYXRlZFwiLFxuICAgIGF1dG9WYWx1ZTogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoIHRoaXMuaXNVcGRhdGUgKSB7XG4gICAgICAgIHJldHVybiBuZXcgRGF0ZTtcbiAgICAgIH0gXG4gICAgfSxcbiAgICBvcHRpb25hbDogdHJ1ZVxuICB9XG59KTtcblxuU2VhcmNoZXMuYXR0YWNoU2NoZW1hKCBTZWFyY2hlcy5TY2hlbWEgKTtcblxuaWYoTWV0ZW9yLmlzU2VydmVyKXtcbiAgTWV0ZW9yLnN0YXJ0dXAoKCkgPT4ge1xuICAgIFNlYXJjaGVzLl9lbnN1cmVJbmRleCh7XG4gICAgICAgIGNyZWF0ZWQ6IC0xLFxuICAgIH0pO1xuICAgIC8vIFNlYXJjaGVzLl9lbnN1cmVJbmRleCh7IHNlYXJjaF9pbWFnZTogMX0pO1xuICB9KTtcbn1cblxuU2VhcmNoZXMucHVibGljRmllbGRzID0ge1xuICBzdGF0aW9uX25hbWU6IDEsXG4gIHNlYXJjaF90eXBlOiAxLFxuICBzZWFyY2hfY29sbGVjdGlvbnM6IDEsXG4gIHNlYXJjaF9pbWFnZTogMSxcbiAgc2VhcmNoX3Jlc3VsdHM6IDEsXG4gIGNyZWF0ZWQ6IDEsXG4gIHVwZGF0ZWQ6IDFcbn07XG5cbi8vIFNlYXJjaGVzLmhlbHBlcnMoe1xuLy8gICAvLyBBIGNvbGxlY3Rpb25zIGlzIGNvbnNpZGVyZWQgdG8gYmUgcHJpdmF0ZSBpZiBcInByaXZhdGVcIiBpcyBzZXQgdG8gdHJ1ZVxuLy8gICBpc1ByaXZhdGUoKSB7XG4vLyAgICAgcmV0dXJuIHRoaXMucHJpdmF0ZTtcbi8vICAgfVxuLy8gfSk7IiwiaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5pbXBvcnQgeyBDb2xsZWN0aW9ucyB9IGZyb20gJy4uLy4uL2FwaS9jb2xsZWN0aW9ucy9jb2xsZWN0aW9ucy5qcyc7XG5pbXBvcnQgeyBQcmludHMgfSBmcm9tICcuLi8uLi9hcGkvcHJpbnRzL3ByaW50cy5qcyc7XG5pbXBvcnQgeyBTZWFyY2hlcyB9IGZyb20gJy4uLy4uL2FwaS9zZWFyY2hlcy9zZWFyY2hlcy5qcyc7XG5pbXBvcnQgQVdTIGZyb20gJ2F3cy1zZGsnO1xuXG5BV1MuY29uZmlnLnJlZ2lvbiA9ICd1cy1lYXN0LTEnO1xudmFyIHJla29nbml0aW9uID0gbmV3IEFXUy5SZWtvZ25pdGlvbigpO1xuXG4vLyBpZiB0aGUgZGF0YWJhc2UgaXMgZW1wdHkgb24gc2VydmVyIHN0YXJ0LCBjcmVhdGUgc29tZSBzYW1wbGUgZGF0YS5cblxuTWV0ZW9yLnN0YXJ0dXAoKCkgPT4ge1xuXG4gIGNvbnNvbGUubG9nKFwic3luY2luZyBhd3MgY29sbGVjdGlvbnMuLi5cIik7XG4gIGxldCBjb2xQYXJhbXMgPSB7fTtcbiAgbGV0IGNvbFJlcXVlc3QgPSByZWtvZ25pdGlvbi5saXN0Q29sbGVjdGlvbnMoKTtcbiAgbGV0IHByb21pc2UgPSBjb2xSZXF1ZXN0LnByb21pc2UoKTtcbi8vIGNvbFBhcmFtcyA9IHtcbi8vICAgICAgICAgICAgXCJDb2xsZWN0aW9uSWRcIjogXCJtYWNpZXNcIlxuLy8gICAgICAgICB9O1xuLy8gICBsZXQgdGVzdCA9ICAgICAgcmVrb2duaXRpb24uZGVzY3JpYmVDb2xsZWN0aW9uKGNvbFBhcmFtcykucHJvbWlzZSgpLmNhdGNoKGVycm9yID0+IHsgdGhyb3cgbmV3IE1ldGVvci5FcnJvcihlcnJvci5jb2RlLCBlcnJvci5tZXNzYWdlLCBlcnJvcik7IHJldHVybiBlcnJvcjsgfSkudGhlbihyZXN1bHQgPT4ge1xuLy8gICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3VsdCk7XG4vLyAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbi8vICAgICAgICAgfSk7XG4vLyAgICAgY29uc29sZS5sb2codGVzdCk7XG4gIGxldCBjb2xzID0gcHJvbWlzZS50aGVuKHJlc3VsdCA9PiB7XG4gICAgY29uc29sZS5sb2cocmVzdWx0KTtcbiAgICBpZihyZXN1bHQgJiYgcmVzdWx0LkNvbGxlY3Rpb25JZHMubGVuZ3RoID4gMCl7XG4gICAgICBfLmVhY2gocmVzdWx0LkNvbGxlY3Rpb25JZHMsIGZ1bmN0aW9uKGNvbElkKXtcbiAgICAgICAgbGV0IGF3c0NvbCA9IHtcbiAgICAgICAgICBjb2xsZWN0aW9uX2lkOiBjb2xJZCxcbiAgICAgICAgICBjb2xsZWN0aW9uX25hbWU6IGNvbElkLnJlcGxhY2UoXCJfX1wiLCBcIiBcIiksXG4gICAgICAgICAgY29sbGVjdGlvbl90eXBlOiBcImZhY2VcIlxuICAgICAgICB9O1xuICAgICAgICAvLyBkZXNjcmliZSBjb2xsZWN0aW9uIHRvIGdldCBmYWNlIGNvdW50XG4gICAgICAgIGNvbFBhcmFtcyA9IHtcbiAgICAgICAgICAgXCJDb2xsZWN0aW9uSWRcIjogY29sSWRcbiAgICAgICAgfTtcbiAgICAgICAgcmVrb2duaXRpb24uZGVzY3JpYmVDb2xsZWN0aW9uKGNvbFBhcmFtcykucHJvbWlzZSgpLmNhdGNoKGVycm9yID0+IHsgdGhyb3cgbmV3IE1ldGVvci5FcnJvcihlcnJvci5jb2RlLCBlcnJvci5tZXNzYWdlLCBlcnJvcik7IHJldHVybiBlcnJvcjsgfSkudGhlbihyZXN1bHQgPT4ge1xuICAgICAgICAgIGF3c0NvbC5wcmludF9jb3VudCA9IHJlc3VsdC5GYWNlQ291bnQ7XG4gICAgICAgICAgY29uc29sZS5sb2coYCR7Y29sSWR9IGNvbGxlY3Rpb24gaGFzICR7cmVzdWx0LkZhY2VDb3VudH0gZmFjZXNgKTtcbiAgICAgICAgICBjb25zb2xlLmxvZyhhd3NDb2wpO1xuICAgICAgICAgIGxldCBleGlzdGluZ0NvbCA9IENvbGxlY3Rpb25zLnVwc2VydCh7Y29sbGVjdGlvbl9pZDogY29sSWR9LCB7JHNldDogYXdzQ29sfSk7XG4gICAgICAgICAgY29uc29sZS5sb2coYHVwc2VydGVkIGNvbGxlY3Rpb246ICR7SlNPTi5zdHJpbmdpZnkoZXhpc3RpbmdDb2wpfWApO1xuICAgICAgICB9KTtcbiAgICAgICAgLy8gTm93IHRyeSBnZXR0aW5nIGV4aXN0aW5nIGZhY2VzIGZvciBlYWNoIGNvbGxlY3Rpb25cbiAgICAgICAgbGV0IGZhY2VQYXJhbXMgPSB7XG4gICAgICAgICAgQ29sbGVjdGlvbklkOiBjb2xJZFxuICAgICAgICB9O1xuICAgICAgICBsZXQgZmFjZVJlcXVlc3QgPSByZWtvZ25pdGlvbi5saXN0RmFjZXMoZmFjZVBhcmFtcyk7XG4gICAgICAgIGxldCBwcm9taXNlID0gZmFjZVJlcXVlc3QucHJvbWlzZSgpO1xuICAgICAgICBsZXQgZmFjZXMgPSBwcm9taXNlLnRoZW4ocmVzdWx0ID0+IHtcbiAgICAgICAgICBpZihyZXN1bHQgJiYgcmVzdWx0LkZhY2VzLmxlbmd0aCA+IDApe1xuICAgICAgICAgICAgbGV0IGNvbGxlY3Rpb25faWQgPSBDb2xsZWN0aW9ucy5maW5kT25lKHtjb2xsZWN0aW9uX2lkOiBjb2xJZH0pLl9pZDtcbiAgICAgICAgICAgIF8uZWFjaChyZXN1bHQuRmFjZXMsIGZ1bmN0aW9uKGZhY2Upe1xuICAgICAgICAgICAgICBsZXQgYXdzRmFjZSA9IHtcbiAgICAgICAgICAgICAgICBwcmludF9pZDogZmFjZS5GYWNlSWQsXG4gICAgICAgICAgICAgICAgcHJpbnRfbmFtZTogZmFjZS5FeHRlcm5hbEltYWdlSWQucmVwbGFjZShcIl9cIiwgXCIgXCIpIHx8IGZhY2UuSW1hZ2VJZCxcbiAgICAgICAgICAgICAgICBwcmludF90eXBlOiBcImZhY2VcIixcbiAgICAgICAgICAgICAgICBwcmludF9jb2xsZWN0aW9uX2lkOiBjb2xsZWN0aW9uX2lkLFxuICAgICAgICAgICAgICAgIHByaW50X2RldGFpbHM6IGZhY2UsXG4gICAgICAgICAgICAgICAgcHJpbnRfYWRkZXI6IFwicm9vdFwiXG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgIFByaW50cy5zaW1wbGVTY2hlbWEoKS5jbGVhbihhd3NGYWNlKTtcbiAgICAgICAgICAgICAgbGV0IGV4aXN0aW5nRmFjZSA9IFByaW50cy51cHNlcnQoe3ByaW50X2lkOiBmYWNlLkZhY2VJZH0sIHskc2V0OiBhd3NGYWNlfSk7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKGB1cHNlcnRlZCBwcmludDogJHtKU09OLnN0cmluZ2lmeShleGlzdGluZ0ZhY2UpfWApO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH0pO1xuXG4gIC8vIGlmIChQcmludHMuZmluZCgpLmNvdW50KCkgPCAxNSkge1xuICAvLyAgIGNvbnNvbGUubG9nKFwic2VlZGluZyBwcmludHMuLi5cIik7XG4gIC8vICAgbGV0IHNlZWRQcmludHMgPSBbXVxuICAvLyAgIF8udGltZXMoNSwgKCk9PntcbiAgLy8gICAgIGxldCBwcmludCA9IHtcbiAgLy8gICAgICAgcHJpbnRfYWRkZXI6IHRoaXMudXNlcklkIHx8IFwicm9vdFwiLFxuICAvLyAgICAgICBwcmludF9jb2xsZWN0aW9uOiBcInBlb3BsZVwiLFxuICAvLyAgICAgICBwcmludF9jb2xsZWN0aW9uX2lkOiBcInBlb3BsZVwiLFxuICAvLyAgICAgICBwcmludF9uYW1lOiBmYWtlci5oZWxwZXJzLnVzZXJDYXJkKCkubmFtZSxcbiAgLy8gICAgICAgcHJpbnRfaWQ6IGZha2VyLnJhbmRvbS51dWlkKCksXG4gIC8vICAgICAgIHByaW50X2ltZzogZmFrZXIuaW1hZ2UuYXZhdGFyKClcbiAgLy8gICAgIH07XG4gIC8vICAgICBsZXQgcHJpbnRJZCA9IFByaW50cy5pbnNlcnQocHJpbnQpO1xuICAvLyAgICAgc2VlZFByaW50cy5wdXNoKHByaW50SWQpO1xuICAvLyAgIH0pO1xuICAvLyAgIGNvbnNvbGUubG9nKHNlZWRQcmludHMpO1xuXG4gIC8vIH07XG59KTsiLCIvKlxuICogQ29weXJpZ2h0IDIwMTctcHJlc2VudCBBbnRtb3VuZHMuY29tLCBJbmMuIG9yIGl0cyBhZmZpbGlhdGVzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBHTlUgQWZmZXJvIEdlbmVyYWwgUHVibGljIExpY2Vuc2UsIHZlcnNpb24gMy4wICh0aGUgXCJMaWNlbnNlXCIpLiBZb3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGhcbiAqIHRoZSBMaWNlbnNlLiBBIGNvcHkgb2YgdGhlIExpY2Vuc2UgaXMgbG9jYXRlZCBhdFxuICpcbiAqICAgICBodHRwczovL3d3dy5nbnUub3JnL2xpY2Vuc2VzL2FncGwtMy4wLmVuLmh0bWxcbiAqXG4gKiBvciBpbiB0aGUgXCJsaWNlbnNlXCIgZmlsZSBhY2NvbXBhbnlpbmcgdGhpcyBmaWxlLiBUaGlzIGZpbGUgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1JcbiAqIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9uc1xuICogYW5kIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5pbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCB7IEhUVFAgfSBmcm9tICdtZXRlb3IvaHR0cCc7XG5pbXBvcnQgJy4uL2FjY291bnRzLWNvbmZpZy5qcyc7XG5pbXBvcnQgJy4vZml4dHVyZXMuanMnO1xuLy8gVGhpcyBkZWZpbmVzIGFsbCB0aGUgY29sbGVjdGlvbnMsIHB1YmxpY2F0aW9ucyBhbmQgbWV0aG9kcyB0aGF0IHRoZSBhcHBsaWNhdGlvbiBwcm92aWRlc1xuLy8gYXMgYW4gQVBJIHRvIHRoZSBjbGllbnQuXG5pbXBvcnQgJy4vcmVnaXN0ZXItYXBpLmpzJztcblxuY29uc3Qgb3MgPSByZXF1aXJlKCdvcycpO1xuXG5cbnNlcnZlcl9tb2RlID0gTWV0ZW9yLmlzUHJvZHVjdGlvbiA/IFwiUFJPRFVDVElPTlwiIDogXCJERVZFTE9QTUVOVFwiO1xuY29uc29sZS5sb2coJ2luZGV4LmpzOiAnICsgc2VydmVyX21vZGUgKyBcIi0tPlwiICsgSlNPTi5zdHJpbmdpZnkoTWV0ZW9yLnNldHRpbmdzKSk7XG5cbk1ldGVvci5tZXRob2RzKHtcblxuXHRpbmZvKCl7XG5cdFx0cmV0dXJuIGByZWxlYXNlOiBsaXRlIC0gdmVyc2lvbjogMC45IC0gYnVpbGQ6ICR7cHJvY2Vzcy5lbnYuQlVJTEQgfHwgJ2Rldid9IC0gaG9zdG5hbWU6ICR7b3MuaG9zdG5hbWUoKX1gO1xuXHR9LFxuXG5cdGFzeW5jIGdldERhdGEoKXsgICAgXG5cdFx0dHJ5e1xuXHRcdFx0dmFyIHJlc3BvbnNlID0ge307XG5cdFx0XHRjb25zdCByZXN1bHRzID0gYXdhaXQgSFRUUC5jYWxsKCdHRVQnLCAnaHR0cDovL2pzb25wbGFjZWhvbGRlci50eXBpY29kZS5jb20vcG9zdHMnKTtcdFxuXHRcdFx0Y29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkocmVzdWx0cy5kYXRhWzBdKSk7XHRcblx0XHRcdGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHJlc3VsdHMuaGVhZGVycykpO1xuXHRcdFx0cmVzcG9uc2UuY29kZSA9IHRydWU7XG5cdFx0XHRyZXNwb25zZS5kYXRhID0gcmVzdWx0cztcblx0XHR9IGNhdGNoKGUpe1xuXHRcdFx0cmVzcG9uc2UgPSBmYWxzZTtcblx0XHRcdGNvbnNvbGUubG9nKGUpO1xuXHRcdH0gZmluYWxseSB7XG5cdFx0XHRjb25zb2xlLmxvZyhcImZpbmFsbHkuLi5cIilcblx0XHRcdC8vdGhyb3cgbmV3IE1ldGVvci5FcnJvcihcImluYXBwcm9wcmlhdGUtcGljXCIsXCJUaGUgdXNlciBoYXMgdGFrZW4gYW4gaW5hcHByb3ByaWF0ZSBwaWN0dXJlLlwiKTtcdFxuXHRcdFx0cmV0dXJuIHJlc3BvbnNlO1xuXHRcdH1cblx0fVxuXG59KTtcblxuTWV0ZW9yLm9uQ29ubmVjdGlvbigoY29ubmVjdGlvbik9Pntcblx0bGV0IGNsaWVudEFkZHIgPSBjb25uZWN0aW9uLmNsaWVudEFkZHJlc3M7XG5cdGxldCBoZWFkZXJzID0gY29ubmVjdGlvbi5odHRwSGVhZGVycztcblx0Y29uc29sZS5sb2coYGNvbm5lY3Rpb24gZnJvbSAke2NsaWVudEFkZHJ9YCk7XG5cdC8vIGNvbnNvbGUubG9nKGhlYWRlcnMpO1xufSkiLCJpbXBvcnQgJy4uLy4uL2FwaS9jb2xsZWN0aW9ucy9tZXRob2RzLmpzJztcbmltcG9ydCAnLi4vLi4vYXBpL2NvbGxlY3Rpb25zL3B1YmxpY2F0aW9ucy5qcyc7XG5pbXBvcnQgJy4uLy4uL2FwaS9zZWFyY2hlcy9tZXRob2RzLmpzJztcbmltcG9ydCAnLi4vLi4vYXBpL3NlYXJjaGVzL3B1YmxpY2F0aW9ucy5qcyc7XG5pbXBvcnQgJy4uLy4uL2FwaS9wcmludHMvbWV0aG9kcy5qcyc7XG5pbXBvcnQgJy4uLy4uL2FwaS9wcmludHMvcHVibGljYXRpb25zLmpzJzsiLCJpbXBvcnQgeyBBY2NvdW50cyB9IGZyb20gJ21ldGVvci9hY2NvdW50cy1iYXNlJztcbmltcG9ydCB7IEFjY291bnRzQ29tbW9uIH0gZnJvbSAnbWV0ZW9yL2FjY291bnRzLWJhc2UnXG5pbXBvcnQgeyBBY2NvdW50c0NsaWVudCB9IGZyb20gJ21ldGVvci9hY2NvdW50cy1iYXNlJ1xuXG5cbmlmIChNZXRlb3IuaXNDbGllbnQpIHtcblx0QWNjb3VudHMudWkuY29uZmlnKHtcblx0ICBwYXNzd29yZFNpZ251cEZpZWxkczogJ1VTRVJOQU1FX0FORF9FTUFJTCcsXG5cdH0pO1xufVxuXG5pZiAoTWV0ZW9yLmlzU2VydmVyKSB7XG5cdGNvbnNvbGUubG9nKFwiYWNjb3VudHMgY29uZmlnIGxvYWRlZCFcIik7XG5cdEFjY291bnRzLm9uQ3JlYXRlVXNlcigob3B0aW9ucywgdXNlcikgPT4ge1xuXHRcdC8vIHVzZXIuY3JlYXRlZCA9IG5ldyBEYXRlKCk7XG5cblx0XHRjb25zb2xlLmxvZyhcInVzZXI6IFwiICsgdXNlcik7XG5cdFx0Y29uc29sZS5sb2coXCJvcHRpb25zOiBcIiArIG9wdGlvbnMpO1xuXHRcdC8vIHVzZXIgPSBKU09OLnN0cmluZ2lmeSh1c2VyKTtcblx0XHRjb25zb2xlLmxvZyh1c2VyKTtcblx0XHQvLyBvcHRpb25zID0gSlNPTi5zdHJpbmdpZnkob3B0aW9ucyk7XG5cdFx0Y29uc29sZS5sb2cob3B0aW9ucyk7XG5cblx0ICAgIC8vIERvbid0IGZvcmdldCB0byByZXR1cm4gdGhlIG5ldyB1c2VyIG9iamVjdCBhdCB0aGUgZW5kIVxuXHRcdHJldHVybiB1c2VyO1xuXHR9KTtcbn0iLCIvKlxuICogQ29weXJpZ2h0IDIwMTctcHJlc2VudCBBbnRtb3VuZHMuY29tLCBJbmMuIG9yIGl0cyBhZmZpbGlhdGVzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBHTlUgQWZmZXJvIEdlbmVyYWwgUHVibGljIExpY2Vuc2UsIHZlcnNpb24gMy4wICh0aGUgXCJMaWNlbnNlXCIpLiBZb3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGhcbiAqIHRoZSBMaWNlbnNlLiBBIGNvcHkgb2YgdGhlIExpY2Vuc2UgaXMgbG9jYXRlZCBhdFxuICpcbiAqICAgICBodHRwczovL3d3dy5nbnUub3JnL2xpY2Vuc2VzL2FncGwtMy4wLmVuLmh0bWxcbiAqXG4gKiBvciBpbiB0aGUgXCJsaWNlbnNlXCIgZmlsZSBhY2NvbXBhbnlpbmcgdGhpcyBmaWxlLiBUaGlzIGZpbGUgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1JcbiAqIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9uc1xuICogYW5kIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5pbXBvcnQgJy4uL2ltcG9ydHMvc3RhcnR1cC9zZXJ2ZXInO1xuXG5NZXRlb3Iuc3RhcnR1cCgoKSA9PiB7XG4gIC8vIGNvZGUgdG8gcnVuIG9uIHNlcnZlciBhdCBzdGFydHVwXG59KTtcbiJdfQ==
