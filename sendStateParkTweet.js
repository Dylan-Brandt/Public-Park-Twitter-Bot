import { readFileSync } from 'fs';

import { getTwitterClient, getSpecificPark, getPlacePhotoReferences, getPlaceAerialPhotoBuffer, getManyPlacePhotoBuffers } from './index.js';

export async function sendStateParkTweet(stateFile) {
    const rwClient = getTwitterClient();
    const data = readFileSync(["./wikipedia_data/state_parks/", stateFile].join(""));
    const state_parks = JSON.parse(data);
    const keys = Object.keys(state_parks);

    let wikiChunks = null;
    let key = keys[Math.floor(Math.random() * keys.length)];
    let wikiData;
    while(wikiChunks == null) {
        wikiData = state_parks[key]
        if(Object.hasOwn(wikiData, "Sentence chunks")) {
            wikiChunks = wikiData["Sentence chunks"];
        }
        else {
            key = keys[Math.floor(Math.random() * keys.length)];
        }
    }
    
    console.log(key);
    const googleData = await getSpecificPark(wikiData["Name"]);
    const photoReferences = await getPlacePhotoReferences(googleData["place_id"]);
    const photoBuffers = await getManyPlacePhotoBuffers(photoReferences);
    // const aerialPhotoBuffer = await getPlaceAerialPhotoBuffer("roadmap", 6, googleData["geometry"]["location"]["lat"], googleData["geometry"]["location"]["lng"], true);

    let tweets = [];

    let leadMediaIds = [];
    if(photoBuffers.length < 5) {
        for(let i = 0; i < photoBuffers.length; i++) {
            leadMediaIds.push(await rwClient.v1.uploadMedia(photoBuffers.pop(i), {mimeType: 'image/jpg', chunkLength: 50000}));
        }
    }
    else {
        for(let i = 0; i < 4; i++) {
            leadMediaIds.push(await rwClient.v1.uploadMedia(photoBuffers.pop(i), {mimeType: 'image/jpg', chunkLength: 50000}));
        }
    }
    // leadMediaIds.push(await rwClient.v1.uploadMedia(aerialPhotoBuffer, {mimeType: 'image/jpg', chunkLength: 50000}));
    let leadBlurb = 'The state park of the day is ' + wikiData["Name"] + `, located in ${stateFile.replaceAll("_", " ").replace(".json", "")}!\n\n`
    + (googleData["rating"] + "/5 stars (" + googleData["user_ratings_total"] + " ratings)\n\n🧵");
    tweets.push({text: leadBlurb, media: {media_ids: leadMediaIds}});

    let threadMediaIds = [];
    for(let i = 0; i < photoBuffers.length; i++) {
        threadMediaIds.push([await rwClient.v1.uploadMedia(photoBuffers[i], {mimeType: 'image/jpg', chunkLength: 50000})]);
    }

    let numThreadTweets = wikiChunks.length < 6 ? wikiChunks.length : 6

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