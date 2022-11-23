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
let placePhotoBlob = await place.getPlacePhotoBlob();
let aerialPhotoBlob = await place.getPlaceAerialPhotoBlob();

const mediaIds = await Promise.all([
  rwClient.v1.uploadMedia(placePhotoBlob, {mimeType: 'image/jpg', chunkLength: 50000}),
  rwClient.v1.uploadMedia(aerialPhotoBlob, {mimeType: 'image/jpg', chunkLength: 50000}),
]);
rwClient.v1.createMediaMetadata(mediaIds[0], {alt_text: {text: String(place.source)}});

await rwClient.v2.tweet(place.blurb, {media: {media_ids: mediaIds}});


