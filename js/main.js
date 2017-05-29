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


// VIEWS (V)


var Neighborhood = function(data){
	this.sno = ko.observable(data.sno);
	this.address = ko.observable(data.address);
	this.places = ko.observableArray([]);
	this.latlng = ko.observable(data.latlng);
	this.poi = [];
	this.markers = [];
}


// VIEW MODEL (VM)


var ViewModel = function(){
	// retain this=ViewModel
	self = this; 

	// store map
	self.map = null;

	// store current neighborhood
	self.currentNeighborhood = null;

	// create neighborhoods knockout observable array
	this.neighborhoods = ko.observableArray([]);

	// store info window
	self.infowindow = null;

	// push items to neighborhoods array
	neighborhoods.forEach(function(n){
		self.neighborhoods.push(new Neighborhood(n));
	});

	// initialize map
	this.initMap = function(){
		// set current neighborhood
		self.currentNeighborhood = this;

		// set infowindow to google maps api's infowindow object
		// this supposed to be the only instance to use 
		self.infowindow = new google.maps.InfoWindow();

		// set map to google maps api's map object
		// this supposed to be the only instance to use 
		self.map = new google.maps.Map(
			$('#map')[0],
			{
				center: this.latlng(),
  				zoom: 17	
			}
		);

		// get places of interest
		self.getPlacesOfInterest(this, self.map, this.latlng());
	};

	// get places of interest
	self.getPlacesOfInterest = function(neighborhood, map, latlng){
		// initiate request service object
		service = new google.maps.places.PlacesService(map);

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
			self.currentNeighborhood.poi = [];

			var i = 1;
			$.each(results,function(index, place){
				var placeDetails = {
					sno: i,
					placeId: place.place_id,
					name: place.name,
					location: place.geometry.location
				};

				self.currentNeighborhood.poi.push(placeDetails);

				i++;
			});

			// create markers for places
			self.createMarkers(self.currentNeighborhood.poi);

		}
	};

	self.createMarkers = function(placesList){
		var i = 1;
		$.each(placesList, function(index, place){
			var marker = new google.maps.Marker({
				sno: i,
				map: self.map,
				position: place.location
	        });

			// Create an onclick event to open an infowindow at each marker.
			marker.addListener('click', function() {
				self.infowindow.marker = marker;
          		self.infowindow.setContent(place.name);
          		self.infowindow.open(self.map, marker);
          		this.setAnimation(google.maps.Animation.BOUNCE);

          		// unset anmiation after 3 sec
          		var thisMarker = this;
				setTimeout(function () {
					thisMarker.setAnimation(null);
				}, 3000);

				self.getPoiDetails(thisMarker, place.location, place.name);
			});

			self.currentNeighborhood.markers.push(marker);

			i++;
		});

		// trigger changes and keyup events, 
		// so that we show the list of markers,
		// after the data is available
		$('#search').val(' ');
		$('#search').keyup();
		$('#search').val('');
		$('#search').keyup();
	};

	// hide all markers on map
	self.hideAllMarkers = function(){
		if (self.currentNeighborhood){
			for (var i = 0; i < self.currentNeighborhood.markers.length; i++) {
				self.currentNeighborhood.markers[i].setMap(null);
			}
		}
	}

	// loop through the places of interest and 
	// show markers on map
	self.showMarkersForPois = function(pois) {
		for (var i = 0; i < pois.length; i++) {
			self.currentNeighborhood.markers[pois[i].sno-1].setMap(self.map);
		}
	}

	// store search query
	// observe valueUpdate: 'keyup' usage in html 
	self.query = ko.observable('');

	// computed observable
	self.searchResults = ko.computed(function() {
	    var q = self.query(); 
	    // this value is update on every 'key up'
	    // so, the state of the variable will change
	    // so, this will run again and again

	    if(self.currentNeighborhood){
		    // self reminder: filter is a native javascript method
		    var pois = self.currentNeighborhood.poi.filter(function(i) {
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
	    }
	});

	this.clickMarker = function(){
		var sno = this.sno;
		google.maps.event.trigger(self.currentNeighborhood.markers[sno-1], 'click');
		self.currentNeighborhood.markers[sno-1].setAnimation(google.maps.Animation.BOUNCE);

		// unset anmiation after 3 sec
		setTimeout(function () {
			self.currentNeighborhood.markers[sno-1].setAnimation(null);
		}, 3000);
	}

	self.getPoiDetails = function(marker, position, name){
		var foursquareUrl = 'https://api.foursquare.com/v2/venues/search?' + 
							'client_id=NKHGCANQ0WVGYPVFUZFS0QOW4TU0PYGVE44JLNE3XRQVKHYT&' + 
							'client_secret=V21GQUL1TZLXPN5AQY1FOAICFRIRWDNA4EKOU2L5YUDMA25A&' + 
							'll=' + position.lat() + ',' + position.lng() + '&' + 
							'query=' + encodeURI(name) + '&' +
							'limit=1&v=20170529';

		var infowindowContent = self.infowindow.getContent();
		infowindowContent += '<br><hr><br>FourSqare Data:<br>';

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
			
			self.infowindow.setContent(infowindowContent);
		}).fail(function(){
			infowindowContent += '<br>Failed to load FourSqare Data';
			self.infowindow.setContent(infowindowContent);
		});
	}
}



// apply bindings
ko.applyBindings(new ViewModel());


// OTHER EVENTS

function initMap(){
	$('#neighborhoods > li:first').addClass('current').click();
}

$('#neighborhoods > li').click(function(){
	$('#neighborhoods li').removeClass('current');
	$(this).addClass('current');
});

