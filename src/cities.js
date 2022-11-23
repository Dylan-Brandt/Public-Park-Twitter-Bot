import fetch from "node-fetch";

const STATES = ['Alabama','Alaska','American Samoa','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','District of Columbia','Federated States of Micronesia','Florida','Georgia','Guam','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Marshall Islands','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Northern Mariana Islands','Ohio','Oklahoma','Oregon','Palau','Pennsylvania','Puerto Rico','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virgin Island','Virginia','Washington','West Virginia','Wisconsin','Wyoming'];

export async function getCities(state) {
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

export function getRandomState() {
    let randomStateIndex = Math.floor(Math.random() * STATES.length);
    return STATES[randomStateIndex];
}

export async function getRandomCity() {
    let randomState = getRandomState();
    let cities = await getCities(randomState);
    if(Array.isArray(cities)){
        let randomCityIndex = Math.floor(Math.random() * cities.length);
        return cities[randomCityIndex] + ", " + randomState;
    }
    else {
        return randomState + ", United States";
    }
}
