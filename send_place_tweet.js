import { TwitterApi } from 'twitter-api-v2';
import { Place } from './src/place.js';
import * as city from './src/cities.js';
import { consumerKey, consumerSecret, accessToken, accessSecret } from './keys/key.js';

const userClient = new TwitterApi({
    appKey: consumerKey,
    appSecret: consumerSecret,
    accessToken: accessToken,
    accessSecret: accessSecret,
  });
const rwClient = userClient.readWrite;

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
let mediaIds = [];
if(randomPlace.firstPhoto) {
    firstPhotoBlob = await randomPlace.getPlacePhotoBlob(randomPlace.firstPhoto);
	mediaIds.push(await rwClient.v1.uploadMedia(firstPhotoBlob, {mimeType: 'image/jpg', chunkLength: 50000}));
}
if(randomPlace.secondPhoto) {
    secondPhotoBlob = await randomPlace.getPlacePhotoBlob(randomPlace.secondPhoto);
	mediaIds.push(await rwClient.v1.uploadMedia(secondPhotoBlob, {mimeType: 'image/jpg', chunkLength: 50000}));
}
if(randomPlace.thirdPhoto) {
    thirdPhotoBlob = await randomPlace.getPlacePhotoBlob(randomPlace.thirdPhoto);
	mediaIds.push(await rwClient.v1.uploadMedia(thirdPhotoBlob, {mimeType: 'image/jpg', chunkLength: 50000}));
}
let mapPhotoBlob = await randomPlace.getPlaceAerialPhotoBlob("roadmap", 4, true);
mediaIds.push(await rwClient.v1.uploadMedia(mapPhotoBlob, {mimeType: 'image/jpg', chunkLength: 50000}));

await rwClient.v2.tweet(randomPlace.blurb, {media: {media_ids: mediaIds}});
console.log(randomPlace.blurb);



