import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import AWS from 'aws-sdk';

import { Collections } from '../collections/collections.js';
import { Prints } from './prints.js';

AWS.config.region = 'us-east-1';
var rekognition = new AWS.Rekognition();

Meteor.methods({
	"print.save"(newPrint){
		let col = Collections.findOne(newPrint.collection);
		console.log(col);
		if(!col){
			throw new Meteor.Error('no-collection','No collection found with given id!');
		};
		newPrint.print_adder = this.userId || null;
		newPrint.print_collection_id = col._id || null;
		newPrint.print_name = newPrint.name.replace(/ /g,"__");
		newPrint.print_img = newPrint.img;
		// console.log(newPrint);
		if(!newPrint){
			throw new Meteor.Error('invalid-print','submitted print is invalid!');
		};
		Prints.simpleSchema().clean(newPrint);
        // index a face into a collection
        let faceParams = {
          CollectionId: col.collection_id,
          ExternalImageId: newPrint.print_name,
		  Image: { 
			"Bytes": new Buffer.from(newPrint.print_img.split(",")[1], "base64"),
		  },
          DetectionAttributes: ["ALL"]
        };
        console.log(1);
        let faceRequest = rekognition.indexFaces(faceParams);
        let promise = faceRequest.promise();
        let indexFace = promise.then(result => {
        	// console.log(result);
        	newPrint.print_id = result.FaceRecords[0].Face.FaceId;
			let print = Prints.insert(newPrint);
        	console.log(`inserted: ${print}`);
        	return result;
        }).catch(error => {
        	throw new Meteor.Error(error.code, error.message, error);
        	return error;
        });
		return indexFace;
	},

	"print.delete"(printId){
		check(printId,String);
		let print = Prints.findOne(printId);
		let col = Collections.findOne(print.print_collection_id);
		console.log(print);
		if(!print){
			throw new Meteor.Error('no-print','No print found with given id!');
		}else{
			let params = {
				CollectionId: col.collection_id, 
				FaceIds: [
					print.print_id
				]
			};
			let printRequest = rekognition.deleteFaces(params).promise().catch(error => { throw new Meteor.Error(error.code, error.message, error); return error; });
			printRequest.then(values => {
				let oldPrint = Prints.remove(print._id);
				if(oldPrint){
					console.log(`deleted face: ${printId}`);
				}else{
		            console.log(printId);
		            throw new Meteor.Error('remove-print-error',`error removing print: ${printId}`)		
				};
				return values
			});
			return `removed print: ${printId}`;
		};
	},
})

// Define a rule to limit method calls
let deletePrintRule = {
	type: 'method',
	name: 'print.delete'
};
// Add the rule, allowing up to 1 scan every 1 seconds
DDPRateLimiter.addRule(deletePrintRule, 1, 1000);