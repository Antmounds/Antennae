import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import 'jquery-validation'

import './collections.html';
import { Collections } from '../../api/collections/collections.js';


Template.collections.created = function(){
	console.log(`${this.view.name} created`);
	var self = this;    
	//self.curSearches = new ReactiveDict(null);

	self.autorun(() => {
		self.colHandle = self.subscribe("collections.get");
		console.log(`Collections are ${self.subscriptionsReady() ? 'ready' : 'not ready'}`);
	});
};

Template.collections.rendered = function(){
	console.log(`${this.view.name} rendered`);
	$('.modal').modal();

	let template = Template.instance();

	$( "#createCollectionForm" ).validate({
		rules: {
			collection_name: {
				required: true
			},
		},
		messages: {
			collection_name: {
				required: "Collection required to have a name. A-z,0-9"
			},
		},
		submitHandler(event) {
			let collection = {
				collection_name: template.find( "[name='collection_name']" ).value,
				collection_type: 'face'
			};
			$("[name='collection_name']").val("");
			console.log(collection);
			// console.log(Collections.simpleSchema().clean(collection));

  			// event.preventDefault();

		    Meteor.call('collection.save', collection, (error, result) => {
		      if(error){
		        let e = JSON.stringify(error, null, 4);
		        console.log(e);
		        alert(error.message);
		      }else{
		        console.log(result);

		      }
		  	});

			// Meteor.loginWithPassword(user.username, user.password, function(error){
			//     if(error){
			//         console.log(error.reason);
			// 		// validator.showErrors({
			// 		//     email: error.reason    
			// 		// });
			//     } else {
			//         var currentRoute = FlowRouter.getRouteName();
			//         if(currentRoute == "login"){
			//             FlowRouter.go('profile');
			//         }
			//     }
			// });
		}
	});
};

Template.collections.helpers({

  privateCollections(){
  	if(Template.instance().subscriptionsReady()){
  		return Collections.find({private: true}, { sort: { created: -1 } });
  	}else{
  		return {subsNotReady: true};
  	};
  },

  publicCollections(){
  	return data;
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
  },

  'submit #createCollectionForm'(event, instance) {
  	event.preventDefault();
  	// alert();
  },

  'click .avatar'(event,template) {
  	event.preventDefault();
  	// alert();
  	let col = event.currentTarget.id;
    // console.log(col);
    // console.log(event);
    // console.log(event.currentTarget);
    // console.log(template);
    FlowRouter.go("collection",{collection_id: col});
    //  $('#farmModal').modal('hide')
    //     .on('hidden.bs.modal', function() {
    // FlowRouter.go('profile',{profile_id:template.data.farm._id});
    //     })
    //     .modal('hide');
  },
});

var data = [{id: 6, name: "Celebrity", enabled: true},
			{id: 3, name: "FBI Most Wanted", enabled: false},
			{id: 3, name: "Human Traffick", enabled: false},
			{id: 1, name: "Mugshot", enabled: false},
			{id: 2, name: "RSO", enabled: false},
			{id: 4, name: "Shoplifters", enabled: false},
			{id: 5, name: "Social Media", enabled: false}];