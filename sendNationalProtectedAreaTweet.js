import { readFileSync } from 'fs';

import { getTwitterClient, getSpecificPark, getPlacePhotoReferences, getPlaceAerialPhotoBuffer, getManyPlacePhotoBuffers } from '../../../../../index.js';

export async function sendNationalProtectedAreaTweet(parkType, area=null) {
    const rwClient = getTwitterClient();
    const data = readFileSync(["./wikipedia_data/json/processed/", parkType.replaceAll(" ", "_").toLowerCase(), "s.json"].join(""));
    const national_parks = JSON.parse(data);
    const keys = Object.keys(national_parks);
    let key = keys[Math.floor(Math.random() * keys.length)];
    console.log(key);
    const wikiData = national_parks[key];
    const wikiChunks = wikiData["Sentence chunks"];
    
    const googleData = await getSpecificPark(wikiData["Name"] + ` ${parkType}`);
    const photoReferences = await getPlacePhotoReferences(googleData["place_id"]);
    const photoBuffers = await getManyPlacePhotoBuffers(photoReferences);
    const aerialPhotoBuffer = await getPlaceAerialPhotoBuffer("roadmap", 6, googleData["geometry"]["location"]["lat"], googleData["geometry"]["location"]["lng"], true);

    let tweets = [];
    let leadMediaIds = [];
    // if(photoBuffers.length < 4) {
    //     for(let i = 0; i < photoBuffers.length; i++) {
    //         leadMediaIds.push(await rwClient.v1.uploadMedia(photoBuffers.pop(i), {mimeType: 'image/jpg', chunkLength: 50000}));
    //     }
    //     leadMediaIds.push(await rwClient.v1.uploadMedia(aerialPhotoBuffer, {mimeType: 'image/jpg', chunkLength: 50000}));
    // }
    // else {
    //     for(let i = 0; i < 3; i++) {
    //         leadMediaIds.push(await rwClient.v1.uploadMedia(photoBuffers.pop(i), {mimeType: 'image/jpg', chunkLength: 50000}));
    //     }
    //     leadMediaIds.push(await rwClient.v1.uploadMedia(aerialPhotoBuffer, {mimeType: 'image/jpg', chunkLength: 50000}));
    // }
    leadMediaIds.push(await rwClient.v1.uploadMedia(photoBuffers.pop(0), {mimeType: 'image/jpg', chunkLength: 50000}))
    // leadMediaIds.push(await rwClient.v1.uploadMedia(aerialPhotoBuffer, {mimeType: 'image/jpg', chunkLength: 50000}));
    let leadBlurb = `The ${(area ? area : parkType).toLowerCase()} of the week is ` + wikiData["Name"] + ` ${parkType}!\n\n`
    + (googleData["rating"] + "/5 stars (" + googleData["user_ratings_total"] + " ratings)\n\n🧵");
    tweets.push({text: leadBlurb, media: {media_ids: leadMediaIds}});

    let threadMediaIds = [];
    let threadBlurbs = [];
    for(let i = 0; i < photoBuffers.length; i++) {
        threadMediaIds.push([await rwClient.v1.uploadMedia(photoBuffers[i], {mimeType: 'image/jpg', chunkLength: 50000})]);
    }

    let numThreadTweets = threadMediaIds.length < 9 ? threadMediaIds.length : 9

    for(let i = 0; i < numThreadTweets; i++) {
        if(i < threadMediaIds.length) {
            tweets.push({text: wikiChunks[i], media: {media_ids: threadMediaIds[i]}})
        }
        else {
            tweets.push(wikiChunks[i]);
        }
    }

    console.log(leadBlurb);
    console.log(threadBlurbs);
    console.log(threadBlurbs.length);
    console.log(threadMediaIds.length);

    await rwClient.v2.tweetThread(tweets);
}

sendNationalProtectedAreaTweet("National Monument", null);