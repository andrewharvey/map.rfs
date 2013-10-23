/*
 * Application code for map.rfs
 *
 * This file is licenced CC0 http://creativecommons.org/publicdomain/zero/1.0/
 *
 */

/* Give the user some context of what they are looking at.
 * Later this could be disclaimer warning users of what they should already
 * know. Since the source data is non-free I'll need to do whatever I can to
 * keep RFS happy with the use of it's data here. */
$(document).ready( function () {
    bootbox.alert("This web site is an effort to provide a simple yet usable map of the NSW RFS Current Fires and Incidents.<br><br>" + 
        "I was frustrated by the tiny map offered on the RFS web site and the poor usability of the map component. Clicking each marker gave you a popup which filled the whole map window making it very hard to close again and pan around.<br><br>" +
        "Furthermore, it was running off the Google Maps API which is probably costing the RFS money sent to Google.<br><br>" +
        "Currently map.rfs.nsw.gov.au goes nowhere, so I built the website I expected to get by going to map.rfs.nsw.gov.au.<br><br>" + 
        "This web site is still only a prototype and remains in heavy development, as such please don't rely on it for critical emergency information! <br><br>" +
        'This site is free and open source software, if you are interested you may check out the <a href="https://github.com/andrewharvey/map.rfs/">source code</a>.<br><br>' +
        'The site was built by <a href="http://tianjara.net/">Andrew Harvey</a>.'
        );
});

var compiledPopupTemplate = Mustache.compile(popupTemplateString);

/* set colors according to alert levels */
var alertLevelStyle = {
    'emergency': 'red',
    'watchAndAct': 'orange',
    'advice': 'blue',
    'notApplicable': 'grey'
};

function alertToClass(alertValue) {
    switch (alertValue) {
        case 'Emergency Warning':
            return 'text-danger';
            break;
        case 'Watch and Act':
            return 'text-warning';
            break;
        case 'Advice':
            return 'text-info';
            break;
        case 'Not Applicable':
            return 'text-muted';
            break;
        default:
            return '';
    }
}

function statusToClass(statusValue) {
    switch (statusValue) {
        case 'Out of Control':
            return 'text-danger';
            break;
        case 'Being Controlled':
            return 'text-warning';
            break;
        case 'Under Control':
            return 'text-info';
            break;
        default:
            return '';
    }
}

var markerIcon = 'fire';

/* now create the polygon styles */
var emergencyPolygonStyle = {
    'color': alertLevelStyle.emergency
};
var watchAndActPolygonStyle = {
    'color': alertLevelStyle.watchAndAct
};
var advicePolygonStyle = {
    'color': alertLevelStyle.advice
};
var notApplicablePolygonStyle = {
    'color': alertLevelStyle.notApplicable
};

/* now create the markers */
var emergencyIcon = L.AwesomeMarkers.icon({
    icon: markerIcon,
    color: alertLevelStyle.emergency 
});
var watchAndActIcon = L.AwesomeMarkers.icon({
    icon: markerIcon,
    color: alertLevelStyle.watchAndAct
});
var adviceIcon = L.AwesomeMarkers.icon({
    icon: markerIcon,
    color: alertLevelStyle.advice
});
var notApplicableIcon = L.AwesomeMarkers.icon({
    icon: 'info',
    color: alertLevelStyle.notApplicable
});

/* set the polygon style for this feature */
function polygonStyle(feature) {
    if (feature.properties && feature.properties.category) {
        switch (feature.properties.category) {
            case 'Emergency Warning':
                return emergencyPolygonStyle;
                break;
            case 'Watch and Act':
                return watchAndActPolygonStyle;
                break;
            case 'Advice':
                return advicePolygonStyle;
                break;
            case 'Not Applicable':
                return notApplicablePolygonStyle;
                break;
            default:
                return {};
        }
    } else {
        return {}; /* default style */
    }
}

/* create a marker for this feature */
function createMarker(feature, latlng) {
    var icon = new L.Icon.Default();

    if (feature.properties && feature.properties.category) {
        switch (feature.properties.category) {
            case 'Emergency Warning':
                icon = emergencyIcon;
                break;
            case 'Watch and Act':
                icon = watchAndActIcon;
                break;
            case 'Advice':
                icon = adviceIcon;
                break;
            case 'Not Applicable':
                icon = notApplicableIcon;
                break;
        }
    }

    return L.marker(latlng, { icon: icon });
    //return new HoverPopupMarker(latlng, { icon: icon });
}

/* for each feature from the GeoJSON do some extra tasks */
function onEachFeature(feature, layer) {
    /* FIXME we should still map features with properties but no description,
     * but for now we don't do this */
    if (feature.properties && feature.properties.description) {
        /* parsing the description value */
        var attributes = feature.properties.description.split('<br />');
        var properties = {};
        for (var i = 0; i < attributes.length; i++) {
            /* reasoning for this regex

               format is KEY: VALUE

               however sometimes the key may have a ":" like for times

               sometimes the whitespace between ":" and "VALUE" may be a single space or a space and newline

               because VALUE may have multiple newline characters, we need the /s modifier so that the dot
               matches newline, but since it doesn't exist in javascript we use [\s\S] instead of the dot
               */
            var matches = attributes[i].match(/^(.*):\s+([\s\S]*)$/);
            if (matches && (matches.length == 3)) {
                var key = matches[1];
                var value = matches[2];

                properties[key] = value;
            }else{
                // problem parsing description field
                console.log(attributes[i]);
            }
        }

        /* now we have a proper object to work with */

        /* hmm... do we use feature.properties.pubDate or
         * feature.properties.description.UPDATED ?
         * They appear to be the same, except pubDate is less ambiguous because
         * it is GMT whereas UPDATED the time zone isn't specified. */

        var templateData = {
            "title": ((feature.properties.title) ? feature.properties.title : 'Untitled'),
            "alert-color": alertToClass(properties["ALERT LEVEL"]),
            "alert-text": properties["ALERT LEVEL"],
            "status-color": statusToClass(properties["STATUS"]),
            "status-text": properties["STATUS"],
            "type": properties["TYPE"],
            "fire": properties["FIRE"],
            "size": properties["SIZE"],
            "council": properties["COUNCIL AREA"],
            "responsible-agency": properties["RESPONSIBLE AGENCY"],
            "last-update": properties["UPDATED"],
            "last-update-human": moment(feature.properties.pubDate).calendar(),
            "last-update-human-ago": moment(feature.properties.pubDate).fromNow(),
            "location": properties["LOCATION"]
        };

        var html = compiledPopupTemplate(templateData);

        /* bind a popup to the current feature layer using our
           content we have just defined */
        layer.bindPopup(html);

        /* if the feature is a polygon also create a center marker
           because tiny polygons are easily missed */
        if (feature.geometry.type == 'Polygon') {
            var centerMarker = createMarker(feature, layer.getBounds().getCenter()).addTo(map);
            centerMarker.bindPopup(html, {showOnMouseOver: true});
        }
    } else {
        console.log("Found a feature with properties, but no description property, so won't be mapped.");
    }
}

/* create the leaflet map */
var map = L.map('map');

/* remove attribution */
map.attributionControl.setPrefix('');

/* set the view for NSW ( S W N E ) */
map.fitBounds([
        [-37.614, 140.756],
        [-28.071, 153.896]
        ]);

L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
        }).addTo(map);

$.getJSON('//tianjara.net/data/rfs/majorIncidents.json', function (data) {
        L.geoJson(data, {
            style: polygonStyle,
            pointToLayer: createMarker,
            onEachFeature: onEachFeature
        }).addTo(map);
        });

/* add RFS attribution */
map.attributionControl.addAttribution('Major Incident data &copy; <a href="http://www.rfs.nsw.gov.au/feeds/majorIncidents.xml">NSW Rural Fire Service</a>');
