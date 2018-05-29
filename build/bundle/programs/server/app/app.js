var require = meteorInstall({"imports":{"api":{"moments":{"methods.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                    //
// imports/api/moments/methods.js                                                                     //
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
AWS.config.region = 'us-east-1';
var rekognition = new AWS.Rekognition();
Meteor.methods({
  "moment.scan"(picData) {
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
    // return Promise.all([
    // 	promise1.catch(error => { return error }),
    // 	promise2.catch(error => { return error }),
    // 	promise3.catch(error => { return error }),
    // ]).then(values => {
    // 	console.log(values[0]);
    // 	console.log(values[1]);
    // 	console.log(values[2]);
    // 	let t1 = new Date().getTime();
    // 	console.log(`Request took ${t1 - t0} ms`);
    // 	return values;
    // });
    //return {};

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
}; // Add the rule, allowing up to 1 scan every 20 seconds

DDPRateLimiter.addRule(runScanRule, 1, 1000);
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
var server_mode = Meteor.isProduction ? "PRODUCTION" : "DEVELOPMENT";
console.log('index.js: ' + server_mode + "-->" + JSON.stringify(Meteor.settings));
Meteor.methods({
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
module.watch(require("../../api/moments/methods.js"));
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvbW9tZW50cy9tZXRob2RzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9pbXBvcnRzL3N0YXJ0dXAvc2VydmVyL2luZGV4LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9pbXBvcnRzL3N0YXJ0dXAvc2VydmVyL3JlZ2lzdGVyLWFwaS5qcyIsIm1ldGVvcjovL/CfkrthcHAvc2VydmVyL21haW4uanMiXSwibmFtZXMiOlsiRERQUmF0ZUxpbWl0ZXIiLCJtb2R1bGUiLCJ3YXRjaCIsInJlcXVpcmUiLCJ2IiwiQVdTIiwiZGVmYXVsdCIsImNvbmZpZyIsInJlZ2lvbiIsInJla29nbml0aW9uIiwiUmVrb2duaXRpb24iLCJNZXRlb3IiLCJtZXRob2RzIiwicGljRGF0YSIsImNvbnNvbGUiLCJsb2ciLCJ0MCIsIkRhdGUiLCJnZXRUaW1lIiwiaW1nQnl0ZXMiLCJCdWZmZXIiLCJmcm9tIiwic3BsaXQiLCJtb2RlcmF0aW9uUGFyYW1zIiwibGFiZWxQYXJhbXMiLCJmYWNlUGFyYW1zIiwibW9kZXJhdGlvblJlcXVlc3QiLCJkZXRlY3RNb2RlcmF0aW9uTGFiZWxzIiwibGFiZWxSZXF1ZXN0IiwiZGV0ZWN0TGFiZWxzIiwiZmFjZVJlcXVlc3QiLCJkZXRlY3RGYWNlcyIsInByb21pc2UxIiwicHJvbWlzZSIsInByb21pc2UyIiwicHJvbWlzZTMiLCJyZXNwb25zZSIsIlByb21pc2UiLCJhbGwiLCJjYXRjaCIsImVycm9yIiwiRXJyb3IiLCJjb2RlIiwibWVzc2FnZSIsInRoZW4iLCJ2YWx1ZXMiLCJ0MSIsInJlYXNvbiIsImRldGFpbHMiLCJmaW5hbGx5IiwicnVuU2NhblJ1bGUiLCJ0eXBlIiwibmFtZSIsImFkZFJ1bGUiLCJIVFRQIiwic2VydmVyX21vZGUiLCJpc1Byb2R1Y3Rpb24iLCJKU09OIiwic3RyaW5naWZ5Iiwic2V0dGluZ3MiLCJnZXREYXRhIiwicmVzdWx0cyIsImNhbGwiLCJkYXRhIiwiaGVhZGVycyIsImUiLCJvbkNvbm5lY3Rpb24iLCJjb25uZWN0aW9uIiwiY2xpZW50QWRkciIsImNsaWVudEFkZHJlc3MiLCJodHRwSGVhZGVycyIsInN0YXJ0dXAiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQUEsSUFBSUEsY0FBSjtBQUFtQkMsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLHlCQUFSLENBQWIsRUFBZ0Q7QUFBQ0gsaUJBQWVJLENBQWYsRUFBaUI7QUFBQ0oscUJBQWVJLENBQWY7QUFBaUI7O0FBQXBDLENBQWhELEVBQXNGLENBQXRGO0FBQXlGLElBQUlDLEdBQUo7QUFBUUosT0FBT0MsS0FBUCxDQUFhQyxRQUFRLFNBQVIsQ0FBYixFQUFnQztBQUFDRyxVQUFRRixDQUFSLEVBQVU7QUFBQ0MsVUFBSUQsQ0FBSjtBQUFNOztBQUFsQixDQUFoQyxFQUFvRCxDQUFwRDtBQUdwSEMsSUFBSUUsTUFBSixDQUFXQyxNQUFYLEdBQW9CLFdBQXBCO0FBRUEsSUFBSUMsY0FBYyxJQUFJSixJQUFJSyxXQUFSLEVBQWxCO0FBRUFDLE9BQU9DLE9BQVAsQ0FBZTtBQUNkLGdCQUFjQyxPQUFkLEVBQXNCO0FBQ3JCO0FBQ0FDLFlBQVFDLEdBQVIsQ0FBWSxvQkFBWjtBQUNBLFFBQUlDLEtBQUssSUFBSUMsSUFBSixHQUFXQyxPQUFYLEVBQVQ7QUFDQSxRQUFJQyxXQUFXLElBQUlDLE9BQU9DLElBQVgsQ0FBZ0JSLFFBQVFTLEtBQVIsQ0FBYyxHQUFkLEVBQW1CLENBQW5CLENBQWhCLEVBQXVDLFFBQXZDLENBQWY7QUFDQSxRQUFJQyxtQkFBbUI7QUFDdEIsZUFBUztBQUNSLGlCQUFTSjtBQURELE9BRGE7QUFJdEIsdUJBQWlCO0FBSkssS0FBdkI7QUFNQSxRQUFJSyxjQUFjO0FBQ2pCLGVBQVM7QUFDUixpQkFBU0w7QUFERCxPQURRO0FBSWpCLG1CQUFhLEVBSkk7QUFLakIsdUJBQWlCO0FBTEEsS0FBbEI7QUFPQSxRQUFJTSxhQUFhO0FBQ2hCLGVBQVM7QUFDUixpQkFBU047QUFERCxPQURPO0FBSWQsb0JBQWMsQ0FBQyxLQUFE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LFVBQUQsSUFBYztBQUNqQyxNQUFJQyxhQUFhRCxXQUFXRSxhQUE1QjtBQUNBLE1BQUlMLFVBQVVHLFdBQVdHLFdBQXpCO0FBQ0F4RCxVQUFRQyxHQUFSLENBQWEsbUJBQWtCcUQsVUFBVyxFQUExQyxFQUhpQyxDQUlqQztBQUNBLENBTEQsRTs7Ozs7Ozs7Ozs7QUNwQ0FuRSxPQUFPQyxLQUFQLENBQWFDLFFBQVEsOEJBQVIsQ0FBYixFOzs7Ozs7Ozs7OztBQ0FBRixPQUFPQyxLQUFQLENBQWFDLFFBQVEsMkJBQVIsQ0FBYjtBQUVBUSxPQUFPNEQsT0FBUCxDQUFlLE1BQU0sQ0FDbkI7QUFDRCxDQUZELEUiLCJmaWxlIjoiL2FwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEREUFJhdGVMaW1pdGVyIH0gZnJvbSAnbWV0ZW9yL2RkcC1yYXRlLWxpbWl0ZXInO1xuaW1wb3J0IEFXUyBmcm9tICdhd3Mtc2RrJztcblxuQVdTLmNvbmZpZy5yZWdpb24gPSAndXMtZWFzdC0xJztcblxudmFyIHJla29nbml0aW9uID0gbmV3IEFXUy5SZWtvZ25pdGlvbigpO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdFwibW9tZW50LnNjYW5cIihwaWNEYXRhKXtcblx0XHQvL3JldHVybiAxO1xuXHRcdGNvbnNvbGUubG9nKFwiQU5BTFlaSU5HIElNQUdFLi4uXCIpO1xuXHRcdHZhciB0MCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXHRcdGxldCBpbWdCeXRlcyA9IG5ldyBCdWZmZXIuZnJvbShwaWNEYXRhLnNwbGl0KFwiLFwiKVsxXSwgXCJiYXNlNjRcIik7XG5cdFx0bGV0IG1vZGVyYXRpb25QYXJhbXMgPSB7XG5cdFx0XHRcIkltYWdlXCI6IHsgXG5cdFx0XHRcdFwiQnl0ZXNcIjogaW1nQnl0ZXMsXG5cdFx0XHR9LFxuXHRcdFx0XCJNaW5Db25maWRlbmNlXCI6IDUwLFxuXHRcdH07XG5cdFx0bGV0IGxhYmVsUGFyYW1zID0ge1xuXHRcdFx0XCJJbWFnZVwiOiB7IFxuXHRcdFx0XHRcIkJ5dGVzXCI6IGltZ0J5dGVzLFxuXHRcdFx0fSxcblx0XHRcdFwiTWF4TGFiZWxzXCI6IDIwLFxuXHRcdFx0XCJNaW5Db25maWRlbmNlXCI6IDc1LFxuXHRcdH07XG5cdFx0bGV0IGZhY2VQYXJhbXMgPSB7XG5cdFx0XHRcIkltYWdlXCI6IHsgXG5cdFx0XHRcdFwiQnl0ZXNcIjogaW1nQnl0ZXMsXG5cdFx0XHR9LFxuICBcdFx0XHRcIkF0dHJpYnV0ZXNcIjogW1wiQUxMXCJdLFxuXHRcdH07XG5cdFx0Ly8gY3JlYXRlIHJlcXVlc3Qgb2JqZWN0c1xuXHRcdGxldCBtb2RlcmF0aW9uUmVxdWVzdCA9IHJla29nbml0aW9uLmRldGVjdE1vZGVyYXRpb25MYWJlbHMobW9kZXJhdGlvblBhcmFtcyk7XG5cdFx0bGV0IGxhYmVsUmVxdWVzdCA9IHJla29nbml0aW9uLmRldGVjdExhYmVscyhsYWJlbFBhcmFtcyk7XG5cdFx0bGV0IGZhY2VSZXF1ZXN0ID0gcmVrb2duaXRpb24uZGV0ZWN0RmFjZXMoZmFjZVBhcmFtcyk7XG5cdFx0Ly8gY3JlYXRlIHByb21pc2VzXG5cdFx0bGV0IHByb21pc2UxID0gbW9kZXJhdGlvblJlcXVlc3QucHJvbWlzZSgpO1xuXHRcdGxldCBwcm9taXNlMiA9IGxhYmVsUmVxdWVzdC5wcm9taXNlKCk7XG5cdFx0bGV0IHByb21pc2UzID0gZmFjZVJlcXVlc3QucHJvbWlzZSgpO1xuXHRcdC8vIEZ1bGZpbGwgcHJvbWlzZXMgaW4gcGFyYWxsZWxcblx0XHQvLyByZXR1cm4gUHJvbWlzZS5hbGwoW1xuXHRcdC8vIFx0cHJvbWlzZTEuY2F0Y2goZXJyb3IgPT4geyByZXR1cm4gZXJyb3IgfSksXG5cdFx0Ly8gXHRwcm9taXNlMi5jYXRjaChlcnJvciA9PiB7IHJldHVybiBlcnJvciB9KSxcblx0XHQvLyBcdHByb21pc2UzLmNhdGNoKGVycm9yID0+IHsgcmV0dXJuIGVycm9yIH0pLFxuXHRcdC8vIF0pLnRoZW4odmFsdWVzID0+IHtcblx0XHQvLyBcdGNvbnNvbGUubG9nKHZhbHVlc1swXSk7XG5cdFx0Ly8gXHRjb25zb2xlLmxvZyh2YWx1ZXNbMV0pO1xuXHRcdC8vIFx0Y29uc29sZS5sb2codmFsdWVzWzJdKTtcblx0XHQvLyBcdGxldCB0MSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXHRcdC8vIFx0Y29uc29sZS5sb2coYFJlcXVlc3QgdG9vayAke3QxIC0gdDB9IG1zYCk7XG5cdFx0Ly8gXHRyZXR1cm4gdmFsdWVzO1xuXHRcdC8vIH0pO1xuXHRcdC8vcmV0dXJuIHt9O1xuXHRcdGxldCByZXNwb25zZSA9IFByb21pc2UuYWxsKFtcblx0XHRcdHByb21pc2UxLmNhdGNoKGVycm9yID0+IHsgdGhyb3cgbmV3IE1ldGVvci5FcnJvcihlcnJvci5jb2RlLCBlcnJvci5tZXNzYWdlLCBlcnJvcik7cmV0dXJuIGVycm9yOyB9KSxcblx0XHRcdHByb21pc2UyLmNhdGNoKGVycm9yID0+IHsgdGhyb3cgbmV3IE1ldGVvci5FcnJvcihlcnJvci5jb2RlLCBlcnJvci5tZXNzYWdlLCBlcnJvcik7cmV0dXJuIGVycm9yOyB9KSxcblx0XHRcdHByb21pc2UzLmNhdGNoKGVycm9yID0+IHsgdGhyb3cgbmV3IE1ldGVvci5FcnJvcihlcnJvci5jb2RlLCBlcnJvci5tZXNzYWdlLCBlcnJvcik7cmV0dXJuIGVycm9yOyB9KSxcblx0XHRdKS50aGVuKHZhbHVlcyA9PiB7XG5cdFx0XHRjb25zb2xlLmxvZyh2YWx1ZXNbMF0pO1xuXHRcdFx0Y29uc29sZS5sb2codmFsdWVzWzFdKTtcblx0XHRcdGNvbnNvbGUubG9nKHZhbHVlc1syXSk7XG5cdFx0XHRsZXQgdDEgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcblx0XHRcdGNvbnNvbGUubG9nKGBSZXNwb25zZSB0b29rICR7dDEgLSB0MH0gbXNgKTtcblx0XHRcdHJldHVybiB2YWx1ZXM7XG5cdFx0fSkuY2F0Y2goZXJyb3IgPT4ge1xuXHRcdFx0Y29uc29sZS5sb2coJ2NhdWdodCBlcnJvciEnKTtcblx0XHRcdGNvbnNvbGUubG9nKGVycm9yKTtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoZXJyb3IuZXJyb3IsIGVycm9yLnJlYXNvbiwgZXJyb3IuZGV0YWlscyk7XG5cdFx0fSkuZmluYWxseSgoKSA9PiB7XG5cdFx0XHRjb25zb2xlLmxvZygnZmluYWxseScpO1xuXHRcdFx0Y29uc29sZS5sb2codGhpcyk7XG5cdFx0fSk7XG5cdFx0Y29uc29sZS5sb2cocmVzcG9uc2UpO1xuXHRcdGxldCB0MSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXHRcdGNvbnNvbGUubG9nKGBSZXF1ZXN0IHRvb2sgJHt0MSAtIHQwfSBtc2ApO1xuXHRcdHJldHVybiByZXNwb25zZTtcblx0fVxufSlcblxuLy8gRGVmaW5lIGEgcnVsZSB0byBsaW1pdCBtZXRob2QgY2FsbHNcbmxldCBydW5TY2FuUnVsZSA9IHtcblx0dHlwZTogJ21ldGhvZCcsXG5cdG5hbWU6ICdtb21lbnQuc2Nhbidcbn07XG4vLyBBZGQgdGhlIHJ1bGUsIGFsbG93aW5nIHVwIHRvIDEgc2NhbiBldmVyeSAyMCBzZWNvbmRzXG5ERFBSYXRlTGltaXRlci5hZGRSdWxlKHJ1blNjYW5SdWxlLCAxLCAxMDAwKTsiLCJpbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCB7IEhUVFAgfSBmcm9tICdtZXRlb3IvaHR0cCc7XG4vLyBpbXBvcnQgQVdTIGZyb20gJ2F3cy1zZGsnO1xuLy8gaW1wb3J0ICcuLi9hY2NvdW50cy1jb25maWcuanMnO1xuLy8gVGhpcyBkZWZpbmVzIGFsbCB0aGUgY29sbGVjdGlvbnMsIHB1YmxpY2F0aW9ucyBhbmQgbWV0aG9kcyB0aGF0IHRoZSBhcHBsaWNhdGlvbiBwcm92aWRlc1xuLy8gYXMgYW4gQVBJIHRvIHRoZSBjbGllbnQuXG5pbXBvcnQgJy4vcmVnaXN0ZXItYXBpLmpzJztcbi8vIGltcG9ydCAnLi9maXh0dXJlcy5qcyc7XG5cblxuXG52YXIgc2VydmVyX21vZGUgPSBNZXRlb3IuaXNQcm9kdWN0aW9uID8gXCJQUk9EVUNUSU9OXCIgOiBcIkRFVkVMT1BNRU5UXCI7XG5jb25zb2xlLmxvZygnaW5kZXguanM6ICcgKyBzZXJ2ZXJfbW9kZSArIFwiLS0+XCIgKyBKU09OLnN0cmluZ2lmeShNZXRlb3Iuc2V0dGluZ3MpKTtcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXG5cdGFzeW5jIGdldERhdGEoKXsgICAgXG5cdFx0dHJ5e1xuXHRcdFx0dmFyIHJlc3BvbnNlID0ge307XG5cdFx0XHRjb25zdCByZXN1bHRzID0gYXdhaXQgSFRUUC5jYWxsKCdHRVQnLCAnaHR0cDovL2pzb25wbGFjZWhvbGRlci50eXBpY29kZS5jb20vcG9zdHMnKTtcdFxuXHRcdFx0Y29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkocmVzdWx0cy5kYXRhWzBdKSk7XHRcblx0XHRcdGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHJlc3VsdHMuaGVhZGVycykpO1xuXHRcdFx0cmVzcG9uc2UuY29kZSA9IHRydWU7XHRcdFxuXHRcdFx0cmVzcG9uc2UuZGF0YSA9IHJlc3VsdHM7XHRcblx0XHR9IGNhdGNoKGUpe1xuXHRcdFx0cmVzcG9uc2UgPSBmYWxzZTtcblx0XHRcdGNvbnNvbGUubG9nKGUpO1xuXHRcdH0gZmluYWxseSB7XG5cdFx0XHRjb25zb2xlLmxvZyhcImZpbmFsbHkuLi5cIilcblx0XHRcdC8vdGhyb3cgbmV3IE1ldGVvci5FcnJvcihcImluYXBwcm9wcmlhdGUtcGljXCIsXCJUaGUgdXNlciBoYXMgdGFrZW4gYW4gaW5hcHByb3ByaWF0ZSBwaWN0dXJlLlwiKTtcdFxuXHRcdFx0cmV0dXJuIHJlc3BvbnNlO1xuXHRcdH1cblx0fVxuXG59KTtcblxuTWV0ZW9yLm9uQ29ubmVjdGlvbigoY29ubmVjdGlvbik9Pntcblx0bGV0IGNsaWVudEFkZHIgPSBjb25uZWN0aW9uLmNsaWVudEFkZHJlc3M7XG5cdGxldCBoZWFkZXJzID0gY29ubmVjdGlvbi5odHRwSGVhZGVycztcblx0Y29uc29sZS5sb2coYGNvbm5lY3Rpb24gZnJvbSAke2NsaWVudEFkZHJ9YCk7XG5cdC8vIGNvbnNvbGUubG9nKGhlYWRlcnMpO1xufSkiLCJpbXBvcnQgJy4uLy4uL2FwaS9tb21lbnRzL21ldGhvZHMuanMnIiwiaW1wb3J0ICcuLi9pbXBvcnRzL3N0YXJ0dXAvc2VydmVyJztcblxuTWV0ZW9yLnN0YXJ0dXAoKCkgPT4ge1xuICAvLyBjb2RlIHRvIHJ1biBvbiBzZXJ2ZXIgYXQgc3RhcnR1cFxufSk7XG4iXX0=
