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
const os = require('os');

server_mode = Meteor.isProduction ? "PRODUCTION" : "DEVELOPMENT";
console.log('index.js: ' + server_mode + "-->" + JSON.stringify(Meteor.settings));
Meteor.methods({
  info() {
    return `version: 0.9.0 - build: ${process.env.BUILD || 1234} - hostname: ${os.hostname()}`;
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvbW9tZW50cy9tZXRob2RzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9pbXBvcnRzL3N0YXJ0dXAvc2VydmVyL2luZGV4LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9pbXBvcnRzL3N0YXJ0dXAvc2VydmVyL3JlZ2lzdGVyLWFwaS5qcyIsIm1ldGVvcjovL/CfkrthcHAvc2VydmVyL21haW4uanMiXSwibmFtZXMiOlsiRERQUmF0ZUxpbWl0ZXIiLCJtb2R1bGUiLCJ3YXRjaCIsInJlcXVpcmUiLCJ2IiwiQVdTIiwiZGVmYXVsdCIsImNvbmZpZyIsInJlZ2lvbiIsInJla29nbml0aW9uIiwiUmVrb2duaXRpb24iLCJNZXRlb3IiLCJtZXRob2RzIiwicGljRGF0YSIsImNvbnNvbGUiLCJsb2ciLCJ0MCIsIkRhdGUiLCJnZXRUaW1lIiwiaW1nQnl0ZXMiLCJCdWZmZXIiLCJmcm9tIiwic3BsaXQiLCJtb2RlcmF0aW9uUGFyYW1zIiwibGFiZWxQYXJhbXMiLCJmYWNlUGFyYW1zIiwibW9kZXJhdGlvblJlcXVlc3QiLCJkZXRlY3RNb2RlcmF0aW9uTGFiZWxzIiwibGFiZWxSZXF1ZXN0IiwiZGV0ZWN0TGFiZWxzIiwiZmFjZVJlcXVlc3QiLCJkZXRlY3RGYWNlcyIsInByb21pc2UxIiwicHJvbWlzZSIsInByb21pc2UyIiwicHJvbWlzZTMiLCJyZXNwb25zZSIsIlByb21pc2UiLCJhbGwiLCJjYXRjaCIsImVycm9yIiwiRXJyb3IiLCJjb2RlIiwibWVzc2FnZSIsInRoZW4iLCJ2YWx1ZXMiLCJ0MSIsInJlYXNvbiIsImRldGFpbHMiLCJmaW5hbGx5IiwicnVuU2NhblJ1bGUiLCJ0eXBlIiwibmFtZSIsImFkZFJ1bGUiLCJIVFRQIiwib3MiLCJzZXJ2ZXJfbW9kZSIsImlzUHJvZHVjdGlvbiIsIkpTT04iLCJzdHJpbmdpZnkiLCJzZXR0aW5ncyIsImluZm8iLCJwcm9jZXNzIiwiZW52IiwiQlVJTEQiLCJob3N0bmFtZSIsImdldERhdGEiLCJyZXN1bHRzIiwiY2FsbCIsImRhdGEiLCJoZWFkZXJzIiwiZSIsIm9uQ29ubmVjdGlvbiIsImNvbm5lY3Rpb24iLCJjbGllbnRBZGRyIiwiY2xpZW50QWRkcmVzcyIsImh0dHBIZWFkZXJzIiwic3RhcnR1cCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBQSxJQUFJQSxjQUFKO0FBQW1CQyxPQUFPQyxLQUFQLENBQWFDLFFBQVEseUJBQVIsQ0FBYixFQUFnRDtBQUFDSCxpQkFBZUksQ0FBZixFQUFpQjtBQUFDSixxQkFBZUksQ0FBZjtBQUFpQjs7QUFBcEMsQ0FBaEQsRUFBc0YsQ0FBdEY7QUFBeUYsSUFBSUMsR0FBSjtBQUFRSixPQUFPQyxLQUFQLENBQWFDLFFBQVEsU0FBUixDQUFiLEVBQWdDO0FBQUNHLFVBQVFGLENBQVIsRUFBVTtBQUFDQyxVQUFJRCxDQUFKO0FBQU07O0FBQWxCLENBQWhDLEVBQW9ELENBQXBEO0FBR3BIQyxJQUFJRSxNQUFKLENBQVdDLE1BQVgsR0FBb0IsV0FBcEI7QUFFQSxJQUFJQyxjQUFjLElBQUlKLElBQUlLLFdBQVIsRUFBbEI7QUFFQUMsT0FBT0MsT0FBUCxDQUFlO0FBQ2QsZ0JBQWNDLE9BQWQsRUFBc0I7QUFDckI7QUFDQUMsWUFBUUMsR0FBUixDQUFZLG9CQUFaO0FBQ0EsUUFBSUMsS0FBSyxJQUFJQyxJQUFKLEdBQVdDLE9BQVgsRUFBVDtBQUNBLFFBQUlDLFdBQVcsSUFBSUMsT0FBT0MsSUFBWCxDQUFnQlIsUUFBUVMsS0FBUixDQUFjLEdBQWQsRUFBbUIsQ0FBbkIsQ0FBaEIsRUFBdUMsUUFBdkMsQ0FBZjtBQUNBLFFBQUlDLG1CQUFtQjtBQUN0QixlQUFTO0FBQ1IsaUJBQVNKO0FBREQsT0FEYTtBQUl0Qix1QkFBaUI7QUFKSyxLQUF2QjtBQU1BLFFBQUlLLGNBQWM7QUFDakIsZUFBUztBQUNSLGlCQUFTTDtBQURELE9BRFE7QUFJakIsbUJBQWEsRUFKSTtBQUtqQix1QkFBaUI7QUFMQSxLQUFsQjtBQU9BLFFBQUlNLGFBQWE7QUFDaEIs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UTtBQUNUbkMsbUJBQVcsS0FBWDtBQUNBdEIsZ0JBQVFDLEdBQVIsQ0FBWXdELENBQVo7QUFDQSxPQVZELFNBVVU7QUFDVHpELGdCQUFRQyxHQUFSLENBQVksWUFBWixFQURTLENBRVQ7O0FBQ0EsZUFBT3FCLFFBQVA7QUFDQTtBQUNELEtBaEJEO0FBQUE7O0FBTmMsQ0FBZjtBQTBCQXpCLE9BQU82RCxZQUFQLENBQXFCQyxVQUFELElBQWM7QUFDakMsTUFBSUMsYUFBYUQsV0FBV0UsYUFBNUI7QUFDQSxNQUFJTCxVQUFVRyxXQUFXRyxXQUF6QjtBQUNBOUQsVUFBUUMsR0FBUixDQUFhLG1CQUFrQjJELFVBQVcsRUFBMUMsRUFIaUMsQ0FJakM7QUFDQSxDQUxELEU7Ozs7Ozs7Ozs7O0FDckRBekUsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLDhCQUFSLENBQWIsRTs7Ozs7Ozs7Ozs7QUNBQUYsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLDJCQUFSLENBQWI7QUFjQVEsT0FBT2tFLE9BQVAsQ0FBZSxNQUFNLENBQ25CO0FBQ0QsQ0FGRCxFIiwiZmlsZSI6Ii9hcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBERFBSYXRlTGltaXRlciB9IGZyb20gJ21ldGVvci9kZHAtcmF0ZS1saW1pdGVyJztcbmltcG9ydCBBV1MgZnJvbSAnYXdzLXNkayc7XG5cbkFXUy5jb25maWcucmVnaW9uID0gJ3VzLWVhc3QtMSc7XG5cbnZhciByZWtvZ25pdGlvbiA9IG5ldyBBV1MuUmVrb2duaXRpb24oKTtcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXHRcIm1vbWVudC5zY2FuXCIocGljRGF0YSl7XG5cdFx0Ly9yZXR1cm4gMTtcblx0XHRjb25zb2xlLmxvZyhcIkFOQUxZWklORyBJTUFHRS4uLlwiKTtcblx0XHR2YXIgdDAgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcblx0XHRsZXQgaW1nQnl0ZXMgPSBuZXcgQnVmZmVyLmZyb20ocGljRGF0YS5zcGxpdChcIixcIilbMV0sIFwiYmFzZTY0XCIpO1xuXHRcdGxldCBtb2RlcmF0aW9uUGFyYW1zID0ge1xuXHRcdFx0XCJJbWFnZVwiOiB7IFxuXHRcdFx0XHRcIkJ5dGVzXCI6IGltZ0J5dGVzLFxuXHRcdFx0fSxcblx0XHRcdFwiTWluQ29uZmlkZW5jZVwiOiA1MCxcblx0XHR9O1xuXHRcdGxldCBsYWJlbFBhcmFtcyA9IHtcblx0XHRcdFwiSW1hZ2VcIjogeyBcblx0XHRcdFx0XCJCeXRlc1wiOiBpbWdCeXRlcyxcblx0XHRcdH0sXG5cdFx0XHRcIk1heExhYmVsc1wiOiAyMCxcblx0XHRcdFwiTWluQ29uZmlkZW5jZVwiOiA3NSxcblx0XHR9O1xuXHRcdGxldCBmYWNlUGFyYW1zID0ge1xuXHRcdFx0XCJJbWFnZVwiOiB7IFxuXHRcdFx0XHRcIkJ5dGVzXCI6IGltZ0J5dGVzLFxuXHRcdFx0fSxcbiAgXHRcdFx0XCJBdHRyaWJ1dGVzXCI6IFtcIkFMTFwiXSxcblx0XHR9O1xuXHRcdC8vIGNyZWF0ZSByZXF1ZXN0IG9iamVjdHNcblx0XHRsZXQgbW9kZXJhdGlvblJlcXVlc3QgPSByZWtvZ25pdGlvbi5kZXRlY3RNb2RlcmF0aW9uTGFiZWxzKG1vZGVyYXRpb25QYXJhbXMpO1xuXHRcdGxldCBsYWJlbFJlcXVlc3QgPSByZWtvZ25pdGlvbi5kZXRlY3RMYWJlbHMobGFiZWxQYXJhbXMpO1xuXHRcdGxldCBmYWNlUmVxdWVzdCA9IHJla29nbml0aW9uLmRldGVjdEZhY2VzKGZhY2VQYXJhbXMpO1xuXHRcdC8vIGNyZWF0ZSBwcm9taXNlc1xuXHRcdGxldCBwcm9taXNlMSA9IG1vZGVyYXRpb25SZXF1ZXN0LnByb21pc2UoKTtcblx0XHRsZXQgcHJvbWlzZTIgPSBsYWJlbFJlcXVlc3QucHJvbWlzZSgpO1xuXHRcdGxldCBwcm9taXNlMyA9IGZhY2VSZXF1ZXN0LnByb21pc2UoKTtcblx0XHQvLyBGdWxmaWxsIHByb21pc2VzIGluIHBhcmFsbGVsXG5cdFx0Ly8gcmV0dXJuIFByb21pc2UuYWxsKFtcblx0XHQvLyBcdHByb21pc2UxLmNhdGNoKGVycm9yID0+IHsgcmV0dXJuIGVycm9yIH0pLFxuXHRcdC8vIFx0cHJvbWlzZTIuY2F0Y2goZXJyb3IgPT4geyByZXR1cm4gZXJyb3IgfSksXG5cdFx0Ly8gXHRwcm9taXNlMy5jYXRjaChlcnJvciA9PiB7IHJldHVybiBlcnJvciB9KSxcblx0XHQvLyBdKS50aGVuKHZhbHVlcyA9PiB7XG5cdFx0Ly8gXHRjb25zb2xlLmxvZyh2YWx1ZXNbMF0pO1xuXHRcdC8vIFx0Y29uc29sZS5sb2codmFsdWVzWzFdKTtcblx0XHQvLyBcdGNvbnNvbGUubG9nKHZhbHVlc1syXSk7XG5cdFx0Ly8gXHRsZXQgdDEgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcblx0XHQvLyBcdGNvbnNvbGUubG9nKGBSZXF1ZXN0IHRvb2sgJHt0MSAtIHQwfSBtc2ApO1xuXHRcdC8vIFx0cmV0dXJuIHZhbHVlcztcblx0XHQvLyB9KTtcblx0XHQvL3JldHVybiB7fTtcblx0XHRsZXQgcmVzcG9uc2UgPSBQcm9taXNlLmFsbChbXG5cdFx0XHRwcm9taXNlMS5jYXRjaChlcnJvciA9PiB7IHRocm93IG5ldyBNZXRlb3IuRXJyb3IoZXJyb3IuY29kZSwgZXJyb3IubWVzc2FnZSwgZXJyb3IpO3JldHVybiBlcnJvcjsgfSksXG5cdFx0XHRwcm9taXNlMi5jYXRjaChlcnJvciA9PiB7IHRocm93IG5ldyBNZXRlb3IuRXJyb3IoZXJyb3IuY29kZSwgZXJyb3IubWVzc2FnZSwgZXJyb3IpO3JldHVybiBlcnJvcjsgfSksXG5cdFx0XHRwcm9taXNlMy5jYXRjaChlcnJvciA9PiB7IHRocm93IG5ldyBNZXRlb3IuRXJyb3IoZXJyb3IuY29kZSwgZXJyb3IubWVzc2FnZSwgZXJyb3IpO3JldHVybiBlcnJvcjsgfSksXG5cdFx0XSkudGhlbih2YWx1ZXMgPT4ge1xuXHRcdFx0Y29uc29sZS5sb2codmFsdWVzWzBdKTtcblx0XHRcdGNvbnNvbGUubG9nKHZhbHVlc1sxXSk7XG5cdFx0XHRjb25zb2xlLmxvZyh2YWx1ZXNbMl0pO1xuXHRcdFx0bGV0IHQxID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG5cdFx0XHRjb25zb2xlLmxvZyhgUmVzcG9uc2UgdG9vayAke3QxIC0gdDB9IG1zYCk7XG5cdFx0XHRyZXR1cm4gdmFsdWVzO1xuXHRcdH0pLmNhdGNoKGVycm9yID0+IHtcblx0XHRcdGNvbnNvbGUubG9nKCdjYXVnaHQgZXJyb3IhJyk7XG5cdFx0XHRjb25zb2xlLmxvZyhlcnJvcik7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKGVycm9yLmVycm9yLCBlcnJvci5yZWFzb24sIGVycm9yLmRldGFpbHMpO1xuXHRcdH0pLmZpbmFsbHkoKCkgPT4ge1xuXHRcdFx0Y29uc29sZS5sb2coJ2ZpbmFsbHknKTtcblx0XHRcdGNvbnNvbGUubG9nKHRoaXMpO1xuXHRcdH0pO1xuXHRcdGNvbnNvbGUubG9nKHJlc3BvbnNlKTtcblx0XHRsZXQgdDEgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcblx0XHRjb25zb2xlLmxvZyhgUmVxdWVzdCB0b29rICR7dDEgLSB0MH0gbXNgKTtcblx0XHRyZXR1cm4gcmVzcG9uc2U7XG5cdH1cbn0pXG5cbi8vIERlZmluZSBhIHJ1bGUgdG8gbGltaXQgbWV0aG9kIGNhbGxzXG5sZXQgcnVuU2NhblJ1bGUgPSB7XG5cdHR5cGU6ICdtZXRob2QnLFxuXHRuYW1lOiAnbW9tZW50LnNjYW4nXG59O1xuLy8gQWRkIHRoZSBydWxlLCBhbGxvd2luZyB1cCB0byAxIHNjYW4gZXZlcnkgMjAgc2Vjb25kc1xuRERQUmF0ZUxpbWl0ZXIuYWRkUnVsZShydW5TY2FuUnVsZSwgMSwgMTAwMCk7IiwiLypcbiAqIENvcHlyaWdodCAyMDE3LXByZXNlbnQgQW50bW91bmRzLmNvbSwgSW5jLiBvciBpdHMgYWZmaWxpYXRlcy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgR05VIEFmZmVybyBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlLCB2ZXJzaW9uIDMuMCAodGhlIFwiTGljZW5zZVwiKS4gWW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoXG4gKiB0aGUgTGljZW5zZS4gQSBjb3B5IG9mIHRoZSBMaWNlbnNlIGlzIGxvY2F0ZWQgYXRcbiAqXG4gKiAgICAgaHR0cHM6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy9hZ3BsLTMuMC5lbi5odG1sXG4gKlxuICogb3IgaW4gdGhlIFwibGljZW5zZVwiIGZpbGUgYWNjb21wYW55aW5nIHRoaXMgZmlsZS4gVGhpcyBmaWxlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SXG4gKiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnNcbiAqIGFuZCBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5pbXBvcnQgeyBIVFRQIH0gZnJvbSAnbWV0ZW9yL2h0dHAnO1xuLy8gaW1wb3J0IEFXUyBmcm9tICdhd3Mtc2RrJztcbi8vIGltcG9ydCAnLi4vYWNjb3VudHMtY29uZmlnLmpzJztcbi8vIFRoaXMgZGVmaW5lcyBhbGwgdGhlIGNvbGxlY3Rpb25zLCBwdWJsaWNhdGlvbnMgYW5kIG1ldGhvZHMgdGhhdCB0aGUgYXBwbGljYXRpb24gcHJvdmlkZXNcbi8vIGFzIGFuIEFQSSB0byB0aGUgY2xpZW50LlxuaW1wb3J0ICcuL3JlZ2lzdGVyLWFwaS5qcyc7XG4vLyBpbXBvcnQgJy4vZml4dHVyZXMuanMnO1xuXG5jb25zdCBvcyA9IHJlcXVpcmUoJ29zJyk7XG5cblxuc2VydmVyX21vZGUgPSBNZXRlb3IuaXNQcm9kdWN0aW9uID8gXCJQUk9EVUNUSU9OXCIgOiBcIkRFVkVMT1BNRU5UXCI7XG5jb25zb2xlLmxvZygnaW5kZXguanM6ICcgKyBzZXJ2ZXJfbW9kZSArIFwiLS0+XCIgKyBKU09OLnN0cmluZ2lmeShNZXRlb3Iuc2V0dGluZ3MpKTtcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXG5cdGluZm8oKXtcblx0XHRyZXR1cm4gYHZlcnNpb246IDAuOS4wIC0gYnVpbGQ6ICR7cHJvY2Vzcy5lbnYuQlVJTEQgfHwgMTIzNH0gLSBob3N0bmFtZTogJHtvcy5ob3N0bmFtZSgpfWA7XG5cdH0sXG5cblx0YXN5bmMgZ2V0RGF0YSgpeyAgICBcblx0XHR0cnl7XG5cdFx0XHR2YXIgcmVzcG9uc2UgPSB7fTtcblx0XHRcdGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBIVFRQLmNhbGwoJ0dFVCcsICdodHRwOi8vanNvbnBsYWNlaG9sZGVyLnR5cGljb2RlLmNvbS9wb3N0cycpO1x0XG5cdFx0XHRjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShyZXN1bHRzLmRhdGFbMF0pKTtcdFxuXHRcdFx0Y29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkocmVzdWx0cy5oZWFkZXJzKSk7XG5cdFx0XHRyZXNwb25zZS5jb2RlID0gdHJ1ZTtcdFx0XG5cdFx0XHRyZXNwb25zZS5kYXRhID0gcmVzdWx0cztcdFxuXHRcdH0gY2F0Y2goZSl7XG5cdFx0XHRyZXNwb25zZSA9IGZhbHNlO1xuXHRcdFx0Y29uc29sZS5sb2coZSk7XG5cdFx0fSBmaW5hbGx5IHtcblx0XHRcdGNvbnNvbGUubG9nKFwiZmluYWxseS4uLlwiKVxuXHRcdFx0Ly90aHJvdyBuZXcgTWV0ZW9yLkVycm9yKFwiaW5hcHByb3ByaWF0ZS1waWNcIixcIlRoZSB1c2VyIGhhcyB0YWtlbiBhbiBpbmFwcHJvcHJpYXRlIHBpY3R1cmUuXCIpO1x0XG5cdFx0XHRyZXR1cm4gcmVzcG9uc2U7XG5cdFx0fVxuXHR9XG5cbn0pO1xuXG5NZXRlb3Iub25Db25uZWN0aW9uKChjb25uZWN0aW9uKT0+e1xuXHRsZXQgY2xpZW50QWRkciA9IGNvbm5lY3Rpb24uY2xpZW50QWRkcmVzcztcblx0bGV0IGhlYWRlcnMgPSBjb25uZWN0aW9uLmh0dHBIZWFkZXJzO1xuXHRjb25zb2xlLmxvZyhgY29ubmVjdGlvbiBmcm9tICR7Y2xpZW50QWRkcn1gKTtcblx0Ly8gY29uc29sZS5sb2coaGVhZGVycyk7XG59KSIsImltcG9ydCAnLi4vLi4vYXBpL21vbWVudHMvbWV0aG9kcy5qcyciLCIvKlxuICogQ29weXJpZ2h0IDIwMTctcHJlc2VudCBBbnRtb3VuZHMuY29tLCBJbmMuIG9yIGl0cyBhZmZpbGlhdGVzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBHTlUgQWZmZXJvIEdlbmVyYWwgUHVibGljIExpY2Vuc2UsIHZlcnNpb24gMy4wICh0aGUgXCJMaWNlbnNlXCIpLiBZb3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGhcbiAqIHRoZSBMaWNlbnNlLiBBIGNvcHkgb2YgdGhlIExpY2Vuc2UgaXMgbG9jYXRlZCBhdFxuICpcbiAqICAgICBodHRwczovL3d3dy5nbnUub3JnL2xpY2Vuc2VzL2FncGwtMy4wLmVuLmh0bWxcbiAqXG4gKiBvciBpbiB0aGUgXCJsaWNlbnNlXCIgZmlsZSBhY2NvbXBhbnlpbmcgdGhpcyBmaWxlLiBUaGlzIGZpbGUgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1JcbiAqIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9uc1xuICogYW5kIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5pbXBvcnQgJy4uL2ltcG9ydHMvc3RhcnR1cC9zZXJ2ZXInO1xuXG5NZXRlb3Iuc3RhcnR1cCgoKSA9PiB7XG4gIC8vIGNvZGUgdG8gcnVuIG9uIHNlcnZlciBhdCBzdGFydHVwXG59KTtcbiJdfQ==
