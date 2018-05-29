import { Accounts } from 'meteor/accounts-base';
import { AccountsCommon } from 'meteor/accounts-base'
import { AccountsClient } from 'meteor/accounts-base'


if (Meteor.isClient) {
	Accounts.ui.config({
	  passwordSignupFields: 'USERNAME_AND_EMAIL',
	});
}

if (Meteor.isServer) {
	console.log("accounts config loaded!");
	Accounts.onCreateUser((options, user) => {
		// user.created = new Date();

		console.log("user: " + user);
		console.log("options: " + options);
		// user = JSON.stringify(user);
		console.log(user);
		// options = JSON.stringify(options);
		console.log(options);

	    // Don't forget to return the new user object at the end!
		return user;
	});
}