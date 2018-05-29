import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import AWS from 'aws-sdk';

AWS.config.region = 'us-east-1';

var rekognition = new AWS.Rekognition();

Meteor.methods({
	"moment.scan"(picData){
		//return 1;
		console.log("ANALYZING IMAGE...");
		var t0 = new Date().getTime();
		let imgBytes = new Buffer.from(picData.split(",")[1], "base64");
		let moderationParams = {
			"Image": { 
				"Bytes": imgBytes,
			},
			"MinConfidence": 50,
		};
		let labelParams = {
			"Image": { 
				"Bytes": imgBytes,
			},
			"MaxLabels": 20,
			"MinConfidence": 75,
		};
		let faceParams = {
			"Image": { 
				"Bytes": imgBytes,
			},
  			"Attributes": ["ALL"],
		};
		// create request objects
		let moderationRequest = rekognition.detectModerationLabels(moderationParams);
		let labelRequest = rekognition.detectLabels(labelParams);
		let faceRequest = rekognition.detectFaces(faceParams);
		// create promises
		let promise1 = moderationRequest.promise();
		let promise2 = labelRequest.promise();
		let promise3 = faceRequest.promise();
		// Fulfill promises in parallel
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
		let response = Promise.all([
			promise1.catch(error => { throw new Meteor.Error(error.code, error.message, error);return error; }),
			promise2.catch(error => { throw new Meteor.Error(error.code, error.message, error);return error; }),
			promise3.catch(error => { throw new Meteor.Error(error.code, error.message, error);return error; }),
		]).then(values => {
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
})

// Define a rule to limit method calls
let runScanRule = {
	type: 'method',
	name: 'moment.scan'
};
// Add the rule, allowing up to 1 scan every 20 seconds
DDPRateLimiter.addRule(runScanRule, 1, 1000);