import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';

import './body.html';

localTimeline = new Meteor.Collection(null);


Template.app_body.created = function(){
	console.log(`${this.view.name} created`);
  this.app_info = new ReactiveVar("");
  Meteor.call('info', (error, result) => {
    if(error){
      let e = JSON.stringify(error, null, 4);
      console.log(e);
      alert(error.message);
    }else{
      console.log(result);
      //this.app_info = new ReactiveVar(result);
      this.app_info.set(result);
    }
  });
};

Template.app_body.rendered = function(){
  console.log(`${this.view.name} rendered`);
  $('.button-collapse').sideNav({
    closeOnClick: true,
    draggable: true
  });
};

Template.app_body.helpers({
  app_info() {
    return Template.instance().app_info.get();
  },
});

Template.app_body.events({

  'submit #loginForm': function( event, template ) {
    event.preventDefault();
  // console.log(event);
  },

  'click #logout': function( event, template ) {
    event.preventDefault();

    Meteor.logout(function(err) {
      console.log('logged out: ' + err);
      FlowRouter.go('login');
      // callback
      // Session.set("ses",false);
    });
  },

  //searches(){
    //let searches = Searches.find({}, { sort: { created: -1 } });
    // console.log(searches.fetch());
    //Tracker.onInvalidate(() => console.trace());
    //return searches;
  //},
});

Template.hello.created = function(){
  console.log(`${this.view.name} created`);
  // counter starts at 0
  this.counter = new ReactiveVar(0);
};

Template.hello.helpers({
  counter() {
    return Template.instance().counter.get();
  },
});

Template.hello.events({
  'click #getData'(event, instance) {
    Meteor.call('getData', (error, result) => {
      if(error){
        console.log(error);
        alert(error);
      }else{
        console.log(result.data.data[0]);
      }
    });
  },

  'click #default'(event, instance) {
    // increment the counter when button is clicked
    instance.counter.set(instance.counter.get() + 1);
  },
});




Template.post.created = function(){
	console.log(`${this.view.name} created`);
  this.tags = new ReactiveVar(["Mountain", "lake", "forest", "stream"]);
};

Template.post.rendered = function(){
	$(".tooltipped").tooltip({delay:50});
	console.log(`${this.view.name} rendered`);
};

Template.post.helpers({
  tags(){
    let t = Template.instance().tags.get();
    console.log(t);
    return t;
  }
});