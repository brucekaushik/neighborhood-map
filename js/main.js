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

	// push items to neighborhoods array
	neighborhoods.forEach(function(n){
		self.neighborhoods.push(new Neighborhood(n));
	});

	// initialize map
	this.initMap = function(){
		// set current neighborhood
		self.currentNeighborhood = this;

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
			radius: '500'
		};

		// make nearby search
		service.nearbySearch(request, self.storePlaces);
	};

	// store places in markers array (of this neighborhood)
	self.storePlaces = function (results, status){
		$.each(results,function(index, place){
			var placeDetails = {
				placeId: place.place_id,
				name: place.name,
				location: place.geometry.location
			};

			self.currentNeighborhood.poi.push(placeDetails);
		});

		// create markers for places
		self.createMarkers(self.currentNeighborhood.poi);
	};

	self.createMarkers = function(placesList){
		$.each(placesList, function(index, place){
			var marker = new google.maps.Marker({
	          map: self.map,
	          position: place.location
	        });
		});

		// trigger changes and keyup events, 
		// so that we show the list of markers,
		// after the data is available
		$('#search').val(' ');
		$('#search').keyup();
		$('#search').val('');
		$('#search').keyup();
	};

	self.Query = ko.observable('');

	// computed observable
	self.searchResults = ko.computed(function() {
	    var q = self.Query();

	    if(self.currentNeighborhood){
		    // self reminder: filter is a native javascript method
		    var items = self.currentNeighborhood.poi.filter(function(i) {
		      return i.name.toLowerCase().indexOf(q) >= 0;
		    });
	    
	    	return items;
	    }
	});
}






// apply bindings
ko.applyBindings(new ViewModel());


// OTHER EVENTS

function initMap(){
	$('#neighborhoods > li:first').click();
}