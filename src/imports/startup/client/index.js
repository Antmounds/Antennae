/*
 * Copyright 2017-present Antmounds.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the GNU Affero General Public License, version 3.0 (the "License"). You may not use this file except in compliance with
 * the License. A copy of the License is located at
 *
 *     https://www.gnu.org/licenses/agpl-3.0.en.html
 *
 * or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
 * CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 */
import '../accounts-config.js';
import './routes.js';
import { Session } from 'meteor/session';
import Swal from 'sweetalert2';
// import './demo.js';
// import './picker.js';


if(Meteor.isProduction){
	console.log(`Welcome to Antennae!\nYou opened the console! Looking for the code? Check out the project repo at https://gitlab.com/Antmounds/Antennae\n========================================\n${JSON.stringify(Meteor.settings)}`);
}else{
	console.log("DEVELOPMENT MODE: " + JSON.stringify(Meteor.settings) + "\n" + Meteor.release);
};
// global helpers
Template.registerHelper('formatDate', function(date) {
	// console.log(moment(date))
	return moment(date).format("dddd, MMMM Do YYYY, H:mm:ss");
});
Template.registerHelper('timeAgo', function(d) {
	// console.log(d);
	return moment(d).fromNow();
	// console.log(moment(date, "MMMM Do YYYY, H:mm:ss"));
	// return moment(date, "MMMM Do YYYY, H:mm:ss").fromNow();
});
Template.registerHelper('formatDaysSince', function(startDate) {
  var a = {};
  a.b = moment(startDate);
  a.c = moment();  
  a.days = a.c.diff(a.b, 'days')+1   // =moment(grolog.date).fromNow();  
  return a.days;
});
Template.registerHelper('stringify', function(data) {
  return JSON.stringify(data);
});

// Startup checks
Meteor.startup(() => {
  	Session.set('matchThreshold', 98);
  	Session.set('stationName', 'Station 1');

  	// register service worker
  	if('serviceWorker' in navigator){
  		navigator.serviceWorker
  				 .register('/sw.js')
  				 .then(()=>{console.log("Service Worker Registered");})
  				 .catch((error)=>{console.log("Service Worker Failed to Register");});
  	};

	console.log(sessionStorage.getItem('faceRecognitionConsent'));
	if(!sessionStorage.getItem('faceRecognitionConsent')){
		Swal({
			title: 'Face Recognition',
			text: 'By using this app, you give Antennae permission to process your images for the purposes of facial recognition. No pictures are saved, only mathematical representations of facial features.',
			type: 'warning',
			animation: true,
			// customClass: 'animated tada',
			showCancelButton: true,
			confirmButtonText: 'I Consent'
		}).then((result) => {
				console.log(result);
			if(result.value){
				console.log("permission granted");
				console.log(result);
	            sessionStorage.setItem('faceRecognitionConsent', true);
			} else if (result.dismiss == Swal.DismissReason.cancel){
				console.log(result);
				Swal(
					'Cancelled',
					'Your face is safe. Please stop using the app.',
					'error'
				);
	    		FlowRouter.go("checkin");
			};
		});
	}
});