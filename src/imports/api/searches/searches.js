import { Mongo } from 'meteor/mongo';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';



export const Searches = new Meteor.Collection('searches');

// Deny all client-side updates since we will be using methods to manage this collection
Searches.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});

Searches.Schema = new SimpleSchema({
  "station_name": {
    type: String,
    label: "Station search performed at",
    optional: true,
    defaultValue: "Station 1"
  },
  // schema rules
  "search_type": {
    type: [String],
    label: "Search types",
    optional: false,
    allowedValues: ["moderation", "label", "face", "collection"],
    defaultValue: ["moderation", "label", "face"]
  },
  "search_collections": {
    type: [String],
    label: "Collections to search",
    optional: true,
    defaultValue: [""]
  },
  "search_image": {
    type: String,
    label: "Image to search",
    optional: true,
    defaultValue: "/img/face-id-100.png"
  },
  "search_results": {
    type: Object,
    label: "Object of search types",
    optional: true,
    blackbox: true,
    defaultValue: {}
  },
  "faces": {
    type: [Object],
    label: "Face objects found in image",
    optional: true,
    blackbox: true,
    defaultValue: []
  },
  "created": {
    type: Date,
    label: "Date search performed",
    autoValue: function() {
      if ( this.isInsert ) {
        return new Date;
      } 
    },
    optional: true,
    //index: true
  },
  "updated": {
    type: Date,
    label: "Date search updated",
    autoValue: function() {
      if ( this.isUpdate ) {
        return new Date;
      } 
    },
    optional: true
  }
});

Searches.attachSchema( Searches.Schema );

if(Meteor.isServer){
  Meteor.startup(() => {
    Searches._ensureIndex({
        created: -1,
    });
    // Searches._ensureIndex({ search_image: 1});
  });
}

Searches.publicFields = {
  station_name: 1,
  search_type: 1,
  search_collections: 1,
  search_image: 1,
  search_results: 1,
  created: 1,
  updated: 1
};

// Searches.helpers({
//   // A collections is considered to be private if "private" is set to true
//   isPrivate() {
//     return this.private;
//   }
// });