import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';
// import AWS from 'aws-sdk';
// import '../accounts-config.js';
// This defines all the collections, publications and methods that the application provides
// as an API to the client.
import './register-api.js';
// import './fixtures.js';



var server_mode = Meteor.isProduction ? "PRODUCTION" : "DEVELOPMENT";
console.log('index.js: ' + server_mode + "-->" + JSON.stringify(Meteor.settings));

Meteor.methods({

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