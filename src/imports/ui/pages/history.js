import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Session } from 'meteor/session';

import './history.html';
import { Searches } from '../../api/searches/searches.js';


Template.history.created = function(){
	console.log(`${this.view.name} created`);
	var self = this;    
	//self.curSearches = new ReactiveDict(null);

	self.autorun(() => {
		self.subscribe("searches.get");
		console.log(`Search history is ${self.subscriptionsReady() ? 'ready' : 'not ready'}`);
	});
};

Template.history.rendered = function(){
	console.log(`${this.view.name} rendered`);
	$('.modal').modal();
};

Template.history.helpers({

  searches(){
  	let searches = Searches.find({}, { sort: { created: -1 } });
  	// console.log(searches.fetch());
  	//Tracker.onInvalidate(() => console.trace());
  	return searches;
  },
});