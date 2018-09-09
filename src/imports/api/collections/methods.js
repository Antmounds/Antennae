import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import AWS from 'aws-sdk';

import { Collections } from './collections.js';

AWS.config.region = 'us-east-1';
var rekognition = new AWS.Rekognition();

Meteor.methods({
	"collection.save"(newCol){
		console.log(newCol);
		let collectionParams = {
  			CollectionId: newCol.collection_id
		};
		let collectionRequest = rekognition.createCollection(collectionParams).promise().catch(error => { throw new Meteor.Error(error.code, error.message, error); return error; });
		collectionRequest.then(values => {return values});
		let col = Collections.insert(newCol);
		if(col){
			console.log(`added collection: ${col}`);
		}else{
            console.log(newCol);
            throw new Meteor.Error('add-collection-error',`error adding collection: ${newCol}`)		
		}
		return `added collection: ${col}`;
	},

	"collection.delete"(colId){
		check(colId,String);
		let col = Collections.findOne(colId);
		console.log(col);
		if(!col){
			throw new Meteor.Error('no-collection','No collection found with given id!');
		}else{
			let params = {
				CollectionId: col.collection_id
			};
			let collectionRequest = rekognition.deleteCollection(params).promise().catch(error => { throw new Meteor.Error(error.code, error.message, error); return error; });
			collectionRequest.then(values => {return values});
			let oldCol = Collections.remove(col._id);
			if(oldCol){
				console.log(`removed collection: ${oldCol}`);
			}else{
	            console.log(colId);
	            throw new Meteor.Error('remove-collection-error',`error removing collection: ${colId}`)		
			};
			return `removed collection: ${colId}`;
				// let print = Collections.remove(colId);
				// console.log(`deleted collection: ${colId}`);
				// return `deleted collection: ${colId}`;
		};
	}
})

// Define a rule to limit method calls
// let runScanRule = {
// 	type: 'method',
// 	name: 'moment.scan'
// };
// Add the rule, allowing up to 1 scan every 10 seconds
// DDPRateLimiter.addRule(runScanRule, 1, 10000);