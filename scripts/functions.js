// A helper to see if the page has finished loading.
function ready(fn) {
  if (document.readyState !== "loading") {
    fn();
    return;
  }
  document.addEventListener("DOMContentLoaded", fn);
}

// store this as a global variable so that the stats box can always access the current value
var filterStates = {
	year: false,
	district: false,
	showAlumni: true
};
// store the year relating to any currently-displayed popup, so it can be cleaned up if necessary
var popupYear = 0;
// assign all new popups to this variable so we can remove them as needed
var popup;

// global to support free text entry zoom controls
var districtBBOXes = {};

// assemble list of ISDs to filter by to get an ESC
const ESC_ISD_LUT = 'data/tbl_school_districts_ESC_regions_LUT.csv'
var ESC_ISD_list = {};
parseDelimitedTextFile(ESC_ISD_LUT, ',', '\n', function(data) {
	for (let i in data) {
		let ESC = data[i]['ESC_CITY'];
		if (ESC in ESC_ISD_list) {
			ESC_ISD_list[ESC].push(data[i]['NAME']);
		} else {
			ESC_ISD_list[ESC] = [data[i]['NAME']];
		}
	}
});

var urlParams = {};
window.location.href.replace(
	/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {urlParams[key] = value;}
);
var showHouseDistricts = false;
var showSenateDistricts = false;
var showSchoolDistricts = false;
var showESCRegions = false;

// handle alternate param names / capitalisation
if (!urlParams["districts"]) {
	if (urlParams["Districts"]) {
		urlParams["districts"] = urlParams["Districts"];
	} else if (urlParams["display"]) {
		urlParams["districts"] = urlParams["display"];
	} else if (urlParams["Display"]) {
		urlParams["districts"] = urlParams["Display"];
	}
}

// set min, max, and starting year parameters based on time slider configuration & URL parameters
if (urlParams["year"]) {
	const year = parseInt(urlParams["year"]);
	if (Number.isInteger(year)) {
		filterStates.year = year;
	}
}
let slider;
let minYear;
let maxYear;
ready(function() {
	slider = document.getElementById('slider');
	minYear = parseInt(slider.min);
	maxYear = parseInt(slider.max);
	if ((!filterStates.year) || (filterStates.year > maxYear)) {
		filterStates.year = maxYear;
	} else if (filterStates.year < minYear) {
		filterStates.year = minYear;
	}
});

// zoom to a district if request in the URL parameters
if (urlParams["zoomto"]) {
	filterStates.district.val = decodeURIComponent(urlParams["zoomto"]);
}






function showHideLayer(layerName, markerNames, showOnly=false, hideOnly=false) {
	let visibility = map.getLayoutProperty(layerName, 'visibility');
	if ((visibility === 'visible' || hideOnly) && !showOnly) {;
		map.setLayoutProperty(layerName, 'visibility', 'none');
		for (let i in markerNames) {
			if (document.getElementById(markerNames[i]) !== null) {
				document.getElementById(markerNames[i]).classList.add('inactive');
			}
		}
	} else {
		map.setLayoutProperty(layerName, 'visibility', 'visible');
		for (let i in markerNames) {
			if (document.getElementById(markerNames[i]) !== null) {
				document.getElementById(markerNames[i]).classList.remove('inactive');
			}
		}
	}
}



function showHideAlumni(showOnly=false, hideOnly=false) {
	if ((filterStates.showAlumni || hideOnly) && !showOnly) {
		filterStates.showAlumni = false;
		document.getElementById('active_markers').classList.remove('inactive');
		document.getElementById('alumni_markers').classList.add('inactive');
	} else {
		filterStates.showAlumni = true;
		document.getElementById('alumni_markers').classList.remove('inactive');
		document.getElementById('active_markers').classList.add('inactive');
	}
	for (let i in loadedPointLayers) {
		setFilter(loadedPointLayers[i][0]);
	}
}


//These are the four functions written by Eldan that power the zoom-to-district feature
// runWhenLoadComplete() checks if the map has finished loading data, and once it has then it calls the next one.
//populateZoomControl() fills the dropdowns with options generated from reading the data layers for all the district names.
//getPolygons() does the actual work of fetching the district names
//zoomToPolygon() zooms the map to the district extent

function runWhenLoadComplete() {
	if (!map.getLayer('raising-school-leaders-points') || !map.getLayer('charles-butt-scholars-points') || !map.getLayer('raising-blended-learners-campuses-points') || !map.getLayer('raising-texas-teachers-points')) {
		setTimeout(runWhenLoadComplete, 100);
	}
	else {
		moveYearSlider('active-year', 0); // calling this with a 0 increment will make sure that the filter, caption and slider position all match.  Without doing this, the browser seems to keep the slider position between refreshes, but reset the filter and caption so they get out of sync.
		/* commenting out legislative district controls
		if (showHouseDistricts) {
			populateZoomControl("house-districts-control", "state-house-districts", "District", "Texas House Districts");
			map.moveLayer('state-house-districts-lines');
		}
		if (showSenateDistricts) {
			populateZoomControl("senate-districts-control", "state-senate-districts", "District", "Texas Senate Districts");
			map.moveLayer('state-senate-districts-lines');
		}
		*/
		populateZoomControl("esc-regions-control", "esc-regions", "CITY", "Education Service Centers", "esc");
		populateZoomControl("school-districts-control", "state-school-districts", "NAME", "School Districts", "isd");

		// using a timeout here to stop this from running before the big Raising School Leaders layer has finished loading
		setTimeout(function(){
			map.moveLayer('state-school-districts-lines');
			map.moveLayer('esc-regions-lines');
			map.moveLayer('raising-school-leaders-points');
			map.moveLayer('charles-butt-scholars-points');
			map.moveLayer('raising-blended-learners-campuses-points');
			map.moveLayer('raising-texas-teachers-points');
		}, 100);
	}
}

function populateZoomControl(selectID, sourceID, fieldName, layerName, districtType, hideMaskLayer=true) {
	polygons = getPolygons(sourceID, fieldName);
	var select = document.getElementById(selectID);
	select.options[0] = new Option(layerName, "-108,25,-88,37,0");
	if (!(districtType in districtBBOXes)) {
		districtBBOXes[districtType] = {};
	}
	for (let i in polygons) {
		select.options[select.options.length] = new Option(
			polygons[i].name,
			polygons[i].bbox.toString() + ',' + polygons[i].name
		);
		if (urlParams["districts"] && urlParams["districts"] === districtType) {
			if (urlParams["zoomto"] && decodeURIComponent(urlParams["zoomto"].toString()) === polygons[i].name.toString()) {
				zoomToPolygon(sourceID, polygons[i].bbox.toString() + ',' + polygons[i].name, fieldName);
			}
		}
		districtBBOXes[districtType][polygons[i].name] = polygons[i].bbox;
	}
	if (hideMaskLayer) {
		map.setLayoutProperty(sourceID + '-poly', 'visibility', 'none');
	// IMPORTANT: these paint properties define the appearance of the mask layer that deemphasises districts outside the one we've zoomed to.  They will overrule anything that's set when that mask layer was loaded.
		map.setPaintProperty(sourceID + '-poly', 'fill-color', 'rgba(200, 200, 200, 0.7)');
		map.setPaintProperty(sourceID + '-poly', 'fill-outline-color', 'rgba(200, 200, 200, 0.1)');
	}
}


function findDistrictBySubstring(districtType, prompt) {
	// first check for a complete match
	if (districtBBOXes[districtType][prompt]) {
		return prompt;
	}

	// then check common suffixes
	const suffixes = [" ISD", " CSD", " Cons CSD", " Cons ISD"];
	for (let i in suffixes) {
		if (districtBBOXes[districtType][prompt + suffixes[i]]) {
			return prompt + suffixes[i];
		}
	}

	// then try for substrings, but only return if there's a unique match
	const keys = Object.keys(districtBBOXes[districtType]);
	let matches = [];
	keys.forEach(function(key) {
		if (key.indexOf(prompt) !== -1) {
			matches.push(key);
		}
	});
	if (matches.length === 1) {
		return matches[0];
	}

	// if none of the above worked, tell the calling function that
	return false;
}

function textZoomHandler(districtType, sourceID, fieldName, val) {
	if (val.length > 2) {
		const districtName = findDistrictBySubstring(districtType, val.trim());
		if (districtName) {
			zoomToPolygon(
				sourceID,
				districtBBOXes[districtType][districtName].toString() + ',' + districtName,
				fieldName
			);
		}
	}
}

function removeElement(id) {
	var elementToRemove = document.getElementById(id);
	if (elementToRemove) {
		elementToRemove.parentNode.removeChild(elementToRemove);
	}
}

function getPolygons(sourceID, nameField) {
	layerID = map.getSource(sourceID).vectorLayerIds[0];
	features = map.querySourceFeatures(sourceID, {'sourceLayer': layerID})
	polygons = [];
	existingItems = [];
	for (let i in features) {
		existing = existingItems.indexOf(features[i].properties[nameField]);
		if (existing > -1) {
			polygons[existing].bbox = getFeatureBounds(
				features[i].toJSON().geometry.coordinates,
				polygons[existing].bbox
			);
		}
		else {
			existingItems.push(features[i].properties[nameField]);
			polygons.push({
				name: features[i].properties[nameField],
				bbox: getFeatureBounds(features[i].toJSON().geometry.coordinates)
			});
		}
	}
	polygons.sort(function(a, b){
		var x = a.name;
		var y = b.name;
		if (x < y) {return -1;}
		if (x > y) {return 1;}
		return 0;
	});
	return polygons;
}

function getFeatureBounds(coords, startingBBOX) {
	if (startingBBOX === undefined) {
		minX = 180;
		maxX = -180;
		minY = 90;
		maxY = -90;
	}
	else {
		minX = startingBBOX[0][0];
		maxX = startingBBOX[1][0];
		minY = startingBBOX[0][1];
		maxY = startingBBOX[1][1];
	}
	for (let i in coords) {
		// coords may be a simple array of coords, or an array of arrays if it's a multipolygon
		for (let j in coords[i]) {
			if (!(coords[i][j][0] instanceof Array)) {
				if (coords[i][j][0] < minX) { minX = coords[i][j][0]; }
				if (coords[i][j][0] > maxX) { maxX = coords[i][j][0]; }
				if (coords[i][j][1] < minY) { minY = coords[i][j][1]; }
				if (coords[i][j][1] > maxY) { maxY = coords[i][j][1]; }
			}
			else {
				for (let k in coords[i][j]) {
					if (coords[i][j][k][0] < minX) { minX = coords[i][j][k][0]; }
					if (coords[i][j][k][0] > maxX) { maxX = coords[i][j][k][0]; }
					if (coords[i][j][k][1] < minY) { minY = coords[i][j][k][1]; }
					if (coords[i][j][k][1] > maxY) { maxY = coords[i][j][k][1]; }
				}
			}
		}
	}
	return [[minX, minY], [maxX, maxY]];
}

// from https://www.mapbox.com/mapbox-gl-js/example/filter-features-within-map-view/
// Because features come from tiled vector data, feature geometries may be split
// or duplicated across tile boundaries and, as a result, features may appear
// multiple times in query results.
function getUniqueFeatures(array, comparatorProperty) {
	var existingFeatureKeys = {};
	var uniqueFeatures = array.filter(function(el) {
		if (existingFeatureKeys[el.properties[comparatorProperty]]) {
			return false;
		} else {
			existingFeatureKeys[el.properties[comparatorProperty]] = true;
			return true;
		}
	});

	return uniqueFeatures;
}

// apply map filters persistently
function setFilter(sourceID) {
	if (filterStates.year) {
		if (sourceID.includes("raising-blended-learners")) {
			termLength = 4;
		} else {
			termLength = 1;
		}
		filters = ['all']
		filters.push(['<=', 'year', filterStates.year.toString()]);
		if (!filterStates.showAlumni) {
			filters.push(['>', 'year', (filterStates.year - termLength).toString()]);
		}
		if (filterStates.district && filterStates.district.val) {
			// special handling for ESCs because each consists of multiple ISDs
			if (filterStates.district.field === 'CITY') {
				filters.push(['in', 'school_district'].concat(ESC_ISD_list[filterStates.district.val]));
			} else {
				filters.push([
					'==',
					showSchoolDistricts ? 'school_district' : filterStates.district.field,
					filterStates.district.val.toString()
				]);
			}
		}
		map.setFilter(sourceID, filters);
		map.setPaintProperty(
			sourceID,
			'circle-stroke-opacity', 1
		);
		map.setPaintProperty(
			sourceID,
			'circle-opacity', 0.3
		);
	} else {
		console.log('something`s wrong, there should never be no year filter', filterStates);
	}
}

// Update the year slider and corresponding map filter
function updateYearSlider(numberID, year) {
	filterStates.year = parseInt(year, 10);
	for (let i in loadedPointLayers) {
		setFilter(loadedPointLayers[i][0]);
	}
	// update text in the UI
	document.getElementById(numberID).innerText = year;
	setTimeout(function(){ updateStatsBox(); }, 100);
}

function moveYearSlider(numberID, increment, loop=false) {
	currentYear = filterStates.year ? parseInt(filterStates.year, 10) : parseInt(slider.value, 10);
	desiredYear = currentYear + increment;

	if (loop) { // if we're looping then wrap any overflow around
		if (desiredYear > maxYear) {desiredYear = minYear;}
		else if (desiredYear < minYear) {desiredYear = maxYear;}
	}
	else { // if not looping then keep changes within the min/max bounds
		if ((desiredYear > maxYear) || (desiredYear < minYear)) {
			desiredYear = currentYear;
			console.log('Hacking too much time');
		}
	}

	slider.value = desiredYear;
	updateYearSlider(numberID, desiredYear);
	if (desiredYear < popupYear) {
		popup.remove();
	}
	updateURL(district = filterStates.district ? filterStates.district.val : '0');
}

function animateYearSlider(numberID, delay) {
	if (animationRunning) {
		moveYearSlider(numberID, 1, loop=true);
		setTimeout(
			function() {animateYearSlider(numberID, delay)},
			delay
		);
	}
}

function startYearAnimation(numberID, delay, playID, stopID) {
	animationRunning = true;
	document.getElementById(playID).style.display = 'none';
	document.getElementById(stopID).style.display = 'inline';
	animateYearSlider(numberID, delay);
}

function stopYearAnimation(playID, stopID) {
	animationRunning = false;
	document.getElementById(playID).style.display = 'inline';
	document.getElementById(stopID).style.display = 'none';
}

function updateURL(district='0') {
	var newURL = window.location.pathname;
	var newTitle = 'Charles Butt Foundation programs'
	if (showHouseDistricts) {
		newURL += '?districts=house';
	} else if (showSenateDistricts) {
		newURL += '?districts=senate';
	} else if (showSchoolDistricts) {
		newURL += '?districts=isd'
	} else if (showESCRegions) {
		newURL += '?districts=esc'
	}
	if (district === '0') {
		if (showHouseDistricts) {
			newTitle += ' by House District ';
		} else if (showSenateDistricts) {
			newTitle += ' by Senate District';
		} else if (showSchoolDistricts) {
			newTitle += ' by School District';
		} else if (showESCRegions) {
			newTitle += ' by Education Service Center';
		}
	} else {
		newURL += (newURL.indexOf('?') > -1) ? '&' : '?';
		newURL += 'zoomto=' + district;
		newTitle += ' in '
		if (showHouseDistricts) {
			newTitle += 'House District ';
		} else if (showSenateDistricts) {
			newTitle += 'Senate District ';
		}
		newTitle += decodeURIComponent(district);
		if (showESCRegions) {
			newTitle += ' ESC';
		}
	}
	newURL += (newURL.indexOf('?') > -1) ? '&' : '?';
	newURL += 'year=' + filterStates.year;
	newTitle += ' in ' + filterStates.year;
	history.pushState({id: 'zoomto'}, newTitle, newURL);
	document.title = newTitle;
}

// this event listener forces a page reload when going back through the history, even if only a parameter has changed
window.addEventListener('popstate', function() {
	if (history.state && history.state.id === 'zoomto') {
		location.reload();
	}
})

function zoomToPolygon(sourceID, coords, filterField, maskLayer=true) {
	if (typeof coords !== 'undefined') {
		document.getElementById('statsBox').style.opacity = 0;
		// reset dropdowns as appropriate
		if (sourceID !== 'state-school-districts') {
			showSchoolDistricts = false;
			document.getElementById('school-districts-control').selectedIndex = 0;
		}
		if (sourceID !== 'esc-regions') {
			showESCRegions = false;
			document.getElementById('esc-regions-control').selectedIndex = 0;
		}
		// show appropriate district boundaries
		if (sourceID === 'state-school-districts') {
			showSchoolDistricts = true;
			showHideLayer('esc-regions-lines', markerNames=['esc_regions'], showOnly=false, hideOnly=true);
			filterStates.district.field = 'NAME';
		}
		if (sourceID === 'esc-regions') {
			showESCRegions = true;
			showHideLayer('state-school-districts-lines', markerNames=['state_school_districts'], showOnly=false, hideOnly=true);
			filterStates.district.field = 'CITY';
		}
		coords = coords.split(",");
		bbox = [
			[coords[0], coords[1]],
			[coords[2], coords[3]]
		];
		if (maskLayer) {
			updateURL(district=coords[4]);
			if (coords[4] != '0') {
				filterStates.district.val = coords[4];
			}
			if (showHouseDistricts) {
				showHideLayer('state-house-districts-lines', markerNames=['state_house_districts'], showOnly=true);
			} else if (showSenateDistricts) {
				showHideLayer('state-senate-districts-lines', markerNames=['state_senate_districts'], showOnly=true);
			} else if (showSchoolDistricts) {
				showHideLayer('state-school-districts-lines', markerNames=['state_school_districts'], showOnly=true);
			} else if (showESCRegions) {
				showHideLayer('esc-regions-lines', markerNames=['esc_regions'], showOnly=true);
			}
		}
		map.fitBounds(bbox, options={padding: 10, duration: 3000});
		if (maskLayer && filterField !== undefined) {
			setTimeout(function(){
				if (coords[4] === '0') {
					filterStates.district = false;
				} else {
					filterStates.district = {
						'field': filterField,
						'val':   coords[4]
					};
				}
				for (let i in loadedPolygonLayers) {
					let useLayer = false;
					let markers = [];
					if (coords[4] !== '0' && loadedPolygonLayers[i][1].replaceAll('_', '-') === sourceID) {
						useLayer = true;
						markers = [loadedPolygonLayers[i][1]];
					}
					showHideLayer(
						loadedPolygonLayers[i][0],
						markers,
						showOnly = useLayer,
						hideOnly = !useLayer
					);
					if (useLayer) {
						if (loadedPolygonLayers[i][1] === 'state_school_districts') {
							map.setFilter(
								loadedPolygonLayers[i][0],
								['!=', 'NAME', (coords[4])]
							);
						} else if (loadedPolygonLayers[i][1] === 'esc_regions') {
							map.setFilter(
								loadedPolygonLayers[i][0],
								['!=', 'CITY', (coords[4])]
							);
						} else {
							map.setFilter(
								loadedPolygonLayers[i][0],
								['!=', 'District', parseInt(coords[4])]
							);
						}
					}
				}
				for (let i in loadedPointLayers) {
					setFilter(loadedPointLayers[i][0]);
					if (coords[4] != '0') {
						showHideLayer(loadedPointLayers[i][0], [loadedPointLayers[i][1], loadedPointLayers[i][1] + '_icon'], showOnly=true);
					}
				}
				if (coords[4] === '0') {
					document.getElementById('statsBox').style.opacity = 0;
				}
			}, 1500);
		}
	}
}

function updateStatsBox() {
	if (filterStates.district && filterStates.district.val) { // only do anything if we have a selected district
		document.getElementById('statsBox').style.opacity = 1;
		if (filterStates.district.field.indexOf("house") > -1) {
			document.getElementById("stats.districtType").innerText = "House District";
		} else if (filterStates.district.field.indexOf("senate") > -1) {
			document.getElementById("stats.districtType").innerText = "Senate District";
		} else {
			document.getElementById("stats.districtType").innerText = "";
		}
		document.getElementById("stats.districtName").innerText = decodeURIComponent(filterStates.district.val);
		if (filterStates.district.field.indexOf("CITY") > -1) {
			document.getElementById("stats.districtSuffix").innerText = " ESC";
		} else {
			document.getElementById("stats.districtSuffix").innerText = "";
		}
		document.getElementById("stats.year").innerText = filterStates.year;
		for (let i in loadedPointLayers) {
			if (loadedPointLayers[i][0].includes("raising-blended-learners")) {
				f = ['<', 'year', (filterStates.year + 4).toString()];
			} else {
				f = ['==', 'year', filterStates.year.toString()];
			}
			pointsInDistrict = getUniqueFeatures(
				map.queryRenderedFeatures( {
					layers: [loadedPointLayers[i][0]],
					filter: f
				} ),
				"unique_id"
			);
			counterID = "count." + loadedPointLayers[i][0];
			document.getElementById(counterID).innerText = pointsInDistrict.length;
		}
	} else {
		document.getElementById('statsBox').style.opacity = 0;
	}
}

function standardizeCase(txt) {
	if (txt === undefined || txt === "") {
		return "";
	} else {
		txt = txt.replace(/([^\W_]+[^\s-]*) */g, function(x) {
			return x.charAt(0).toUpperCase() + x.substr(1).toLowerCase();
		});
		txt = " " + txt + " ";
// NB: always include the leading & trailing spaces in this list to avoid accidentally selecting substrings.  The .trim() call at the end will clean them back up.
		overrides = [
			[" Isd ", " ISD "],
			[" Cisd ", " CISD "],
			[" El ", " Elementary School "],
			[" Pri ", " Primary School "],
			[" J H ", " Junior High School " ],
			[" Junior High School Moore ", " J.H. Moore "], // comedy hour special case here, because the line above expands "J H Moore El" to "Junior High Moore Elementary School"
			[" Int ", " Intermediate School "],
			[" H S ", " High School "],
			[" Aec ", " Alternative Education Center "]
		];
		for (let i in overrides) {
			txt = txt.replace(overrides[i][0], overrides[i][1]);
		}
		return txt.trim();
	}
}




function openNav() {
	document.getElementById("mySidenav").style.width = "300px";
	document.getElementById("main").style.marginLeft = "300px";
}

function closeNav() {
	document.getElementById("mySidenav").style.width = "0";
	document.getElementById("main").style.marginLeft= "0";
}




function setVisibilityState(params) {
	if ((params.visibleOnLoad === undefined) || (params.visibleOnLoad === false)) {
		if ((params.legendID !== undefined) && (params.legendID !== false)) {
			document.getElementById(params.legendID).classList.add('inactive');
		}
		return 'none';
	} else {
		if ((params.legendID !== undefined) && (params.legendID !== false)) {
			document.getElementById(params.legendID).classList.remove('inactive');
		}
		return 'visible';
	}
}

function addPointLayer(map, params) {
	delimitedTextToGeoJSON(params.tsvURL, '\t', '\r\n', function(jsondata) {
		var visibilityState = setVisibilityState(params);
		if (params.scalingFactor === undefined) { params.scalingFactor = 25; }
		map.addSource(params.sourceName, {
			type: 'geojson',
			data: jsondata
		});
		if (params.icon !== undefined) {
			map.addLayer({
				'id': params.layerName,
				'type': 'symbol',
				'source': params.sourceName,
				'layout': {
					'icon-image': params.icon,
					'icon-size': params.iconSize,
					'icon-allow-overlap': true,
					'visibility': visibilityState
				}
			});
		} else if (params.circleColor !== undefined) {
			map.addLayer({
				'id': params.layerName,
				'type': 'circle',
				'source': params.sourceName,
				'layout': {
					'visibility': visibilityState
				},
				'paint': {
					'circle-radius': [
						'interpolate', ['exponential', 1.5],
						['zoom'],
						(originalZoomLevel - 1), params.circleRadius,
						15, (params.circleRadius * params.scalingFactor),
						22, (params.circleRadius * params.scalingFactor * params.scalingFactor)
					],
					'circle-color': params.circleColor,
					'circle-opacity': 0,
					'circle-stroke-color': params.circleColor,
					'circle-stroke-opacity': 0,
					'circle-stroke-width': 1,
					'circle-blur': 0.1
				}
			});
		} else {
			console.log('Layer type not recognised:', params);
			return;
		}
		loadedPointLayers.push([params.layerName, params.legendID]);
		loadedPointLayerNames.push(params.layerName)
	});
}

function addVectorLayer(map, params) {
	var visibilityState = setVisibilityState(params);
	map.addSource(params.sourceName, {
		type: 'vector',
		url: params.sourceURL
	});
	if ((params.lineLayerName !== undefined) && (params.lineLayerName !== false)) {
		map.addLayer(
			{
				'id': params.lineLayerName,
				'type': 'line',
				'source': params.sourceName,
				'source-layer': params.sourceID,
				'layout': {
					'visibility': visibilityState,
					'line-join': 'round',
					'line-cap': 'round'
				},
				'paint': {
					'line-color': params.lineColor,
					'line-width': 1
				},
			}
		);
		if (params.legendID !== undefined) {
			loadedLineLayers.push([params.lineLayerName, params.legendID]);
		}
	}
	if ((params.polygonLayerName !== undefined) && (params.polygonLayerName !== false)) {
		if (params.usedInZoomControl) { visibilityState = 'visible'; }
		map.addLayer(
			{
				'id': params.polygonLayerName,
				'type': 'fill',
				'source': params.sourceName,
				'source-layer': params.sourceID,
				'layout': {
					'visibility': visibilityState
				},
				'paint': {
					'fill-color': params.polygonFillColor,
					'fill-outline-color': params.polygonOutlineColor
				},
			}
		);
		if (params.legendID !== undefined) {
			loadedPolygonLayers.push([params.polygonLayerName, params.legendID]);
		}
	}
}




// These are the popups for the polygon district layers, using Eldan's House/Senate 'show' logic
// When a click event occurs on a feature in the unioned districts layer, open a popup for
// the correct district type at the location of the click, with description HTML from its properties.
function fillpopup(data) {
	var html = "<span class='varname'>";
	if (showHouseDistricts) {
		html += "House District: ";
	} else if (showSenateDistricts) {
		html += "Senate District: ";
	}
	html += "</span><span class='attribute'>";
	if (showHouseDistricts) {
		html += data.HseDistNum;
	} else if (showSenateDistricts) {
		html += data.SenDistNum;
	} else if (showSchoolDistricts) {
		html += data.NAME;
	}
	html += "</span>";
	return html; //this will return the string to the calling function
}




function fetchFile(path, lineSeparator, callback) {
	var httpRequest = new XMLHttpRequest();
	httpRequest.onreadystatechange = function() {
		if (httpRequest.readyState === 4) {
			if (httpRequest.status === 200) {
				// split to get an array in which each item was one row of the original file
				if (callback) callback(httpRequest.responseText.split(lineSeparator));
			}
		}
	};
	httpRequest.open('GET', path);
	httpRequest.send();
}



// make text signature of an object for comparing
function objectSig(obj, ignoreFields) {
	let sig = '';
	for (let j in obj) {
		if (ignoreFields.indexOf(j) === -1) {
			sig += j + obj[j];
		}
	}
	return sig
}



// make an array with no duplicate features, and a count of source duplicates
function compileUniqueArray(features, ignoreFields=[]) {
	let uniques = [];
	let sigs = [];
	ignoreFields.push('latitude', 'longitude', 'count', 'unique_id'); // we always want to ignore these fields
	for (let i in features) {
		let data = features[i].properties;
		let sig = objectSig(data, ignoreFields);
		let idx = sigs.indexOf(sig);
		if (idx > -1) {
			uniques[idx].count += 1;
		} else {
			data.count = 1;
			uniques.push(data);
			sigs.push(sig);
		}
	}
	// sort the list, as per https://flaviocopes.com/how-to-sort-array-of-objects-by-property-javascript/
	features.sort((a, b) => (a.year < b.year) ? 1 : -1);
	// use the earliest date for popupYear, because its used to hide this popup if the display year is set to before any of the contents were valid
	popupYear = features[features.length - 1].properties.year;
	return uniques
}



function normaliseHeaders(row, delimiter) {
	let headers = row.split(delimiter);
	for (let i in headers) {
		switch(headers[i].toLowerCase()) {
				case 'longitude':
				case 'long':
				case 'lng':
				case 'lon':
				case 'x':
				case 'xcoord':
				headers[i] = 'x';
				break;
				case 'latitude':
				case 'lat':
				case 'y':
				case 'ycoord':
				headers[i] = 'y';
		}
	}
	return headers;
}


// parseDelimitedTextFile parses a delimited text file into a data object.
// The only assumption made is that the first row contains variable names.
// No checking or normalisation is done; duplicate variable names *will* cause problems.
function parseDelimitedTextFile(url, delimiter, lineSeparator, callback) {
	fetchFile(url, lineSeparator, function(data) {
		const headers = data[0].split(delimiter);
		let results = [];
		for (let i = 1; i < data.length; i++) {
			let row = data[i].split(delimiter);
			let result = {};
			for (let j = 0; j < row.length; j++) {
				if (row[j]) {
					result[headers[j]] = row[j];
				}
			}
			if (Object.keys(result).length > 0) {
				results.push(result);
			}
		}
		callback(results);
	});
}


// delimitedTextToGeoJSON parses a delimited text file into GeoJSON,
// assuming that it can find `x` and `y` fields to assemble coordinates from.
// does not do any reprojecting or validating of coordinates, so output is
// assumed to be EPSG:4326 by default
function delimitedTextToGeoJSON(url, delimiter, lineSeparator, callback) {
	fetchFile(url, lineSeparator, function(data) {

		let headers = normaliseHeaders(data[0], delimiter);

		const gj = { type: 'FeatureCollection', features: [] };

		for (let i = 1; i < data.length; i++) {
			let row = data[i].split(delimiter);
			const feature = {
				type: 'Feature',
				geometry: {
					type: 'Point',
					coordinates: [0, 0]
				},
				properties: {}
			};

			for (let j = 0; j < headers.length; j++) {
				feature.properties[headers[j]] = row[j];
			}

			if ('x' in feature.properties) {
				feature.geometry.coordinates[0] = parseFloat(feature.properties.x);
			}
			if ('y' in feature.properties) {
				feature.geometry.coordinates[1] = parseFloat(feature.properties.y);
			}

			gj.features.push(feature);
		}

		callback(gj);
	});
};
