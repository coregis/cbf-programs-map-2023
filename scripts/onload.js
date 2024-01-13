// this is the CBF Mapbox account token cbf-programs-map

mapboxgl.accessToken = 'pk.eyJ1Ijoid2ViLWNoYXJsZXNidXR0ZmRuIiwiYSI6ImNsb3FlMWM1eDBnM3UyanBzb3V3MzNxc3cifQ._PujXINObg5VlQm7Yi10rA';

//set bounds to Texas
var bounds = [
		[-120, 20], // southwest coords
		[-80, 38] // northeast coords
	];

// skip the landing page if we already have ?=arguments
if (Object.keys(urlParams).length < 1) {
	document.getElementById('landing').style.visibility = "visible";
}

// fit bounds is not doing what we want, which is to zoom the map to the extent of TX
// regardless of size of viewport
var map = new mapboxgl.Map({
	container: 'map', // container id
	style: 'mapbox://styles/web-charlesbuttfdn/cloqecrs0003i01rcc34e7tvx', // CBF stylesheet location; this is the v2.3.1 style with markers turned OFF
	fitBounds: ([
		[-108, 25],
		[-88,37]
	]),
	/*center: [-98.3,31], // starting position [lng, lat]
	zoom: 5.5, // starting zoom
	*/
	maxBounds: bounds // sets bounds as max
});

var originalZoomLevel = map.getZoom();

var loadedPointLayers = [];
var loadedPointLayerNames = [];
var loadedLineLayers = [];
var loadedPolygonLayers = [];





var coll = document.getElementsByClassName("collapsible");
var i;

for (let i = 0; i < coll.length; i++) {
	coll[i].addEventListener("click", function() {
		this.classList.toggle("active");
		var content = this.nextElementSibling;
		if (content.style.maxHeight) {
			content.style.maxHeight = null;
		} else {
			content.style.maxHeight = content.scrollHeight + "px";
		}
	});
}





/*
	How to add point layers using the GUS API:
	Call the addPointLayer() function with arguments like the examples below.

	How to add vector layers using Mapbox:
	Call the addVectorLayer() function with arguments like the examples below.
	Note that these calls have to be after the addPointLayer() ones, because they will reference at least one of the point layers as a way of making sure polygons get drawn behind points.
*/

map.on('load', function () {
	addPointLayer(
		map,
		{
			'tsvURL': "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5t_uwUWORpXDPAXiOV4HuxTaEqOk6Rcp24pzrp8q0nz55dcgdxlU5HpqmkXwoqvC4Um7QEE5pJaMT/pub?gid=1352187007&single=true&output=tsv",
			'sourceName': 'raising-school-leaders',
			'layerName': 'raising-school-leaders-points',
			'circleColor': '#418FDE',
			'circleRadius': 4,
			'legendID': 'raising_school_leaders',
			'visibleOnLoad': true,
			'scalingFactor': 25
		}
	);

	addPointLayer(
		map,
		{
			'tsvURL': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSVgWMzQvRj8-EQ3IIgMiH8dubC8ihqq8WFPWy5GQOpQAJfv1rGz3RsyZNwdutE9Z16VPVq5nxSBCI3/pub?gid=0&single=true&output=tsv', // Whole link for the CSV output from Google Sheets
			'sourceName': 'raising-blended-learners-campuses', // the data source name, used internally
			'layerName': 'raising-blended-learners-campuses-points', // layer name, used internally
			// 'icon': 'raising_blended_learners_campuses_large', // to make this an icon layer, use this property for the icon image name, using the name from Mapbox
			// 'iconSize': 0.1, // a size multiplier for the icon, which should be saved at 1/x times the intended initial display size, so that when it gets scaled up on zooming in it will still look good
			'circleColor': '#AB2328', // to get a circle layer, use this property specifying the colour
			'circleRadius': 4,
			'legendID': 'raising_blended_learners_campuses', // OPTIONAL: the id in the legend, so we can set it to active or inactive as appropriate. Simply leave out for layers that don't appear in the legend
			'scalingFactor': 25, // OPTIONAL: how much to magnify the markers by when zooming in.  Defaults to 25 if not specified; set to 1 to have no zoom at all.
			'visibleOnLoad': true // set the optional final argument to true to have the layer visible on load
		}
	);

	addPointLayer(
		map,
		{
			'tsvURL': "https://docs.google.com/spreadsheets/d/e/2PACX-1vTLm7jm5Tgepbhao611Amu1Cm7-vdo9VESvP9188YI0RS6gETLFtq6tHfFJlfwhimfio79cMykmmiMl/pub?gid=697505768&single=true&output=tsv",
			'sourceName': 'charles-butt-scholars',
			'layerName': 'charles-butt-scholars-points',
			'circleColor': '#00B2A9',
			'circleRadius': 4,
			'legendID': 'charles_butt_scholars',
			'visibleOnLoad': true
		}
	);

	addPointLayer(
		map,
		{
			'tsvURL': "https://docs.google.com/spreadsheets/d/e/2PACX-1vRW1KdSVNHDi6ivUlsfiKg2k75CwxgqAacXeIJS3FQqL-Vvtwd7QwLnuc9YXFUV3gOu7QRdaNfPwGTO/pub?gid=956631515&single=true&output=tsv",
			'sourceName': 'raising-texas-teachers',
			'layerName': 'raising-texas-teachers-points',
			'circleColor': '#E57410',
			'circleRadius': 4,
			'legendID': 'raising_texas_teachers',
			'visibleOnLoad': true
		}
	);

	addVectorLayer(
		map,
		{
			'sourceName': 'state-school-districts',
			'sourceID': 'texas_districts_1882_v4',
			'sourceURL': 'mapbox://web-charlesbuttfdn.117fbef3',
			'lineLayerName': 'state-school-districts-lines',
			'lineColor': 'rgba(117, 137, 77, 0.3)',
			'legendID': 'state_school_districts',
			'displayBehind': 'raising-school-leaders-points',
			'polygonLayerName': 'state-school-districts-poly',
			'polygonFillColor': 'rgba(153, 110, 0, 0)',
			'polygonOutlineColor':'rgba(153, 110, 0, 0)',
			'visibleOnLoad': showSchoolDistricts,
			'usedInZoomControl': true
		}
	);

// ESC = Educational Service Centers
	addVectorLayer(
		map,
		{
			'sourceName': 'esc-regions',
			'sourceID': 'ESC_Regions-6oqjhv',
			'sourceURL': 'mapbox://web-charlesbuttfdn.30mozefe',
			'lineLayerName': 'esc-regions-lines',
			'lineColor': 'rgba(61, 57, 53, 0.3)',
			'legendID': 'esc_regions',
			'displayBehind': 'raising-school-leaders-points',
			'polygonLayerName': 'esc-regions-poly',
			'polygonFillColor': 'rgba(153, 110, 0, 0)',
			'polygonOutlineColor':'rgba(153, 110, 0, 0)',
			'visibleOnLoad': showESCRegions,
			'usedInZoomControl': true
		}
	);
	// This is a special cases: the layer is never displayed, but can be used to set what will appear in popups when someone clicks on the map
	addVectorLayer(
		map,
		{
			'sourceName': 'school_house_senate_districts_UNION',
			'sourceID': 'school_house_senate_districts-dpf66q',
			'sourceURL': 'mapbox://web-charlesbuttfdn.9oviqxay',
			'displayBehind': 'districts-of-innovation-points',
			'polygonLayerName': 'school_house_senate_districts_UNION-poly',
			'polygonFillColor': 'rgba(200, 100, 240, 0)',
			'polygonOutlineColor': 'rgba(200, 100, 240, 0)',
			'usedInZoomControl': true
		}
	);

	//add interactivity to the time slider
	document.getElementById('slider').addEventListener('input', function(e) {
		updateYearSlider('active-year', e.target.value);
	});

	runWhenLoadComplete();
});

/*

*****************************************************
These are the popups for the point layers
When a click event occurs on a feature in the point layer, open a popup at
the location of the click, with description HTML from its properties
*****************************************************
*/

// generalised code to add district info
function expandDistrictInfo(district) {
// make sure we have a district to use
if (
		(showHouseDistricts || showSenateDistricts) &&
		district.length > 0 &&
		district[0].layer.id === 'school_house_senate_districts_UNION-poly'
	) {
	data = district[0].properties;
	var html = "";
	html += "<span class='varname'>";
	html += showHouseDistricts ? "House District: " : "Senate District: ";
	html += "</span> <span class='attribute'>";
	html += showHouseDistricts ? data.HseDistNum : data.SenDistNum;
	html += "</span>";
	return html;
} else {
	// if there's no appropriate district match, then just return an empty string so we don't get "undefined" in the popup
	return '';
}
}

//raising blended learners campuses popup
map.on('click', 'raising-blended-learners-campuses-points', function (e) {
	var district = map.queryRenderedFeatures(e.point, {layers: ['school_house_senate_districts_UNION-poly']});
	features = compileUniqueArray(e.features);
	popup = new mapboxgl.Popup()
		.setLngLat(e.lngLat)
		.setHTML(fillpopup_rbl(features) + expandDistrictInfo(district))
		.addTo(map);
});

// Change the cursor to a pointer when the mouse is over the points layer.
map.on('mouseenter', 'raising-blended-learners-campuses-points', function () {
	map.getCanvas().style.cursor = 'pointer';
});

// Change it back to a pointer when it leaves.
map.on('mouseleave', 'raising-blended-learners-campuses-points', function () {
	map.getCanvas().style.cursor = '';
});

map.on('idle', function() { updateStatsBox(); });

function fillpopup_rbl(features){
	let html = "";
	for (let i in features) {
		if (i > 0) {
			html += "<hr class='divider'/>";
		}
		let data = features[i];
		let endyear = parseInt(data.year) + 3 // 4-year terms for this program
		if (data.url === undefined) {
			html = html + "<span class='varname'>District: </span> <span class='attribute'>" + data.school_district + "</span>";
		} else {
			html = html + "<span class='varname'>District: </span> <span class='attribute'><a href='" + data.url + "'>" + data.school_district + "</a></span>";
		}
		html = html + "<br />"
		html = html + "<span class='varname'>Years: </span> <span class='attribute'>" + data.year + " - " + endyear + "</span>";
		html = html + "<br />"
		html = html + "<span class='varname'>Grades: </span> <span class='attribute'>" + data.grades_served + "</span>";
		if (data.count > 1) {
			html = html + "<br />"
			html = html + "<span class='varname'>Team of: </span> <span class='attribute'>" + data.count + " people</span>";
		}
	}
	return html;
	//this will return the string to the calling function

}

//charles butt scholars popup
map.on('click', 'charles-butt-scholars-points', function (e) {
	var district = map.queryRenderedFeatures(e.point, {layers: ['school_house_senate_districts_UNION-poly']});
	features = compileUniqueArray(e.features);
	popup = new mapboxgl.Popup()
		.setLngLat(e.lngLat)
		.setHTML(fillpopup_cbs(features) + expandDistrictInfo(district))
		.addTo(map);
});

 // Change the cursor to a pointer when the mouse is over the points layer.
	map.on('mouseenter', 'charles-butt-scholars-points', function () {
		map.getCanvas().style.cursor = 'pointer';
	});

	// Change it back to a pointer when it leaves.
	map.on('mouseleave', 'charles-butt-scholars-points', function () {
		map.getCanvas().style.cursor = '';
	});

function fillpopup_cbs(features){
	let html = "";
	for (let i in features) {
		let data = features[i];
		html = html + "<span class='varname'>Scholar's Name: </span> <span class='attribute'>" + data.full_name + "</span>";
		html = html + "<br />"
		html = html + "<span class='varname'>Year: </span> <span class='attribute'>" + data.year + "</span>";
		html = html + "<br />"
	}
	return html;
	//this will return the string to the calling function

}

//institutes for higher education popup
map.on('click', 'raising-texas-teachers-points', function (e) {
	var district = map.queryRenderedFeatures(e.point, {layers: ['school_house_senate_districts_UNION-poly']});
	features = compileUniqueArray(e.features);
	popup = new mapboxgl.Popup()
		.setLngLat(e.lngLat)
		.setHTML(fillpopup_rtt(features) + expandDistrictInfo(district))
		.addTo(map);
});

 // Change the cursor to a pointer when the mouse is over the points layer.
	map.on('mouseenter', 'raising-texas-teachers-points', function () {
		map.getCanvas().style.cursor = 'pointer';
	});

	// Change it back to a pointer when it leaves.
	map.on('mouseleave', 'raising-texas-teachers-points', function () {
		map.getCanvas().style.cursor = '';
	});

function fillpopup_rtt(features){
	var html = "";
	for (let i in features) {
		if (i > 0) {
			html += "<hr class='divider'/>";
		}
		let data = features[i];
		html = html + "<span class='varname'>Institute: </span> <span class='attribute'>" + data.university_name + "</span>";
		html = html + "<br />"
		html = html + "<span class='varname'>Year: </span> <span class='attribute'>" + data.year + "</span>";
		if (data.count > 1) {
			html = html + "<br />"
			html = html + "<span class='varname'>Team of: </span> <span class='attribute'>" + data.count + " people</span>";
		}
	}
	return html;
	//this will return the string to the calling function

}


//raising school leaders popup
map.on('click', 'raising-school-leaders-points', function (e) {
	var district = map.queryRenderedFeatures(e.point, {layers: ['school_house_senate_districts_UNION-poly']});
	// deduplicate the list
	features = compileUniqueArray(e.features);
	popup = new mapboxgl.Popup()
		.setLngLat(e.lngLat)
		.setHTML(fillpopup_rsl(features) + expandDistrictInfo(district))
		.addTo(map);
});

 // Change the cursor to a pointer when the mouse is over the points layer.
	map.on('mouseenter', 'raising-school-leaders-points', function () {
		map.getCanvas().style.cursor = 'pointer';
	});

	// Change it back to a pointer when it leaves.
	map.on('mouseleave', 'raising-school-leaders-points', function () {
		map.getCanvas().style.cursor = '';
	});

function fillpopup_rsl(features){
	let html = "";
	for (let i in features) {
		if (i > 0) {
			html += "<hr class='divider'/>";
		}
		let data = features[i];
		html = html + "<span class='varname'>Institute: </span> <span class='attribute'>" + data.institute + "</span>";
		html = html + "<br />"
		html = html + "<span class='varname'>Campus: </span> <span class='attribute'>" + standardizeCase(data.campus) + "</span>";
		if (data.district) {
			html = html + "<br />"
			html = html + "<span class='varname'>School District: </span> <span class='attribute'>" + standardizeCase(data.district) + "</span>";
			html = html + "<br />"
			html = html + "<span class='varname'>Year: </span> <span class='attribute'>" + data.year + "</span>";
		}
		if (data.count > 1) {
			html = html + "<br />"
			html = html + "<span class='varname'>Team of: </span> <span class='attribute'>" + data.count + " people</span>";
		}
	}
	return html;
	//this will return the string to the calling function
}
