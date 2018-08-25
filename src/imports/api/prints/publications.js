import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';

import { Prints } from './prints.js';


Meteor.publish('prints.get', function(collectionId) {
	collectionId = collectionId || "";
	check(collectionId,String);
	let selector = {
		// print_collection: collectionId
	};
  	// console.log(Collections.find(collectionId).count());
	return Prints.find(
		selector, 
	  { 
	  	sort: { created: -1 } 
	}
	, {
		fields: Prints.publicFields
	});
});

// Define a rule to limit subscription calls
var subscribeToPrintsRule = {
  type: 'subscription',
  name: 'prints.get'
}
// Add the rule, allowing up to 1 subscription every 5 seconds.
DDPRateLimiter.addRule(subscribeToPrintsRule, 1, 5000);