import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';

import './profile.html';

localTimeline = new Meteor.Collection(null);


Template.profile.created = function(){
	console.log(`${this.view.name} created`);
	// counter starts at 0
	this.counter = new ReactiveVar(0);
};

Template.profile.helpers({
  counter() {
    return Template.instance().counter.get();
  },
});