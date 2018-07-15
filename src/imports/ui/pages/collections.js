import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';

import './collections.html';
import { Collections } from '../../api/collections/collections.js';

localTimeline = new Meteor.Collection(null);


Template.collections.created = function(){
	console.log(`${this.view.name} created`);
	// counter starts at 0
	this.counter = new ReactiveVar(0);
};

Template.collections.rendered = function(){
	console.log(`${this.view.name} rendered`);
	$('.modal').modal();
};

Template.collections.helpers({

  collections(){
  	if(Collections.find().count>10){
  		console.log(Collections.find());
		return Collections.find({}, { sort: { created: 1 } });
	}else{
  		console.log('no collections; loading samples')

		return data;
	}
  },

  enabled(){
  	if(this.enabled){
  		return "checked";
  	}else{
  		return "";
  	}
  },
});

Template.collections.events({
  'change #newCollection'(event, instance) {
  	event.preventDefault();

  }
});

var data = [{id: 6, name: "Celebrity", enabled: true},
			{id: 3, name: "FBI Most Wanted", enabled: false},
			{id: 3, name: "Human Traffick", enabled: false},
			{id: 1, name: "Mugshot", enabled: false},
			{id: 2, name: "RSO", enabled: false},
			{id: 4, name: "Shoplifters", enabled: false},
			{id: 5, name: "Social Media", enabled: false}];