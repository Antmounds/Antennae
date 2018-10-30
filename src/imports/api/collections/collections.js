import { Mongo } from 'meteor/mongo';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';



export const Collections = new Meteor.Collection('collections');

// Deny all client-side updates since we will be using methods to manage this collection
Collections.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});

Collections.Schema = new SimpleSchema({
  // Our schema rules will go here.
  "collection_id": {
    type: String,
    label: "Collection ID",
    optional: false,
    defaultValue: "My_Collection",
    index: true,
    unique: true
  },
  "collection_name": {
    type: String,
    label: "Collection Name",
    optional: false,
    defaultValue: "My Collection",
    index: true
  },
  "collection_type": {
    type: String,
    label: "Collection type",
    optional: false,
    allowedValues: ["face", "voice"],
    defaultValue: "face"
  },
  "print_count": {
    type: Number,
    label: "Print count",
    optional: true,
    defaultValue: 0
  },
  "private": {
    type: Boolean,
    label: "Collection privacy",
    optional: true,
    defaultValue: true
  },
  "created": {
    type: Date,
    label: "Date collection added to Antennae",
    autoValue: function() {
      if ( this.isInsert ) {
        return new Date;
      } 
    },
    optional: true
  },
  "updated": {
    type: Date,
    label: "Date collection updated in System",
    autoValue: function() {
      if ( this.isUpdate ) {
        return new Date;
      } 
    },
    optional: true
  }
});

Collections.attachSchema( Collections.Schema ); 


Collections.publicFields = {
  collection_id: 1,
  collection_name: 1,
  collection_type: 1,
  print_count: 1,
  private: 1,
  created: 1,
  updated: 1
};

// Collections.helpers({
//   // A collections is considered to be private if "private" is set to true
//   isPrivate() {
//     return this.private;
//   }
// });