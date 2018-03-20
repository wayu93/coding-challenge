#!/usr/bin/env node
const request = require("request");
const argv = require("yargs").argv;
const fs = require("fs");
const $ = jQuery = require("jquery");
require("./jquery.csv.js");

const units = argv.units || "mi";
const output = argv.output || "text";
const apiKey = "AIzaSyBAWzI9muhohOfZ_naYXPFk39LatWT4vbk";
let address = argv.address;
let zip = argv.zip;

// Error handling for in case the user fails to input either address or zip code, inputs both, or does not provide a valid choice for either units or output
if ((address && zip) || (!address && !zip) || (units !== 'mi' && units !== 'km') || (output !== 'text' && output !== 'json')) {
	console.log('Usage:\nfind_store --address="<address>"\nfind_store --address="<address>" [--units=(mi|km)] [--output=text|json]\nfind_store --zip=<zip>\nfind_store --zip=<zip> [--units=(mi|km)] [--output=text|json]');
	return;
}

let location = zip ? zip : address;
geocode(location, printNearestStore);

// First I use the google geocode api to return the latitude and longitude for the inputted address or zip code (the api accepts either)
// and then in the callback I use that information to determine the closest store
function geocode(address, callback) {
	let url = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${apiKey}`;
	request(url, function(err, response, body) {
		if (err) {
			console.log("Error: unable to determine coordinates for provided address/zip code");
			return;
		} else {
			let data = JSON.parse(body);
			if (data.results.length !== 1 || data.results[0].errorMessage) {
				console.log("Error: unable to determine coordinates for provided address/zip code");
				return;
			}
			let result = data.results[0];
			let location = result.geometry.location;
			callback(location.lat, location.lng);
		}
	});
}

// Parse the list of all stores from the csv file and then go through the list and compare the distance
// between each store and the inputted location and store the closest one
function printNearestStore(originLat, originLong) {
	fs.readFile("store-locations.csv", "utf8", function(err, response) {  
	    if (err) throw err;
	    // This extra bit of conversion is necessary because toObjects is very picky about the format of the
	    // csv string that it accepts for conversion into JSON, while fromArrays pretty much works with any
	    // csv string. So first we convert the response to Array and then we use fromArrays to convert it back
	    // into a csv string, after which it will be in the proper format that toObjects will accept
	    let allStoreData = $.csv.toObjects($.csv.fromArrays($.csv.toArrays(response)));
	    let closestStore = {address: "", distance: Infinity};
		for (var i = 1; i < allStoreData.length; i++) {
			let storeData = allStoreData[i];
			let storeLat = storeData.Latitude;
			let storeLong = storeData.Longitude;
			let distance = computeDistance(originLong, originLat, storeLong, storeLat);
			if (distance < closestStore.distance) {
				closestStore.distance = distance;
				closestStore.address = `${storeData.Address}, ${storeData.City}, ${storeData.State} ${storeData['Zip Code']}`;
			}
		}

		// Finally print the closestStore in the correct format depending on what was specified in the command line
		if (output === 'json') {
			console.log(closestStore);
		} else {
			console.log(closestStore.address + "\n" + closestStore.distance + " " + units);
		}
		return;
	});
}

// Formula to compute distance between two locations based on their respective latitude and longitude
function computeDistance(startLat, startLong, endLat, endLong){
	let earthRadius = 3959;
	if (units === 'km') {
		earthRadius = 6371;
	}
	let dLat = degreesToRadians(endLat-startLat);
	let dLon = degreesToRadians(endLong-startLong);
	startLat = degreesToRadians(startLat);
	endLat = degreesToRadians(endLat);
	let a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(startLat) * Math.cos(endLat); 
	let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
	return earthRadius * c;
}

function degreesToRadians(degrees) {
	return degrees * Math.PI / 180;
}
