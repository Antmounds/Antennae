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

  'click #app_info'(event, instance) {
    event.preventDefault();
    if(FlowRouter.getRouteName()=='settings'){
      Meteor.call('getCode', (error, result) => {
        if(error){
          let e = JSON.stringify(error, null, 4);
          console.log(e);
          alert(error.message);
        }else{
          console.log(`code: ${result}`);
          //this.app_info = new ReactiveVar(result);
        }
      });
    }else{
      console.log(`code: ${Meteor.settings.public.key}`);
    };
    Materialize.toast('easter egg found!', 3000);
  },

  //searches(){
    //let searches = Searches.find({}, { sort: { created: -1 } });
    // console.log(searches.fetch());
    //Tracker.onInvalidate(() => console.trace());
    //return searches;
  //},
});


Template.post.created = function(){
	console.log(`${this.view.name} created`);
};

Template.post.rendered = function(){
	$(".tooltipped").tooltip({delay:50});
	console.log(`${this.view.name} rendered`);
};

Template.post.helpers({
  // tags(){
  //   let t = Template.instance().tags.get();
  //   console.log(t);
  //   return t;
  // }
});