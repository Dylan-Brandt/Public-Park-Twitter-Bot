import {Place} from './src/place.js';
import * as city from './src/cities.js';
import {saveFile} from './src/saveFile.js';

var args = process.argv.slice(2);

let randomCity = await city.getRandomCity();
let place = await Place.buildRandomPlace(randomCity, args[0]);
let topPhotoBlob = await place.getPlacePhotoBlob(place.top_photo_reference);
let randomPhotoBlob = await place.getPlacePhotoBlob(place.random_photo_reference);
let satellitePhotoBlob = await place.getPlaceAerialPhotoBlob("satellite", 16, false);
let mapPhotoBlob = await place.getPlaceAerialPhotoBlob("roadmap", 6, true);

await saveFile('./sample_place/topPhoto.jpg', topPhotoBlob);
await saveFile('./sample_place/randomPhoto.jpg', randomPhotoBlob);
await saveFile('./sample_place/aerialPhoto.jpg', satellitePhotoBlob);
await saveFile('sample_place/mapPhoto.jpg', mapPhotoBlob)
await saveFile('./sample_place/blurb.txt', place.blurb);

console.log(city.STATES.length);
console.log(place.blurb);
console.log(place.blurb.length);
