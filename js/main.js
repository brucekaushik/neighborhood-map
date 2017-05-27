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
}


// VIEW MODEL (VM)


var ViewModel = function(){
	// retain this=ViewModel
	self = this; 

	// store map, markers for the current instances
	this.map = null;
	this.markers = [];

	// create neighborhoods knockout observable array
	this.neighborhoods = ko.observableArray([]);

	// push items to neighborhoods array
	neighborhoods.forEach(function(n){
		self.neighborhoods.push(new Neighborhood(n));
	});

	// initialize map
	this.initMap = function(){
		this.map = new google.maps.Map(
			$('#map')[0],
			{
				center: this.latlng(),
  				zoom: 17	
			}
		);
	};
}


// apply bindings
ko.applyBindings(new ViewModel());


// OTHER EVENTS

function initMap(){
	$('#neighborhoods > li:first').click();
}