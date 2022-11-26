import fetch from "node-fetch";
import {googleAPIKey} from '../keys/key.js';
import { shuffleArray } from "./saveFile.js";

export class Place {
    static HASHTAGS = "#parks #nature #outdoors #travel #landscape #satellite";
    constructor(asyncPlaceJSON) {
        if(typeof(asyncPlaceJSON) === "undefined") {
            throw new Error("Cannot be called directly");
        }
        this.place_id = asyncPlaceJSON["place_id"];
        this.name = asyncPlaceJSON["name"];
        this.query = asyncPlaceJSON["query"];
        this.firstPhoto = asyncPlaceJSON["first_photo"];
        this.secondPhoto = asyncPlaceJSON["second_photo"];
        this.thirdPhoto = asyncPlaceJSON["third_photo"];
        this.rating = asyncPlaceJSON["rating"];
        this.user_ratings_total = asyncPlaceJSON["user_ratings_total"];
        this.formatted_address = asyncPlaceJSON["formatted_address"];
        this.lat = asyncPlaceJSON["lat"];
        this.lng = asyncPlaceJSON["lng"];
        this.blurb = this.name + "\n"
        + this.query + "\n"
        + (this.rating + "/5 stars (" + this.user_ratings_total + " ratings)\n");
        if(this.blurb.length + Place.HASHTAGS.length < 180) {
            this.blurb = this.blurb + Place.HASHTAGS;
        }
    }

    static async buildRandomPlace(query, placeType) {
        let url = "https://maps.googleapis.com/maps/api/place/textsearch/json?key=" + googleAPIKey + "&query=" + query + "&type=" + placeType;
        let response = await fetch(url, {method: "GET"});
        if(response.ok) {
            let responseJSON = await response.json();
            if(responseJSON["status"] == "ZERO_RESULTS") {
                throw new ReferenceError("No results for place query");
            }
            return new Place(await Place.getRandomPlaceData(query, responseJSON));
        }
        else {
            throw new URIError("Could not receive place data!");
        }
    }

    static async getRandomPlaceData(query, placeJSON) {
        let randomResultIndex = Math.floor(Math.random() * placeJSON["results"].length);
        var count = 0
        while(count < 10) {
            if("photos" in placeJSON["results"][randomResultIndex]) {
                break;
            }
            else {
                randomResultIndex = Math.floor(Math.random() * placeJSON["results"].length);
                count++;
            }
        }
        let randomPlace = placeJSON["results"][randomResultIndex];
        let placePhotos = await Place.getPlacePhotoReferences(randomPlace["place_id"]);
        
        let numPhotosArray = [];
        for(let i = 0; i < placePhotos.length; i++) {
            numPhotosArray.push(i);
        }
        shuffleArray(numPhotosArray);
        let firstPhoto = null;
        let secondPhoto = null;
        let thirdPhoto = null;
        if(numPhotosArray.length > 2) {
            firstPhoto = placePhotos[numPhotosArray[0]]["photo_reference"];
            secondPhoto = placePhotos[numPhotosArray[1]]["photo_reference"];
            thirdPhoto = placePhotos[numPhotosArray[2]]["photo_reference"];
        }
        else if(numPhotosArray.length > 1) {
            firstPhoto = placePhotos[numPhotosArray[0]]["photo_reference"];
            secondPhoto = placePhotos[numPhotosArray[1]]["photo_reference"];
            thirdPhoto = null;
        }
        else {
            firstPhoto = placePhotos[numPhotosArray[0]]["photo_reference"];
            secondPhoto = null;
            thirdPhoto = null;
        }

        let data = {
            place_id: randomPlace["place_id"],
            query: query,
            name: randomPlace["name"],
            rating: randomPlace["rating"],
            user_ratings_total: randomPlace["user_ratings_total"],
            formatted_address: randomPlace["formatted_address"],
            lat: randomPlace["geometry"]["location"]["lat"],
            lng: randomPlace["geometry"]["location"]["lng"],
            first_photo: firstPhoto,
            second_photo: secondPhoto,
            third_photo: thirdPhoto
        };
        return data
    }

    static async getPlacePhotoReferences(place_id) {
        try {
            let url = "https://maps.googleapis.com/maps/api/place/details/json"
            + "?key=" + googleAPIKey
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

    async getPlacePhotoBlob(photo_reference) {
        try {
            let url = "https://maps.googleapis.com/maps/api/place/photo?key="
            + googleAPIKey
            + "&photo_reference=" + photo_reference
            + "&maxwidth=1600";
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

    async getPlaceAerialPhotoBlob(maptype, zoom, markers=false) {
        try {
            let coordinates = this.lat + "," + this.lng;
            let url = "https://maps.googleapis.com/maps/api/staticmap?key="
            + googleAPIKey
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
}



