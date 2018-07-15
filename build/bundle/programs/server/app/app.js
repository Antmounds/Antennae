var require = meteorInstall({"imports":{"api":{"searches":{"methods.js":function(require,exports,module){

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
  // Our schema rules will go here.
  "search_id": {
    type: String,
    label: "Search ID",
    optional: true
  },
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
    optional: true
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvc2VhcmNoZXMvbWV0aG9kcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvc2VhcmNoZXMvcHVibGljYXRpb25zLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9pbXBvcnRzL2FwaS9zZWFyY2hlcy9zZWFyY2hlcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9zdGFydHVwL3NlcnZlci9pbmRleC5qcyIsIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9zdGFydHVwL3NlcnZlci9yZWdpc3Rlci1hcGkuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3NlcnZlci9tYWluLmpzIl0sIm5hbWVzIjpbIkREUFJhdGVMaW1pdGVyIiwibW9kdWxlIiwid2F0Y2giLCJyZXF1aXJlIiwidiIsIkFXUyIsImRlZmF1bHQiLCJTZWFyY2hlcyIsImNvbmZpZyIsInJlZ2lvbiIsInJla29nbml0aW9uIiwiUmVrb2duaXRpb24iLCJNZXRlb3IiLCJtZXRob2RzIiwicGljRGF0YSIsImNvbnNvbGUiLCJsb2ciLCJ0MCIsIkRhdGUiLCJnZXRUaW1lIiwiaW1nQnl0ZXMiLCJCdWZmZXIiLCJmcm9tIiwic3BsaXQiLCJtb2RlcmF0aW9uUGFyYW1zIiwibGFiZWxQYXJhbXMiLCJmYWNlUGFyYW1zIiwibW9kZXJhdGlvblJlcXVlc3QiLCJkZXRlY3RNb2RlcmF0aW9uTGFiZWxzIiwibGFiZWxSZXF1ZXN0IiwiZGV0ZWN0TGFiZWxzIiwiZmFjZVJlcXVlc3QiLCJkZXRlY3RGYWNlcyIsInByb21pc2UxIiwicHJvbWlzZSIsInByb21pc2UyIiwicHJvbWlzZTMiLCJyZXNwb25zZSIsIlByb21pc2UiLCJhbGwiLCJjYXRjaCIsImVycm9yIiwiRXJyb3IiLCJjb2RlIiwibWVzc2FnZSIsInRoZW4iLCJ2YWx1ZXMiLCJ0MSIsInNlYXJjaF9yZXN1bHRzIiwibW9kZXJhdGlvbiIsIk1vZGVyYXRpb25MYWJlbHMiLCJsYWJlbHMiLCJMYWJlbHMiLCJmYWNlRGV0YWlscyIsIkZhY2VEZXRhaWxzIiwic2VhcmNoIiwic2VhcmNoX2ltYWdlIiwic2F2ZVNlYXJjaCIsImluc2VydCIsInJlYXNvbiIsImRldGFpbHMiLCJmaW5hbGx5IiwicnVuU2NhblJ1bGUiLCJ0eXBlIiwibmFtZSIsImFkZFJ1bGUiLCJwdWJsaXNoIiwic2VhcmNoSWQiLCJjaGVjayIsIlN0cmluZyIsImZpbmQiLCJjb3VudCIsInNvcnQiLCJjcmVhdGVkIiwiZmllbGRzIiwicHVibGljRmllbGRzIiwic3Vic2NyaWJlVG9TZWFyY2hlc1J1bGUiLCJleHBvcnQiLCJNb25nbyIsIlNpbXBsZVNjaGVtYSIsIkNvbGxlY3Rpb24iLCJkZW55IiwidXBkYXRlIiwicmVtb3ZlIiwiU2NoZW1hIiwibGFiZWwiLCJvcHRpb25hbCIsImFsbG93ZWRWYWx1ZXMiLCJkZWZhdWx0VmFsdWUiLCJPYmplY3QiLCJibGFja2JveCIsImF1dG9WYWx1ZSIsImlzSW5zZXJ0IiwiaXNVcGRhdGUiLCJhdHRhY2hTY2hlbWEiLCJzZWFyY2hfaWQiLCJzZWFyY2hfdHlwZSIsInNlYXJjaF9jb2xsZWN0aW9ucyIsInVwZGF0ZWQiLCJIVFRQIiwib3MiLCJzZXJ2ZXJfbW9kZSIsImlzUHJvZHVjdGlvbiIsIkpTT04iLCJzdHJpbmdpZnkiLCJzZXR0aW5ncyIsImluZm8iLCJwcm9jZXNzIiwiZW52IiwiQlVJTEQiLCJob3N0bmFtZSIsImdldERhdGEiLCJyZXN1bHRzIiwiY2FsbCIsImRhdGEiLCJoZWFkZXJzIiwiZSIsIm9uQ29ubmVjdGlvbiIsImNvbm5lY3Rpb24iLCJjbGllbnRBZGRyIiwiY2xpZW50QWRkcmVzcyIsImh0dHBIZWFkZXJzIiwic3RhcnR1cCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBQSxJQUFJQSxjQUFKO0FBQW1CQyxPQUFPQyxLQUFQLENBQWFDLFFBQVEseUJBQVIsQ0FBYixFQUFnRDtBQUFDSCxpQkFBZUksQ0FBZixFQUFpQjtBQUFDSixxQkFBZUksQ0FBZjtBQUFpQjs7QUFB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LFNBVVU7QUFDVHJHLGdCQUFRQyxHQUFSLENBQVksWUFBWixFQURTLENBRVQ7O0FBQ0EsZUFBT3FCLFFBQVA7QUFDQTtBQUNELEtBaEJEO0FBQUE7O0FBTmMsQ0FBZjtBQTBCQXpCLE9BQU95RyxZQUFQLENBQXFCQyxVQUFELElBQWM7QUFDakMsTUFBSUMsYUFBYUQsV0FBV0UsYUFBNUI7QUFDQSxNQUFJTCxVQUFVRyxXQUFXRyxXQUF6QjtBQUNBMUcsVUFBUUMsR0FBUixDQUFhLG1CQUFrQnVHLFVBQVcsRUFBMUMsRUFIaUMsQ0FJakM7QUFDQSxDQUxELEU7Ozs7Ozs7Ozs7O0FDckRBdEgsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLCtCQUFSLENBQWI7QUFBdURGLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxvQ0FBUixDQUFiLEU7Ozs7Ozs7Ozs7O0FDQXZERixPQUFPQyxLQUFQLENBQWFDLFFBQVEsMkJBQVIsQ0FBYjtBQWNBUyxPQUFPOEcsT0FBUCxDQUFlLE1BQU0sQ0FDbkI7QUFDRCxDQUZELEUiLCJmaWxlIjoiL2FwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEREUFJhdGVMaW1pdGVyIH0gZnJvbSAnbWV0ZW9yL2RkcC1yYXRlLWxpbWl0ZXInO1xuaW1wb3J0IEFXUyBmcm9tICdhd3Mtc2RrJztcblxuaW1wb3J0IHsgU2VhcmNoZXMgfSBmcm9tICcuL3NlYXJjaGVzLmpzJztcblxuQVdTLmNvbmZpZy5yZWdpb24gPSAndXMtZWFzdC0xJztcbnZhciByZWtvZ25pdGlvbiA9IG5ldyBBV1MuUmVrb2duaXRpb24oKTtcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXHRcInNlYXJjaC5mYWNlXCIocGljRGF0YSl7XG5cdFx0Ly9yZXR1cm4gMTtcblx0XHRjb25zb2xlLmxvZyhcIkFOQUxZWklORyBJTUFHRS4uLlwiKTtcblx0XHR2YXIgdDAgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcblx0XHRsZXQgaW1nQnl0ZXMgPSBuZXcgQnVmZmVyLmZyb20ocGljRGF0YS5zcGxpdChcIixcIilbMV0sIFwiYmFzZTY0XCIpO1xuXHRcdGxldCBtb2RlcmF0aW9uUGFyYW1zID0ge1xuXHRcdFx0XCJJbWFnZVwiOiB7IFxuXHRcdFx0XHRcIkJ5dGVzXCI6IGltZ0J5dGVzLFxuXHRcdFx0fSxcblx0XHRcdFwiTWluQ29uZmlkZW5jZVwiOiA1MCxcblx0XHR9O1xuXHRcdGxldCBsYWJlbFBhcmFtcyA9IHtcblx0XHRcdFwiSW1hZ2VcIjogeyBcblx0XHRcdFx0XCJCeXRlc1wiOiBpbWdCeXRlcyxcblx0XHRcdH0sXG5cdFx0XHRcIk1heExhYmVsc1wiOiAyMCxcblx0XHRcdFwiTWluQ29uZmlkZW5jZVwiOiA3NSxcblx0XHR9O1xuXHRcdGxldCBmYWNlUGFyYW1zID0ge1xuXHRcdFx0XCJJbWFnZVwiOiB7IFxuXHRcdFx0XHRcIkJ5dGVzXCI6IGltZ0J5dGVzLFxuXHRcdFx0fSxcbiAgXHRcdFx0XCJBdHRyaWJ1dGVzXCI6IFtcIkFMTFwiXSxcblx0XHR9O1xuXHRcdC8vIGNyZWF0ZSByZXF1ZXN0IG9iamVjdHNcblx0XHRsZXQgbW9kZXJhdGlvblJlcXVlc3QgPSByZWtvZ25pdGlvbi5kZXRlY3RNb2RlcmF0aW9uTGFiZWxzKG1vZGVyYXRpb25QYXJhbXMpO1xuXHRcdGxldCBsYWJlbFJlcXVlc3QgPSByZWtvZ25pdGlvbi5kZXRlY3RMYWJlbHMobGFiZWxQYXJhbXMpO1xuXHRcdGxldCBmYWNlUmVxdWVzdCA9IHJla29nbml0aW9uLmRldGVjdEZhY2VzKGZhY2VQYXJhbXMpO1xuXHRcdC8vIGNyZWF0ZSBwcm9taXNlc1xuXHRcdGxldCBwcm9taXNlMSA9IG1vZGVyYXRpb25SZXF1ZXN0LnByb21pc2UoKTtcblx0XHRsZXQgcHJvbWlzZTIgPSBsYWJlbFJlcXVlc3QucHJvbWlzZSgpO1xuXHRcdGxldCBwcm9taXNlMyA9IGZhY2VSZXF1ZXN0LnByb21pc2UoKTtcblx0XHQvLyBGdWxmaWxsIHByb21pc2VzIGluIHBhcmFsbGVsXG5cdFx0bGV0IHJlc3BvbnNlID0gUHJvbWlzZS5hbGwoW1xuXHRcdFx0cHJvbWlzZTEuY2F0Y2goZXJyb3IgPT4geyB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKGVycm9yLmNvZGUsIGVycm9yLm1lc3NhZ2UsIGVycm9yKTtyZXR1cm4gZXJyb3I7IH0pLFxuXHRcdFx0cHJvbWlzZTIuY2F0Y2goZXJyb3IgPT4geyB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKGVycm9yLmNvZGUsIGVycm9yLm1lc3NhZ2UsIGVycm9yKTtyZXR1cm4gZXJyb3I7IH0pLFxuXHRcdFx0cHJvbWlzZTMuY2F0Y2goZXJyb3IgPT4geyB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKGVycm9yLmNvZGUsIGVycm9yLm1lc3NhZ2UsIGVycm9yKTtyZXR1cm4gZXJyb3I7IH0pLFxuXHRcdF0pLnRoZW4odmFsdWVzID0+IHtcblx0XHRcdGNvbnNvbGUubG9nKHZhbHVlc1swXSk7XG5cdFx0XHRjb25zb2xlLmxvZyh2YWx1ZXNbMV0pO1xuXHRcdFx0Y29uc29sZS5sb2codmFsdWVzWzJdKTtcblx0XHRcdGxldCB0MSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXHRcdFx0Y29uc29sZS5sb2coYFJlc3BvbnNlIHRvb2sgJHt0MSAtIHQwfSBtc2ApO1xuXHRcdFx0bGV0IHNlYXJjaF9yZXN1bHRzID0ge1xuXHRcdFx0XHRtb2RlcmF0aW9uOiB2YWx1ZXNbMF0uTW9kZXJhdGlvbkxhYmVscyxcblx0XHRcdFx0bGFiZWxzOiB2YWx1ZXNbMV0uTGFiZWxzLFxuXHRcdFx0XHRmYWNlRGV0YWlsczogdmFsdWVzWzJdLkZhY2VEZXRhaWxzXG5cdFx0XHR9O1xuXHRcdFx0bGV0IHNlYXJjaCA9IHtcblx0XHRcdFx0c2VhcmNoX2ltYWdlOiBwaWNEYXRhLFxuXHRcdFx0XHRzZWFyY2hfcmVzdWx0czogc2VhcmNoX3Jlc3VsdHNcblx0XHRcdH07XG5cdFx0XHRsZXQgc2F2ZVNlYXJjaCA9IFNlYXJjaGVzLmluc2VydChzZWFyY2gpO1xuXHRcdFx0Y29uc29sZS5sb2coc2F2ZVNlYXJjaCk7XG5cdFx0XHRyZXR1cm4gdmFsdWVzO1xuXHRcdH0pLmNhdGNoKGVycm9yID0+IHtcblx0XHRcdGNvbnNvbGUubG9nKCdjYXVnaHQgZXJyb3IhJyk7XG5cdFx0XHRjb25zb2xlLmxvZyhlcnJvcik7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKGVycm9yLmVycm9yLCBlcnJvci5yZWFzb24sIGVycm9yLmRldGFpbHMpO1xuXHRcdH0pLmZpbmFsbHkoKCkgPT4ge1xuXHRcdFx0Y29uc29sZS5sb2coJ2ZpbmFsbHknKTtcblx0XHRcdGNvbnNvbGUubG9nKHRoaXMpO1xuXHRcdH0pO1xuXHRcdGNvbnNvbGUubG9nKHJlc3BvbnNlKTtcblx0XHRsZXQgdDEgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcblx0XHRjb25zb2xlLmxvZyhgUmVxdWVzdCB0b29rICR7dDEgLSB0MH0gbXNgKTtcblx0XHRyZXR1cm4gcmVzcG9uc2U7XG5cdH1cbn0pXG5cbi8vIERlZmluZSBhIHJ1bGUgdG8gbGltaXQgbWV0aG9kIGNhbGxzXG5sZXQgcnVuU2NhblJ1bGUgPSB7XG5cdHR5cGU6ICdtZXRob2QnLFxuXHRuYW1lOiAnbW9tZW50LnNjYW4nXG59O1xuLy8gQWRkIHRoZSBydWxlLCBhbGxvd2luZyB1cCB0byAxIHNjYW4gZXZlcnkgMTAgc2Vjb25kc1xuRERQUmF0ZUxpbWl0ZXIuYWRkUnVsZShydW5TY2FuUnVsZSwgMSwgMTAwMDApOyIsImltcG9ydCB7IEREUFJhdGVMaW1pdGVyIH0gZnJvbSAnbWV0ZW9yL2RkcC1yYXRlLWxpbWl0ZXInO1xuXG5pbXBvcnQgeyBTZWFyY2hlcyB9IGZyb20gJy4vc2VhcmNoZXMuanMnO1xuXG5cbk1ldGVvci5wdWJsaXNoKCdzZWFyY2hlcy5nZXQnLCBmdW5jdGlvbihzZWFyY2hJZD0nJykge1xuXHRjaGVjayhzZWFyY2hJZCxTdHJpbmcpO1xuXHRzZWFyY2hJZCA9IHNlYXJjaElkIHx8IHt9O1xuICBcdGNvbnNvbGUubG9nKFNlYXJjaGVzLmZpbmQoc2VhcmNoSWQpLmNvdW50KCkpO1xuXHRyZXR1cm4gU2VhcmNoZXMuZmluZChcblx0XHRzZWFyY2hJZCwgXG5cdCAgeyBcblx0ICBcdHNvcnQ6IHsgY3JlYXRlZDogLTEgfSBcblx0fVxuXHQsIHtcblx0XHRmaWVsZHM6IFNlYXJjaGVzLnB1YmxpY0ZpZWxkc1xuXHR9KTtcbn0pO1xuXG4vLyBEZWZpbmUgYSBydWxlIHRvIGxpbWl0IHN1YnNjcmlwdGlvbiBjYWxsc1xudmFyIHN1YnNjcmliZVRvU2VhcmNoZXNSdWxlID0ge1xuICB0eXBlOiAnc3Vic2NyaXB0aW9uJyxcbiAgbmFtZTogJ3NlYXJjaGVzLmdldCdcbn1cbi8vIEFkZCB0aGUgcnVsZSwgYWxsb3dpbmcgdXAgdG8gMSBzdWJzY3JpcHRpb24gZXZlcnkgNSBzZWNvbmRzLlxuRERQUmF0ZUxpbWl0ZXIuYWRkUnVsZShzdWJzY3JpYmVUb1NlYXJjaGVzUnVsZSwgMSwgNTAwMCk7IiwiaW1wb3J0IHsgTW9uZ28gfSBmcm9tICdtZXRlb3IvbW9uZ28nO1xuaW1wb3J0IHsgU2ltcGxlU2NoZW1hIH0gZnJvbSAnbWV0ZW9yL2FsZGVlZDpzaW1wbGUtc2NoZW1hJztcblxuXG5cbmV4cG9ydCBjb25zdCBTZWFyY2hlcyA9IG5ldyBNZXRlb3IuQ29sbGVjdGlvbignc2VhcmNoZXMnKTtcblxuLy8gRGVueSBhbGwgY2xpZW50LXNpZGUgdXBkYXRlcyBzaW5jZSB3ZSB3aWxsIGJlIHVzaW5nIG1ldGhvZHMgdG8gbWFuYWdlIHRoaXMgY29sbGVjdGlvblxuU2VhcmNoZXMuZGVueSh7XG4gIGluc2VydCgpIHsgcmV0dXJuIHRydWU7IH0sXG4gIHVwZGF0ZSgpIHsgcmV0dXJuIHRydWU7IH0sXG4gIHJlbW92ZSgpIHsgcmV0dXJuIHRydWU7IH0sXG59KTtcblxuU2VhcmNoZXMuU2NoZW1hID0gbmV3IFNpbXBsZVNjaGVtYSh7XG4gIC8vIE91ciBzY2hlbWEgcnVsZXMgd2lsbCBnbyBoZXJlLlxuICBcInNlYXJjaF9pZFwiOiB7XG4gICAgdHlwZTogU3RyaW5nLFxuICAgIGxhYmVsOiBcIlNlYXJjaCBJRFwiLFxuICAgIG9wdGlvbmFsOiB0cnVlXG4gIH0sXG4gIFwic2VhcmNoX3R5cGVcIjoge1xuICAgIHR5cGU6IFtTdHJpbmddLFxuICAgIGxhYmVsOiBcIlNlYXJjaCB0eXBlc1wiLFxuICAgIG9wdGlvbmFsOiBmYWxzZSxcbiAgICBhbGxvd2VkVmFsdWVzOiBbXCJtb2RlcmF0aW9uXCIsIFwibGFiZWxcIiwgXCJmYWNlXCIsIFwiY29sbGVjdGlvblwiXSxcbiAgICBkZWZhdWx0VmFsdWU6IFtcIm1vZGVyYXRpb25cIiwgXCJsYWJlbFwiLCBcImZhY2VcIl1cbiAgfSxcbiAgXCJzZWFyY2hfY29sbGVjdGlvbnNcIjoge1xuICAgIHR5cGU6IFtTdHJpbmddLFxuICAgIGxhYmVsOiBcIkNvbGxlY3Rpb25zIHRvIHNlYXJjaFwiLFxuICAgIG9wdGlvbmFsOiB0cnVlLFxuICAgIGRlZmF1bHRWYWx1ZTogW1wiXCJdXG4gIH0sXG4gIFwic2VhcmNoX2ltYWdlXCI6IHtcbiAgICB0eXBlOiBTdHJpbmcsXG4gICAgbGFiZWw6IFwiSW1hZ2UgdG8gc2VhcmNoXCIsXG4gICAgb3B0aW9uYWw6IHRydWUsXG4gICAgZGVmYXVsdFZhbHVlOiBcIlwiXG4gIH0sXG4gIFwic2VhcmNoX3Jlc3VsdHNcIjoge1xuICAgIHR5cGU6IE9iamVjdCxcbiAgICBsYWJlbDogXCJPYmplY3Qgb2Ygc2VhcmNoIHR5cGVzXCIsXG4gICAgb3B0aW9uYWw6IHRydWUsXG4gICAgYmxhY2tib3g6IHRydWUsXG4gICAgZGVmYXVsdFZhbHVlOiB7fVxuICB9LFxuICBcImZhY2VzXCI6IHtcbiAgICB0eXBlOiBbT2JqZWN0XSxcbiAgICBsYWJlbDogXCJGYWNlIG9iamVjdHMgZm91bmQgaW4gaW1hZ2VcIixcbiAgICBvcHRpb25hbDogdHJ1ZSxcbiAgICBibGFja2JveDogdHJ1ZSxcbiAgICBkZWZhdWx0VmFsdWU6IFtdXG4gIH0sXG4gIFwiY3JlYXRlZFwiOiB7XG4gICAgdHlwZTogRGF0ZSxcbiAgICBsYWJlbDogXCJEYXRlIHNlYXJjaCBwZXJmb3JtZWRcIixcbiAgICBhdXRvVmFsdWU6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCB0aGlzLmlzSW5zZXJ0ICkge1xuICAgICAgICByZXR1cm4gbmV3IERhdGU7XG4gICAgICB9IFxuICAgIH0sXG4gICAgb3B0aW9uYWw6IHRydWVcbiAgfSxcbiAgXCJ1cGRhdGVkXCI6IHtcbiAgICB0eXBlOiBEYXRlLFxuICAgIGxhYmVsOiBcIkRhdGUgc2VhcmNoIHVwZGF0ZWRcIixcbiAgICBhdXRvVmFsdWU6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCB0aGlzLmlzVXBkYXRlICkge1xuICAgICAgICByZXR1cm4gbmV3IERhdGU7XG4gICAgICB9IFxuICAgIH0sXG4gICAgb3B0aW9uYWw6IHRydWVcbiAgfVxufSk7XG5cblNlYXJjaGVzLmF0dGFjaFNjaGVtYSggU2VhcmNoZXMuU2NoZW1hICk7IFxuXG5cblNlYXJjaGVzLnB1YmxpY0ZpZWxkcyA9IHtcbiAgc2VhcmNoX2lkOiAxLFxuICBzZWFyY2hfdHlwZTogMSxcbiAgc2VhcmNoX2NvbGxlY3Rpb25zOiAxLFxuICBzZWFyY2hfaW1hZ2U6IDEsXG4gIHNlYXJjaF9yZXN1bHRzOiAxLFxuICBjcmVhdGVkOiAxLFxuICB1cGRhdGVkOiAxXG59O1xuXG4vLyBTZWFyY2hlcy5oZWxwZXJzKHtcbi8vICAgLy8gQSBjb2xsZWN0aW9ucyBpcyBjb25zaWRlcmVkIHRvIGJlIHByaXZhdGUgaWYgXCJwcml2YXRlXCIgaXMgc2V0IHRvIHRydWVcbi8vICAgaXNQcml2YXRlKCkge1xuLy8gICAgIHJldHVybiB0aGlzLnByaXZhdGU7XG4vLyAgIH1cbi8vIH0pOyIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNy1wcmVzZW50IEFudG1vdW5kcy5jb20sIEluYy4gb3IgaXRzIGFmZmlsaWF0ZXMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEdOVSBBZmZlcm8gR2VuZXJhbCBQdWJsaWMgTGljZW5zZSwgdmVyc2lvbiAzLjAgKHRoZSBcIkxpY2Vuc2VcIikuIFlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aFxuICogdGhlIExpY2Vuc2UuIEEgY29weSBvZiB0aGUgTGljZW5zZSBpcyBsb2NhdGVkIGF0XG4gKlxuICogICAgIGh0dHBzOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvYWdwbC0zLjAuZW4uaHRtbFxuICpcbiAqIG9yIGluIHRoZSBcImxpY2Vuc2VcIiBmaWxlIGFjY29tcGFueWluZyB0aGlzIGZpbGUuIFRoaXMgZmlsZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUlxuICogQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zXG4gKiBhbmQgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbmltcG9ydCB7IE1ldGVvciB9IGZyb20gJ21ldGVvci9tZXRlb3InO1xuaW1wb3J0IHsgSFRUUCB9IGZyb20gJ21ldGVvci9odHRwJztcbi8vIGltcG9ydCBBV1MgZnJvbSAnYXdzLXNkayc7XG4vLyBpbXBvcnQgJy4uL2FjY291bnRzLWNvbmZpZy5qcyc7XG4vLyBUaGlzIGRlZmluZXMgYWxsIHRoZSBjb2xsZWN0aW9ucywgcHVibGljYXRpb25zIGFuZCBtZXRob2RzIHRoYXQgdGhlIGFwcGxpY2F0aW9uIHByb3ZpZGVzXG4vLyBhcyBhbiBBUEkgdG8gdGhlIGNsaWVudC5cbmltcG9ydCAnLi9yZWdpc3Rlci1hcGkuanMnO1xuLy8gaW1wb3J0ICcuL2ZpeHR1cmVzLmpzJztcblxuY29uc3Qgb3MgPSByZXF1aXJlKCdvcycpO1xuXG5cbnNlcnZlcl9tb2RlID0gTWV0ZW9yLmlzUHJvZHVjdGlvbiA/IFwiUFJPRFVDVElPTlwiIDogXCJERVZFTE9QTUVOVFwiO1xuY29uc29sZS5sb2coJ2luZGV4LmpzOiAnICsgc2VydmVyX21vZGUgKyBcIi0tPlwiICsgSlNPTi5zdHJpbmdpZnkoTWV0ZW9yLnNldHRpbmdzKSk7XG5cbk1ldGVvci5tZXRob2RzKHtcblxuXHRpbmZvKCl7XG5cdFx0cmV0dXJuIGB2ZXJzaW9uOiAwLjkuMCAtIGJ1aWxkOiAke3Byb2Nlc3MuZW52LkJVSUxEIHx8ICdkZXYnfSAtIGhvc3RuYW1lOiAke29zLmhvc3RuYW1lKCl9YDtcblx0fSxcblxuXHRhc3luYyBnZXREYXRhKCl7ICAgIFxuXHRcdHRyeXtcblx0XHRcdHZhciByZXNwb25zZSA9IHt9O1xuXHRcdFx0Y29uc3QgcmVzdWx0cyA9IGF3YWl0IEhUVFAuY2FsbCgnR0VUJywgJ2h0dHA6Ly9qc29ucGxhY2Vob2xkZXIudHlwaWNvZGUuY29tL3Bvc3RzJyk7XHRcblx0XHRcdGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHJlc3VsdHMuZGF0YVswXSkpO1x0XG5cdFx0XHRjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShyZXN1bHRzLmhlYWRlcnMpKTtcblx0XHRcdHJlc3BvbnNlLmNvZGUgPSB0cnVlO1x0XHRcblx0XHRcdHJlc3BvbnNlLmRhdGEgPSByZXN1bHRzO1x0XG5cdFx0fSBjYXRjaChlKXtcblx0XHRcdHJlc3BvbnNlID0gZmFsc2U7XG5cdFx0XHRjb25zb2xlLmxvZyhlKTtcblx0XHR9IGZpbmFsbHkge1xuXHRcdFx0Y29uc29sZS5sb2coXCJmaW5hbGx5Li4uXCIpXG5cdFx0XHQvL3Rocm93IG5ldyBNZXRlb3IuRXJyb3IoXCJpbmFwcHJvcHJpYXRlLXBpY1wiLFwiVGhlIHVzZXIgaGFzIHRha2VuIGFuIGluYXBwcm9wcmlhdGUgcGljdHVyZS5cIik7XHRcblx0XHRcdHJldHVybiByZXNwb25zZTtcblx0XHR9XG5cdH1cblxufSk7XG5cbk1ldGVvci5vbkNvbm5lY3Rpb24oKGNvbm5lY3Rpb24pPT57XG5cdGxldCBjbGllbnRBZGRyID0gY29ubmVjdGlvbi5jbGllbnRBZGRyZXNzO1xuXHRsZXQgaGVhZGVycyA9IGNvbm5lY3Rpb24uaHR0cEhlYWRlcnM7XG5cdGNvbnNvbGUubG9nKGBjb25uZWN0aW9uIGZyb20gJHtjbGllbnRBZGRyfWApO1xuXHQvLyBjb25zb2xlLmxvZyhoZWFkZXJzKTtcbn0pIiwiaW1wb3J0ICcuLi8uLi9hcGkvc2VhcmNoZXMvbWV0aG9kcy5qcyc7XG5pbXBvcnQgJy4uLy4uL2FwaS9zZWFyY2hlcy9wdWJsaWNhdGlvbnMuanMnOyIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNy1wcmVzZW50IEFudG1vdW5kcy5jb20sIEluYy4gb3IgaXRzIGFmZmlsaWF0ZXMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEdOVSBBZmZlcm8gR2VuZXJhbCBQdWJsaWMgTGljZW5zZSwgdmVyc2lvbiAzLjAgKHRoZSBcIkxpY2Vuc2VcIikuIFlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aFxuICogdGhlIExpY2Vuc2UuIEEgY29weSBvZiB0aGUgTGljZW5zZSBpcyBsb2NhdGVkIGF0XG4gKlxuICogICAgIGh0dHBzOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvYWdwbC0zLjAuZW4uaHRtbFxuICpcbiAqIG9yIGluIHRoZSBcImxpY2Vuc2VcIiBmaWxlIGFjY29tcGFueWluZyB0aGlzIGZpbGUuIFRoaXMgZmlsZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUlxuICogQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zXG4gKiBhbmQgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbmltcG9ydCAnLi4vaW1wb3J0cy9zdGFydHVwL3NlcnZlcic7XG5cbk1ldGVvci5zdGFydHVwKCgpID0+IHtcbiAgLy8gY29kZSB0byBydW4gb24gc2VydmVyIGF0IHN0YXJ0dXBcbn0pO1xuIl19
