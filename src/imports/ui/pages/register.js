import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Session } from 'meteor/session';

import './register.html';
//import { Searches } from '../../api/searches/searches.js';


Template.register.created = function(){
	console.log(`${this.view.name} created`);
	var self = this;    
	//self.curSearches = new ReactiveDict(null);

	// self.autorun(() => {
	// 	self.subscribe("searches.get");
	// 	console.log(`register is ${self.subscriptionsReady() ? 'ready' : 'not ready'}`);
	// });
};

Template.register.rendered = function(){
	console.log(`${this.view.name} rendered`);

	let template = Template.instance();

	$( "#registerForm" ).validate({
		rules: {
			// username: {
			// 	required: true
			// },
			email: {
				required: true
			},
			password: {
				required: true,
				minlength: 2
			}
		},
		messages: {
			// username: {
			// 	required: "Username required."
			// },
			email: {
				required: "Email required.",
				email: "Is that an email address?..."
			},
			password: {
				required: "Password required.",
				minlength: "Password must be at least 2 characters..."
			}
		},
		submitHandler() {
			let user = {
				// username: template.find( "[name='username']" ).value,
				email: template.find( "[name='email']" ).value,
				password: template.find( "[name='password']" ).value
			};

			console.log( user );

            Accounts.createUser(
            	user, function(error){
                if(error){
                    console.log(error.reason);
                } else {
                    FlowRouter.go('home');
                }
            });
		}
	});
	//$('.modal').modal();
};

Template.register.helpers({

  register: function(){
    return Session.get("displayStyle")
  },

  us: function(){
  	console.log(Meteor.users);
  	return JSON.stringify(Meteor.user());
  }

});

Template.register.events({

  'submit #registerForm': function( event, template ) {
  	event.preventDefault();
	// console.log(event);
  },

  'click #logout': function( event, template ) {
  	event.preventDefault();

	Meteor.logout(function(err) {
		console.log('logged out: ' + err);
		// callback
		// Session.set("ses",false);
	});
  },
	
})