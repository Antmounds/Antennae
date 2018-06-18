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