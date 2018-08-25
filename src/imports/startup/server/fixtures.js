import { Meteor } from 'meteor/meteor';
import { Collections } from '../../api/collections/collections.js';
import { Prints } from '../../api/prints/prints.js';
import { Searches } from '../../api/searches/searches.js';
import AWS from 'aws-sdk';

AWS.config.region = 'us-east-1';
var rekognition = new AWS.Rekognition();

// if the database is empty on server start, create some sample data.

Meteor.startup(() => {

  console.log("getting aws collections...");
  let colParams= {};
  let colRequest = rekognition.listCollections(colParams);
  let promise = colRequest.promise();
  let cols = promise.then(result => {
    console.log(result);
    if(result && result.CollectionIds.length > 0){
      _.each(result.CollectionIds, function(colId){
        let awsCol = {
          collection_id: colId,
          collection_name: colId,
          collection_type: "face",
          private: true
        };
        let existingCol = Collections.upsert({collection_id: colId}, {$set: awsCol});
        console.log(`upserted collection: ${JSON.stringify(existingCol)}`);
        // Now try getting existing faces for each collection
        let faceParams = {
          CollectionId: colId
        };
        let faceRequest = rekognition.listFaces(faceParams);
        let promise = faceRequest.promise();
        let faces = promise.then(result => {
          if(result && result.Faces.length > 0){
            console.log(`collection has ${result.Faces.length} faces`);
            _.each(result.Faces, function(face){
              let awsFace = {
                print_id: face.FaceId,
                print_name: face.ExternalImageId || face.ImageId,
                print_type: "face",
                print_collection: colId,
                print_details: face,
                print_adder: "root"
              };
              Prints.simpleSchema().clean(awsFace);
              let existingFace = Prints.upsert({print_id: face.FaceId}, {$set: awsFace});
              console.log(existingFace);
            })
          }
        });
      });
    }
    return result;
  });

  if (Prints.find().count() < 15) {
    console.log("seeding prints...");
    let seedPrints = []
    _.times(5, ()=>{
      let print = {
        print_adder: this.userId || "deded",
        print_collection: "people",
        print_name: faker.helpers.userCard().name,
        print_id: faker.random.uuid(),
        print_img: faker.image.avatar()
      };
      let printId = Prints.insert(print);
      seedPrints.push(printId);
    });
    console.log(seedPrints);

  };
});