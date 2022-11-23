import fetch from "node-fetch";
import {googleAPIKey} from '../keys/key.js';

export class Place {
    static HASHTAGS = ["#parks", "#nature", "#outdoors", "#travel", "#landscape", "#satellite"];
    constructor(asyncPlaceJSON) {
        if(typeof(asyncPlaceJSON) === "undefined") {
            throw new Error("Cannot be called directly");
        }
        this.place_id = asyncPlaceJSON["place_id"];
        this.name = asyncPlaceJSON["name"];
        this.query = asyncPlaceJSON["query"];
        this.top_photo_reference = asyncPlaceJSON["top_photo_reference"];
        this.top_source = asyncPlaceJSON["top_source"];
        this.random_photo_reference = asyncPlaceJSON["rand_photo_reference"];
        this.rand_source = asyncPlaceJSON["rand_source"];
        this.rating = asyncPlaceJSON["rating"];
        this.user_ratings_total = asyncPlaceJSON["user_ratings_total"];
        this.formatted_address = asyncPlaceJSON["formatted_address"];
        this.lat = asyncPlaceJSON["lat"];
        this.lng = asyncPlaceJSON["lng"];
        this.blurb = this.name + "\n"
        + this.query + "\n"
        + (this.rating + "/5 stars (" + this.user_ratings_total + " ratings)\n")
        + Place.HASHTAGS.join(" ");
        
    }

    static async buildRandomPlace(query, placeType) {
        try {
            let url = "https://maps.googleapis.com/maps/api/place/textsearch/json?key=" + googleAPIKey + "&query=" + query + "&type=" + placeType;
            let response = await fetch(url, {method: "GET"});
            if(response.ok) {
                let responseJSON = await response.json();
                return new Place(await Place.getRandomPlaceData(query, responseJSON));
            }
            else {
                throw new Error("Could not receive place data!");
            }
        }
        catch (error) {
            console.error(error);
        }
    }

    static async getRandomPlaceData(query, placeJSON) {
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
        let placePhotos = await Place.getPlacePhotoReferences(randomPlace["place_id"]);
        let randomPhotoIndex = Math.floor(Math.random() * placePhotos.length);

        return {
            place_id: randomPlace["place_id"],
            query: query,
            name: randomPlace["name"],
            rating: randomPlace["rating"],
            user_ratings_total: randomPlace["user_ratings_total"],
            formatted_address: randomPlace["formatted_address"],
            lat: randomPlace["geometry"]["location"]["lat"],
            lng: randomPlace["geometry"]["location"]["lng"],
            top_photo_reference: randomPlace["photos"][0]["photo_reference"],
            top_source: Place.#parseSource(randomPlace["photos"][0]["html_attributions"][0]),
            rand_photo_reference: placePhotos[randomPhotoIndex]["photo_reference"],
            rand_source: Place.#parseSource(placePhotos[randomPhotoIndex]["html_attributions"][0])
        };
    }

    static #parseSource(html_tag) {
        let link = html_tag.substring(html_tag.indexOf("href") + 6, html_tag.indexOf(">") - 1);
        let photographer = html_tag.substring(html_tag.indexOf(">") + 1, html_tag.indexOf("</"));
        return "Source: " + photographer + " - " + link;
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



