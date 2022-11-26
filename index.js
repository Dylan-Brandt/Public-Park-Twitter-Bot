import {Place} from './src/place.js';
import * as city from './src/cities.js';
import {saveFile} from './src/saveFile.js';

var args = process.argv.slice(2);

let randomCity = await city.getRandomCity();
try {
    var randomPlace = await Place.buildRandomPlace(randomCity, args[0]);
}
catch (error) {
    if(error instanceof ReferenceError | error instanceof URIError) { // try again with different query
        randomCity = await city.getRandomCity();
        randomPlace = await Place.buildRandomPlace(randomCity, args[0]);
    }
    else {
        console.error(error);
    }
    
}

let firstPhotoBlob = null;
let secondPhotoBlob = null;
let thirdPhotoBlob = null;
if(randomPlace.firstPhoto) {
    firstPhotoBlob = await randomPlace.getPlacePhotoBlob(randomPlace.firstPhoto);
    await saveFile('./sample_place/firstPhoto.jpg', firstPhotoBlob);
}
if(randomPlace.secondPhoto) {
    secondPhotoBlob = await randomPlace.getPlacePhotoBlob(randomPlace.secondPhoto);
    await saveFile('./sample_place/secondPhoto.jpg', secondPhotoBlob);
}
if(randomPlace.thirdPhoto) {
    thirdPhotoBlob = await randomPlace.getPlacePhotoBlob(randomPlace.thirdPhoto);
    await saveFile('./sample_place/thirdPhoto.jpg', thirdPhotoBlob);
}

let mapPhotoBlob = await randomPlace.getPlaceAerialPhotoBlob("roadmap", 5, true);
await saveFile('./sample_place/mapPhoto.jpg', mapPhotoBlob)
await saveFile('./sample_place/blurb.txt', randomPlace.blurb);

console.log(randomPlace.blurb);
