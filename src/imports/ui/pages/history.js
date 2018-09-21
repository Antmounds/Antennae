import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Session } from 'meteor/session';
import Swal from 'sweetalert2';

import './history.html';
import { Searches } from '../../api/searches/searches.js';


Template.history.created = function(){
	console.log(`${this.view.name} created`);
	$('.tooltipped').tooltip({enterDelay: 10, inDuration: 0});
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

	displayName(result){
		let text = result.persons[0] && result.persons[0].image_id ? `${result.persons[0].image_id}` : false;
		return text;
	},

	faceDetails(result){
		// console.log(result)
		let text = result && result.faceDetails[0] ? `${result.faceDetails[0].AgeRange.Low}-${result.faceDetails[0].AgeRange.High} yr old ${(result.faceDetails[0].Beard.Value ? 'bearded ' : '')}${result.faceDetails[0].Gender.Value} ${(result.faceDetails[0].Mustache.Value ? 'with mustache ' : '')}who appears ${result.faceDetails[0].Emotions[0].Type}${(result.celebrity[0] ? ` and looks like ${result.celebrity[0].Name} (${result.celebrity[0].MatchConfidence}%)` : '')}. They are ${(result.faceDetails[0].Eyeglasses.Value||result.faceDetails[0].Eyeglasses.Value ? '' : 'not ')}wearing ${(result.faceDetails[0].Eyeglasses.Value||result.faceDetails[0].Eyeglasses.Value ? (result.faceDetails[0].Eyeglasses.Value ? 'eye' : 'sun') : '')}glasses and are ${(result.faceDetails[0].Smile.Value ? '' : 'not ')}smiling with their mouth ${(result.faceDetails[0].MouthOpen.Value ? 'open' : 'closed')} and eyes ${(result.faceDetails[0].EyesOpen.Value ? 'open' : 'closed')}.` : false;
		return text;
	},

	searches(){
		if(Template.instance().subscriptionsReady()){
			console.log(Searches.find({}, { sort: { created: -1 } }).fetch());
			return Searches.find({}, { sort: { created: -1 } });
		}else{
			return {subsNotReady: true};
		};
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
	            // console.log(result);
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

  async 'click #btnSaveFace'(event, instance) {
  	// let searchId = event.currentTarget.name;
  	console.log(event);
  	console.log(instance);
  	const {value: file} = await Swal({
  	  progressSteps: [1,2],
  	  currentProgressStep: 0,
      title: 'Who is this?',
  	  text: 'Input a name this face should be remembered as',
      imageUrl: instance,
      imageAlt: 'The uploaded picture',
      input: 'text',
      inputAttributes: {
        'aria-label': 'Type name of this person'
      },
      showCancelButton: true,
      confirmButtonText: 'Next &rarr;',
      allowOutsideClick: false
	})
    Swal({
  	  progressSteps: [1,2],
  	  currentProgressStep: 1,
      title: 'Save to which collection?',
  	  text: 'Input a name this face should be remembered as',
      input: 'select',
      inputOptions: {
      	'people': 'people'
      },
      inputAttributes: {
        'aria-label': 'Collection name'
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
				collection: result.value,
				name: result.value,
				img: result.value
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

});