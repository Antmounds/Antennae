import { Mongo } from 'meteor/mongo';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { FilesCollection } from 'meteor/ostrio:files';


export const Images = new FilesCollection({
	debug: true,
	downloadRoute: process.env.PWD + '/public',
	storagePath: process.env.PWD + '/public/img',
	collectionName: 'Images',
	public: true,
  	allowClientCode: true
});

// Deny all client-side updates since we will be using methods to manage this collection
// Images.denyClient();
// Images.deny({
//   insert() { return true; },
//   update() { return true; },
//   remove() { return true; },
// });


Images.publicFields = {
  created: 1,
  updated: 1
};

// Images.helpers({
//   // A collections is considered to be private if "private" is set to true
//   isPrivate() {
//     return this.private;
//   }
// });