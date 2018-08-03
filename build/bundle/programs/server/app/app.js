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
    defaultValue: "Collection ID"
  },
  "collection_name": {
    type: String,
    label: "Collection Name",
    optional: false,
    defaultValue: "MyCollection"
  },
  "collection_type": {
    type: String,
    label: "Collection type",
    optional: false,
    allowedValues: ["face", "voice"],
    defaultValue: "face"
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
  created: 1,
  updated: 1
}; // Collections.helpers({
//   // A collections is considered to be private if "private" is set to true
//   isPrivate() {
//     return this.private;
//   }
// });
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
  collectionId = collectionId || {};
  console.log(Collections.find(collectionId).count());
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
  searchId = searchId || {};
  console.log(Searches.find(searchId).count());
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

}}},"startup":{"server":{"index.js":function(require,exports,module){

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
module.watch(require("./register-api.js"));

// import './fixtures.js';
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
module.watch(require("../../api/collections/publications.js"));
module.watch(require("../../api/searches/methods.js"));
module.watch(require("../../api/searches/publications.js"));
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvY29sbGVjdGlvbnMvY29sbGVjdGlvbnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL2NvbGxlY3Rpb25zL3B1YmxpY2F0aW9ucy5qcyIsIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvc2VhcmNoZXMvbWV0aG9kcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvc2VhcmNoZXMvcHVibGljYXRpb25zLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9pbXBvcnRzL2FwaS9zZWFyY2hlcy9zZWFyY2hlcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9zdGFydHVwL3NlcnZlci9pbmRleC5qcyIsIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9zdGFydHVwL3NlcnZlci9yZWdpc3Rlci1hcGkuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3NlcnZlci9tYWluLmpzIl0sIm5hbWVzIjpbIm1vZHVsZSIsImV4cG9ydCIsIkNvbGxlY3Rpb25zIiwiTW9uZ28iLCJ3YXRjaCIsInJlcXVpcmUiLCJ2IiwiU2ltcGxlU2NoZW1hIiwiTWV0ZW9yIiwiQ29sbGVjdGlvbiIsImRlbnkiLCJpbnNlcnQiLCJ1cGRhdGUiLCJyZW1vdmUiLCJTY2hlbWEiLCJ0eXBlIiwiU3RyaW5nIiwibGFiZWwiLCJvcHRpb25hbCIsImRlZmF1bHRWYWx1ZSIsImFsbG93ZWRWYWx1ZXMiLCJEYXRlIiwiYXV0b1ZhbHVlIiwiaXNJbnNlcnQiLCJpc1VwZGF0ZSIsImF0dGFjaFNjaGVtYSIsInB1YmxpY0ZpZWxkcyIsImNvbGxlY3Rpb25faWQiLCJjb2xsZWN0aW9uX25hbWUiLCJjb2xsZWN0aW9uX3R5cGUiLCJjcmVhdGVkIiwidXBkYXRlZCIsIkREUFJhdGVMaW1pdGVyIiwicHVibGlzaCIsImNvbGxlY3Rpb25JZCIsImNoZWNrIiwiY29uc29sZSIsImxvZyIsImZpbmQiLCJjb3VudCIsInNvcnQiLCJmaWVsZHMiLCJzdWJzY3JpYmVUb0NvbGxlY3Rpb25zUnVsZSIsIm5hbWUiLCJhZGRSdWxlIiwiQVdTIiwiZGVmYXVsdCIsIlNlYXJjaGVzIiwiY29uZmlnIiwicmVnaW9uIiwicmVrb2duaXRpb24iLCJSZWtvZ25pdGlvbiIsIm1ldGhvZHMiLCJwaWNEYXRhIiwidDAiLCJnZXRUaW1lIiwiaW1nQnl0ZXMiLCJCdWZmZXIiLCJmcm9tIiwic3BsaXQiLCJtb2RlcmF0aW9uUGFyYW1zIiwibGFiZWxQYXJhbXMiLCJmYWNlUGFyYW1zIiwibW9kZXJhdGlvblJlcXVlc3QiLCJkZXRlY3RNb2RlcmF0aW9uTGFiZWxzIiwibGFiZWxSZXF1ZXN0IiwiZGV0ZWN0TGFiZWxzIiwiZmFjZVJlcXVlc3QiLCJkZXRlY3RGYWNlcyIsInByb21pc2UxIiwicHJvbWlzZSIsInByb21pc2UyIiwicHJvbWlzZTMiLCJyZXNwb25zZSIsIlByb21pc2UiLCJhbGwiLCJjYXRjaCIsImVycm9yIiwiRXJyb3IiLCJjb2RlIiwibWVzc2FnZSIsInRoZW4iLCJ2YWx1ZXMiLCJ0MSIsInNlYXJjaF9yZXN1bHRzIiwibW9kZXJhdGlvbiIsIk1vZGVyYXRpb25MYWJlbHMiLCJsYWJlbHMiLCJMYWJlbHMiLCJmYWNlRGV0YWlscyIsIkZhY2VEZXRhaWxzIiwic2VhcmNoIiwic2VhcmNoX2ltYWdlIiwic2F2ZVNlYXJjaCIsInJlYXNvbiIsImRldGFpbHMiLCJmaW5hbGx5IiwicnVuU2NhblJ1bGUiLCJzZWFyY2hJZCIsInN1YnNjcmliZVRvU2VhcmNoZXNSdWxlIiwiT2JqZWN0IiwiYmxhY2tib3giLCJpc1NlcnZlciIsInN0YXJ0dXAiLCJfZW5zdXJlSW5kZXgiLCJzZWFyY2hfaWQiLCJzZWFyY2hfdHlwZSIsInNlYXJjaF9jb2xsZWN0aW9ucyIsIkhUVFAiLCJvcyIsInNlcnZlcl9tb2RlIiwiaXNQcm9kdWN0aW9uIiwiSlNPTiIsInN0cmluZ2lmeSIsInNldHRpbmdzIiwiaW5mbyIsInByb2Nlc3MiLCJlbnYiLCJCVUlMRCIsImhvc3RuYW1lIiwiZ2V0RGF0YSIsInJlc3VsdHMiLCJjYWxsIiwiZGF0YSIsImhlYWRlcnMiLCJlIiwib25Db25uZWN0aW9uIiwiY29ubmVjdGlvbiIsImNsaWVudEFkZHIiLCJjbGllbnRBZGRyZXNzIiwiaHR0cEhlYWRlcnMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQUFBLE9BQU9DLE1BQVAsQ0FBYztBQUFDQyxlQUFZLE1BQUlBO0FBQWpCLENBQWQ7QUFBNkMsSUFBSUMsS0FBSjtBQUFVSCxPQUFPSSxLQUFQLENBQWFDLFFBQVEsY0FBUixDQUFiLEVBQXFDO0FBQUNGLFFBQU1HLENBQU4sRUFBUTtBQUFDSCxZQUFNRyxDQUFOO0FBQVE7O0FBQWxCLENBQXJDLEVBQXlELENBQXpEO0FBQTRELElBQUlDLFlBQUo7QUFBaUJQLE9BQU9JLEtBQVAsQ0FBYUMsUUFBUSw2QkFBUixDQUFiLEVBQW9EO0FBQUNFLGVBQWFELENBQWIsRUFBZTtBQUFDQyxtQkFBYUQsQ0FBYjtBQUFlOztBQUFoQyxDQUFwRCxFQUFzRixDQUF0RjtBQUs3SCxNQUFNSixjQUFjLElBQUlNLE9BQU9DLFVBQVgsQ0FBc0IsYUFBdEIsQ0FBcEI7QUFFUDtBQUNBUCxZQUFZUSxJQUFaLENBQWlCO0FBQ2ZDLFdBQVM7QUFBRSxXQUFPLElBQVA7QUFBYyxHQURWOztBQUVmQyxXQUFTO0FBQUUsV0FBTyxJQUFQO0FBQWMsR0FGVjs7QUFHZkMsV0FBUztBQUFFLFdBQU8sSUFBUDtBQUFjOztBQUhWLENBQWpCO0FBTUFYLFlBQVlZLE1BQVosR0FBcUIsSUFBSVAsWUFBSixDQUFpQjtBQUNwQztBQUNBLG1CQUFpQjtBQUNmUSxVQUFNQyxNQURTO0FBRWZDLFdBQU8sZUFGUTtBQUdmQyxjQUFVLEtBSEs7QUFJZkMsa0JBQWM7QUFKQyxHQUZtQjtBQVFwQyxxQkFBbUI7QUFDakJKLFVBQU1DLE1BRFc7QUFFakJDLFdBQU8saUJBRlU7QUFHakJDLGNBQVUsS0FITztBQUlqQkMsa0JBQWM7QUFKRyxHQVJpQjtBQWNwQyxxQkFBbUI7QUFDakJKLFVBQU1DLE1BRFc7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YSxtQkFBa0IyRixVQUFXLEVBQTFDLEVBSGlDLENBSWpDO0FBQ0EsQ0FMRCxFOzs7Ozs7Ozs7OztBQ3JEQWhJLE9BQU9JLEtBQVAsQ0FBYUMsUUFBUSx1Q0FBUixDQUFiO0FBQStETCxPQUFPSSxLQUFQLENBQWFDLFFBQVEsK0JBQVIsQ0FBYjtBQUF1REwsT0FBT0ksS0FBUCxDQUFhQyxRQUFRLG9DQUFSLENBQWIsRTs7Ozs7Ozs7Ozs7QUNBdEhMLE9BQU9JLEtBQVAsQ0FBYUMsUUFBUSwyQkFBUixDQUFiO0FBY0FHLE9BQU8rRixPQUFQLENBQWUsTUFBTSxDQUNuQjtBQUNELENBRkQsRSIsImZpbGUiOiIvYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTW9uZ28gfSBmcm9tICdtZXRlb3IvbW9uZ28nO1xuaW1wb3J0IHsgU2ltcGxlU2NoZW1hIH0gZnJvbSAnbWV0ZW9yL2FsZGVlZDpzaW1wbGUtc2NoZW1hJztcblxuXG5cbmV4cG9ydCBjb25zdCBDb2xsZWN0aW9ucyA9IG5ldyBNZXRlb3IuQ29sbGVjdGlvbignY29sbGVjdGlvbnMnKTtcblxuLy8gRGVueSBhbGwgY2xpZW50LXNpZGUgdXBkYXRlcyBzaW5jZSB3ZSB3aWxsIGJlIHVzaW5nIG1ldGhvZHMgdG8gbWFuYWdlIHRoaXMgY29sbGVjdGlvblxuQ29sbGVjdGlvbnMuZGVueSh7XG4gIGluc2VydCgpIHsgcmV0dXJuIHRydWU7IH0sXG4gIHVwZGF0ZSgpIHsgcmV0dXJuIHRydWU7IH0sXG4gIHJlbW92ZSgpIHsgcmV0dXJuIHRydWU7IH0sXG59KTtcblxuQ29sbGVjdGlvbnMuU2NoZW1hID0gbmV3IFNpbXBsZVNjaGVtYSh7XG4gIC8vIE91ciBzY2hlbWEgcnVsZXMgd2lsbCBnbyBoZXJlLlxuICBcImNvbGxlY3Rpb25faWRcIjoge1xuICAgIHR5cGU6IFN0cmluZyxcbiAgICBsYWJlbDogXCJDb2xsZWN0aW9uIElEXCIsXG4gICAgb3B0aW9uYWw6IGZhbHNlLFxuICAgIGRlZmF1bHRWYWx1ZTogXCJDb2xsZWN0aW9uIElEXCJcbiAgfSxcbiAgXCJjb2xsZWN0aW9uX25hbWVcIjoge1xuICAgIHR5cGU6IFN0cmluZyxcbiAgICBsYWJlbDogXCJDb2xsZWN0aW9uIE5hbWVcIixcbiAgICBvcHRpb25hbDogZmFsc2UsXG4gICAgZGVmYXVsdFZhbHVlOiBcIk15Q29sbGVjdGlvblwiXG4gIH0sXG4gIFwiY29sbGVjdGlvbl90eXBlXCI6IHtcbiAgICB0eXBlOiBTdHJpbmcsXG4gICAgbGFiZWw6IFwiQ29sbGVjdGlvbiB0eXBlXCIsXG4gICAgb3B0aW9uYWw6IGZhbHNlLFxuICAgIGFsbG93ZWRWYWx1ZXM6IFtcImZhY2VcIiwgXCJ2b2ljZVwiXSxcbiAgICBkZWZhdWx0VmFsdWU6IFwiZmFjZVwiXG4gIH0sXG4gIFwiY3JlYXRlZFwiOiB7XG4gICAgdHlwZTogRGF0ZSxcbiAgICBsYWJlbDogXCJEYXRlIGNvbGxlY3Rpb24gYWRkZWQgdG8gQW50ZW5uYWVcIixcbiAgICBhdXRvVmFsdWU6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCB0aGlzLmlzSW5zZXJ0ICkge1xuICAgICAgICByZXR1cm4gbmV3IERhdGU7XG4gICAgICB9IFxuICAgIH0sXG4gICAgb3B0aW9uYWw6IHRydWVcbiAgfSxcbiAgXCJ1cGRhdGVkXCI6IHtcbiAgICB0eXBlOiBEYXRlLFxuICAgIGxhYmVsOiBcIkRhdGUgY29sbGVjdGlvbiB1cGRhdGVkIGluIFN5c3RlbVwiLFxuICAgIGF1dG9WYWx1ZTogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoIHRoaXMuaXNVcGRhdGUgKSB7XG4gICAgICAgIHJldHVybiBuZXcgRGF0ZTtcbiAgICAgIH0gXG4gICAgfSxcbiAgICBvcHRpb25hbDogdHJ1ZVxuICB9XG59KTtcblxuQ29sbGVjdGlvbnMuYXR0YWNoU2NoZW1hKCBDb2xsZWN0aW9ucy5TY2hlbWEgKTsgXG5cblxuQ29sbGVjdGlvbnMucHVibGljRmllbGRzID0ge1xuICBjb2xsZWN0aW9uX2lkOiAxLFxuICBjb2xsZWN0aW9uX25hbWU6IDEsXG4gIGNvbGxlY3Rpb25fdHlwZTogMSxcbiAgY3JlYXRlZDogMSxcbiAgdXBkYXRlZDogMVxufTtcblxuLy8gQ29sbGVjdGlvbnMuaGVscGVycyh7XG4vLyAgIC8vIEEgY29sbGVjdGlvbnMgaXMgY29uc2lkZXJlZCB0byBiZSBwcml2YXRlIGlmIFwicHJpdmF0ZVwiIGlzIHNldCB0byB0cnVlXG4vLyAgIGlzUHJpdmF0ZSgpIHtcbi8vICAgICByZXR1cm4gdGhpcy5wcml2YXRlO1xuLy8gICB9XG4vLyB9KTsiLCJpbXBvcnQgeyBERFBSYXRlTGltaXRlciB9IGZyb20gJ21ldGVvci9kZHAtcmF0ZS1saW1pdGVyJztcblxuaW1wb3J0IHsgQ29sbGVjdGlvbnMgfSBmcm9tICcuL2NvbGxlY3Rpb25zLmpzJztcblxuXG5NZXRlb3IucHVibGlzaCgnY29sbGVjdGlvbnMuZ2V0JywgZnVuY3Rpb24oY29sbGVjdGlvbklkPScnKSB7XG5cdGNoZWNrKGNvbGxlY3Rpb25JZCxTdHJpbmcpO1xuXHRjb2xsZWN0aW9uSWQgPSBjb2xsZWN0aW9uSWQgfHwge307XG4gIFx0Y29uc29sZS5sb2coQ29sbGVjdGlvbnMuZmluZChjb2xsZWN0aW9uSWQpLmNvdW50KCkpO1xuXHRyZXR1cm4gQ29sbGVjdGlvbnMuZmluZChcblx0XHRjb2xsZWN0aW9uSWQsIFxuXHQgIHsgXG5cdCAgXHRzb3J0OiB7IGNyZWF0ZWQ6IC0xIH0gXG5cdH1cblx0LCB7XG5cdFx0ZmllbGRzOiBDb2xsZWN0aW9ucy5wdWJsaWNGaWVsZHNcblx0fSk7XG59KTtcblxuLy8gRGVmaW5lIGEgcnVsZSB0byBsaW1pdCBzdWJzY3JpcHRpb24gY2FsbHNcbnZhciBzdWJzY3JpYmVUb0NvbGxlY3Rpb25zUnVsZSA9IHtcbiAgdHlwZTogJ3N1YnNjcmlwdGlvbicsXG4gIG5hbWU6ICdjb2xsZWN0aW9ucy5nZXQnXG59XG4vLyBBZGQgdGhlIHJ1bGUsIGFsbG93aW5nIHVwIHRvIDEgc3Vic2NyaXB0aW9uIGV2ZXJ5IDUgc2Vjb25kcy5cbkREUFJhdGVMaW1pdGVyLmFkZFJ1bGUoc3Vic2NyaWJlVG9Db2xsZWN0aW9uc1J1bGUsIDEsIDUwMDApOyIsImltcG9ydCB7IEREUFJhdGVMaW1pdGVyIH0gZnJvbSAnbWV0ZW9yL2RkcC1yYXRlLWxpbWl0ZXInO1xuaW1wb3J0IEFXUyBmcm9tICdhd3Mtc2RrJztcblxuaW1wb3J0IHsgU2VhcmNoZXMgfSBmcm9tICcuL3NlYXJjaGVzLmpzJztcblxuQVdTLmNvbmZpZy5yZWdpb24gPSAndXMtZWFzdC0xJztcbnZhciByZWtvZ25pdGlvbiA9IG5ldyBBV1MuUmVrb2duaXRpb24oKTtcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXHRcInNlYXJjaC5mYWNlXCIocGljRGF0YSl7XG5cdFx0Ly9yZXR1cm4gMTtcblx0XHRjb25zb2xlLmxvZyhcIkFOQUxZWklORyBJTUFHRS4uLlwiKTtcblx0XHR2YXIgdDAgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcblx0XHRsZXQgaW1nQnl0ZXMgPSBuZXcgQnVmZmVyLmZyb20ocGljRGF0YS5zcGxpdChcIixcIilbMV0sIFwiYmFzZTY0XCIpO1xuXHRcdGxldCBtb2RlcmF0aW9uUGFyYW1zID0ge1xuXHRcdFx0XCJJbWFnZVwiOiB7IFxuXHRcdFx0XHRcIkJ5dGVzXCI6IGltZ0J5dGVzLFxuXHRcdFx0fSxcblx0XHRcdFwiTWluQ29uZmlkZW5jZVwiOiA1MCxcblx0XHR9O1xuXHRcdGxldCBsYWJlbFBhcmFtcyA9IHtcblx0XHRcdFwiSW1hZ2VcIjogeyBcblx0XHRcdFx0XCJCeXRlc1wiOiBpbWdCeXRlcyxcblx0XHRcdH0sXG5cdFx0XHRcIk1heExhYmVsc1wiOiAyMCxcblx0XHRcdFwiTWluQ29uZmlkZW5jZVwiOiA3NSxcblx0XHR9O1xuXHRcdGxldCBmYWNlUGFyYW1zID0ge1xuXHRcdFx0XCJJbWFnZVwiOiB7IFxuXHRcdFx0XHRcIkJ5dGVzXCI6IGltZ0J5dGVzLFxuXHRcdFx0fSxcbiAgXHRcdFx0XCJBdHRyaWJ1dGVzXCI6IFtcIkFMTFwiXSxcblx0XHR9O1xuXHRcdC8vIGNyZWF0ZSByZXF1ZXN0IG9iamVjdHNcblx0XHRsZXQgbW9kZXJhdGlvblJlcXVlc3QgPSByZWtvZ25pdGlvbi5kZXRlY3RNb2RlcmF0aW9uTGFiZWxzKG1vZGVyYXRpb25QYXJhbXMpO1xuXHRcdGxldCBsYWJlbFJlcXVlc3QgPSByZWtvZ25pdGlvbi5kZXRlY3RMYWJlbHMobGFiZWxQYXJhbXMpO1xuXHRcdGxldCBmYWNlUmVxdWVzdCA9IHJla29nbml0aW9uLmRldGVjdEZhY2VzKGZhY2VQYXJhbXMpO1xuXHRcdC8vIGNyZWF0ZSBwcm9taXNlc1xuXHRcdGxldCBwcm9taXNlMSA9IG1vZGVyYXRpb25SZXF1ZXN0LnByb21pc2UoKTtcblx0XHRsZXQgcHJvbWlzZTIgPSBsYWJlbFJlcXVlc3QucHJvbWlzZSgpO1xuXHRcdGxldCBwcm9taXNlMyA9IGZhY2VSZXF1ZXN0LnByb21pc2UoKTtcblx0XHQvLyBGdWxmaWxsIHByb21pc2VzIGluIHBhcmFsbGVsXG5cdFx0bGV0IHJlc3BvbnNlID0gUHJvbWlzZS5hbGwoW1xuXHRcdFx0cHJvbWlzZTEuY2F0Y2goZXJyb3IgPT4geyB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKGVycm9yLmNvZGUsIGVycm9yLm1lc3NhZ2UsIGVycm9yKTtyZXR1cm4gZXJyb3I7IH0pLFxuXHRcdFx0cHJvbWlzZTIuY2F0Y2goZXJyb3IgPT4geyB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKGVycm9yLmNvZGUsIGVycm9yLm1lc3NhZ2UsIGVycm9yKTtyZXR1cm4gZXJyb3I7IH0pLFxuXHRcdFx0cHJvbWlzZTMuY2F0Y2goZXJyb3IgPT4geyB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKGVycm9yLmNvZGUsIGVycm9yLm1lc3NhZ2UsIGVycm9yKTtyZXR1cm4gZXJyb3I7IH0pLFxuXHRcdF0pLnRoZW4odmFsdWVzID0+IHtcblx0XHRcdGNvbnNvbGUubG9nKHZhbHVlc1swXSk7XG5cdFx0XHRjb25zb2xlLmxvZyh2YWx1ZXNbMV0pO1xuXHRcdFx0Y29uc29sZS5sb2codmFsdWVzWzJdKTtcblx0XHRcdGxldCB0MSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXHRcdFx0Y29uc29sZS5sb2coYFJlc3BvbnNlIHRvb2sgJHt0MSAtIHQwfSBtc2ApO1xuXHRcdFx0bGV0IHNlYXJjaF9yZXN1bHRzID0ge1xuXHRcdFx0XHRtb2RlcmF0aW9uOiB2YWx1ZXNbMF0uTW9kZXJhdGlvbkxhYmVscyxcblx0XHRcdFx0bGFiZWxzOiB2YWx1ZXNbMV0uTGFiZWxzLFxuXHRcdFx0XHRmYWNlRGV0YWlsczogdmFsdWVzWzJdLkZhY2VEZXRhaWxzXG5cdFx0XHR9O1xuXHRcdFx0bGV0IHNlYXJjaCA9IHtcblx0XHRcdFx0c2VhcmNoX2ltYWdlOiBwaWNEYXRhLFxuXHRcdFx0XHRzZWFyY2hfcmVzdWx0czogc2VhcmNoX3Jlc3VsdHNcblx0XHRcdH07XG5cdFx0XHRsZXQgc2F2ZVNlYXJjaCA9IFNlYXJjaGVzLmluc2VydChzZWFyY2gpO1xuXHRcdFx0Y29uc29sZS5sb2coc2F2ZVNlYXJjaCk7XG5cdFx0XHRyZXR1cm4gdmFsdWVzO1xuXHRcdH0pLmNhdGNoKGVycm9yID0+IHtcblx0XHRcdGNvbnNvbGUubG9nKCdjYXVnaHQgZXJyb3IhJyk7XG5cdFx0XHRjb25zb2xlLmxvZyhlcnJvcik7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKGVycm9yLmVycm9yLCBlcnJvci5yZWFzb24sIGVycm9yLmRldGFpbHMpO1xuXHRcdH0pLmZpbmFsbHkoKCkgPT4ge1xuXHRcdFx0Y29uc29sZS5sb2coJ2ZpbmFsbHknKTtcblx0XHRcdGNvbnNvbGUubG9nKHRoaXMpO1xuXHRcdH0pO1xuXHRcdGNvbnNvbGUubG9nKHJlc3BvbnNlKTtcblx0XHRsZXQgdDEgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcblx0XHRjb25zb2xlLmxvZyhgUmVxdWVzdCB0b29rICR7dDEgLSB0MH0gbXNgKTtcblx0XHRyZXR1cm4gcmVzcG9uc2U7XG5cdH1cbn0pXG5cbi8vIERlZmluZSBhIHJ1bGUgdG8gbGltaXQgbWV0aG9kIGNhbGxzXG5sZXQgcnVuU2NhblJ1bGUgPSB7XG5cdHR5cGU6ICdtZXRob2QnLFxuXHRuYW1lOiAnbW9tZW50LnNjYW4nXG59O1xuLy8gQWRkIHRoZSBydWxlLCBhbGxvd2luZyB1cCB0byAxIHNjYW4gZXZlcnkgMTAgc2Vjb25kc1xuRERQUmF0ZUxpbWl0ZXIuYWRkUnVsZShydW5TY2FuUnVsZSwgMSwgMTAwMDApOyIsImltcG9ydCB7IEREUFJhdGVMaW1pdGVyIH0gZnJvbSAnbWV0ZW9yL2RkcC1yYXRlLWxpbWl0ZXInO1xuXG5pbXBvcnQgeyBTZWFyY2hlcyB9IGZyb20gJy4vc2VhcmNoZXMuanMnO1xuXG5cbk1ldGVvci5wdWJsaXNoKCdzZWFyY2hlcy5nZXQnLCBmdW5jdGlvbihzZWFyY2hJZD0nJykge1xuXHRjaGVjayhzZWFyY2hJZCxTdHJpbmcpO1xuXHRzZWFyY2hJZCA9IHNlYXJjaElkIHx8IHt9O1xuICBcdGNvbnNvbGUubG9nKFNlYXJjaGVzLmZpbmQoc2VhcmNoSWQpLmNvdW50KCkpO1xuXHRyZXR1cm4gU2VhcmNoZXMuZmluZChcblx0XHRzZWFyY2hJZCwgXG5cdCAgeyBcblx0ICBcdHNvcnQ6IHsgY3JlYXRlZDogLTEgfSBcblx0fVxuXHQsIHtcblx0XHRmaWVsZHM6IFNlYXJjaGVzLnB1YmxpY0ZpZWxkc1xuXHR9KTtcbn0pO1xuXG4vLyBEZWZpbmUgYSBydWxlIHRvIGxpbWl0IHN1YnNjcmlwdGlvbiBjYWxsc1xudmFyIHN1YnNjcmliZVRvU2VhcmNoZXNSdWxlID0ge1xuICB0eXBlOiAnc3Vic2NyaXB0aW9uJyxcbiAgbmFtZTogJ3NlYXJjaGVzLmdldCdcbn1cbi8vIEFkZCB0aGUgcnVsZSwgYWxsb3dpbmcgdXAgdG8gMSBzdWJzY3JpcHRpb24gZXZlcnkgNSBzZWNvbmRzLlxuRERQUmF0ZUxpbWl0ZXIuYWRkUnVsZShzdWJzY3JpYmVUb1NlYXJjaGVzUnVsZSwgMSwgNTAwMCk7IiwiaW1wb3J0IHsgTW9uZ28gfSBmcm9tICdtZXRlb3IvbW9uZ28nO1xuaW1wb3J0IHsgU2ltcGxlU2NoZW1hIH0gZnJvbSAnbWV0ZW9yL2FsZGVlZDpzaW1wbGUtc2NoZW1hJztcblxuXG5cbmV4cG9ydCBjb25zdCBTZWFyY2hlcyA9IG5ldyBNZXRlb3IuQ29sbGVjdGlvbignc2VhcmNoZXMnKTtcblxuLy8gRGVueSBhbGwgY2xpZW50LXNpZGUgdXBkYXRlcyBzaW5jZSB3ZSB3aWxsIGJlIHVzaW5nIG1ldGhvZHMgdG8gbWFuYWdlIHRoaXMgY29sbGVjdGlvblxuU2VhcmNoZXMuZGVueSh7XG4gIGluc2VydCgpIHsgcmV0dXJuIHRydWU7IH0sXG4gIHVwZGF0ZSgpIHsgcmV0dXJuIHRydWU7IH0sXG4gIHJlbW92ZSgpIHsgcmV0dXJuIHRydWU7IH0sXG59KTtcblxuU2VhcmNoZXMuU2NoZW1hID0gbmV3IFNpbXBsZVNjaGVtYSh7XG4gIC8vIHNjaGVtYSBydWxlc1xuICBcInNlYXJjaF90eXBlXCI6IHtcbiAgICB0eXBlOiBbU3RyaW5nXSxcbiAgICBsYWJlbDogXCJTZWFyY2ggdHlwZXNcIixcbiAgICBvcHRpb25hbDogZmFsc2UsXG4gICAgYWxsb3dlZFZhbHVlczogW1wibW9kZXJhdGlvblwiLCBcImxhYmVsXCIsIFwiZmFjZVwiLCBcImNvbGxlY3Rpb25cIl0sXG4gICAgZGVmYXVsdFZhbHVlOiBbXCJtb2RlcmF0aW9uXCIsIFwibGFiZWxcIiwgXCJmYWNlXCJdXG4gIH0sXG4gIFwic2VhcmNoX2NvbGxlY3Rpb25zXCI6IHtcbiAgICB0eXBlOiBbU3RyaW5nXSxcbiAgICBsYWJlbDogXCJDb2xsZWN0aW9ucyB0byBzZWFyY2hcIixcbiAgICBvcHRpb25hbDogdHJ1ZSxcbiAgICBkZWZhdWx0VmFsdWU6IFtcIlwiXVxuICB9LFxuICBcInNlYXJjaF9pbWFnZVwiOiB7XG4gICAgdHlwZTogU3RyaW5nLFxuICAgIGxhYmVsOiBcIkltYWdlIHRvIHNlYXJjaFwiLFxuICAgIG9wdGlvbmFsOiB0cnVlLFxuICAgIGRlZmF1bHRWYWx1ZTogXCJcIlxuICB9LFxuICBcInNlYXJjaF9yZXN1bHRzXCI6IHtcbiAgICB0eXBlOiBPYmplY3QsXG4gICAgbGFiZWw6IFwiT2JqZWN0IG9mIHNlYXJjaCB0eXBlc1wiLFxuICAgIG9wdGlvbmFsOiB0cnVlLFxuICAgIGJsYWNrYm94OiB0cnVlLFxuICAgIGRlZmF1bHRWYWx1ZToge31cbiAgfSxcbiAgXCJmYWNlc1wiOiB7XG4gICAgdHlwZTogW09iamVjdF0sXG4gICAgbGFiZWw6IFwiRmFjZSBvYmplY3RzIGZvdW5kIGluIGltYWdlXCIsXG4gICAgb3B0aW9uYWw6IHRydWUsXG4gICAgYmxhY2tib3g6IHRydWUsXG4gICAgZGVmYXVsdFZhbHVlOiBbXVxuICB9LFxuICBcImNyZWF0ZWRcIjoge1xuICAgIHR5cGU6IERhdGUsXG4gICAgbGFiZWw6IFwiRGF0ZSBzZWFyY2ggcGVyZm9ybWVkXCIsXG4gICAgYXV0b1ZhbHVlOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICggdGhpcy5pc0luc2VydCApIHtcbiAgICAgICAgcmV0dXJuIG5ldyBEYXRlO1xuICAgICAgfSBcbiAgICB9LFxuICAgIG9wdGlvbmFsOiB0cnVlLFxuICAgIC8vaW5kZXg6IHRydWVcbiAgfSxcbiAgXCJ1cGRhdGVkXCI6IHtcbiAgICB0eXBlOiBEYXRlLFxuICAgIGxhYmVsOiBcIkRhdGUgc2VhcmNoIHVwZGF0ZWRcIixcbiAgICBhdXRvVmFsdWU6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCB0aGlzLmlzVXBkYXRlICkge1xuICAgICAgICByZXR1cm4gbmV3IERhdGU7XG4gICAgICB9IFxuICAgIH0sXG4gICAgb3B0aW9uYWw6IHRydWVcbiAgfVxufSk7XG5cblNlYXJjaGVzLmF0dGFjaFNjaGVtYSggU2VhcmNoZXMuU2NoZW1hICk7XG5cbmlmKE1ldGVvci5pc1NlcnZlcil7XG4gIE1ldGVvci5zdGFydHVwKCgpID0+IHtcbiAgICBTZWFyY2hlcy5fZW5zdXJlSW5kZXgoe1xuICAgICAgICBjcmVhdGVkOiAtMSxcbiAgICB9KTtcbiAgICAvLyBTZWFyY2hlcy5fZW5zdXJlSW5kZXgoeyBzZWFyY2hfaW1hZ2U6IDF9KTtcbiAgfSk7XG59XG5cblNlYXJjaGVzLnB1YmxpY0ZpZWxkcyA9IHtcbiAgc2VhcmNoX2lkOiAxLFxuICBzZWFyY2hfdHlwZTogMSxcbiAgc2VhcmNoX2NvbGxlY3Rpb25zOiAxLFxuICBzZWFyY2hfaW1hZ2U6IDEsXG4gIHNlYXJjaF9yZXN1bHRzOiAxLFxuICBjcmVhdGVkOiAxLFxuICB1cGRhdGVkOiAxXG59O1xuXG4vLyBTZWFyY2hlcy5oZWxwZXJzKHtcbi8vICAgLy8gQSBjb2xsZWN0aW9ucyBpcyBjb25zaWRlcmVkIHRvIGJlIHByaXZhdGUgaWYgXCJwcml2YXRlXCIgaXMgc2V0IHRvIHRydWVcbi8vICAgaXNQcml2YXRlKCkge1xuLy8gICAgIHJldHVybiB0aGlzLnByaXZhdGU7XG4vLyAgIH1cbi8vIH0pOyIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNy1wcmVzZW50IEFudG1vdW5kcy5jb20sIEluYy4gb3IgaXRzIGFmZmlsaWF0ZXMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEdOVSBBZmZlcm8gR2VuZXJhbCBQdWJsaWMgTGljZW5zZSwgdmVyc2lvbiAzLjAgKHRoZSBcIkxpY2Vuc2VcIikuIFlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aFxuICogdGhlIExpY2Vuc2UuIEEgY29weSBvZiB0aGUgTGljZW5zZSBpcyBsb2NhdGVkIGF0XG4gKlxuICogICAgIGh0dHBzOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvYWdwbC0zLjAuZW4uaHRtbFxuICpcbiAqIG9yIGluIHRoZSBcImxpY2Vuc2VcIiBmaWxlIGFjY29tcGFueWluZyB0aGlzIGZpbGUuIFRoaXMgZmlsZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUlxuICogQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zXG4gKiBhbmQgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbmltcG9ydCB7IE1ldGVvciB9IGZyb20gJ21ldGVvci9tZXRlb3InO1xuaW1wb3J0IHsgSFRUUCB9IGZyb20gJ21ldGVvci9odHRwJztcbi8vIGltcG9ydCBBV1MgZnJvbSAnYXdzLXNkayc7XG4vLyBpbXBvcnQgJy4uL2FjY291bnRzLWNvbmZpZy5qcyc7XG4vLyBUaGlzIGRlZmluZXMgYWxsIHRoZSBjb2xsZWN0aW9ucywgcHVibGljYXRpb25zIGFuZCBtZXRob2RzIHRoYXQgdGhlIGFwcGxpY2F0aW9uIHByb3ZpZGVzXG4vLyBhcyBhbiBBUEkgdG8gdGhlIGNsaWVudC5cbmltcG9ydCAnLi9yZWdpc3Rlci1hcGkuanMnO1xuLy8gaW1wb3J0ICcuL2ZpeHR1cmVzLmpzJztcblxuY29uc3Qgb3MgPSByZXF1aXJlKCdvcycpO1xuXG5cbnNlcnZlcl9tb2RlID0gTWV0ZW9yLmlzUHJvZHVjdGlvbiA/IFwiUFJPRFVDVElPTlwiIDogXCJERVZFTE9QTUVOVFwiO1xuY29uc29sZS5sb2coJ2luZGV4LmpzOiAnICsgc2VydmVyX21vZGUgKyBcIi0tPlwiICsgSlNPTi5zdHJpbmdpZnkoTWV0ZW9yLnNldHRpbmdzKSk7XG5cbk1ldGVvci5tZXRob2RzKHtcblxuXHRpbmZvKCl7XG5cdFx0cmV0dXJuIGB2ZXJzaW9uOiAwLjkuMCAtIGJ1aWxkOiAke3Byb2Nlc3MuZW52LkJVSUxEIHx8ICdkZXYnfSAtIGhvc3RuYW1lOiAke29zLmhvc3RuYW1lKCl9YDtcblx0fSxcblxuXHRhc3luYyBnZXREYXRhKCl7ICAgIFxuXHRcdHRyeXtcblx0XHRcdHZhciByZXNwb25zZSA9IHt9O1xuXHRcdFx0Y29uc3QgcmVzdWx0cyA9IGF3YWl0IEhUVFAuY2FsbCgnR0VUJywgJ2h0dHA6Ly9qc29ucGxhY2Vob2xkZXIudHlwaWNvZGUuY29tL3Bvc3RzJyk7XHRcblx0XHRcdGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHJlc3VsdHMuZGF0YVswXSkpO1x0XG5cdFx0XHRjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShyZXN1bHRzLmhlYWRlcnMpKTtcblx0XHRcdHJlc3BvbnNlLmNvZGUgPSB0cnVlO1x0XHRcblx0XHRcdHJlc3BvbnNlLmRhdGEgPSByZXN1bHRzO1x0XG5cdFx0fSBjYXRjaChlKXtcblx0XHRcdHJlc3BvbnNlID0gZmFsc2U7XG5cdFx0XHRjb25zb2xlLmxvZyhlKTtcblx0XHR9IGZpbmFsbHkge1xuXHRcdFx0Y29uc29sZS5sb2coXCJmaW5hbGx5Li4uXCIpXG5cdFx0XHQvL3Rocm93IG5ldyBNZXRlb3IuRXJyb3IoXCJpbmFwcHJvcHJpYXRlLXBpY1wiLFwiVGhlIHVzZXIgaGFzIHRha2VuIGFuIGluYXBwcm9wcmlhdGUgcGljdHVyZS5cIik7XHRcblx0XHRcdHJldHVybiByZXNwb25zZTtcblx0XHR9XG5cdH1cblxufSk7XG5cbk1ldGVvci5vbkNvbm5lY3Rpb24oKGNvbm5lY3Rpb24pPT57XG5cdGxldCBjbGllbnRBZGRyID0gY29ubmVjdGlvbi5jbGllbnRBZGRyZXNzO1xuXHRsZXQgaGVhZGVycyA9IGNvbm5lY3Rpb24uaHR0cEhlYWRlcnM7XG5cdGNvbnNvbGUubG9nKGBjb25uZWN0aW9uIGZyb20gJHtjbGllbnRBZGRyfWApO1xuXHQvLyBjb25zb2xlLmxvZyhoZWFkZXJzKTtcbn0pIiwiaW1wb3J0ICcuLi8uLi9hcGkvY29sbGVjdGlvbnMvcHVibGljYXRpb25zLmpzJztcbmltcG9ydCAnLi4vLi4vYXBpL3NlYXJjaGVzL21ldGhvZHMuanMnO1xuaW1wb3J0ICcuLi8uLi9hcGkvc2VhcmNoZXMvcHVibGljYXRpb25zLmpzJzsiLCIvKlxuICogQ29weXJpZ2h0IDIwMTctcHJlc2VudCBBbnRtb3VuZHMuY29tLCBJbmMuIG9yIGl0cyBhZmZpbGlhdGVzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBHTlUgQWZmZXJvIEdlbmVyYWwgUHVibGljIExpY2Vuc2UsIHZlcnNpb24gMy4wICh0aGUgXCJMaWNlbnNlXCIpLiBZb3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGhcbiAqIHRoZSBMaWNlbnNlLiBBIGNvcHkgb2YgdGhlIExpY2Vuc2UgaXMgbG9jYXRlZCBhdFxuICpcbiAqICAgICBodHRwczovL3d3dy5nbnUub3JnL2xpY2Vuc2VzL2FncGwtMy4wLmVuLmh0bWxcbiAqXG4gKiBvciBpbiB0aGUgXCJsaWNlbnNlXCIgZmlsZSBhY2NvbXBhbnlpbmcgdGhpcyBmaWxlLiBUaGlzIGZpbGUgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1JcbiAqIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9uc1xuICogYW5kIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5pbXBvcnQgJy4uL2ltcG9ydHMvc3RhcnR1cC9zZXJ2ZXInO1xuXG5NZXRlb3Iuc3RhcnR1cCgoKSA9PiB7XG4gIC8vIGNvZGUgdG8gcnVuIG9uIHNlcnZlciBhdCBzdGFydHVwXG59KTtcbiJdfQ==
