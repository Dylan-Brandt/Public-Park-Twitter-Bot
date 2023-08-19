import { readdirSync } from "fs";

import { sendRandomParkTweet } from "./sendRandomParkTweet.js";
import { sendNationalProtectedAreaTweet } from "./sendNationalProtectedAreaTweet.js";
import { sendStateParkTweet } from "./sendStateParkTweet.js";

'use strict';

export async function sendRandomPark(event) {
    await sendRandomParkTweet();
}

export async function sendRandomNationalPark(event) {
    await sendNationalProtectedAreaTweet("National Park", null);
}

export async function sendRandomNationalForest(event) {
    await sendNationalProtectedAreaTweet("National Forest", null);
}

export async function sendRandomNationalMonument(event) {
    await sendNationalProtectedAreaTweet("National Monument", null);
}

export async function sendRandomProtectedArea(event) {
    let rand = Math.floor(Math.random() * 65);
    if(rand < 3) {
        await sendNationalProtectedAreaTweet("National Lakeshore", "national protected area");
    }
    else if(rand < 13) {
        await sendNationalProtectedAreaTweet("National Seashore", "national protected area");
    }
    else if(rand < 24) {
        await sendNationalProtectedAreaTweet("National Scenic Trail", "national protected area");
    }
    else if(rand < 44) {
        await sendNationalProtectedAreaTweet("National Grassland", "national protected area");
    }
    else if(rand < 65) {
        await sendNationalProtectedAreaTweet("National Grassland", "national protected area");
    }
}

export async function sendRandomStatePark(event) {
    let states = readdirSync("./wikipedia_data/state_parks/json/processed");
    let randomState = states[Math.floor(Math.random() * states.length)];
    await sendStateParkTweet(randomState);
}