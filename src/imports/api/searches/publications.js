import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';

import { Searches } from './searches.js';


Meteor.publish('searches.get', function(searchId='') {
	check(searchId,String);
	searchId = searchId || {};
  	console.log(Searches.find(searchId).count());
	return Searches.find(
		searchId, 
	  { 
	  	sort: { created: -1 } 
	}
	, {
		fields: Searches.publicFields
	});
});

// Define a rule to limit subscription calls
var subscribeToSearchesRule = {
  type: 'subscription',
  name: 'searches.get'
}
// Add the rule, allowing up to 1 subscription every 5 seconds.
DDPRateLimiter.addRule(subscribeToSearchesRule, 1, 5000);