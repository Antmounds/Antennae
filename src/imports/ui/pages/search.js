import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Session } from 'meteor/session';

import './search.html';
//import { Searches } from '../../api/searches/searches.js';


Template.search.created = function(){
	console.log(`${this.view.name} created`);
	$('.tooltipped').tooltip({enterDelay: 10, inDuration: 0});
	//self.curSearches = new ReactiveDict(null);

	// self.autorun(() => {
	// 	self.subscribe("searches.get");
	// 	console.log(`Search is ${self.subscriptionsReady() ? 'ready' : 'not ready'}`);
	// });
};

Template.search.rendered = function(){
	console.log(`${this.view.name} rendered`);
	//$('.modal').modal();
};

Template.search.helpers({
  search() {
    let s = Session.get('search');//Template.instance().search.get();
    // console.log(s);
    return s;
  },
});

Template.search.events({
  'change #newPost'(event, instance) {
  	event.preventDefault();
  	if(event.target.files && event.target.files[0]){
      if(event.target.files[0].size > 5000000){
        alert("image too large! Max size: 5MB");
        // console.log(event.target.files);
        return false;
      };
  		let reader = new FileReader();

  		reader.onload = function(e) {
        //$("#postImg").attr('src', e.target.result);
        //Session.set("pic", e.target.result);
        let data = e.target.result;
        //console.log(data);
        Meteor.call('search.face', data, Session.get('matchThreshold'), (error, result) => {
          if(error){
            let e = JSON.stringify(error, null, 4);
            console.log(e);
            alert(error.message);
          }else{
            console.log(result);
            let search = {
              img: data,
              tags: result ? result.labels : false,//["Mountain", "lake", "forest", "stream"]
              faceDetails: result && result.faceDetails[0] ? `${result.faceDetails[0].AgeRange.Low}-${result.faceDetails[0].AgeRange.High} yr old ${(result.faceDetails[0].Beard.Value ? 'bearded ' : '')}${result.faceDetails[0].Gender.Value} ${(result.faceDetails[0].Mustache.Value ? 'with mustache ' : '')}who appears ${result.faceDetails[0].Emotions[0].Type}. They are ${(result.faceDetails[0].Eyeglasses.Value||result.faceDetails[0].Eyeglasses.Value ? '' : 'not ')}wearing ${(result.faceDetails[0].Eyeglasses.Value||result.faceDetails[0].Eyeglasses.Value ? (result.faceDetails[0].Eyeglasses.Value ? 'eye' : 'sun') : '')}glasses and are ${(result.faceDetails[0].Smile.Value ? '' : 'not ')}smiling with their mouth ${(result.faceDetails[0].MouthOpen.Value ? 'open' : 'closed')} and eyes ${(result.faceDetails[0].EyesOpen.Value ? 'open' : 'closed')}.` : false,
              persons: result.persons,
              celebrity: result && result.celebrity ? result.celebrity : false,
              displayName: result.persons[0] && result.persons[0].image_id && result.celebrity && result.celebrity[0] ? `${result.persons[0].image_id} (${result.celebrity[0].Name})` : (result.persons[0] && result.persons[0].image_id ? result.persons[0].image_id : false) || (result && result.celebrity[0] ? result.celebrity[0].Name : false) || false,
              collections: "AntPay"
            };
            console.log(search);
            //let m = instance.search.get();
            //m.unshift(moment);
            //sessionStorage.setItem('moment', JSON.stringify(m));
            //instance.search.set(search);
            Session.set('search', search);
            //localTimeline.insert(moment);
          }
        });
      };

      reader.readAsDataURL(event.target.files[0]);
  	}
  },
});