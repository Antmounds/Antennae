import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';

import { Prints } from './prints.js';


Meteor.publish('prints.get', function(collectionId) {
	collectionId = collectionId || "";
	check(collectionId,String);
	let selector = collectionId ? {print_collection_id: collectionId} : {};
  	console.log(selector);
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