/*
 * Full screen for map.rfs (so if you want to embedd it into another web page just replace this file)
 *
 * This file is licenced CC0 http://creativecommons.org/publicdomain/zero/1.0/
 *
 */

/* create the leaflet map */
var map = L.map('map');

/* remove Leaflet attribution */
map.attributionControl.setPrefix('');

/* set the view for NSW ( S W N E ) */
map.fitBounds([
        [-37.614, 140.756],
        [-28.071, 153.896]
        ]);

/* use OSM as the base map */
L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: 'Base map &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

/* add the major incidents geojson feed */
$.getJSON('//tianjara.net/data/rfs/majorIncidents.json', function (data) {
        addIncidentLayer(map, data)
        });

/* add RFS attribution */
map.attributionControl.addAttribution('Major Incident data &copy; <a href="http://www.rfs.nsw.gov.au/feeds/majorIncidents.xml">NSW Rural Fire Service</a>');

/* add the GA hotspots feed */
$.getJSON('//tianjara.net/data/ga/sentinel.json', function (data) {
        addSentinelLayer(map, data)
        });

/* add Sentinel attribution */
map.attributionControl.addAttribution('MODIS Hotspots &copy; <a href="http://sentinel.ga.gov.au/RSS/sentinelrss.xml">Based on Geoscience Australia material.</a>');
