import { Meteor } from 'meteor/meteor';
import { Collections } from '../../api/collections/collections.js';
import { Prints } from '../../api/prints/prints.js';
import { Searches } from '../../api/searches/searches.js';
import AWS from 'aws-sdk';

AWS.config.region = 'us-east-1';
var rekognition = new AWS.Rekognition();

// if the database is empty on server start, create some sample data.

Meteor.startup(() => {

  console.log("syncing aws collections...");
  let colParams = {};
  let colRequest = rekognition.listCollections();
  let promise = colRequest.promise();
// colParams = {
//            "CollectionId": "macies"
//         };
//   let test =      rekognition.describeCollection(colParams).promise().catch(error => { throw new Meteor.Error(error.code, error.message, error); return error; }).then(result => {
//           console.log(result);
//           return result;
//         });
//     console.log(test);
  let cols = promise.then(result => {
    console.log(result);
    if(result && result.CollectionIds.length > 0){
      _.each(result.CollectionIds, function(colId){
        let awsCol = {
          collection_id: colId,
          collection_name: colId.replace("__", " "),
          collection_type: "face",
          private: true
        };
        // describe collection to get face count
        colParams = {
           "CollectionId": colId
        };
        let colResults = rekognition.describeCollection(colParams).promise().catch(error => { throw new Meteor.Error(error.code, error.message, error); return error; }).then(result => {
          awsCol.print_count = result.FaceCount;
          console.log(`${colId} collection has ${result.FaceCount} faces`);
          console.log(awsCol);
          let existingCol = Collections.upsert({collection_id: colId}, {$set: awsCol});
          console.log(`upserted collection: ${JSON.stringify(existingCol)}`);
        });
    console.log(colResults);
        // Now try getting existing faces for each collection
        let faceParams = {
          CollectionId: colId
        };
        let faceRequest = rekognition.listFaces(faceParams);
        let promise = faceRequest.promise();
        let faces = promise.then(result => {
          if(result && result.Faces.length > 0){
            let collection_id = Collections.findOne({collection_id: colId})._id;
            _.each(result.Faces, face => {
              let awsFace = {
                print_id: face.FaceId,
                print_name: face.ExternalImageId.replace("__", " ") || face.ImageId,
                print_type: "face",
                print_collection_id: collection_id,
                print_details: face,
                print_adder: "root"
              };
              Prints.simpleSchema().clean(awsFace);
              let existingFace = Prints.upsert({print_id: face.FaceId}, {$set: awsFace});
              console.log(`upserted print: ${JSON.stringify(existingFace)}`);
            })
          }
        });
      });
    }
    return result;
  });

  // if (Prints.find().count() < 15) {
  //   console.log("seeding prints...");
  //   let seedPrints = []
  //   _.times(5, ()=>{
  //     let print = {
  //       print_adder: this.userId || "root",
  //       print_collection: "people",
  //       print_collection_id: "people",
  //       print_name: faker.helpers.userCard().name,
  //       print_id: faker.random.uuid(),
  //       print_img: faker.image.avatar()
  //     };
  //     let printId = Prints.insert(print);
  //     seedPrints.push(printId);
  //   });
  //   console.log(seedPrints);

  // };
});