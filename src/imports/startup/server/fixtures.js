import { Meteor } from 'meteor/meteor';
import { Collections } from '../../api/collections/collections.js';
import { Prints } from '../../api/prints/prints.js';
import { Searches } from '../../api/searches/searches.js';

// if the database is empty on server start, create some sample data.

Meteor.startup(() => {
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