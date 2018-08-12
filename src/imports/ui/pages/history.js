import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Session } from 'meteor/session';
import Swal from 'sweetalert2';

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

Template.history.events({

  'click #btnDeleteSearch'(event, instance) {
  	let searchId = event.currentTarget.name;
  	Swal({
		title: 'Delete Search?',
		text: 'This search will be forgotten',
		type: 'warning',
		animation: true,
		// customClass: 'animated tada',
		showCancelButton: true,
		confirmButtonText: 'Delete'
	}).then((result) => {
		console.log(result);
		if(result.value){
			console.log("deleting search...");
			// console.log(result);
			console.log(searchId);
	        Meteor.call('search.delete', searchId, (error, result) => {
	          if(error){
	            let e = JSON.stringify(error, null, 4);
	            console.log(e);
	            alert(error.message);
	          }else{
	            console.log(result);
	            //let m = instance.search.get();
	            //m.unshift(moment);
	            //sessionStorage.setItem('moment', JSON.stringify(m));
	            //instance.search.set(search);
	            // Session.set('search', search);
	            //localTimeline.insert(moment);
	          }
	        });
			Swal(
				'Deleted!',
				'Face search removed',
				'error'
			);
		} else if (result.dismiss == Swal.DismissReason.cancel){
			console.log(result);
		};
	});
  },

});