import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import AWS from 'aws-sdk';

import { Collections } from '../collections/collections.js';
import { Prints } from './prints.js';

AWS.config.region = 'us-east-1';
var rekognition = new AWS.Rekognition();

Meteor.methods({
	"print.save"(newPrint){
		newPrint.print_adder = this.userId || "null";
		newPrint.print_collection = Collections.findOne(newPrint.collection) || "people";
		newPrint.print_name = newPrint.name;
		newPrint.print_img = newPrint.img;
		// console.log(newPrint);
		Prints.simpleSchema().clean(newPrint);
		if(!newPrint){
			throw new Meteor.Error('invalid-print','submitted print is invalid!');
		};
		let print = Prints.insert(newPrint);
		return print;
	},

	"print.delete"(printId){
		check(printId,String);
		if(printId){
			let print = Prints.remove(printId);
			console.log(`deleted face: ${printId}`);
			return `deleted face: ${printId}`;
		};
	}
})

// Define a rule to limit method calls
// let runScanRule = {
// 	type: 'method',
// 	name: 'print.save'
// };
// Add the rule, allowing up to 1 scan every 10 seconds
// DDPRateLimiter.addRule(runScanRule, 1, 10000);