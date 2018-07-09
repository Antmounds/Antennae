import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';

import './home.html';


Template.home.created = function(){
  console.log(`${this.view.name} created`);
  // counter starts at 0
  sessionStorage.getItem('moment') || sessionStorage.setItem('moment', JSON.stringify([]));
  this.moments = new ReactiveVar(JSON.parse(sessionStorage.getItem('moment')));
};

Template.home.helpers({
  moments() {
    let m = Template.instance().moments.get(); //JSON.parse(sessionStorage.getItem('moment')); //localTimeline.find({}); //Session.get('moment');// || 
    //let m = Template.instance().moments.get();
    console.log(m);
    return m;
  },
});

Template.home.events({
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
            sessionStorage.setItem('moment', JSON.stringify(m));
            instance.moments.set(m);
            //Session.set('moment', [moment]);
            //localTimeline.insert(moment);
          }
        });
      };

      reader.readAsDataURL(event.target.files[0]);
  	}
  },
});