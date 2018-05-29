import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

// Import components
// import layouts;
import '../../ui/layouts/body.js';
// import pages;
// import '../../ui/pages/404.html';
// import '../../ui/pages/500.html';
// import '../../ui/pages/browse.js';

// Global route triggers
FlowRouter.triggers.enter(function(context){
  // $("ul.tabs").tabs();
  $('body').addClass('grey lighten-2');
});

FlowRouter.route('/', {
  name: 'home',
  action() {
    console.log("Loading home");
    document.title = 'Home | Moments';
    BlazeLayout.render('app_body');
  }
});
