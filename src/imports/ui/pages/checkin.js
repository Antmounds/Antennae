import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './checkin.html';
// import { Searches } from '../../api/searches/searches.js';


Template.checkin.created = function(){
	console.log(`${this.view.name} created`);
	var self = this;   
	self.checkinPic = new ReactiveVar( "img/avatar5.png" ); 
	self.isCheckingIn = new ReactiveVar( false ); 
	self.isKnown = new ReactiveVar( false );
	self.isLoading = new ReactiveVar( false );
  	console.log(self);

	self.autorun(() => {
		// self.subscribe("searches.get");
		console.log(`Checkin is ${self.subscriptionsReady() ? 'ready' : 'not ready'}`);
	});
};

Template.checkin.rendered = function(){
	console.log(`${this.view.name} rendered`);
	//$('.modal').modal();
};

Template.checkin.helpers({

  checkinPic(){
  	return Template.instance().checkinPic.get();
  },

  isCheckingIn(){
  	return Template.instance().isCheckingIn.get();
  },

  loading(){
  	return Template.instance().isLoading.get();
  },
});

Template.checkin.events({
  'click #btnCancel'(event, instance) {
  	instance.isCheckingIn.set(false);
	instance.isLoading.set(false);
  },

  'click #header'(event, instance) {
  	instance.isCheckingIn.set(!instance.isCheckingIn.get());
  },

  'change #checkinPic'(event, instance) {
    // console.log(event);
    // console.log(instance);
  	event.preventDefault();
  	if(event.target.files && event.target.files[0]){
		if(event.target.files[0].size > 5000000){
			alert("image too large! Max size: 5MB");
			console.log(event.target.files);
			return false;
		};

		instance.isLoading.set(true);

  		let reader = new FileReader();

  		reader.onload = function(e) {
	        let data = e.target.result;
	        // $("#imgCheckin").attr('src', data);
	        instance.checkinPic.set(data);
			instance.isCheckingIn.set(true);
	        // Session.set("checkinPic", data);
	    };

	    reader.readAsDataURL(event.target.files[0]);
	};
  },
});