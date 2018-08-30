import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import AWS from 'aws-sdk';

import { Collections } from './collections.js';

AWS.config.region = 'us-east-1';
var rekognition = new AWS.Rekognition();

Meteor.methods({
	"settings.update"(settings){
		if(!Meteor.user){
			throw new Meteor.Error('not-logged-in','must be logged-in to update settings');
			return false;
		}
		check(settings,Object);
		if(settings){
			let user = Meteor.user();
			console.log(`deleted collection: ${user}`);
			return `deleted collection: ${user}`;
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