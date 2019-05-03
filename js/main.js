/* Bryan Garner, Sarah Grandstrand, Kevin Palmer, 2019
 UW-Madison, GEOG-575, Spring 2019 */
//Define basemap tilesets
var light = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoicHNteXRoMiIsImEiOiJjaXNmNGV0bGcwMG56MnludnhyN3Y5OHN4In0.xsZgj8hsNPzjb91F31-rYA', {
		id: 'mapbox.streets',
		attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>'
	}),
	dark = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/dark-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoicHNteXRoMiIsImEiOiJjaXNmNGV0bGcwMG56MnludnhyN3Y5OHN4In0.xsZgj8hsNPzjb91F31-rYA', {
		id: 'mapbox.dark',
		attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>'
	}),
	streets = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/streets-v10/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoicHNteXRoMiIsImEiOiJjaXNmNGV0bGcwMG56MnludnhyN3Y5OHN4In0.xsZgj8hsNPzjb91F31-rYA', {
		id: 'mapbox.streets',
		attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>'
	}),
	imagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
		attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
	});
//Create the map
var map = L.map('mapid', {
	center: [27.9510, -85.3444],
	zoom: 7,
	minZoom: 3,
	maxZoom: 18,
	layers: [light]
});
//Create map panes
map.createPane("statePane").style.zIndex = 250;
map.createPane("countyPane").style.zIndex = 260;
map.createPane("hu2Pane").style.zIndex = 270;
map.createPane("hu4Pane").style.zIndex = 280;
map.createPane("hu6Pane").style.zIndex = 290;
map.createPane("hu8Pane").style.zIndex = 300;
map.createPane("markerPane").style.zIndex = 450;
map.createPane("popupPane").style.zIndex = 700;
//Create basemap tileset layers
var baseMaps = {
	"Light Gray": light,
	"Dark Gray": dark,
	"OSM Streets": streets,
	"Esri Imagery": imagery
};
//Initiate document function
$(document).ready(function() {
	//Define Florida NAS data categories arrays
	var categories = [];
	for (var i = 0; i < data.features.length; i++) {
		var species = data.features[i].properties.Group_;
		if (categories.indexOf(species) === -1) {
			categories.push(species)
		}
	}
	categories.sort();
	var comNameArr = [];
	for (var i = 0; i < data.features.length; i++) {
		var name = data.features[i].properties.Common_Name;
		if (comNameArr.indexOf(name) === -1) {
			comNameArr.push(name)
		}
	}
	//Add polygon baselayer geoJSON data
	var statefl = L.geoJson(flstate, {
		pane: 'statePane',
		"color": "#000000",
		"weight": 2,
		"fillOpacity": 0
	}).addTo(map);
	var countiesfl = L.geoJson(flcounties, {
		pane: 'countyPane',
		"color": "#000000",
		"weight": .5,
		"fillOpacity": 0,
		onEachFeature: toolTipCounty
	}).addTo(map);
	var u8 = L.geoJson(watershed_u8, {
		pane: 'hu8Pane',
		onEachFeature: toolTipWatersheds
	});
	var u6 = L.geoJson(watershed_u6, {
		pane: 'hu6Pane',
		onEachFeature: toolTipWatersheds
	});
	var u4 = L.geoJson(watershed_u4, {
		pane: 'hu4Pane',
		onEachFeature: toolTipWatersheds
	});
	var u2 = L.geoJson(watershed_u2, {
		pane: 'hu2Pane',
		onEachFeature: toolTipWatersheds
	});
	//Add point geoJSON data
	var NASdata = L.geoJson(data, {
		pane: 'markerPane',
		pointToLayer: pointToLayer,
		onEachFeature: onEachFeature
	});
	//Run functions to add web app features
	createLegend();
	createLegendToggle();
	createSearch(NASdata);
	createFilter();
	createSidebar();
	//Run function to calculate top species in Florida NAS data
	calcTopSpecies(categories);
	//Run function to add bar chart
	barChart(categories);
	//Create polygon baselayers
	var baseLayers = {
		"State (Florida)": statefl,
		"Counties (Florida)": countiesfl,
		"Hydrologic Unit - HU2": u2,
		"Hydrologic Unit - HU4": u4,
		"Hydrologic Unit - HU6": u6,
		"Hydrologic Unit - HU8": u8
	};
	//Add layers control to the map
	var layerControl = L.control.layers(baseMaps, baseLayers);
	layerControl.addTo(map);
	$('<p class = "controlHeader">Basemap Tilesets</p>').insertBefore('div.leaflet-control-layers-base');
	$('<p class = "controlHeader">Overlay Layers</p>').insertBefore('div.leaflet-control-layers-overlays');
	//FUNCTIONS...
	//Convert Florida NAS geoJSON to leaflet point markers
	function pointToLayer(feature, latlng) {
		var geojsonMarkerOptions = {
			radius: 3,
			fillColor: "",
			color: "#000000",
			weight: 1,
			opacity: 0.35,
			fillOpacity: 1,
			tags: ['']
		};
		var attribute = "Group_";
		var attValue = feature.properties[attribute];
		for (var i = 0; i < categories.length; i++) {
			if (attValue == categories[i]) {
				geojsonMarkerOptions.fillColor = getColor(attValue);
				geojsonMarkerOptions.tags = [categories[i]];
			}
		}
		return L.circleMarker(latlng, geojsonMarkerOptions);
	}
	//Create popups on each feature function
	function onEachFeature(feature, layer) {
		var popupContent = "<p><b>Common Name:</b> " + feature.properties.Common_Name + "</p>"
		popupContent += "<p><b>Group:</b> " + feature.properties.Group_ + "</p>"
		popupContent += "<p><b>Status:</b> " + feature.properties.Status + "</p>"
		popupContent += "<p><b>Year Spotted:</b> " + feature.properties.Year + "</p>"
		popupContent += "<p><b>Specimen Number:</b> " + feature.properties.Specimen_Number + "</p>"
		if (feature.properties) {
			layer.bindPopup(popupContent, {
				closeButton: false,
				className: 'speciesPopup',
				pane: 'popupPane'
			});
		}
		layer.on({
			mouseover: function() {
				this.openPopup()
			},
			mouseout: function() {
				this.closePopup();
			}
		});
	}
	//Create legend function
	function createLegend() {
		$("div.info.legend.leaflet-control").remove();
		//Container
		var div = L.DomUtil.create('div', 'info legend');
		//Make control
		var LegendControl = L.Control.extend({
			options: {
				position: 'bottomright'
			},
			onAdd: function() {
				var labels = ['<strong>Species by Group</strong>']
				for (var i = 0; i < categories.length; i++) {
					div.innerHTML += labels.push('<i class="circle" style="background:' + getColor(categories[i]) + '"></i> ' + (categories[i] ? categories[i] : '+'));
				}
				div.innerHTML = labels.join('<br>');
				return div;
			}
		});
		map.addControl(new LegendControl());
	}
	//Update legend function
	function updateLegend(tags) {
		if (tags.length > 0) {
			$("div.info.legend.leaflet-control").remove();
			//Container
			var div = L.DomUtil.create('div', 'info legend');
			//Make control
			var LegendControl = L.Control.extend({
				options: {
					position: 'bottomright'
				},
				onAdd: function() {
					var labels = ['<strong>Species by Group</strong>'];
					for (var i = 0; i < tags.length; i++) {
						div.innerHTML += labels.push('<i class="circle" style="background:' + getColor(tags[i]) + '"></i> ' + (tags[i] ? tags[i] : '+'));
					}
					div.innerHTML = labels.join('<br>');
					return div;
				}
			});
			map.addControl(new LegendControl());
		} else {
			createLegend();
		}
	}
	//Create legend toggle function
	function createLegendToggle() {
		var toggle = L.easyButton({
			states: [{
				stateName: 'show-legend',
				icon: 'fas fa-list',
				title: 'Toggle Legend',
				onClick: function(control) {
					$("div.info.legend.leaflet-control").hide();
					control.state('hide-legend');
				}
			}, {
				stateName: 'hide-legend',
				icon: 'fas fa-list',
				title: 'Toggle Legend',
				onClick: function(control) {
					$("div.info.legend.leaflet-control").show();
					control.state('show-legend');
				}
			}]
		});
		toggle.addTo(map);
	}
	//Create search bar function
	function createSearch(featuresLayer) {
		var searchControl = new L.Control.Search({
			layer: featuresLayer,
			marker: {
				circle: {
					radius: 16,
					color: '#FF0000',
					opacity: .25,
					weight: 1,
					fillOpacity: .25
				},
				icon: false,
			},
			propertyName: 'Specimen_Number',
			zoom: 12,
			collapsed: true,
			textPlaceholder: 'Search Specimen Number',
			position: 'topleft',
			hideMarkerOnCollapse: true,
		});
		//Open result marker popup
		searchControl.on('search:locationfound', function(e) {
			if (e.layer._popup) {
				let popup = e.layer.getPopup();
				e.layer.bindPopup(popup, {
					offset: [0, -11],
					pane: 'popupPane'
				});
				e.layer.openPopup();
			}
			//Restore original style on popup close
		}).on('search:collapsed', function(e) {
			featuresLayer.eachLayer(function(layer) {
				featuresLayer.resetStyle(layer);
			});
		});
		map.addControl(searchControl);
	}
	//Create point filter by category function
	function createFilter() {
		L.control.tagFilterButton({
			data: categories,
			icon: '<img src="lib/leaflet/images/filter.png">',
			filterOnEveryClick: true,
			clearText: "<strong><i>Clear Filter<i><strong>",
			onSelectionComplete: function(tags) {
				updateLegend(tags);
			}
		}).addTo(map);
	}
	//Create sidebar function
	function createSidebar() {
		var sidebar = L.control.sidebar('sidebar').addTo(map);
		sidebar.open('home');
	}
	//Create point symbol colors function
	function getColor(d) {
		switch (d) {
			case categories[0]:
				return '#ff7800';
			case categories[1]:
				return '#fda65b';
			case categories[2]:
				return '#ff00d1';
			case categories[3]:
				return '#0c28b7';
			case categories[4]:
				return '#44c6fd';
			case categories[5]:
				return '#034e7b';
			case categories[6]:
				return '#92b7d2';
			case categories[7]:
				return '#43bab7';
			case categories[8]:
				return '#68aa80';
			case categories[9]:
				return '#184544';
			case categories[10]:
				return '#9d0715';
			case categories[11]:
				return '#eccd3b';
			case categories[12]:
				return '#7f15f8';
			case categories[13]:
				return '#5f3a61';
			case categories[14]:
				return '#7cfc00';
			case categories[15]:
				return '#86c044';
			case categories[16]:
				return '#c7e9b4';
			default:
				return 'transparent';
		}
	}
	//Get species count per common name function
	function getSpeciesCount() {
		var arrayCount = [];
		for (var i = 0; i < data.features.length; i++) {
			for (var j = 0; j < comNameArr.length; j++) {
				if (data.features[i].properties.Common_Name == comNameArr[j]) {
					arrayCount.push(comNameArr[j]);
				}
			}
		}
		var dict = {};
		for (var i = 0; i < comNameArr.length; i++) {
			var getNumCount = arrayCount.reduce(function(n, val) {
				return n + (val === comNameArr[i]);
			}, 0);
			dict[comNameArr[i]] = getNumCount;
		}
		for (var key in dict) {
			var value = dict[key];
		}
		var props = Object.keys(dict).map(function(key) {
			return {
				key: key,
				value: this[key]
			};
		}, dict);
		props.sort(function(p1, p2) {
			return p2.value - p1.value;
		});
		var topFive = props.slice(0, 5);
		return topFive;
	}
	//Calculate the top (most prevalent) invasive species function from species count
	function calcTopSpecies() {
		//Species #1 html element updates.
		$("#spec1").text(getSpeciesCount()[0].key);
		//Species #2 html element updates.
		$("#spec2").text(getSpeciesCount()[1].key);
		//Species #3 html element updates.
		$("#spec3").text(getSpeciesCount()[2].key);
		//Species #4 html element updates.
		$("#spec4").text(getSpeciesCount()[3].key);
		//Species #5 html element updates.
		$("#spec5").text(getSpeciesCount()[4].key);
	}
	//Create bar chart
	function barChart() {
		var data = getSpeciesCount();
		//Sort bars based on value
		data = data.sort(function(a, b) {
			return d3.ascending(a.value, b.value);
		});
		//Set up svg using margin conventions
		var margin = {
			top: 5,
			right: 35,
			bottom: 5,
			left: 104
		};
		var elmt = document.getElementById("home");
		var bound = elmt.getBoundingClientRect();
		var width = bound.width - margin.left - margin.right;
		var height = 200 - margin.top - margin.bottom;
		var svg = d3.select("#barchart").append("svg").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		var x = d3.scale.linear().range([0, width]).domain([0, d3.max(data, function(d) {
			return d.value;
		})]);
		var y = d3.scale.ordinal().rangeRoundBands([height, 0], .1).domain(data.map(function(d) {
			return d.key;
		}));
		//Make y axis to show bar names
		var yAxis = d3.svg.axis().scale(y)
			//No tick marks
			.tickSize(0).orient("left");
		var gy = svg.append("g").attr("class", "y axis").call(yAxis)
		var bars = svg.selectAll(".bar").data(data).enter().append("g")
		//Filters go in defs element
		var defs = svg.append("defs");
		//Create filter with id #drop-shadow  Height=130% so that the shadow is not clipped
		var filter = defs.append("filter").attr("id", "drop-shadow").attr("height", "130%");
		//SourceAlpha refers to opacity of graphic that this filter will be applied to
		//Convolve that with a Gaussian with standard deviation 3 and store result in blur
		filter.append("feGaussianBlur").attr("in", "SourceAlpha").attr("stdDeviation", 5).attr("result", "blur");
		//Translate output of Gaussian blur to the right and downwards with 2px store result in offsetBlur
		filter.append("feOffset").attr("in", "blur").attr("dx", 5).attr("dy", 5).attr("result", "offsetBlur");
		//Overlay original SourceGraphic over translated blurred opacity by using feMerge filter. Order of specifying inputs is important!
		var feMerge = filter.append("feMerge");
		feMerge.append("feMergeNode").attr("in", "offsetBlur");
		feMerge.append("feMergeNode").attr("in", "SourceGraphic");
		//Append rects
		bars.append("rect").attr("class", "bar").attr("y", function(d) {
			return y(d.key);
		}).attr("height", y.rangeBand()).attr("x", 0).attr("width", function(d) {
			return x(d.value);
		}).style("filter", "url(#drop-shadow)");
		//Add a value label to the right of each bar
		bars.append("text").attr("class", "label")
			//Y position of the label is halfway down the bar
			.attr("y", function(d) {
				return y(d.key) + y.rangeBand() / 2 + 4;
			})
			//X position is 4 pixels to the from the end of the bar
			.attr("x", function(d) {
				return x(d.value) - 4;
			}).attr("text-anchor", "end").text(function(d) {
				return d.value;
			});
	}//End bar chart
	//Create county tool tips
	function toolTipCounty(feature, layer) {
		var customPopup = feature.properties.NAMELSAD;
		var customOptions = {
			'className': 'custom-popup',
			pane: 'popupPane',
            closeButton: false
		};
		layer.bindPopup(customPopup, customOptions);
		layer.on({
			'add': function() {
				layer.bringToBack()
			}
		});
	}
	//Create watershed/hydrologic unit tool tips
	function toolTipWatersheds(feature, layer) {
		var customPopup = "Hydrologic Unit: " + feature.properties.Name;
		var customOptions = {
			'className': 'custom-popup',
			pane: 'popupPane',
            closeButton: false
		};
		layer.bindPopup(customPopup, customOptions);
		layer.on({
			'add': function() {
				layer.bringToBack()
			}
		});
	}
});
