import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';

import './sub_body.html';


Template.app_sub_body.created = function(){
	console.log(`${this.view.name} created`);
  var self = this;    
  self.isLoading = new ReactiveVar( false );
  self.analyzing = new ReactiveVar( true );
  //self.curSearches = new ReactiveDict(null);
    console.log(self);
  // this.app_info = new ReactiveVar("");
  // Meteor.call('info', (error, result) => {
  //   if(error){
  //     let e = JSON.stringify(error, null, 4);
  //     console.log(e);
  //     alert(error.message);
  //   }else{
  //     console.log(result);
  //     //this.app_info = new ReactiveVar(result);
  //     this.app_info.set(result);
  //   }
  // });
};

Template.app_sub_body.rendered = function(){
  console.log(`${this.view.name} rendered`);
  // $('.button-collapse').sideNav();
};

Template.app_sub_body.helpers({
  // app_info() {
  //   return Template.instance().app_info.get();
  // },
});

Template.app_sub_body.events({
  'click #btnBack'(event, instance) {
    event.preventDefault();
    FlowRouter.go('collections');
  },

});