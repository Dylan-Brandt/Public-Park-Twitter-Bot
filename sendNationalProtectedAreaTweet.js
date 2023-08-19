import { readFileSync } from 'fs';

import { getTwitterClient, getSpecificPark, getPlacePhotoReferences, getPlaceAerialPhotoBuffer, getManyPlacePhotoBuffers } from './index.js';

export async function sendNationalProtectedAreaTweet(parkType, area=null) {
    const rwClient = getTwitterClient();
    const data = readFileSync(["./wikipedia_data/national_areas/", parkType.replaceAll(" ", "_").toLowerCase(), "s.json"].join(""));
    const national_parks = JSON.parse(data);
    const keys = Object.keys(national_parks);
    let key = keys[Math.floor(Math.random() * keys.length)];
    console.log(key);
    const wikiData = national_parks[key];
    const wikiChunks = wikiData["Sentence chunks"];
    
    const googleData = await getSpecificPark(wikiData["Name"] + ` ${parkType}`);
    const photoReferences = await getPlacePhotoReferences(googleData["place_id"]);
    const photoBuffers = await getManyPlacePhotoBuffers(photoReferences);
    // const aerialPhotoBuffer = await getPlaceAerialPhotoBuffer("roadmap", 6, googleData["geometry"]["location"]["lat"], googleData["geometry"]["location"]["lng"], true);

    let tweets = [];

    let leadMediaIds = [];
    leadMediaIds.push(await rwClient.v1.uploadMedia(photoBuffers.pop(0), {mimeType: 'image/jpg', chunkLength: 50000}));
    // leadMediaIds.push(await rwClient.v1.uploadMedia(aerialPhotoBuffer, {mimeType: 'image/jpg', chunkLength: 50000}));
    let leadBlurb = `The ${(area ? area : parkType).toLowerCase()} of the week is ` + wikiData["Name"] + ` ${parkType}!\n\n`
    + (googleData["rating"] + "/5 stars (" + googleData["user_ratings_total"] + " ratings)\n\n🧵 Thread below");
    tweets.push({text: leadBlurb, media: {media_ids: leadMediaIds}});

    let threadMediaIds = [];
    let threadBlurbs = [];
    for(let i = 0; i < photoBuffers.length; i++) {
        threadMediaIds.push([await rwClient.v1.uploadMedia(photoBuffers[i], {mimeType: 'image/jpg', chunkLength: 50000})]);
    }

    let numThreadTweets = wikiChunks.length < 9 ? wikiChunks.length : 9

    for(let i = 0; i < numThreadTweets; i++) {
        if(i < threadMediaIds.length) {
            tweets.push({text: wikiChunks[i], media: {media_ids: threadMediaIds[i]}})
        }
        else {
            tweets.push(wikiChunks[i]);
        }
    }

    tweets.push("Read more:\n\n" + "https://en.wikipedia.org/wiki/"
    + wikiData["Name".replaceAll(" ", "_")
    + "\n\n More photos: \n\n"
    + `https://www.google.com/maps/search/?api=1&query=${googleData["geometry"]["location"]["lat"]},${googleData["geometry"]["location"]["lng"]}&query_place_id=${googleData["place_id"]}`]);

    console.log(leadBlurb);

    await rwClient.v2.tweetThread(tweets);
}