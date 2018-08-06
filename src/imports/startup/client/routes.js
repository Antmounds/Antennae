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
import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

// Import components
// import layouts;
import '../../ui/layouts/body.js';
import '../../ui/layouts/sub_body.js';
// import pages;
// import '../../ui/pages/404.html';
// import '../../ui/pages/500.html';
import '../../ui/pages/checkin.js';
import '../../ui/pages/collection.js';
import '../../ui/pages/collections.js';
import '../../ui/pages/history.js';
import '../../ui/pages/home.js';
import '../../ui/pages/login.js';
import '../../ui/pages/search.js';
import '../../ui/pages/settings.js';

// Global route triggers
FlowRouter.triggers.enter(function(context){
  // $("ul.tabs").tabs();
  $('body').addClass('grey lighten-2');
});

FlowRouter.route('/', {
  name: 'home',
  action() {
    console.log("Loading home");
    document.title = 'Home | Antennae';
    BlazeLayout.render('app_body', {content: 'home'});
  }
});

FlowRouter.route('/checkin', {
  name: 'checkin',
  action() {
    console.log("Loading checkin");
    document.title = 'Check-in | Antennae';
    BlazeLayout.render('app_body', {content: 'checkin'});
  }
});

FlowRouter.route("/collection/:collection_id", {
  name: "collection",
  action() {
    console.log("Loading a collection");
    document.title = "Collection | Antennae";
    BlazeLayout.render('app_sub_body', {content: 'collection'});
  }
});

FlowRouter.route('/collections', {
  name: 'collections',
  action() {
    console.log("Loading collections");
    document.title = 'Collections | Antennae';
    BlazeLayout.render('app_body', {content: 'collections'});
  }
});

FlowRouter.route('/history', {
  name: 'history',
  action() {
    console.log("Loading history");
    document.title = 'History | Antennae';
    BlazeLayout.render('app_body', {content: 'history'});
  }
});

FlowRouter.route('/login', {
  name: 'login',
  action() {
    console.log("Loading login");
    document.title = 'Login | Antennae';
    BlazeLayout.render('app_body', {content: 'login'});
  }
});

FlowRouter.route('/search', {
  name: 'search',
  action() {
    console.log("Loading search");
    document.title = 'Collections | Antennae';
    BlazeLayout.render('app_body', {content: 'search'});
  }
});

FlowRouter.route('/settings', {
  name: 'settings',
  action() {
    console.log("Loading settings");
    document.title = 'Collections | Antennae';
    BlazeLayout.render('app_body', {content: 'settings'});
  }
});

FlowRouter.notFound = {
	action: function(){
		FlowRouter.go('home');
	}
}