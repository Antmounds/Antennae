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
// import './materialize.js';
// import './materialize.min.js';
// import './demo.js';
// import './picker.js';


if(Meteor.isProduction){
	console.log(`Welcome to Materialize!\n========================================\${JSON.stringify(Meteor.settings)}`);
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