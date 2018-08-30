import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Session } from 'meteor/session';

import './login.html';
//import { Searches } from '../../api/searches/searches.js';


Template.login.created = function(){
	console.log(`${this.view.name} created`);
	var self = this;    
	//self.curSearches = new ReactiveDict(null);

	// self.autorun(() => {
	// 	self.subscribe("searches.get");
	// 	console.log(`login is ${self.subscriptionsReady() ? 'ready' : 'not ready'}`);
	// });
};

Template.login.rendered = function(){
	console.log(`${this.view.name} rendered`);

	let template = Template.instance();

	$( "#loginForm" ).validate({
		rules: {
			username: {
				required: true
			},
			password: {
				required: true
			}
		},
		messages: {
			username: {
				required: "Username or email required."
			},
			password: {
				required: "Password required."
			}
		},
		submitHandler() {
			let user = {
				username: template.find( "[name='username']" ).value,
				password: template.find( "[name='password']" ).value
			};

			Meteor.loginWithPassword(user.username, user.password, function(error){
			    if(error){
			        console.log(error.reason);
					validator.showErrors({
					    email: error.reason    
					});
			    } else {
			        var currentRoute = FlowRouter.getRouteName();
			        if(currentRoute == "login"){
			            FlowRouter.go('home');
			        }
			    }
			});
		}
	});
	//$('.modal').modal();
};

Template.login.helpers({

  //register: function(){
  //  return Session.get("displayStyle")
  //},

  us: function(){
  	console.log(Meteor.users);
  	return JSON.stringify(Meteor.user());
  }

})

Template.login.events({

  'submit #loginForm': function( event, template ) {
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

  //searches(){
  	//let searches = Searches.find({}, { sort: { created: -1 } });
  	// console.log(searches.fetch());
  	//Tracker.onInvalidate(() => console.trace());
  	//return searches;
  //},
});