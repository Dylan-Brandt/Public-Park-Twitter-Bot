
import { getTwitterClient, getRandomState, getRandomCity, getRandomPark, getPlacePhotoReferences, getPlacePhotoBuffers, getPlaceAerialPhotoBuffer, getPlaceShareLink } from './index.js';

export async function sendRandomParkTweet() {
    const rwClient = getTwitterClient();

    let state = getRandomState();
    let city =  await getRandomCity(state);
    let park = await getRandomPark(city, state);
    let parkPhotoReferences = await getPlacePhotoReferences(park["place_id"]);
    let parkPhotoBuffers = await getPlacePhotoBuffers(parkPhotoReferences);
    let mapPhotoBuffer = await getPlaceAerialPhotoBuffer("roadmap", 6, park["geometry"]["location"]["lat"], park["geometry"]["location"]["lng"], true);

    // Upload photos
    let mediaIds = [];
    for(let i = 0; i < parkPhotoBuffers.length; i++) {
        mediaIds.push(await rwClient.v1.uploadMedia(parkPhotoBuffers[i], {mimeType: 'image/jpg', chunkLength: 50000}));
    }
    // mediaIds.push(await rwClient.v1.uploadMedia(mapPhotoBuffer, {mimeType: 'image/jpg', chunkLength: 50000}));

    let cityState = park["plus_code"]["compound_code"].substring(park["plus_code"]["compound_code"].indexOf(" ") + 1);
    let blurb = park["name"] + "\n"
        + cityState + "\n"
        + (park["rating"] + "/5 stars (" + park["user_ratings_total"] + " ratings)\n");

    // await rwClient.v2.tweet(blurb, {media: {media_ids: mediaIds}});
    getPlaceShareLink(park["geometry"]["location"]["lat"], park["geometry"]["location"]["lng"], park["place_id"]);
}

sendRandomParkTweet();