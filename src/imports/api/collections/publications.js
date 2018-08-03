import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';

import { Collections } from './collections.js';


Meteor.publish('collections.get', function(collectionId='') {
	check(collectionId,String);
	collectionId = collectionId || {};
  	console.log(Collections.find(collectionId).count());
	return Collections.find(
		collectionId, 
	  { 
	  	sort: { created: -1 } 
	}
	, {
		fields: Collections.publicFields
	});
});

// Define a rule to limit subscription calls
var subscribeToCollectionsRule = {
  type: 'subscription',
  name: 'collections.get'
}
// Add the rule, allowing up to 1 subscription every 5 seconds.
DDPRateLimiter.addRule(subscribeToCollectionsRule, 1, 5000);