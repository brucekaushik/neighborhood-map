// 'use strict';

// MODEL (M)


var neighborhoods = [
	{
		sno: 1,
		address: 'Dr. A.S. Rao Nagar, Hyderabad',
		latlng: {lat: 17.4801573, lng: 78.5522229}
	},
	{
		sno: 2,
		address: 'ECIL X Roads, Hyderabad',
		latlng: {lat: 17.4735583, lng: 78.5708349}
	},
	{
		sno: 3,
		address: 'Ramagondanahalli, Bengaluru',
		latlng: {lat: 12.9558171, lng: 77.7409162}
	},
	{
		sno: 4,
		address: 'Kundanhalli Gate, Bengaluru',
		latlng: {lat: 12.9558813, lng: 77.714809}
	}
];

var map,
	currentNeighborhood,
	infoWindow;



// VIEWS (V)


var Neighborhood = function(data){
	this.sno = ko.observable(data.sno);
	this.address = ko.observable(data.address);
	this.latlng = ko.observable(data.latlng);
	this.poi = [];
	this.markers = [];
}



// VIEW MODEL (VM)


var ViewModel = function(){
	// retain this=ViewModel
	var self = this; 

	// store search query
	// observe valueUpdate: 'keyup' usage in html 
	self.query = ko.observable('');

	// observable to toggle display of places of interest list
	self.poiListDisplay = ko.observable('');

	// observable to toggle display of places of neigborhoods list (menu)
	self.neighborhoodsDisplay = ko.observable(''); 


	// initialize neighborhood
	self.init = function(){
		// set map to google maps api's map object
		// this supposed to be the only instance to use 
		map = new google.maps.Map(
			$('#map')[0],
			{
				center: currentNeighborhood.latlng(),
				zoom: 17	
			}
		);

		// set infowindow to google maps api's infowindow object
		// this supposed to be the only instance to use 
		infoWindow = new google.maps.InfoWindow();

		self.getPlacesOfInterest(map, currentNeighborhood.latlng());
	};


	// get places of interest
	self.getPlacesOfInterest = function(map, latlng){
		// initiate request service object
		var service = new google.maps.places.PlacesService(map);

		// prepare request params
		var request = {
			location: latlng,
			radius: '300'
		};

		// make nearby search
		service.nearbySearch(request, self.storePlaces);
	};


	// store places in markers array (of this neighborhood)
	self.storePlaces = function (results, status){
		if (status !== 'OK') {
			$('aside ul').append('<li>Could not fetch places!</li>');
		} else {
			// remove the city result
			results.shift();

			// reset places of interest array
			currentNeighborhood.poi = [];

			// loop thorugh results (places of interest),
			// and store in array
			var i = 1;
			$.each(results,function(index, place){
				var placeDetails = {
					sno: i,
					placeId: place.place_id,
					name: place.name,
					location: place.geometry.location
				};

				currentNeighborhood.poi.push(placeDetails);

				i++;
			});

			// create markers for places
			self.createMarkers(currentNeighborhood.poi);

			// change the state of query,
			// to trigger the computed observable
			self.query(' ');
			self.query('');
		}
	};

	// create markers for placesList passed
	self.createMarkers = function(placesList){
		var i = 1;

		$.each(placesList, function(index, place){
			// create marker
			var marker = new google.maps.Marker({
				sno: i,
				map: map,
				position: place.location
			});

			// Create an onclick event to open an infowindow at each marker.
			marker.addListener('click', function() {
				infoWindow.marker = marker;
				infoWindow.setContent(place.name);
				infoWindow.open(map, marker);
				this.setAnimation(google.maps.Animation.BOUNCE);

				// marker
				var thisMarker = this;

				// unset anmiation after 3 sec
				setTimeout(function () {
					thisMarker.setAnimation(null);
				}, 3000);

				self.getPoiDetails(thisMarker, place.location, place.name);
			});

			// push markers to array in neighborhood
			currentNeighborhood.markers.push(marker);

			i++;
		});
	};


	// loop through the places of interest and 
	// show markers on map
	self.showMarkersForPois = function(pois) {
		for (var i = 0; i < pois.length; i++) {
			currentNeighborhood.markers[pois[i].sno-1].setMap(map);
		}
	};


	// hide all markers on map
	self.hideAllMarkers = function(){
		for (var i = 0; i < currentNeighborhood.markers.length; i++) {
			currentNeighborhood.markers[i].setMap(null);
		}
	};


	self.getPoiDetails = function(marker, position, name){
		// prepare url for querying foursquare api
		var foursquareUrl = 'https://api.foursquare.com/v2/venues/search?' + 
							'client_id=NKHGCANQ0WVGYPVFUZFS0QOW4TU0PYGVE44JLNE3XRQVKHYT&' + 
							'client_secret=V21GQUL1TZLXPN5AQY1FOAICFRIRWDNA4EKOU2L5YUDMA25A&' + 
							'll=' + position.lat() + ',' + position.lng() + '&' + 
							'query=' + encodeURI(name) + '&' +
							'limit=1&v=20170529';

		// get and set infowindow content
		var infowindowContent = infoWindow.getContent();
		infowindowContent += '<br><hr><br>FourSqare Data:<br>';

		// make ajax request to foursquare api
		// depending on response, append to infowindow content
		$.getJSON(foursquareUrl).done(function(response){
			if(response.meta.code !== 200){
				infowindowContent += '<br>Failed to load FourSqare Data';
			} else if (response.response.venues.length == 0){
				infowindowContent += '<br>No FourSqare Data available';
			} else {
			 	var data = '';
				if (response.response.venues[0].name) {
					data += '<br>Description: ' + response.response.venues[0].name;
				}
				if (response.response.venues[0].categories.length !== 0) {
					data += '<br>Category: ' + response.response.venues[0].categories[0].name;
				}
				if (response.response.venues[0].location.address) {
					data += '<br>Address: ' + response.response.venues[0].location.address;
				}
				if (response.response.venues[0].hereNow) {
					data += '<br>People At Location: ' + response.response.venues[0].hereNow.count;
				}
				if(data){
					infowindowContent += data;
				} else {
					infowindowContent += '<br>No interesting deatails found';
				}
			}
			
			// set infowindow content
			infoWindow.setContent(infowindowContent);
		}).fail(function(){
			// handle failure
			infowindowContent += '<br>Failed to load FourSqare Data';
			infoWindow.setContent(infowindowContent);
		});
	};


	// delegate click on marker when place of interest is clicked
	this.clickMarker = function(item, event){
		// marker serial number
		var sno = this.sno;

		// marker location
		var latlng = currentNeighborhood.markers[sno-1].getPosition();

		// trigger click on marker
		google.maps.event.trigger(currentNeighborhood.markers[sno-1], 'click');

		// center the map on marker
		map.setCenter(latlng);

		// make the marker bounce
		currentNeighborhood.markers[sno-1].setAnimation(google.maps.Animation.BOUNCE);

		// unset anmiation after 3 sec
		setTimeout(function () {
			currentNeighborhood.markers[sno-1].setAnimation(null);
		}, 3000);


		if(document.body.clientWidth < 600){
			self.poiListDisplay('hide'); 
		}
	};


	// computed observable
	self.searchResults = ko.computed(function() {
		var q = self.query(); 
		// this value is update on every 'key up'
		// so, the state of the variable will change
		// so, this will run again and again

		// self reminder: filter is a native javascript method
		var pois = currentNeighborhood.poi.filter(function(i) {
		  return i.name.toLowerCase().indexOf(q) >= 0;
		});

		self.hideAllMarkers();

		// return error if no match
		if(pois.length == 0){
			return {name: 'no match found'};
		}

		// show markers for places of interest			
		self.showMarkersForPois(pois);
	
		return pois;
	});


	// toggle display of neighborhoods menu
	self.toggleNeighborhoodsMenu = function(){
		if(self.neighborhoodsDisplay()){
			self.neighborhoodsDisplay('');
		} else {
			self.neighborhoodsDisplay('hide');
		}
	}


	// toggle display of points of interest list
	self.togglePoiList = function(){
		if(self.poiListDisplay()){
			self.poiListDisplay('');
		} else {
			self.poiListDisplay('hide');
		}
	}

}



// OTHER EVENTS

function initMap(){
	// apply bindings
	currentNeighborhood = new Neighborhood(neighborhoods[0]);
	
	// create new instance of view model
	var vm = new ViewModel();

	// initiate neighborhood related stuff
	vm.init(currentNeighborhood);

	// apply bindings
	ko.applyBindings(vm);
}

