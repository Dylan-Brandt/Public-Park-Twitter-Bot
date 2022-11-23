# Public Park Twitter Bot

Contained in this repository are modules for the automated posting of a public park to twitter. Included in each post is the name of the park, the location, rating, and two photos sourced from google. The first photo is a ground view of the park, and the second photo is an aerial view of the park.

The project uses the following public APIs:
- Google Maps Places API: [https://developers.google.com/maps/documentation/places/web-service]()
    * Used to gather information about a park such as coordinates, ratings, location, etc
    * Depends on a search query which is a city in the US and place type which is 'park'
- Google Maps Static Map API: [https://developers.google.com/maps/documentation/maps-static]()
    * Used to get an aerial photo of a park
- Countries and Cities API: [https://documenter.getpostman.com/view/1134062/T1LJjU52#intro]()
    * Used to generate a random city in the US

The project uses the twitter-api-v2 node package to post to twitter.

Link to account: [https://twitter.com/EverydayParks]()