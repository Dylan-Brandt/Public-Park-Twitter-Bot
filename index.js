import {TwitterApi} from 'twitter-api-v2';
import fetch from "node-fetch";

import * as keys from './keys/key.js';

const STATES = ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','District of Columbia','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Puerto Rico','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'];

async function getCities(state) {
    try {
        let url = "https://countriesnow.space/api/v0.1/countries/state/cities/q?country=United%20States&state=" + state;
        let response = await fetch(url, {method: "GET"});
        let retVal = state;
        if(response.ok) {
            let responseJSON = await response.json();
            if(responseJSON["data"].length > 0) {
                retVal = responseJSON["data"]
            }
        }
        return retVal;
    }
    catch (error) {
        console.error(error);
    }
}

function getRandomState() {
    let randomStateIndex = Math.floor(Math.random() * STATES.length);
    return STATES[randomStateIndex];
}

async function getRandomCity(stateParam = undefined) {
    let state;
    if(stateParam) {
        state = stateParam;
    }
    else {
        state = getRandomState();
    }
    let cities = await getCities(state);
    if(Array.isArray(cities)) {
        return cities[Math.floor(Math.random() * cities.length)];
    }
    else {
        throw new Error("Unable to get random city for " + stateParam);
    }
}

async function getRandomPark(city, state) {
    let url = "https://maps.googleapis.com/maps/api/place/textsearch/json?key=" + keys.googleAPIKey
    + "&query=" + city + ", " + state
    + "&type=park";
    let response = await fetch(url, {method: "GET"});
    if(response.ok) {
        let parkJSON = await response.json();
        if(parkJSON["status"] == "ZERO_RESULTS") {
            throw new ReferenceError("No results for place query");
        }
        return parkJSON;
        // return await getRandomPlaceData(city, state, responseJSON);
    }
    else {
        throw new URIError("Could not receive place data!");
    }
}

async function getPlacePhotoReferences(place_id) {
    try {
        let url = "https://maps.googleapis.com/maps/api/place/details/json"
        + "?key=" + keys.googleAPIKey
        + "&place_id=" + place_id
        + "&fields=photos";
        let response = await fetch(url, {method: "GET"});
        if(response.ok) {
            let responseJSON = await response.json();
            return responseJSON["result"]["photos"];
        }
        else {
            throw new Error("Could not receive photo references!");
        }
    }
    catch (error) {
        console.error(error);
    }
}

// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array/12646864#12646864
function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

// Get three or less random photos from the references
async function getPlacePhotoBuffers(photo_references) {
    let randomIndexes = [];
    let numPhotosToFetch;
    let buffers = [];
    for(let i = 0; i < photo_references.length; i++) {
        randomIndexes.push(i);
    }
    shuffleArray(randomIndexes);
    if(randomIndexes.length > 3) {
        numPhotosToFetch = 3;
    }
    else {
        numPhotosToFetch = randomIndexes.length;
    }
    
    for(let i = 0; i < numPhotosToFetch; i++) {
        try {
            let url = "https://maps.googleapis.com/maps/api/place/photo?key="
            + keys.googleAPIKey
            + "&photo_reference=" + photo_references[randomIndexes[i]]["photo_reference"]
            + "&maxwidth=1600";
            let response = await fetch(url, {method: "GET", accept: "image/*"});
            if(response.ok) {
                let responseBlob = await response.blob();
                let responseArrayBuffer = await responseBlob.arrayBuffer();
                let responseBuffer = Buffer.from(responseArrayBuffer, 'binary');
                buffers.push(responseBuffer);
            }
            else {
                throw new Error("Could not receive place photo!");
            }
        }
        catch (error) {
            console.error(error);
        }
    }
    return buffers;
}

async function getPlaceAerialPhotoBuffer(maptype, zoom, lat, lng, markers=false) {
    try {
        let coordinates = lat + "," + lng;
        let url = "https://maps.googleapis.com/maps/api/staticmap?key="
        + keys.googleAPIKey
        + "&center=" + coordinates
        + "&size=500x400"
        + "&maptype=" + maptype
        + "&zoom=" + zoom + "&scale=2";
        if(markers) {
            url = url + "&markers=size:small|"+ coordinates;
        }
        let response = await fetch(url, {method: "GET", accept: "image/*"});
        if(response.ok) {
            let responseBlob = await response.blob();
            let responseArrayBuffer = await responseBlob.arrayBuffer();
            let responseBuffer = Buffer.from(responseArrayBuffer, 'binary');
            return responseBuffer;
        }
        else {
            throw new Error("Could not receive place photo!");
        }
    }
    catch (error) {
        console.error(error);
    }
}

async function sendTweet() {
    const userClient = new TwitterApi({
        appKey: keys.consumerKey,
        appSecret: keys.consumerSecret,
        accessToken: keys.accessToken,
        accessSecret: keys.accessSecret,
    });

    const rwClient = userClient.readWrite;

    let state = getRandomState();
    let city =  await getRandomCity(state);
    let parks = await getRandomPark(city, state);
    let park;
    do {
        park = parks["results"][Math.floor(Math.random() * parks["results"].length)];
    } while(!park["photos"]);
    let parkPhotoReferences = await getPlacePhotoReferences(park["place_id"]);
    let parkPhotoBuffers = await getPlacePhotoBuffers(parkPhotoReferences);
    let mapPhotoBuffer = await getPlaceAerialPhotoBuffer("roadmap", 6, park["geometry"]["location"]["lat"], park["geometry"]["location"]["lng"], true);

    // Upload photos
    let mediaIds = [];
    for(let i = 0; i < parkPhotoBuffers.length; i++) {
        mediaIds.push(await rwClient.v1.uploadMedia(parkPhotoBuffers[i], {mimeType: 'image/jpg', chunkLength: 50000}));
    }
    mediaIds.push(await rwClient.v1.uploadMedia(mapPhotoBuffer, {mimeType: 'image/jpg', chunkLength: 50000}));

    let blurb = park["name"] + "\n"
        + city + ", " + state + "\n"
        + (park["rating"] + "/5 stars (" + park["user_ratings_total"] + " ratings)\n");

    await rwClient.v2.tweet(blurb, {media: {media_ids: mediaIds}});
}

await sendTweet();
