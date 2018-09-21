import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import AWS from 'aws-sdk';

import { Collections } from '../collections/collections.js';
import { Prints } from '../../api/prints/prints.js';
import { Searches } from './searches.js';

AWS.config.region = 'us-east-1';
var rekognition = new AWS.Rekognition();

Meteor.methods({
	"getDashboardStats"(){
		let dashboardStats = {};
		dashboardStats.collections = Collections.find({}).count();
		dashboardStats.faces = Prints.find().count();
		// dashboardStats.faces = Collections.aggregate(
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
		dashboardStats.matches = Searches.find({'search_results.persons': {$ne: []}}).count();
		dashboardStats.matchPercent = (Math.round((dashboardStats.matches / dashboardStats.searches * 100) * 10) / 10) || 0;
		console.log(dashboardStats.faces);
		return dashboardStats;
	},

	"search.face"(searchData){
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
				"FaceMatchThreshold": searchData.matchThreshold,
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
					let colId = Prints.findOne({print_id: values[i].FaceMatches[0].Face.FaceId}, {fields: {print_collection_id: 1}}).print_collection_id;
					let tag = {
						collection: Collections.findOne(colId, {fields: {collection_name: 1}}).collection_name,
						image_id: values[i].FaceMatches[0].Face.ExternalImageId.replace(/__/g," "),
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