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
		newPrint.print_adder = this.userId || "null";
		newPrint.print_collection = col.collection_id || "people";
		newPrint.print_collection_id = col._id;
		newPrint.print_name = newPrint.name.replace(/ /g,"_");
		newPrint.print_img = newPrint.img;
		// console.log(newPrint);
		if(!newPrint){
			throw new Meteor.Error('invalid-print','submitted print is invalid!');
		};
		Prints.simpleSchema().clean(newPrint);
        // index a face into a collection
        let faceParams = {
          CollectionId: newPrint.print_collection,
          ExternalImageId: newPrint.print_name,
		  Image: { 
			"Bytes": new Buffer.from(newPrint.print_img.split(",")[1], "base64"),
		  },
          DetectionAttributes: ["ALL"]
        };
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
		if(printId){
			let print = Prints.remove(printId);
			console.log(`deleted face: ${printId}`);
			return `deleted face: ${printId}`;
		};
	},

	"print.count"(data){
			console.log(data);
		// return 55;
		let colId =  data || "";
		check(colId,String);
		if(colId){
			let printCount = Prints.find({print_collection_id: colId}).count();
			console.log(printCount);
			return printCount;
		};
	},
})

// Define a rule to limit method calls
// let runScanRule = {
// 	type: 'method',
// 	name: 'print.save'
// };
// Add the rule, allowing up to 1 scan every 10 seconds
// DDPRateLimiter.addRule(runScanRule, 1, 10000);