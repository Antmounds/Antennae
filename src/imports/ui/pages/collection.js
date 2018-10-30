import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Session } from 'meteor/session';
import Swal from 'sweetalert2';

import './collection.html';
import { Collections } from '../../api/collections/collections.js';
import { Prints } from '../../api/prints/prints.js';

var prints = [];

Template.collection.created = function(){
	console.log(`${this.view.name} created`);
	var self = this;
	self.newFacePic = new ReactiveVar( false );
	_.times(5, ()=>{
		let print = faker.helpers.contextualCard();
		prints.push(print);
	});

	self.autorun(() => {
		self.getColId = FlowRouter.getParam('collection_id');
		self.printHandle = self.subscribe("prints.get", self.getColId);
		self.colHandle = self.subscribe("collections.get", self.getColId);
		console.log(`Collections & Prints are ${self.subscriptionsReady() ? 'ready' : 'not ready'}`);
	});
};

Template.collection.rendered = function(){
	console.log(`${this.view.name} rendered`);
};

Template.collection.helpers({

  collection(){
  	if(Template.instance().subscriptionsReady()){
  		return Collections.findOne();
  	}else{
  		return {collection_name: 'COLLECTION', subsNotReady: true};
  	};
  },

  prints(){
  	if(Template.instance().subscriptionsReady()){
  		return Prints.find({}, { sort: { created: -1 } });
  	}else{
  		return {subsNotReady: true};
  	};
  	// let prints = Prints.find({}, { sort: { created: -1 } });
  	// if(Prints.find().fetch().length > 0){
  	// 	prints = Prints.find({}, { sort: { created: -1 } });
  	// 	console.log(prints);
  	// };
  },
});

Template.collection.events({
  async 'click #btnAddPerson'(event, instance) {
  	const {value: file} = await Swal({
      progressSteps: [1,2],
      currentProgressStep: 0,
	  title: 'Add a face to recognize',
      text: 'Take or upload a picture with a clear view of a face',
	  input: 'file',
	  inputAttributes: {
	    'accept': 'image/*',
	    'aria-label': 'Upload face to recognize'
	  },
      showCancelButton: true,
      confirmButtonText: 'Next &rarr;'
	})

	if (file) {
	  const reader = new FileReader
	  reader.onload = (e) => {
	    Swal({
      	  progressSteps: [1,2],
      	  currentProgressStep: 1,
	      title: 'Who is this?',
      	  text: 'Input a name this face should be remembered as',
	      imageUrl: e.target.result,
	      imageAlt: 'The uploaded picture',
	      input: 'text',
	      inputAttributes: {
	        'aria-label': 'Type name of this person'
	      },
	      showCancelButton: true,
	      confirmButtonText: 'Add',
	      allowOutsideClick: false
	    }).then((result) => {
			console.log(result);
			if(result.value){
				console.log("adding face...");
				console.log(result);
				let data = {
					collection: FlowRouter.getParam("collection_id"),
					name: result.value,
					img: e.target.result
				};
		        Meteor.call('print.save', data, (error, result) => {
		          if(error){
		            let e = JSON.stringify(error, null, 4);
		            console.log(e);
		            alert(error.message);
		          }else{
		            console.log(result);
		            Tracker.flush();
		            //let m = instance.search.get();
		            //m.unshift(moment);
		            //sessionStorage.setItem('moment', JSON.stringify(m));
		            //instance.search.set(search);
		            // Session.set('search', search);
		            //localTimeline.insert(moment);
		          }
		        });
				Swal(
					'Added!',
					'Face print added',
					'success'
				);
			};
	    });
	  };
	  reader.readAsDataURL(file)
    };
  },

  'click #btnDeleteCollection'(event, instance) {
  	let colId = FlowRouter.getParam("collection_id");
  	Swal({
		title: 'Delete Collection?',
		text: 'All faces in this collection will be deleted! Are you sure?',
		type: 'warning',
		animation: true,
		// customClass: 'animated tada',
		showCancelButton: true,
		confirmButtonText: 'Delete'
	}).then((result) => {
		console.log(result);
		if(result.value){
			console.log("deleting faces...");
			console.log(result);
	        Meteor.call('collection.delete', colId, (error, result) => {
	          if(error){
	            let e = JSON.stringify(error, null, 4);
	            console.log(e);
	            alert(error.message);
	          }else{
	            console.log(result);
	            FlowRouter.go("collections");
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
				'Collection removed',
				'error'
			);
		} else if (result.dismiss == Swal.DismissReason.cancel){
			console.log(result);
		};
	});
  },

  'click #btnDeleteFace'(event, instance) {
  	let printId = event.currentTarget.name;
  	Swal({
		title: 'Delete Face?',
		text: 'This face will be forgotten',
		type: 'warning',
		animation: true,
		// customClass: 'animated tada',
		showCancelButton: true,
		confirmButtonText: 'Delete'
	}).then((result) => {
		console.log(result);
		if(result.value){
			console.log("deleting face...");
			// console.log(result);
			console.log(printId);
	        Meteor.call('print.delete', printId, (error, result) => {
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
				'Face print removed',
				'error'
			);
		} else if (result.dismiss == Swal.DismissReason.cancel){
			console.log(result);
		};
	});
  },

});