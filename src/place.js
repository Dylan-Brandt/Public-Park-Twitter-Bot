import fetch from "node-fetch";
import {key} from '../keys/key.js';

export class Place {

    constructor(asyncPlaceJSON) {
        if(typeof(asyncPlaceJSON) === "undefined") {
            throw new Error("Cannot be called directly");
        }

        this.query = asyncPlaceJSON["query"];
        this.photo_reference = asyncPlaceJSON["photo_reference"];
        this.name = asyncPlaceJSON["name"];
        this.rating = asyncPlaceJSON["rating"];
        this.user_ratings_total = asyncPlaceJSON["user_ratings_total"];
        this.formatted_address = asyncPlaceJSON["formatted_address"];
        this.lat = asyncPlaceJSON["lat"];
        this.lng = asyncPlaceJSON["lng"];
        this.blurb = this.name + "\n"
        + this.query + "\n"
        + (this.rating + " stars / 5 (" + this.user_ratings_total + " ratings)");
        this.source = asyncPlaceJSON["source"];
    }

    static async buildRandomPlace(query, placeType) {
        try {
            let url = "https://maps.googleapis.com/maps/api/place/textsearch/json?key=" + key + "&query=" + query + "&type=" + placeType;
            let response = await fetch(url, {method: "GET"});
            if(response.ok) {
                let responseJSON = await response.json();
                return new Place(Place.getRandomPlaceData(query, responseJSON));
            }
            else {
                throw new Error("Could not receive place data!");
            }
        }
        catch (error) {
            console.error(error);
        }
    }

    static getRandomPlaceData(query, placeJSON) {
        let randomResultIndex = Math.floor(Math.random() * placeJSON["results"].length);
        while(true) {
            if("photos" in placeJSON["results"][randomResultIndex]) {
                break
            }
            else {
                randomResultIndex = Math.floor(Math.random() * placeJSON["results"].length);
            }
        }
        let randomPlace = placeJSON["results"][randomResultIndex];
        return {
            query: query,
            photo_reference: randomPlace["photos"][0]["photo_reference"],
            name: randomPlace["name"],
            rating: randomPlace["rating"],
            user_ratings_total: randomPlace["user_ratings_total"],
            formatted_address: randomPlace["formatted_address"],
            lat: randomPlace["geometry"]["location"]["lat"],
            lng: randomPlace["geometry"]["location"]["lng"],
            source: Place.#parseSource(randomPlace["photos"][0]["html_attributions"][0])
        };
    }

    static #parseSource(html_tag) {
        let link = html_tag.substring(html_tag.indexOf("href") + 6, html_tag.indexOf(">") - 1);
        let photographer = html_tag.substring(html_tag.indexOf(">") + 1, html_tag.indexOf("</"));
        return photographer + " " + link;
    }

    async getPlacePhotoBlob() {
        try {
            let url = "https://maps.googleapis.com/maps/api/place/photo?key="
            + key
            + "&photo_reference=" + this.photo_reference
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

    async getPlaceAerialPhotoBlob() {
        try {
            let coordinates = this.lat + "," + this.lng;
            let url = "https://maps.googleapis.com/maps/api/staticmap?key="
            + key
            + "&center=" + coordinates
            + "&size=500x400&markers=size:small|"+ coordinates
            + "&maptype=satellite&zoom=16&scale=2";
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



