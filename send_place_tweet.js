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
let place = await Place.buildRandomPlace(randomCity, args[0]);
let topPhotoBlob = await place.getPlacePhotoBlob(place.top_photo_reference);
let randomPhotoBlob = await place.getPlacePhotoBlob(place.random_photo_reference);
let satellitePhotoBlob = await place.getPlaceAerialPhotoBlob("satellite", 16, false);
let mapPhotoBlob = await place.getPlaceAerialPhotoBlob("roadmap", 6, true)

const mediaIds = await Promise.all([
  	rwClient.v1.uploadMedia(topPhotoBlob, {mimeType: 'image/jpg', chunkLength: 50000}),
	rwClient.v1.uploadMedia(randomPhotoBlob, {mimeType: 'image/jpg', chunkLength: 50000}),
  	rwClient.v1.uploadMedia(satellitePhotoBlob, {mimeType: 'image/jpg', chunkLength: 50000}),
	rwClient.v1.uploadMedia(mapPhotoBlob, {mimeType: 'image/jpg', chunkLength: 50000})
]);
rwClient.v1.createMediaMetadata(mediaIds[0], {alt_text: {text: String(place.top_source)}});
rwClient.v1.createMediaMetadata(mediaIds[1], {alt_text: {text: String(place.rand_source)}});

if(place.blurb.length <= 180) {
	await rwClient.v2.tweet(place.blurb, {media: {media_ids: mediaIds}});
}
else {
	place.blurb = place.blurb.replace(Place.HASHTAGS.join(""), "")
}



