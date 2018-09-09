import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import AWS from 'aws-sdk';

import { Collections } from '../collections/collections.js';
import { Prints } from '../../api/prints/prints.js';
import { Searches } from './searches.js';

AWS.config.region = 'us-east-1';
var rekognition = new AWS.Rekognition();

Meteor.methods({
	"search.face"(picData,matchThreshold=98){
		//return 1;
		// if(!Meteor.user){
		// 	throw new Meteor.Error('not-logged-in','must be logged-in to perform search');
		// 	return false;
		// }
		// let matchThreshold = matchThreshold;
		check(matchThreshold, Number);
		console.log("ANALYZING IMAGE...");
		var t0 = new Date().getTime();
		let imgBytes = new Buffer.from(picData.split(",")[1], "base64");
		// let colId = Meteor.user().profile.collections;
		let colIds = Collections.find({collection_type: 'face'}, {fields: {collection_id: 1}}).fetch();
		console.log(colIds)
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
		let celebrityParams = {
			"Image": { 
				"Bytes": imgBytes,
			},
		};
		// create request objects
		let moderationRequest = rekognition.detectModerationLabels(moderationParams);
		let labelRequest = rekognition.detectLabels(labelParams);
		let faceRequest = rekognition.detectFaces(faceParams);
		let celebrityRequest = rekognition.recognizeCelebrities(celebrityParams);
		// create promises
		let allPromises = [];
		allPromises.push(moderationRequest.promise().catch(error => { throw new Meteor.Error(error.code, error.message, error); return error; }));
		allPromises.push(labelRequest.promise().catch(error => { throw new Meteor.Error(error.code, error.message, error); return error; }));
		allPromises.push(faceRequest.promise().catch(error => { throw new Meteor.Error(error.code, error.message, error); return error; }));
		allPromises.push(celebrityRequest.promise().catch(error => { throw new Meteor.Error(error.code, error.message, error); return error; }));
		_.each(colIds, (colId) => {
			let rekognitionParams = {
				"CollectionId": colId.collection_id,
				"FaceMatchThreshold": matchThreshold,
				"MaxFaces": 2,
				"Image": { 
					"Bytes": imgBytes,
				},
			};
			console.log(rekognitionParams);
			let rekognitionRequest = rekognition.searchFacesByImage(rekognitionParams);
			allPromises.push(rekognitionRequest.promise().catch(error => { throw new Meteor.Error(error.code, error.message, error); return error; }));
			console.log(colId.collection_id);
		});// rekognitionRequest.promise();
		// Fulfill promises in parallel
		let response = Promise.all(
			allPromises
		).then(values => {
			console.log(JSON.stringify(values));
			console.log(values[0]);
			console.log(values[1]);
			console.log(values[2]);
			console.log(values[3]);
			//console.log(values[4]);
			let i = 4;
			let persons = [];
			while(values[i]){
				console.log(values[i]);
				if (values[i].FaceMatches[0]){
					let tag = {
						collection: Prints.findOne({print_id: values[i].FaceMatches[0].Face.FaceId}, {fields: {print_collection: 1}}),
						image_id: values[i].FaceMatches[0].Face.ExternalImageId,
						face_id: values[i].FaceMatches[0].Face.FaceId,
						similarity: values[i].FaceMatches[0].Similarity,
					};
					persons.push(tag);
					console.log(tag);
				};
				i++;
			};
			let t1 = new Date().getTime();
			console.log(`Response took ${t1 - t0} ms`);
			let search_results = {
					moderation: values[0].ModerationLabels,
					labels: values[1].Labels,
					faceDetails: values[2].FaceDetails,
					celebrity: values[3].CelebrityFaces,
					persons: persons, //.FaceMatches[0],
			};
			let search = {
					// search_image: picData,
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