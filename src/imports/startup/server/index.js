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
import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';
import '../accounts-config.js';
import './fixtures.js';
// This defines all the collections, publications and methods that the application provides
// as an API to the client.
import './register-api.js';

const os = require('os');


server_mode = Meteor.isProduction ? "PRODUCTION" : "DEVELOPMENT";
// console.log('index.js: ' + server_mode + "-->" + JSON.stringify(Meteor.settings));

Meteor.methods({

	info(){
		return `release: ${process.env.VERSION || '0.X'}-${process.env.RELEASE || 'free'} ~ version: ${process.env.VERSION || '0.X'} ~ build: ${process.env.BUILD || 'dev'} ~ hostname: ${os.hostname()}`;
	},

	getCode(){
		return Meteor.settings.private.key;
	},

	async getData(){    
		try{
			var response = {};
			const results = await HTTP.call('GET', 'http://jsonplaceholder.typicode.com/posts');	
			console.log(JSON.stringify(results.data[0]));	
			console.log(JSON.stringify(results.headers));
			response.code = true;
			response.data = results;
		} catch(e){
			response = false;
			console.log(e);
		} finally {
			console.log("finally...")
			//throw new Meteor.Error("inappropriate-pic","The user has taken an inappropriate picture.");	
			return response;
		}
	}

});

Meteor.onConnection((connection)=>{
	let clientAddr = connection.clientAddress;
	let headers = connection.httpHeaders;
	console.log(`connection from ${clientAddr}`);
	// console.log(headers);
})