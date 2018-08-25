import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import AWS from 'aws-sdk';

import { Searches } from './searches.js';

AWS.config.region = 'us-east-1';
var rekognition = new AWS.Rekognition();

Meteor.methods({
	"search.face"(picData){
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
		let rekognitionParams = {
			"CollectionId": "AntPay",
			"FaceMatchThreshold": 98,
			"MaxFaces": 5,
			"Image": { 
				"Bytes": imgBytes,
			},
		};
		let celebrityParams = {
			"Image": { 
				"Bytes": imgBytes,
			},
		};
		// create request objects
		let moderationRequest = rekognition.detectModerationLabels(moderationParams);
		let labelRequest = rekognition.detectLabels(labelParams);
		let faceRequest = rekognition.detectFaces(faceParams);
		let rekognitionRequest = rekognition.searchFacesByImage(rekognitionParams);
		let celebrityRequest = rekognition.recognizeCelebrities(celebrityParams);
		// create promises
		let promise1 = moderationRequest.promise();
		let promise2 = labelRequest.promise();
		let promise3 = faceRequest.promise();
		let promise4 = rekognitionRequest.promise();
		let promise5 = celebrityRequest.promise();
		// Fulfill promises in parallel
		let response = Promise.all([
			promise1.catch(error => { throw new Meteor.Error(error.code, error.message, error);return error; }),
			promise2.catch(error => { throw new Meteor.Error(error.code, error.message, error);return error; }),
			promise3.catch(error => { throw new Meteor.Error(error.code, error.message, error);return error; }),
			promise4.catch(error => { throw new Meteor.Error(error.code, error.message, error);return error; }),
			promise5.catch(error => { throw new Meteor.Error(error.code, error.message, error);return error; }),
		]).then(values => {
			console.log(values[0]);
			console.log(values[1]);
			console.log(values[2]);
			console.log(values[3]);
			console.log(values[4]);
			let t1 = new Date().getTime();
			console.log(`Response took ${t1 - t0} ms`);
			let search_results = {
					moderation: values[0].ModerationLabels,
					labels: values[1].Labels,
					faceDetails: values[2].FaceDetails,
					person: values[3].FaceMatches[0],
					celebrity: values[4].CelebrityFaces
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

	"search.delete"(searchId){
		check(searchId,String);
		if(searchId){
			let search = Searches.remove(searchId);
			console.log(`deleted search: ${searchId}`);
			return `deleted search: ${searchId}`;
		};
	}
})

// Define a rule to limit method calls
let runScanRule = {
	type: 'method',
	name: 'moment.scan'
};
// Add the rule, allowing up to 1 scan every 10 seconds
DDPRateLimiter.addRule(runScanRule, 1, 10000);