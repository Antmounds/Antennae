var require = meteorInstall({"imports":{"api":{"collections":{"collections.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                    //
// imports/api/collections/collections.js                                                             //
//                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////
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
////////////////////////////////////////////////////////////////////////////////////////////////////////

},"methods.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                    //
// imports/api/collections/methods.js                                                                 //
//                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////
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
////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publications.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                    //
// imports/api/collections/publications.js                                                            //
//                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////
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
////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"prints":{"methods.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                    //
// imports/api/prints/methods.js                                                                      //
//                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////
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
    newPrint.print_collection = Collections.findOne(newPrint.collection) || "people";
    newPrint.print_name = newPrint.name;
    newPrint.print_img = newPrint.img; // console.log(newPrint);

    Prints.simpleSchema().clean(newPrint);

    if (!newPrint) {
      throw new Meteor.Error('invalid-print', 'submitted print is invalid!');
    }

    ;
    let print = Prints.insert(newPrint);
    return print;
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
////////////////////////////////////////////////////////////////////////////////////////////////////////

},"prints.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                    //
// imports/api/prints/prints.js                                                                       //
//                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////
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
    defaultValue: "img/face-id-100.png"
  },
  "print_details": {
    type: String,
    label: "Print details",
    optional: true
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
////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publications.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                    //
// imports/api/prints/publications.js                                                                 //
//                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////
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
Meteor.publish('prints.get', function () {
  // check(collectionId,String);
  // collectionId = collectionId || {};
  // console.log(Collections.find(collectionId).count());
  return Prints.find({}, {
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
////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"searches":{"methods.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                    //
// imports/api/searches/methods.js                                                                    //
//                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////
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
    }; // create request objects

    let moderationRequest = rekognition.detectModerationLabels(moderationParams);
    let labelRequest = rekognition.detectLabels(labelParams);
    let faceRequest = rekognition.detectFaces(faceParams); // create promises

    let promise1 = moderationRequest.promise();
    let promise2 = labelRequest.promise();
    let promise3 = faceRequest.promise(); // Fulfill promises in parallel

    let response = Promise.all([promise1.catch(error => {
      throw new Meteor.Error(error.code, error.message, error);
      return error;
    }), promise2.catch(error => {
      throw new Meteor.Error(error.code, error.message, error);
      return error;
    }), promise3.catch(error => {
      throw new Meteor.Error(error.code, error.message, error);
      return error;
    })]).then(values => {
      console.log(values[0]);
      console.log(values[1]);
      console.log(values[2]);
      let t1 = new Date().getTime();
      console.log(`Response took ${t1 - t0} ms`);
      let search_results = {
        moderation: values[0].ModerationLabels,
        labels: values[1].Labels,
        faceDetails: values[2].FaceDetails
      };
      let search = {
        search_image: picData,
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
  }

}); // Define a rule to limit method calls

let runScanRule = {
  type: 'method',
  name: 'moment.scan'
}; // Add the rule, allowing up to 1 scan every 10 seconds

DDPRateLimiter.addRule(runScanRule, 1, 10000);
////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publications.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                    //
// imports/api/searches/publications.js                                                               //
//                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////
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
////////////////////////////////////////////////////////////////////////////////////////////////////////

},"searches.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                    //
// imports/api/searches/searches.js                                                                   //
//                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////
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
    defaultValue: ""
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
////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"startup":{"server":{"fixtures.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                    //
// imports/startup/server/fixtures.js                                                                 //
//                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////
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
// if the database is empty on server start, create some sample data.
Meteor.startup(() => {
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
////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                    //
// imports/startup/server/index.js                                                                    //
//                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////
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
////////////////////////////////////////////////////////////////////////////////////////////////////////

},"register-api.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                    //
// imports/startup/server/register-api.js                                                             //
//                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                      //
module.watch(require("../../api/collections/methods.js"));
module.watch(require("../../api/collections/publications.js"));
module.watch(require("../../api/searches/methods.js"));
module.watch(require("../../api/searches/publications.js"));
module.watch(require("../../api/prints/methods.js"));
module.watch(require("../../api/prints/publications.js"));
////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}},"server":{"main.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                    //
// server/main.js                                                                                     //
//                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                      //
module.watch(require("../imports/startup/server"));
Meteor.startup(() => {// code to run on server at startup
});
////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/server/main.js");
//# sourceURL=meteor://💻app/app/app.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvY29sbGVjdGlvbnMvY29sbGVjdGlvbnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL2NvbGxlY3Rpb25zL21ldGhvZHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL2NvbGxlY3Rpb25zL3B1YmxpY2F0aW9ucy5qcyIsIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvcHJpbnRzL21ldGhvZHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL3ByaW50cy9wcmludHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL3ByaW50cy9wdWJsaWNhdGlvbnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL3NlYXJjaGVzL21ldGhvZHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL3NlYXJjaGVzL3B1YmxpY2F0aW9ucy5qcyIsIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvc2VhcmNoZXMvc2VhcmNoZXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvc3RhcnR1cC9zZXJ2ZXIvZml4dHVyZXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvc3RhcnR1cC9zZXJ2ZXIvaW5kZXguanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvc3RhcnR1cC9zZXJ2ZXIvcmVnaXN0ZXItYXBpLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9zZXJ2ZXIvbWFpbi5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnQiLCJDb2xsZWN0aW9ucyIsIk1vbmdvIiwid2F0Y2giLCJyZXF1aXJlIiwidiIsIlNpbXBsZVNjaGVtYSIsIk1ldGVvciIsIkNvbGxlY3Rpb24iLCJkZW55IiwiaW5zZXJ0IiwidXBkYXRlIiwicmVtb3ZlIiwiU2NoZW1hIiwidHlwZSIsIlN0cmluZyIsImxhYmVsIiwib3B0aW9uYWwiLCJkZWZhdWx0VmFsdWUiLCJpbmRleCIsInVuaXF1ZSIsImFsbG93ZWRWYWx1ZXMiLCJCb29sZWFuIiwiRGF0ZSIsImF1dG9WYWx1ZSIsImlzSW5zZXJ0IiwiaXNVcGRhdGUiLCJhdHRhY2hTY2hlbWEiLCJwdWJsaWNGaWVsZHMiLCJjb2xsZWN0aW9uX2lkIiwiY29sbGVjdGlvbl9uYW1lIiwiY29sbGVjdGlvbl90eXBlIiwicHJpdmF0ZSIsImNyZWF0ZWQiLCJ1cGRhdGVkIiwiRERQUmF0ZUxpbWl0ZXIiLCJBV1MiLCJkZWZhdWx0IiwiY29uZmlnIiwicmVnaW9uIiwicmVrb2duaXRpb24iLCJSZWtvZ25pdGlvbiIsIm1ldGhvZHMiLCJuZXdDb2wiLCJjb25zb2xlIiwibG9nIiwiY29sIiwiRXJyb3IiLCJjb2xJZCIsImNoZWNrIiwicHJpbnQiLCJwdWJsaXNoIiwiY29sbGVjdGlvbklkIiwiZmluZCIsInNvcnQiLCJmaWVsZHMiLCJzdWJzY3JpYmVUb0NvbGxlY3Rpb25zUnVsZSIsIm5hbWUiLCJhZGRSdWxlIiwiUHJpbnRzIiwibmV3UHJpbnQiLCJwcmludF9hZGRlciIsInVzZXJJZCIsInByaW50X2NvbGxlY3Rpb24iLCJmaW5kT25lIiwiY29sbGVjdGlvbiIsInByaW50X25hbWUiLCJwcmludF9pbWciLCJpbWciLCJzaW1wbGVTY2hlbWEiLCJjbGVhbiIsInByaW50SWQiLCJwcmludF9pZCIsInByaW50X3R5cGUiLCJwcmludF9kZXRhaWxzIiwic3Vic2NyaWJlVG9QcmludHNSdWxlIiwiU2VhcmNoZXMiLCJwaWNEYXRhIiwidDAiLCJnZXRUaW1lIiwiaW1nQnl0ZXMiLCJCdWZmZXIiLCJmcm9tIiwic3BsaXQiLCJtb2RlcmF0aW9uUGFyYW1zIiwibGFiZWxQYXJhbXMiLCJmYWNlUGFyYW1zIiwibW9kZXJhdGlvblJlcXVlc3QiLCJkZXRlY3RNb2RlcmF0aW9uTGFiZWxzIiwibGFiZWxSZXF1ZXN0IiwiZGV0ZWN0TGFiZWxzIiwiZmFjZVJlcXVlc3QiLCJkZXRlY3RGYWNlcyIsInByb21pc2UxIiwicHJvbWlzZSIsInByb21pc2UyIiwicHJvbWlzZTMiLCJyZXNwb25zZSIsIlByb21pc2UiLCJhbGwiLCJjYXRjaCIsImVycm9yIiwiY29kZSIsIm1lc3NhZ2UiLCJ0aGVuIiwidmFsdWVzIiwidDEiLCJzZWFyY2hfcmVzdWx0cyIsIm1vZGVyYXRpb24iLCJNb2RlcmF0aW9uTGFiZWxzIiwibGFiZWxzIiwiTGFiZWxzIiwiZmFjZURldGFpbHMiLCJGYWNlRGV0YWlscyIsInNlYXJjaCIsInNlYXJjaF9pbWFnZSIsInNhdmVTZWFyY2giLCJyZWFzb24iLCJkZXRhaWxzIiwiZmluYWxseSIsInJ1blNjYW5SdWxlIiwic2VhcmNoSWQiLCJzdWJzY3JpYmVUb1NlYXJjaGVzUnVsZSIsIk9iamVjdCIsImJsYWNrYm94IiwiaXNTZXJ2ZXIiLCJzdGFydHVwIiwiX2Vuc3VyZUluZGV4Iiwic2VhcmNoX2lkIiwic2VhcmNoX3R5cGUiLCJzZWFyY2hfY29sbGVjdGlvbnMiLCJjb3VudCIsInNlZWRQcmludHMiLCJfIiwidGltZXMiLCJmYWtlciIsImhlbHBlcnMiLCJ1c2VyQ2FyZCIsInJhbmRvbSIsInV1aWQiLCJpbWFnZSIsImF2YXRhciIsInB1c2giLCJIVFRQIiwib3MiLCJzZXJ2ZXJfbW9kZSIsImlzUHJvZHVjdGlvbiIsIkpTT04iLCJzdHJpbmdpZnkiLCJzZXR0aW5ncyIsImluZm8iLCJwcm9jZXNzIiwiZW52IiwiQlVJTEQiLCJob3N0bmFtZSIsImdldERhdGEiLCJyZXN1bHRzIiwiY2FsbCIsImRhdGEiLCJoZWFkZXJzIiwiZSIsIm9uQ29ubmVjdGlvbiIsImNvbm5lY3Rpb24iLCJjbGllbnRBZGRyIiwiY2xpZW50QWRkcmVzcyIsImh0dHBIZWFkZXJzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFBQSxPQUFPQyxNQUFQLENBQWM7QUFBQ0MsZUFBWSxNQUFJQTtBQUFqQixDQUFkO0FBQTZDLElBQUlDLEtBQUo7QUFBVUgsT0FBT0ksS0FBUCxDQUFhQyxRQUFRLGNBQVIsQ0FBYixFQUFxQztBQUFDRixRQUFNRyxDQUFO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QWxILGdCQUFRQyxHQUFSLENBQVlzRyxLQUFLQyxTQUFMLENBQWVRLFFBQVFHLE9BQXZCLENBQVo7QUFDQTlELGlCQUFTSyxJQUFULEdBQWdCLElBQWhCO0FBQ0FMLGlCQUFTNkQsSUFBVCxHQUFnQkYsT0FBaEI7QUFDQSxPQVBELENBT0UsT0FBTUksQ0FBTixFQUFRO0FBQ1QvRCxtQkFBVyxLQUFYO0FBQ0FyRCxnQkFBUUMsR0FBUixDQUFZbUgsQ0FBWjtBQUNBLE9BVkQsU0FVVTtBQUNUcEgsZ0JBQVFDLEdBQVIsQ0FBWSxZQUFaLEVBRFMsQ0FFVDs7QUFDQSxlQUFPb0QsUUFBUDtBQUNBO0FBQ0QsS0FoQkQ7QUFBQTs7QUFOYyxDQUFmO0FBMEJBMUYsT0FBTzBKLFlBQVAsQ0FBcUJDLFVBQUQsSUFBYztBQUNqQyxNQUFJQyxhQUFhRCxXQUFXRSxhQUE1QjtBQUNBLE1BQUlMLFVBQVVHLFdBQVdHLFdBQXpCO0FBQ0F6SCxVQUFRQyxHQUFSLENBQWEsbUJBQWtCc0gsVUFBVyxFQUExQyxFQUhpQyxDQUlqQztBQUNBLENBTEQsRTs7Ozs7Ozs7Ozs7QUNwREFwSyxPQUFPSSxLQUFQLENBQWFDLFFBQVEsa0NBQVIsQ0FBYjtBQUEwREwsT0FBT0ksS0FBUCxDQUFhQyxRQUFRLHVDQUFSLENBQWI7QUFBK0RMLE9BQU9JLEtBQVAsQ0FBYUMsUUFBUSwrQkFBUixDQUFiO0FBQXVETCxPQUFPSSxLQUFQLENBQWFDLFFBQVEsb0NBQVIsQ0FBYjtBQUE0REwsT0FBT0ksS0FBUCxDQUFhQyxRQUFRLDZCQUFSLENBQWI7QUFBcURMLE9BQU9JLEtBQVAsQ0FBYUMsUUFBUSxrQ0FBUixDQUFiLEU7Ozs7Ozs7Ozs7O0FDQWpTTCxPQUFPSSxLQUFQLENBQWFDLFFBQVEsMkJBQVIsQ0FBYjtBQWNBRyxPQUFPdUgsT0FBUCxDQUFlLE1BQU0sQ0FDbkI7QUFDRCxDQUZELEUiLCJmaWxlIjoiL2FwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1vbmdvIH0gZnJvbSAnbWV0ZW9yL21vbmdvJztcbmltcG9ydCB7IFNpbXBsZVNjaGVtYSB9IGZyb20gJ21ldGVvci9hbGRlZWQ6c2ltcGxlLXNjaGVtYSc7XG5cblxuXG5leHBvcnQgY29uc3QgQ29sbGVjdGlvbnMgPSBuZXcgTWV0ZW9yLkNvbGxlY3Rpb24oJ2NvbGxlY3Rpb25zJyk7XG5cbi8vIERlbnkgYWxsIGNsaWVudC1zaWRlIHVwZGF0ZXMgc2luY2Ugd2Ugd2lsbCBiZSB1c2luZyBtZXRob2RzIHRvIG1hbmFnZSB0aGlzIGNvbGxlY3Rpb25cbkNvbGxlY3Rpb25zLmRlbnkoe1xuICBpbnNlcnQoKSB7IHJldHVybiB0cnVlOyB9LFxuICB1cGRhdGUoKSB7IHJldHVybiB0cnVlOyB9LFxuICByZW1vdmUoKSB7IHJldHVybiB0cnVlOyB9LFxufSk7XG5cbkNvbGxlY3Rpb25zLlNjaGVtYSA9IG5ldyBTaW1wbGVTY2hlbWEoe1xuICAvLyBPdXIgc2NoZW1hIHJ1bGVzIHdpbGwgZ28gaGVyZS5cbiAgXCJjb2xsZWN0aW9uX2lkXCI6IHtcbiAgICB0eXBlOiBTdHJpbmcsXG4gICAgbGFiZWw6IFwiQ29sbGVjdGlvbiBJRFwiLFxuICAgIG9wdGlvbmFsOiBmYWxzZSxcbiAgICBkZWZhdWx0VmFsdWU6IFwiQ29sbGVjdGlvbiBJRFwiLFxuICAgIGluZGV4OiB0cnVlLFxuICAgIHVuaXF1ZTogdHJ1ZVxuICB9LFxuICBcImNvbGxlY3Rpb25fbmFtZVwiOiB7XG4gICAgdHlwZTogU3RyaW5nLFxuICAgIGxhYmVsOiBcIkNvbGxlY3Rpb24gTmFtZVwiLFxuICAgIG9wdGlvbmFsOiBmYWxzZSxcbiAgICBkZWZhdWx0VmFsdWU6IFwiTXlDb2xsZWN0aW9uXCIsXG4gICAgaW5kZXg6IHRydWVcbiAgfSxcbiAgXCJjb2xsZWN0aW9uX3R5cGVcIjoge1xuICAgIHR5cGU6IFN0cmluZyxcbiAgICBsYWJlbDogXCJDb2xsZWN0aW9uIHR5cGVcIixcbiAgICBvcHRpb25hbDogZmFsc2UsXG4gICAgYWxsb3dlZFZhbHVlczogW1wiZmFjZVwiLCBcInZvaWNlXCJdLFxuICAgIGRlZmF1bHRWYWx1ZTogXCJmYWNlXCJcbiAgfSxcbiAgXCJwcml2YXRlXCI6IHtcbiAgICB0eXBlOiBCb29sZWFuLFxuICAgIGxhYmVsOiBcIkNvbGxlY3Rpb24gcHJpdmFjeVwiLFxuICAgIG9wdGlvbmFsOiBmYWxzZSxcbiAgICBkZWZhdWx0VmFsdWU6IHRydWVcbiAgfSxcbiAgXCJjcmVhdGVkXCI6IHtcbiAgICB0eXBlOiBEYXRlLFxuICAgIGxhYmVsOiBcIkRhdGUgY29sbGVjdGlvbiBhZGRlZCB0byBBbnRlbm5hZVwiLFxuICAgIGF1dG9WYWx1ZTogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoIHRoaXMuaXNJbnNlcnQgKSB7XG4gICAgICAgIHJldHVybiBuZXcgRGF0ZTtcbiAgICAgIH0gXG4gICAgfSxcbiAgICBvcHRpb25hbDogdHJ1ZVxuICB9LFxuICBcInVwZGF0ZWRcIjoge1xuICAgIHR5cGU6IERhdGUsXG4gICAgbGFiZWw6IFwiRGF0ZSBjb2xsZWN0aW9uIHVwZGF0ZWQgaW4gU3lzdGVtXCIsXG4gICAgYXV0b1ZhbHVlOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICggdGhpcy5pc1VwZGF0ZSApIHtcbiAgICAgICAgcmV0dXJuIG5ldyBEYXRlO1xuICAgICAgfSBcbiAgICB9LFxuICAgIG9wdGlvbmFsOiB0cnVlXG4gIH1cbn0pO1xuXG5Db2xsZWN0aW9ucy5hdHRhY2hTY2hlbWEoIENvbGxlY3Rpb25zLlNjaGVtYSApOyBcblxuXG5Db2xsZWN0aW9ucy5wdWJsaWNGaWVsZHMgPSB7XG4gIGNvbGxlY3Rpb25faWQ6IDEsXG4gIGNvbGxlY3Rpb25fbmFtZTogMSxcbiAgY29sbGVjdGlvbl90eXBlOiAxLFxuICBwcml2YXRlOiAxLFxuICBjcmVhdGVkOiAxLFxuICB1cGRhdGVkOiAxXG59O1xuXG4vLyBDb2xsZWN0aW9ucy5oZWxwZXJzKHtcbi8vICAgLy8gQSBjb2xsZWN0aW9ucyBpcyBjb25zaWRlcmVkIHRvIGJlIHByaXZhdGUgaWYgXCJwcml2YXRlXCIgaXMgc2V0IHRvIHRydWVcbi8vICAgaXNQcml2YXRlKCkge1xuLy8gICAgIHJldHVybiB0aGlzLnByaXZhdGU7XG4vLyAgIH1cbi8vIH0pOyIsImltcG9ydCB7IEREUFJhdGVMaW1pdGVyIH0gZnJvbSAnbWV0ZW9yL2RkcC1yYXRlLWxpbWl0ZXInO1xuaW1wb3J0IEFXUyBmcm9tICdhd3Mtc2RrJztcblxuaW1wb3J0IHsgQ29sbGVjdGlvbnMgfSBmcm9tICcuL2NvbGxlY3Rpb25zLmpzJztcblxuQVdTLmNvbmZpZy5yZWdpb24gPSAndXMtZWFzdC0xJztcbnZhciByZWtvZ25pdGlvbiA9IG5ldyBBV1MuUmVrb2duaXRpb24oKTtcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXHRcImNvbGxlY3Rpb24uc2F2ZVwiKG5ld0NvbCl7XG5cdFx0Y29uc29sZS5sb2cobmV3Q29sKTtcblx0XHRsZXQgY29sID0gQ29sbGVjdGlvbnMuaW5zZXJ0KG5ld0NvbCk7XG5cdFx0aWYoY29sKXtcblx0XHRcdGNvbnNvbGUubG9nKGBhZGRlZCBjb2xsZWN0aW9uOiAke2NvbH1gKTtcblx0XHR9ZWxzZXtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKG5ld0NvbCk7XG4gICAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdhZGQtY29sbGVjdGlvbi1lcnJvcicsYGVycm9yIGFkZGluZyBjb2xsZWN0aW9uOiAke25ld0NvbH1gKVx0XHRcblx0XHR9XG5cdFx0cmV0dXJuIGBhZGRlZCBjb2xsZWN0aW9uOiAke2NvbH1gO1xuXHR9LFxuXG5cdFwiY29sbGVjdGlvbi5kZWxldGVcIihjb2xJZCl7XG5cdFx0Y2hlY2soY29sSWQsU3RyaW5nKTtcblx0XHRpZihjb2xJZCl7XG5cdFx0XHRsZXQgcHJpbnQgPSBDb2xsZWN0aW9ucy5yZW1vdmUoY29sSWQpO1xuXHRcdFx0Y29uc29sZS5sb2coYGRlbGV0ZWQgY29sbGVjdGlvbjogJHtjb2xJZH1gKTtcblx0XHRcdHJldHVybiBgZGVsZXRlZCBjb2xsZWN0aW9uOiAke2NvbElkfWA7XG5cdFx0fTtcblx0fVxufSlcblxuLy8gRGVmaW5lIGEgcnVsZSB0byBsaW1pdCBtZXRob2QgY2FsbHNcbi8vIGxldCBydW5TY2FuUnVsZSA9IHtcbi8vIFx0dHlwZTogJ21ldGhvZCcsXG4vLyBcdG5hbWU6ICdtb21lbnQuc2Nhbidcbi8vIH07XG4vLyBBZGQgdGhlIHJ1bGUsIGFsbG93aW5nIHVwIHRvIDEgc2NhbiBldmVyeSAxMCBzZWNvbmRzXG4vLyBERFBSYXRlTGltaXRlci5hZGRSdWxlKHJ1blNjYW5SdWxlLCAxLCAxMDAwMCk7IiwiaW1wb3J0IHsgRERQUmF0ZUxpbWl0ZXIgfSBmcm9tICdtZXRlb3IvZGRwLXJhdGUtbGltaXRlcic7XG5cbmltcG9ydCB7IENvbGxlY3Rpb25zIH0gZnJvbSAnLi9jb2xsZWN0aW9ucy5qcyc7XG5cblxuTWV0ZW9yLnB1Ymxpc2goJ2NvbGxlY3Rpb25zLmdldCcsIGZ1bmN0aW9uKGNvbGxlY3Rpb25JZD0nJykge1xuXHRjaGVjayhjb2xsZWN0aW9uSWQsU3RyaW5nKTtcblx0Y29sbGVjdGlvbklkID0gY29sbGVjdGlvbklkIHx8IHt9O1xuICBcdC8vIGNvbnNvbGUubG9nKENvbGxlY3Rpb25zLmZpbmQoY29sbGVjdGlvbklkKS5jb3VudCgpKTtcblx0cmV0dXJuIENvbGxlY3Rpb25zLmZpbmQoXG5cdFx0Y29sbGVjdGlvbklkLCBcblx0ICB7IFxuXHQgIFx0c29ydDogeyBjcmVhdGVkOiAtMSB9IFxuXHR9XG5cdCwge1xuXHRcdGZpZWxkczogQ29sbGVjdGlvbnMucHVibGljRmllbGRzXG5cdH0pO1xufSk7XG5cbi8vIERlZmluZSBhIHJ1bGUgdG8gbGltaXQgc3Vic2NyaXB0aW9uIGNhbGxzXG52YXIgc3Vic2NyaWJlVG9Db2xsZWN0aW9uc1J1bGUgPSB7XG4gIHR5cGU6ICdzdWJzY3JpcHRpb24nLFxuICBuYW1lOiAnY29sbGVjdGlvbnMuZ2V0J1xufVxuLy8gQWRkIHRoZSBydWxlLCBhbGxvd2luZyB1cCB0byAxIHN1YnNjcmlwdGlvbiBldmVyeSA1IHNlY29uZHMuXG5ERFBSYXRlTGltaXRlci5hZGRSdWxlKHN1YnNjcmliZVRvQ29sbGVjdGlvbnNSdWxlLCAxLCA1MDAwKTsiLCJpbXBvcnQgeyBERFBSYXRlTGltaXRlciB9IGZyb20gJ21ldGVvci9kZHAtcmF0ZS1saW1pdGVyJztcbmltcG9ydCBBV1MgZnJvbSAnYXdzLXNkayc7XG5cbmltcG9ydCB7IENvbGxlY3Rpb25zIH0gZnJvbSAnLi4vY29sbGVjdGlvbnMvY29sbGVjdGlvbnMuanMnO1xuaW1wb3J0IHsgUHJpbnRzIH0gZnJvbSAnLi9wcmludHMuanMnO1xuXG5BV1MuY29uZmlnLnJlZ2lvbiA9ICd1cy1lYXN0LTEnO1xudmFyIHJla29nbml0aW9uID0gbmV3IEFXUy5SZWtvZ25pdGlvbigpO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdFwicHJpbnQuc2F2ZVwiKG5ld1ByaW50KXtcblx0XHRuZXdQcmludC5wcmludF9hZGRlciA9IHRoaXMudXNlcklkIHx8IFwibnVsbFwiO1xuXHRcdG5ld1ByaW50LnByaW50X2NvbGxlY3Rpb24gPSBDb2xsZWN0aW9ucy5maW5kT25lKG5ld1ByaW50LmNvbGxlY3Rpb24pIHx8IFwicGVvcGxlXCI7XG5cdFx0bmV3UHJpbnQucHJpbnRfbmFtZSA9IG5ld1ByaW50Lm5hbWU7XG5cdFx0bmV3UHJpbnQucHJpbnRfaW1nID0gbmV3UHJpbnQuaW1nO1xuXHRcdC8vIGNvbnNvbGUubG9nKG5ld1ByaW50KTtcblx0XHRQcmludHMuc2ltcGxlU2NoZW1hKCkuY2xlYW4obmV3UHJpbnQpO1xuXHRcdGlmKCFuZXdQcmludCl7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnZhbGlkLXByaW50Jywnc3VibWl0dGVkIHByaW50IGlzIGludmFsaWQhJyk7XG5cdFx0fTtcblx0XHRsZXQgcHJpbnQgPSBQcmludHMuaW5zZXJ0KG5ld1ByaW50KTtcblx0XHRyZXR1cm4gcHJpbnQ7XG5cdH0sXG5cblx0XCJwcmludC5kZWxldGVcIihwcmludElkKXtcblx0XHRjaGVjayhwcmludElkLFN0cmluZyk7XG5cdFx0aWYocHJpbnRJZCl7XG5cdFx0XHRsZXQgcHJpbnQgPSBQcmludHMucmVtb3ZlKHByaW50SWQpO1xuXHRcdFx0Y29uc29sZS5sb2coYGRlbGV0ZWQgZmFjZTogJHtwcmludElkfWApO1xuXHRcdFx0cmV0dXJuIGBkZWxldGVkIGZhY2U6ICR7cHJpbnRJZH1gO1xuXHRcdH07XG5cdH1cbn0pXG5cbi8vIERlZmluZSBhIHJ1bGUgdG8gbGltaXQgbWV0aG9kIGNhbGxzXG4vLyBsZXQgcnVuU2NhblJ1bGUgPSB7XG4vLyBcdHR5cGU6ICdtZXRob2QnLFxuLy8gXHRuYW1lOiAncHJpbnQuc2F2ZSdcbi8vIH07XG4vLyBBZGQgdGhlIHJ1bGUsIGFsbG93aW5nIHVwIHRvIDEgc2NhbiBldmVyeSAxMCBzZWNvbmRzXG4vLyBERFBSYXRlTGltaXRlci5hZGRSdWxlKHJ1blNjYW5SdWxlLCAxLCAxMDAwMCk7IiwiaW1wb3J0IHsgTW9uZ28gfSBmcm9tICdtZXRlb3IvbW9uZ28nO1xuaW1wb3J0IHsgU2ltcGxlU2NoZW1hIH0gZnJvbSAnbWV0ZW9yL2FsZGVlZDpzaW1wbGUtc2NoZW1hJztcblxuXG5cbmV4cG9ydCBjb25zdCBQcmludHMgPSBuZXcgTWV0ZW9yLkNvbGxlY3Rpb24oJ3ByaW50cycpO1xuXG4vLyBEZW55IGFsbCBjbGllbnQtc2lkZSB1cGRhdGVzIHNpbmNlIHdlIHdpbGwgYmUgdXNpbmcgbWV0aG9kcyB0byBtYW5hZ2UgdGhpcyBjb2xsZWN0aW9uXG5QcmludHMuZGVueSh7XG4gIGluc2VydCgpIHsgcmV0dXJuIHRydWU7IH0sXG4gIHVwZGF0ZSgpIHsgcmV0dXJuIHRydWU7IH0sXG4gIHJlbW92ZSgpIHsgcmV0dXJuIHRydWU7IH0sXG59KTtcblxuUHJpbnRzLlNjaGVtYSA9IG5ldyBTaW1wbGVTY2hlbWEoe1xuICAvLyBPdXIgc2NoZW1hIHJ1bGVzIHdpbGwgZ28gaGVyZS5cbiAgXCJwcmludF9pZFwiOiB7XG4gICAgdHlwZTogU3RyaW5nLFxuICAgIGxhYmVsOiBcIlByaW50IElEXCIsXG4gICAgb3B0aW9uYWw6IGZhbHNlLFxuICAgIGRlZmF1bHRWYWx1ZTogXCJBQUFBLUJCQkItQ0NDQy0xMTExLTIyMjItMzMzM1wiLFxuICAgIGluZGV4OiB0cnVlLFxuICAgIHVuaXF1ZTogdHJ1ZVxuICB9LFxuICBcInByaW50X25hbWVcIjoge1xuICAgIHR5cGU6IFN0cmluZyxcbiAgICBsYWJlbDogXCJQcmludCBOYW1lXCIsXG4gICAgb3B0aW9uYWw6IGZhbHNlLFxuICAgIGRlZmF1bHRWYWx1ZTogXCJOZXcgUGVyc29uXCJcbiAgfSxcbiAgXCJwcmludF90eXBlXCI6IHtcbiAgICB0eXBlOiBTdHJpbmcsXG4gICAgbGFiZWw6IFwiUHJpbnQgdHlwZVwiLFxuICAgIG9wdGlvbmFsOiBmYWxzZSxcbiAgICBhbGxvd2VkVmFsdWVzOiBbXCJmYWNlXCIsIFwidm9pY2VcIiwgXCJmaW5nZXJcIl0sXG4gICAgZGVmYXVsdFZhbHVlOiBcImZhY2VcIlxuICB9LFxuICBcInByaW50X2NvbGxlY3Rpb25cIjoge1xuICAgIHR5cGU6IFN0cmluZyxcbiAgICBsYWJlbDogXCJQcmludCBjb2xsZWN0aW9uXCIsXG4gICAgb3B0aW9uYWw6IGZhbHNlLFxuICAgIGRlZmF1bHRWYWx1ZTogXCJwZW9wbGVcIlxuICB9LFxuICBcInByaW50X2ltZ1wiOiB7XG4gICAgdHlwZTogU3RyaW5nLFxuICAgIGxhYmVsOiBcIlByaW50IGltZ1wiLFxuICAgIG9wdGlvbmFsOiB0cnVlLFxuICAgIGRlZmF1bHRWYWx1ZTogXCJpbWcvZmFjZS1pZC0xMDAucG5nXCJcbiAgfSxcbiAgXCJwcmludF9kZXRhaWxzXCI6IHtcbiAgICB0eXBlOiBTdHJpbmcsXG4gICAgbGFiZWw6IFwiUHJpbnQgZGV0YWlsc1wiLFxuICAgIG9wdGlvbmFsOiB0cnVlXG4gIH0sXG4gIFwicHJpbnRfYWRkZXJcIjoge1xuICAgIHR5cGU6IFN0cmluZyxcbiAgICBsYWJlbDogXCJVc2VyIHdobyBhZGRlZCBwcmludFwiLFxuICAgIG9wdGlvbmFsOiBmYWxzZVxuICB9LFxuICBcImNyZWF0ZWRcIjoge1xuICAgIHR5cGU6IERhdGUsXG4gICAgbGFiZWw6IFwiRGF0ZSBwcmludCBhZGRlZCB0byBBbnRlbm5hZVwiLFxuICAgIGF1dG9WYWx1ZTogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoIHRoaXMuaXNJbnNlcnQgKSB7XG4gICAgICAgIHJldHVybiBuZXcgRGF0ZTtcbiAgICAgIH0gXG4gICAgfSxcbiAgICBvcHRpb25hbDogdHJ1ZVxuICB9LFxuICBcInVwZGF0ZWRcIjoge1xuICAgIHR5cGU6IERhdGUsXG4gICAgbGFiZWw6IFwiRGF0ZSBwcmludCB1cGRhdGVkIGluIFN5c3RlbVwiLFxuICAgIGF1dG9WYWx1ZTogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoIHRoaXMuaXNVcGRhdGUgKSB7XG4gICAgICAgIHJldHVybiBuZXcgRGF0ZTtcbiAgICAgIH0gXG4gICAgfSxcbiAgICBvcHRpb25hbDogdHJ1ZVxuICB9XG59KTtcblxuUHJpbnRzLmF0dGFjaFNjaGVtYSggUHJpbnRzLlNjaGVtYSApOyBcblxuXG5QcmludHMucHVibGljRmllbGRzID0ge1xuICBwcmludF9pZDogMSxcbiAgcHJpbnRfbmFtZTogMSxcbiAgcHJpbnRfdHlwZTogMSxcbiAgcHJpbnRfY29sbGVjdGlvbjogMSxcbiAgcHJpbnRfaW1nOiAxLFxuICBwcmludF9kZXRhaWxzOiAxLFxuICBwcmludF9hZGRlcjogMSxcbiAgY3JlYXRlZDogMSxcbiAgdXBkYXRlZDogMVxufTtcblxuLy8gUHJpbnRzLmhlbHBlcnMoe1xuLy8gICAvLyBBIGNvbGxlY3Rpb25zIGlzIGNvbnNpZGVyZWQgdG8gYmUgcHJpdmF0ZSBpZiBcInByaXZhdGVcIiBpcyBzZXQgdG8gdHJ1ZVxuLy8gICBpc1ByaXZhdGUoKSB7XG4vLyAgICAgcmV0dXJuIHRoaXMucHJpdmF0ZTtcbi8vICAgfVxuLy8gfSk7IiwiaW1wb3J0IHsgRERQUmF0ZUxpbWl0ZXIgfSBmcm9tICdtZXRlb3IvZGRwLXJhdGUtbGltaXRlcic7XG5cbmltcG9ydCB7IFByaW50cyB9IGZyb20gJy4vcHJpbnRzLmpzJztcblxuXG5NZXRlb3IucHVibGlzaCgncHJpbnRzLmdldCcsIGZ1bmN0aW9uKCkge1xuXHQvLyBjaGVjayhjb2xsZWN0aW9uSWQsU3RyaW5nKTtcblx0Ly8gY29sbGVjdGlvbklkID0gY29sbGVjdGlvbklkIHx8IHt9O1xuICBcdC8vIGNvbnNvbGUubG9nKENvbGxlY3Rpb25zLmZpbmQoY29sbGVjdGlvbklkKS5jb3VudCgpKTtcblx0cmV0dXJuIFByaW50cy5maW5kKFxuXHRcdHt9LCBcblx0ICB7IFxuXHQgIFx0c29ydDogeyBjcmVhdGVkOiAtMSB9IFxuXHR9XG5cdCwge1xuXHRcdGZpZWxkczogUHJpbnRzLnB1YmxpY0ZpZWxkc1xuXHR9KTtcbn0pO1xuXG4vLyBEZWZpbmUgYSBydWxlIHRvIGxpbWl0IHN1YnNjcmlwdGlvbiBjYWxsc1xudmFyIHN1YnNjcmliZVRvUHJpbnRzUnVsZSA9IHtcbiAgdHlwZTogJ3N1YnNjcmlwdGlvbicsXG4gIG5hbWU6ICdwcmludHMuZ2V0J1xufVxuLy8gQWRkIHRoZSBydWxlLCBhbGxvd2luZyB1cCB0byAxIHN1YnNjcmlwdGlvbiBldmVyeSA1IHNlY29uZHMuXG5ERFBSYXRlTGltaXRlci5hZGRSdWxlKHN1YnNjcmliZVRvUHJpbnRzUnVsZSwgMSwgNTAwMCk7IiwiaW1wb3J0IHsgRERQUmF0ZUxpbWl0ZXIgfSBmcm9tICdtZXRlb3IvZGRwLXJhdGUtbGltaXRlcic7XG5pbXBvcnQgQVdTIGZyb20gJ2F3cy1zZGsnO1xuXG5pbXBvcnQgeyBTZWFyY2hlcyB9IGZyb20gJy4vc2VhcmNoZXMuanMnO1xuXG5BV1MuY29uZmlnLnJlZ2lvbiA9ICd1cy1lYXN0LTEnO1xudmFyIHJla29nbml0aW9uID0gbmV3IEFXUy5SZWtvZ25pdGlvbigpO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdFwic2VhcmNoLmZhY2VcIihwaWNEYXRhKXtcblx0XHQvL3JldHVybiAxO1xuXHRcdGNvbnNvbGUubG9nKFwiQU5BTFlaSU5HIElNQUdFLi4uXCIpO1xuXHRcdHZhciB0MCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXHRcdGxldCBpbWdCeXRlcyA9IG5ldyBCdWZmZXIuZnJvbShwaWNEYXRhLnNwbGl0KFwiLFwiKVsxXSwgXCJiYXNlNjRcIik7XG5cdFx0bGV0IG1vZGVyYXRpb25QYXJhbXMgPSB7XG5cdFx0XHRcIkltYWdlXCI6IHsgXG5cdFx0XHRcdFwiQnl0ZXNcIjogaW1nQnl0ZXMsXG5cdFx0XHR9LFxuXHRcdFx0XCJNaW5Db25maWRlbmNlXCI6IDUwLFxuXHRcdH07XG5cdFx0bGV0IGxhYmVsUGFyYW1zID0ge1xuXHRcdFx0XCJJbWFnZVwiOiB7IFxuXHRcdFx0XHRcIkJ5dGVzXCI6IGltZ0J5dGVzLFxuXHRcdFx0fSxcblx0XHRcdFwiTWF4TGFiZWxzXCI6IDIwLFxuXHRcdFx0XCJNaW5Db25maWRlbmNlXCI6IDc1LFxuXHRcdH07XG5cdFx0bGV0IGZhY2VQYXJhbXMgPSB7XG5cdFx0XHRcIkltYWdlXCI6IHsgXG5cdFx0XHRcdFwiQnl0ZXNcIjogaW1nQnl0ZXMsXG5cdFx0XHR9LFxuICBcdFx0XHRcIkF0dHJpYnV0ZXNcIjogW1wiQUxMXCJdLFxuXHRcdH07XG5cdFx0Ly8gY3JlYXRlIHJlcXVlc3Qgb2JqZWN0c1xuXHRcdGxldCBtb2RlcmF0aW9uUmVxdWVzdCA9IHJla29nbml0aW9uLmRldGVjdE1vZGVyYXRpb25MYWJlbHMobW9kZXJhdGlvblBhcmFtcyk7XG5cdFx0bGV0IGxhYmVsUmVxdWVzdCA9IHJla29nbml0aW9uLmRldGVjdExhYmVscyhsYWJlbFBhcmFtcyk7XG5cdFx0bGV0IGZhY2VSZXF1ZXN0ID0gcmVrb2duaXRpb24uZGV0ZWN0RmFjZXMoZmFjZVBhcmFtcyk7XG5cdFx0Ly8gY3JlYXRlIHByb21pc2VzXG5cdFx0bGV0IHByb21pc2UxID0gbW9kZXJhdGlvblJlcXVlc3QucHJvbWlzZSgpO1xuXHRcdGxldCBwcm9taXNlMiA9IGxhYmVsUmVxdWVzdC5wcm9taXNlKCk7XG5cdFx0bGV0IHByb21pc2UzID0gZmFjZVJlcXVlc3QucHJvbWlzZSgpO1xuXHRcdC8vIEZ1bGZpbGwgcHJvbWlzZXMgaW4gcGFyYWxsZWxcblx0XHRsZXQgcmVzcG9uc2UgPSBQcm9taXNlLmFsbChbXG5cdFx0XHRwcm9taXNlMS5jYXRjaChlcnJvciA9PiB7IHRocm93IG5ldyBNZXRlb3IuRXJyb3IoZXJyb3IuY29kZSwgZXJyb3IubWVzc2FnZSwgZXJyb3IpO3JldHVybiBlcnJvcjsgfSksXG5cdFx0XHRwcm9taXNlMi5jYXRjaChlcnJvciA9PiB7IHRocm93IG5ldyBNZXRlb3IuRXJyb3IoZXJyb3IuY29kZSwgZXJyb3IubWVzc2FnZSwgZXJyb3IpO3JldHVybiBlcnJvcjsgfSksXG5cdFx0XHRwcm9taXNlMy5jYXRjaChlcnJvciA9PiB7IHRocm93IG5ldyBNZXRlb3IuRXJyb3IoZXJyb3IuY29kZSwgZXJyb3IubWVzc2FnZSwgZXJyb3IpO3JldHVybiBlcnJvcjsgfSksXG5cdFx0XSkudGhlbih2YWx1ZXMgPT4ge1xuXHRcdFx0Y29uc29sZS5sb2codmFsdWVzWzBdKTtcblx0XHRcdGNvbnNvbGUubG9nKHZhbHVlc1sxXSk7XG5cdFx0XHRjb25zb2xlLmxvZyh2YWx1ZXNbMl0pO1xuXHRcdFx0bGV0IHQxID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG5cdFx0XHRjb25zb2xlLmxvZyhgUmVzcG9uc2UgdG9vayAke3QxIC0gdDB9IG1zYCk7XG5cdFx0XHRsZXQgc2VhcmNoX3Jlc3VsdHMgPSB7XG5cdFx0XHRcdG1vZGVyYXRpb246IHZhbHVlc1swXS5Nb2RlcmF0aW9uTGFiZWxzLFxuXHRcdFx0XHRsYWJlbHM6IHZhbHVlc1sxXS5MYWJlbHMsXG5cdFx0XHRcdGZhY2VEZXRhaWxzOiB2YWx1ZXNbMl0uRmFjZURldGFpbHNcblx0XHRcdH07XG5cdFx0XHRsZXQgc2VhcmNoID0ge1xuXHRcdFx0XHRzZWFyY2hfaW1hZ2U6IHBpY0RhdGEsXG5cdFx0XHRcdHNlYXJjaF9yZXN1bHRzOiBzZWFyY2hfcmVzdWx0c1xuXHRcdFx0fTtcblx0XHRcdGxldCBzYXZlU2VhcmNoID0gU2VhcmNoZXMuaW5zZXJ0KHNlYXJjaCk7XG5cdFx0XHRjb25zb2xlLmxvZyhzYXZlU2VhcmNoKTtcblx0XHRcdHJldHVybiB2YWx1ZXM7XG5cdFx0fSkuY2F0Y2goZXJyb3IgPT4ge1xuXHRcdFx0Y29uc29sZS5sb2coJ2NhdWdodCBlcnJvciEnKTtcblx0XHRcdGNvbnNvbGUubG9nKGVycm9yKTtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoZXJyb3IuZXJyb3IsIGVycm9yLnJlYXNvbiwgZXJyb3IuZGV0YWlscyk7XG5cdFx0fSkuZmluYWxseSgoKSA9PiB7XG5cdFx0XHRjb25zb2xlLmxvZygnZmluYWxseScpO1xuXHRcdFx0Y29uc29sZS5sb2codGhpcyk7XG5cdFx0fSk7XG5cdFx0Y29uc29sZS5sb2cocmVzcG9uc2UpO1xuXHRcdGxldCB0MSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXHRcdGNvbnNvbGUubG9nKGBSZXF1ZXN0IHRvb2sgJHt0MSAtIHQwfSBtc2ApO1xuXHRcdHJldHVybiByZXNwb25zZTtcblx0fVxufSlcblxuLy8gRGVmaW5lIGEgcnVsZSB0byBsaW1pdCBtZXRob2QgY2FsbHNcbmxldCBydW5TY2FuUnVsZSA9IHtcblx0dHlwZTogJ21ldGhvZCcsXG5cdG5hbWU6ICdtb21lbnQuc2Nhbidcbn07XG4vLyBBZGQgdGhlIHJ1bGUsIGFsbG93aW5nIHVwIHRvIDEgc2NhbiBldmVyeSAxMCBzZWNvbmRzXG5ERFBSYXRlTGltaXRlci5hZGRSdWxlKHJ1blNjYW5SdWxlLCAxLCAxMDAwMCk7IiwiaW1wb3J0IHsgRERQUmF0ZUxpbWl0ZXIgfSBmcm9tICdtZXRlb3IvZGRwLXJhdGUtbGltaXRlcic7XG5cbmltcG9ydCB7IFNlYXJjaGVzIH0gZnJvbSAnLi9zZWFyY2hlcy5qcyc7XG5cblxuTWV0ZW9yLnB1Ymxpc2goJ3NlYXJjaGVzLmdldCcsIGZ1bmN0aW9uKHNlYXJjaElkPScnKSB7XG5cdGNoZWNrKHNlYXJjaElkLFN0cmluZyk7XG5cdHNlYXJjaElkID0gc2VhcmNoSWQgfHwge307XG4gIFx0Ly8gY29uc29sZS5sb2coU2VhcmNoZXMuZmluZChzZWFyY2hJZCkuY291bnQoKSk7XG5cdHJldHVybiBTZWFyY2hlcy5maW5kKFxuXHRcdHNlYXJjaElkLCBcblx0ICB7IFxuXHQgIFx0c29ydDogeyBjcmVhdGVkOiAtMSB9IFxuXHR9XG5cdCwge1xuXHRcdGZpZWxkczogU2VhcmNoZXMucHVibGljRmllbGRzXG5cdH0pO1xufSk7XG5cbi8vIERlZmluZSBhIHJ1bGUgdG8gbGltaXQgc3Vic2NyaXB0aW9uIGNhbGxzXG52YXIgc3Vic2NyaWJlVG9TZWFyY2hlc1J1bGUgPSB7XG4gIHR5cGU6ICdzdWJzY3JpcHRpb24nLFxuICBuYW1lOiAnc2VhcmNoZXMuZ2V0J1xufVxuLy8gQWRkIHRoZSBydWxlLCBhbGxvd2luZyB1cCB0byAxIHN1YnNjcmlwdGlvbiBldmVyeSA1IHNlY29uZHMuXG5ERFBSYXRlTGltaXRlci5hZGRSdWxlKHN1YnNjcmliZVRvU2VhcmNoZXNSdWxlLCAxLCA1MDAwKTsiLCJpbXBvcnQgeyBNb25nbyB9IGZyb20gJ21ldGVvci9tb25nbyc7XG5pbXBvcnQgeyBTaW1wbGVTY2hlbWEgfSBmcm9tICdtZXRlb3IvYWxkZWVkOnNpbXBsZS1zY2hlbWEnO1xuXG5cblxuZXhwb3J0IGNvbnN0IFNlYXJjaGVzID0gbmV3IE1ldGVvci5Db2xsZWN0aW9uKCdzZWFyY2hlcycpO1xuXG4vLyBEZW55IGFsbCBjbGllbnQtc2lkZSB1cGRhdGVzIHNpbmNlIHdlIHdpbGwgYmUgdXNpbmcgbWV0aG9kcyB0byBtYW5hZ2UgdGhpcyBjb2xsZWN0aW9uXG5TZWFyY2hlcy5kZW55KHtcbiAgaW5zZXJ0KCkgeyByZXR1cm4gdHJ1ZTsgfSxcbiAgdXBkYXRlKCkgeyByZXR1cm4gdHJ1ZTsgfSxcbiAgcmVtb3ZlKCkgeyByZXR1cm4gdHJ1ZTsgfSxcbn0pO1xuXG5TZWFyY2hlcy5TY2hlbWEgPSBuZXcgU2ltcGxlU2NoZW1hKHtcbiAgLy8gc2NoZW1hIHJ1bGVzXG4gIFwic2VhcmNoX3R5cGVcIjoge1xuICAgIHR5cGU6IFtTdHJpbmddLFxuICAgIGxhYmVsOiBcIlNlYXJjaCB0eXBlc1wiLFxuICAgIG9wdGlvbmFsOiBmYWxzZSxcbiAgICBhbGxvd2VkVmFsdWVzOiBbXCJtb2RlcmF0aW9uXCIsIFwibGFiZWxcIiwgXCJmYWNlXCIsIFwiY29sbGVjdGlvblwiXSxcbiAgICBkZWZhdWx0VmFsdWU6IFtcIm1vZGVyYXRpb25cIiwgXCJsYWJlbFwiLCBcImZhY2VcIl1cbiAgfSxcbiAgXCJzZWFyY2hfY29sbGVjdGlvbnNcIjoge1xuICAgIHR5cGU6IFtTdHJpbmddLFxuICAgIGxhYmVsOiBcIkNvbGxlY3Rpb25zIHRvIHNlYXJjaFwiLFxuICAgIG9wdGlvbmFsOiB0cnVlLFxuICAgIGRlZmF1bHRWYWx1ZTogW1wiXCJdXG4gIH0sXG4gIFwic2VhcmNoX2ltYWdlXCI6IHtcbiAgICB0eXBlOiBTdHJpbmcsXG4gICAgbGFiZWw6IFwiSW1hZ2UgdG8gc2VhcmNoXCIsXG4gICAgb3B0aW9uYWw6IHRydWUsXG4gICAgZGVmYXVsdFZhbHVlOiBcIlwiXG4gIH0sXG4gIFwic2VhcmNoX3Jlc3VsdHNcIjoge1xuICAgIHR5cGU6IE9iamVjdCxcbiAgICBsYWJlbDogXCJPYmplY3Qgb2Ygc2VhcmNoIHR5cGVzXCIsXG4gICAgb3B0aW9uYWw6IHRydWUsXG4gICAgYmxhY2tib3g6IHRydWUsXG4gICAgZGVmYXVsdFZhbHVlOiB7fVxuICB9LFxuICBcImZhY2VzXCI6IHtcbiAgICB0eXBlOiBbT2JqZWN0XSxcbiAgICBsYWJlbDogXCJGYWNlIG9iamVjdHMgZm91bmQgaW4gaW1hZ2VcIixcbiAgICBvcHRpb25hbDogdHJ1ZSxcbiAgICBibGFja2JveDogdHJ1ZSxcbiAgICBkZWZhdWx0VmFsdWU6IFtdXG4gIH0sXG4gIFwiY3JlYXRlZFwiOiB7XG4gICAgdHlwZTogRGF0ZSxcbiAgICBsYWJlbDogXCJEYXRlIHNlYXJjaCBwZXJmb3JtZWRcIixcbiAgICBhdXRvVmFsdWU6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCB0aGlzLmlzSW5zZXJ0ICkge1xuICAgICAgICByZXR1cm4gbmV3IERhdGU7XG4gICAgICB9IFxuICAgIH0sXG4gICAgb3B0aW9uYWw6IHRydWUsXG4gICAgLy9pbmRleDogdHJ1ZVxuICB9LFxuICBcInVwZGF0ZWRcIjoge1xuICAgIHR5cGU6IERhdGUsXG4gICAgbGFiZWw6IFwiRGF0ZSBzZWFyY2ggdXBkYXRlZFwiLFxuICAgIGF1dG9WYWx1ZTogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoIHRoaXMuaXNVcGRhdGUgKSB7XG4gICAgICAgIHJldHVybiBuZXcgRGF0ZTtcbiAgICAgIH0gXG4gICAgfSxcbiAgICBvcHRpb25hbDogdHJ1ZVxuICB9XG59KTtcblxuU2VhcmNoZXMuYXR0YWNoU2NoZW1hKCBTZWFyY2hlcy5TY2hlbWEgKTtcblxuaWYoTWV0ZW9yLmlzU2VydmVyKXtcbiAgTWV0ZW9yLnN0YXJ0dXAoKCkgPT4ge1xuICAgIFNlYXJjaGVzLl9lbnN1cmVJbmRleCh7XG4gICAgICAgIGNyZWF0ZWQ6IC0xLFxuICAgIH0pO1xuICAgIC8vIFNlYXJjaGVzLl9lbnN1cmVJbmRleCh7IHNlYXJjaF9pbWFnZTogMX0pO1xuICB9KTtcbn1cblxuU2VhcmNoZXMucHVibGljRmllbGRzID0ge1xuICBzZWFyY2hfaWQ6IDEsXG4gIHNlYXJjaF90eXBlOiAxLFxuICBzZWFyY2hfY29sbGVjdGlvbnM6IDEsXG4gIHNlYXJjaF9pbWFnZTogMSxcbiAgc2VhcmNoX3Jlc3VsdHM6IDEsXG4gIGNyZWF0ZWQ6IDEsXG4gIHVwZGF0ZWQ6IDFcbn07XG5cbi8vIFNlYXJjaGVzLmhlbHBlcnMoe1xuLy8gICAvLyBBIGNvbGxlY3Rpb25zIGlzIGNvbnNpZGVyZWQgdG8gYmUgcHJpdmF0ZSBpZiBcInByaXZhdGVcIiBpcyBzZXQgdG8gdHJ1ZVxuLy8gICBpc1ByaXZhdGUoKSB7XG4vLyAgICAgcmV0dXJuIHRoaXMucHJpdmF0ZTtcbi8vICAgfVxuLy8gfSk7IiwiaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5pbXBvcnQgeyBDb2xsZWN0aW9ucyB9IGZyb20gJy4uLy4uL2FwaS9jb2xsZWN0aW9ucy9jb2xsZWN0aW9ucy5qcyc7XG5pbXBvcnQgeyBQcmludHMgfSBmcm9tICcuLi8uLi9hcGkvcHJpbnRzL3ByaW50cy5qcyc7XG5pbXBvcnQgeyBTZWFyY2hlcyB9IGZyb20gJy4uLy4uL2FwaS9zZWFyY2hlcy9zZWFyY2hlcy5qcyc7XG5cbi8vIGlmIHRoZSBkYXRhYmFzZSBpcyBlbXB0eSBvbiBzZXJ2ZXIgc3RhcnQsIGNyZWF0ZSBzb21lIHNhbXBsZSBkYXRhLlxuXG5NZXRlb3Iuc3RhcnR1cCgoKSA9PiB7XG4gIGlmIChQcmludHMuZmluZCgpLmNvdW50KCkgPCAxNSkge1xuICAgIGNvbnNvbGUubG9nKFwic2VlZGluZyBwcmludHMuLi5cIik7XG4gICAgbGV0IHNlZWRQcmludHMgPSBbXVxuICAgIF8udGltZXMoNSwgKCk9PntcbiAgICAgIGxldCBwcmludCA9IHtcbiAgICAgICAgcHJpbnRfYWRkZXI6IHRoaXMudXNlcklkIHx8IFwiZGVkZWRcIixcbiAgICAgICAgcHJpbnRfY29sbGVjdGlvbjogXCJwZW9wbGVcIixcbiAgICAgICAgcHJpbnRfbmFtZTogZmFrZXIuaGVscGVycy51c2VyQ2FyZCgpLm5hbWUsXG4gICAgICAgIHByaW50X2lkOiBmYWtlci5yYW5kb20udXVpZCgpLFxuICAgICAgICBwcmludF9pbWc6IGZha2VyLmltYWdlLmF2YXRhcigpXG4gICAgICB9O1xuICAgICAgbGV0IHByaW50SWQgPSBQcmludHMuaW5zZXJ0KHByaW50KTtcbiAgICAgIHNlZWRQcmludHMucHVzaChwcmludElkKTtcbiAgICB9KTtcbiAgICBjb25zb2xlLmxvZyhzZWVkUHJpbnRzKTtcblxuICB9O1xufSk7IiwiLypcbiAqIENvcHlyaWdodCAyMDE3LXByZXNlbnQgQW50bW91bmRzLmNvbSwgSW5jLiBvciBpdHMgYWZmaWxpYXRlcy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgR05VIEFmZmVybyBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlLCB2ZXJzaW9uIDMuMCAodGhlIFwiTGljZW5zZVwiKS4gWW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoXG4gKiB0aGUgTGljZW5zZS4gQSBjb3B5IG9mIHRoZSBMaWNlbnNlIGlzIGxvY2F0ZWQgYXRcbiAqXG4gKiAgICAgaHR0cHM6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy9hZ3BsLTMuMC5lbi5odG1sXG4gKlxuICogb3IgaW4gdGhlIFwibGljZW5zZVwiIGZpbGUgYWNjb21wYW55aW5nIHRoaXMgZmlsZS4gVGhpcyBmaWxlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SXG4gKiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnNcbiAqIGFuZCBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5pbXBvcnQgeyBIVFRQIH0gZnJvbSAnbWV0ZW9yL2h0dHAnO1xuLy8gaW1wb3J0ICcuLi9hY2NvdW50cy1jb25maWcuanMnO1xuaW1wb3J0ICcuL2ZpeHR1cmVzLmpzJztcbi8vIFRoaXMgZGVmaW5lcyBhbGwgdGhlIGNvbGxlY3Rpb25zLCBwdWJsaWNhdGlvbnMgYW5kIG1ldGhvZHMgdGhhdCB0aGUgYXBwbGljYXRpb24gcHJvdmlkZXNcbi8vIGFzIGFuIEFQSSB0byB0aGUgY2xpZW50LlxuaW1wb3J0ICcuL3JlZ2lzdGVyLWFwaS5qcyc7XG5cbmNvbnN0IG9zID0gcmVxdWlyZSgnb3MnKTtcblxuXG5zZXJ2ZXJfbW9kZSA9IE1ldGVvci5pc1Byb2R1Y3Rpb24gPyBcIlBST0RVQ1RJT05cIiA6IFwiREVWRUxPUE1FTlRcIjtcbmNvbnNvbGUubG9nKCdpbmRleC5qczogJyArIHNlcnZlcl9tb2RlICsgXCItLT5cIiArIEpTT04uc3RyaW5naWZ5KE1ldGVvci5zZXR0aW5ncykpO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cblx0aW5mbygpe1xuXHRcdHJldHVybiBgdmVyc2lvbjogMC45LjAgLSBidWlsZDogJHtwcm9jZXNzLmVudi5CVUlMRCB8fCAnZGV2J30gLSBob3N0bmFtZTogJHtvcy5ob3N0bmFtZSgpfWA7XG5cdH0sXG5cblx0YXN5bmMgZ2V0RGF0YSgpeyAgICBcblx0XHR0cnl7XG5cdFx0XHR2YXIgcmVzcG9uc2UgPSB7fTtcblx0XHRcdGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBIVFRQLmNhbGwoJ0dFVCcsICdodHRwOi8vanNvbnBsYWNlaG9sZGVyLnR5cGljb2RlLmNvbS9wb3N0cycpO1x0XG5cdFx0XHRjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShyZXN1bHRzLmRhdGFbMF0pKTtcdFxuXHRcdFx0Y29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkocmVzdWx0cy5oZWFkZXJzKSk7XG5cdFx0XHRyZXNwb25zZS5jb2RlID0gdHJ1ZTtcdFx0XG5cdFx0XHRyZXNwb25zZS5kYXRhID0gcmVzdWx0cztcdFxuXHRcdH0gY2F0Y2goZSl7XG5cdFx0XHRyZXNwb25zZSA9IGZhbHNlO1xuXHRcdFx0Y29uc29sZS5sb2coZSk7XG5cdFx0fSBmaW5hbGx5IHtcblx0XHRcdGNvbnNvbGUubG9nKFwiZmluYWxseS4uLlwiKVxuXHRcdFx0Ly90aHJvdyBuZXcgTWV0ZW9yLkVycm9yKFwiaW5hcHByb3ByaWF0ZS1waWNcIixcIlRoZSB1c2VyIGhhcyB0YWtlbiBhbiBpbmFwcHJvcHJpYXRlIHBpY3R1cmUuXCIpO1x0XG5cdFx0XHRyZXR1cm4gcmVzcG9uc2U7XG5cdFx0fVxuXHR9XG5cbn0pO1xuXG5NZXRlb3Iub25Db25uZWN0aW9uKChjb25uZWN0aW9uKT0+e1xuXHRsZXQgY2xpZW50QWRkciA9IGNvbm5lY3Rpb24uY2xpZW50QWRkcmVzcztcblx0bGV0IGhlYWRlcnMgPSBjb25uZWN0aW9uLmh0dHBIZWFkZXJzO1xuXHRjb25zb2xlLmxvZyhgY29ubmVjdGlvbiBmcm9tICR7Y2xpZW50QWRkcn1gKTtcblx0Ly8gY29uc29sZS5sb2coaGVhZGVycyk7XG59KSIsImltcG9ydCAnLi4vLi4vYXBpL2NvbGxlY3Rpb25zL21ldGhvZHMuanMnO1xuaW1wb3J0ICcuLi8uLi9hcGkvY29sbGVjdGlvbnMvcHVibGljYXRpb25zLmpzJztcbmltcG9ydCAnLi4vLi4vYXBpL3NlYXJjaGVzL21ldGhvZHMuanMnO1xuaW1wb3J0ICcuLi8uLi9hcGkvc2VhcmNoZXMvcHVibGljYXRpb25zLmpzJztcbmltcG9ydCAnLi4vLi4vYXBpL3ByaW50cy9tZXRob2RzLmpzJztcbmltcG9ydCAnLi4vLi4vYXBpL3ByaW50cy9wdWJsaWNhdGlvbnMuanMnOyIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNy1wcmVzZW50IEFudG1vdW5kcy5jb20sIEluYy4gb3IgaXRzIGFmZmlsaWF0ZXMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEdOVSBBZmZlcm8gR2VuZXJhbCBQdWJsaWMgTGljZW5zZSwgdmVyc2lvbiAzLjAgKHRoZSBcIkxpY2Vuc2VcIikuIFlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aFxuICogdGhlIExpY2Vuc2UuIEEgY29weSBvZiB0aGUgTGljZW5zZSBpcyBsb2NhdGVkIGF0XG4gKlxuICogICAgIGh0dHBzOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvYWdwbC0zLjAuZW4uaHRtbFxuICpcbiAqIG9yIGluIHRoZSBcImxpY2Vuc2VcIiBmaWxlIGFjY29tcGFueWluZyB0aGlzIGZpbGUuIFRoaXMgZmlsZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUlxuICogQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zXG4gKiBhbmQgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbmltcG9ydCAnLi4vaW1wb3J0cy9zdGFydHVwL3NlcnZlcic7XG5cbk1ldGVvci5zdGFydHVwKCgpID0+IHtcbiAgLy8gY29kZSB0byBydW4gb24gc2VydmVyIGF0IHN0YXJ0dXBcbn0pO1xuIl19
