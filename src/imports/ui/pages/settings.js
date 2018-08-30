import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Session } from 'meteor/session';

import './settings.html';
//import { Searches } from '../../api/searches/searches.js';


Template.settings.created = function(){
	console.log(`${this.view.name} created`);
	var self = this;    
	//self.curSearches = new ReactiveDict(null);

	// self.autorun(() => {
	// 	self.subscribe("searches.get");
	// 	console.log(`Search is ${self.subscriptionsReady() ? 'ready' : 'not ready'}`);
	// });
};

Template.settings.rendered = function(){
	console.log(`${this.view.name} rendered`);
	//$('.modal').modal();
};

Template.settings.helpers({

  //searches(){
  	//let searches = Searches.find({}, { sort: { created: -1 } });
  	// console.log(searches.fetch());
  	//Tracker.onInvalidate(() => console.trace());
  	//return searches;
  //},
});

Template.settings.events({
  'change #similarityLevel'(event, instance) {
  	event.preventDefault();
  	Session.set('matchThreshold', Number(event.currentTarget.value));
  	console.log(event);
  	Materialize.toast(event.currentTarget.value,5000);
  },
});