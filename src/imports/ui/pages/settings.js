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

  similarityLevel(){
  	return Session.get('matchThreshold');
  },
});

Template.settings.events({
  'change #similarityLevel'(event, instance) {
  	event.preventDefault();
  	let newSimilarityLevel = Number(event.currentTarget.value) || 98;
  	console.log(newSimilarityLevel);
  	Session.set('matchThreshold', newSimilarityLevel);
  	Materialize.toast(`Similarity updated to ${newSimilarityLevel}%`,1000);
  },

  'change #stationName'(event, instance) {
  	event.preventDefault();
  	let newStationName = String(event.currentTarget.value) || 'Station 1';
  	console.log(newStationName);
  	Session.set('stationName', newStationName);
  	Materialize.toast(`Station Name updated to ${newStationName}`,1000);
  },
});