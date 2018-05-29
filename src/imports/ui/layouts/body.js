import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';

import './body.html';

localTimeline = new Meteor.Collection(null);


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

Template.app_body.created = function(){
  console.log(`${this.view.name} created`);
  // counter starts at 0
  this.moments = new ReactiveVar([]);
};

Template.app_body.helpers({
  moments() {
    let m = Template.instance().moments.get();
    console.log(m);
    return m;
  },
});

Template.app_body.events({
  'change #newPost'(event, instance) {
  	event.preventDefault();
  	if(event.target.files && event.target.files[0]){
      if(event.target.files[0].size > 5000000){
        alert("image too large! Max size: 5MB");
        console.log(event.target.files);
        return false;
      };
  		let reader = new FileReader();

  		reader.onload = function(e) {
        //$("#postImg").attr('src', e.target.result);
        //Session.set("pic", e.target.result);
        let data = e.target.result;
        //console.log(data);
        Meteor.call('moment.scan', data, (error, result) => {
          if(error){
            let e = JSON.stringify(error, null, 4);
            console.log(e);
            alert(error.message);
          }else{
            console.log(result);
            let moment = {
              img: data,
              tags: result[1] ? result[1].Labels : [],//["Mountain", "lake", "forest", "stream"]
              faceDetails: result[2] && result[2].FaceDetails[0] ? `${result[2].FaceDetails[0].AgeRange.Low}-${result[2].FaceDetails[0].AgeRange.High} yr old ${(result[2].FaceDetails[0].Beard.Value ? 'bearded ' : '')}${result[2].FaceDetails[0].Gender.Value} ${(result[2].FaceDetails[0].Mustache.Value ? 'with mustache' : '')} who appears ${result[2].FaceDetails[0].Emotions[0].Type}. They are ${(result[2].FaceDetails[0].Eyeglasses.Value||result[2].FaceDetails[0].Eyeglasses.Value ? '' : 'not ')}wearing ${(result[2].FaceDetails[0].Eyeglasses.Value||result[2].FaceDetails[0].Eyeglasses.Value ? (result[2].FaceDetails[0].Eyeglasses.Value ? 'eye' : 'sun') : '')}glasses and are ${(result[2].FaceDetails[0].Smile.Value ? '' : 'not ')}smiling with their mouth ${(result[2].FaceDetails[0].MouthOpen.Value ? 'open' : 'closed')} and eyes ${(result[2].FaceDetails[0].EyesOpen.Value ? 'open' : 'closed')}.` : false,
            };
            let m = instance.moments.get();
            m.unshift(moment);
            instance.moments.set(m)
          }
        });
      };

      reader.readAsDataURL(event.target.files[0]);
  	}
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