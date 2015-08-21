/*
 * Application code for map.rfs
 *
 * This file is licenced CC0 http://creativecommons.org/publicdomain/zero/1.0/
 *
 */


/* compile the Mustache popup template (makes it faster for repeated use as is
 * the case here) */
var compiledPopupTemplate = Mustache.compile(popupTemplateString);

/* set colors according to alert levels */
var alertLevelStyle = {
    'emergency': 'red',
    'watchAndAct': 'orange',
    'advice': 'blue',
    'notApplicable': 'grey'
};

/* set bootstrap text class's according to incident alert level */
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

/* set bootstrap text class's according to incident status */
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

/* set tooltip explaining incident status
 * these descriptions are pulled verbatim from the RFS from
 * http://www.rfs.nsw.gov.au/dsp_content.cfm?cat_id=683 */
function statusToTooltip(statusValue) {
    switch (statusValue) {
        case 'Out of Control':
            return 'Indicates any fire that is spreading on one or more flanks. Effective control strategies are not in place for the entire perimeter';
            break;
        case 'Being Controlled':
            return 'Effective strategies are in operation or planned for the entire perimeter';
            break;
        case 'Under Control':
            return 'The fire is at a stage where fire fighting resources are only required for patrol purposes and major re-ignition is unlikely';
            break;
        default:
            return '';
    }
}


/* create the fire polygon styles */
var emergencyPolygonStyle = {
    'color': alertLevelStyle.emergency,
    'fillOpacity': 0.2
};
var watchAndActPolygonStyle = {
    'color': alertLevelStyle.watchAndAct,
    'fillOpacity': 0.2
};
var advicePolygonStyle = {
    'color': alertLevelStyle.advice,
    'fillOpacity': 0.2
};
var notApplicablePolygonStyle = {
    'color': alertLevelStyle.notApplicable,
    'fillOpacity': 0.2
};

/* icon to use for the fire markers */
var fireMarkerIcon = 'fire';

/* create the fire markers */
var emergencyIcon = L.AwesomeMarkers.icon({
    icon: fireMarkerIcon,
    prefix: 'fa',
    markerColor: alertLevelStyle.emergency 
});
var watchAndActIcon = L.AwesomeMarkers.icon({
    icon: fireMarkerIcon,
    prefix: 'fa',
    markerColor: alertLevelStyle.watchAndAct
});
var adviceIcon = L.AwesomeMarkers.icon({
    icon: fireMarkerIcon,
    prefix: 'fa',
    markerColor: alertLevelStyle.advice
});
var notApplicableIcon = L.AwesomeMarkers.icon({
    icon: 'info',
    prefix: 'fa',
    markerColor: alertLevelStyle.notApplicable
});

/* function to set the polygon style for each feature */
function firePolygonStyle(feature) {
    if (feature.properties && feature.properties.category) {
        /* style by RSS item category (which is the incident status) */
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
function createFireMarker(feature, latlng) {
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

/* given a size in format "10000 ha" will format this as "10,000 ha" */
function formatSize(size) {
    if (size !== undefined && size.split(/ /).length == 2) {
        return numeral(size.split(/ /)[0]).format('0,0') + " " + size.split(/ /)[1];
    } else {
        return size; // unable to format
    }
}

/* for each feature from the GeoJSON do some extra tasks */
function onEachFireFeature(feature, layer) {
    /* highlight feature on highlight */
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight
    });

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

        /* now we have a proper properties object to work with */

        /* hmm... do we use feature.properties.pubDate or
         * feature.properties.description.UPDATED ?
         * They appear to be the same, except pubDate is less ambiguous because
         * it is GMT whereas UPDATED the time zone isn't specified. */

        /* data we pass into our Mustache popup template */
        var templateData = {
            "title": ((feature.properties.title) ? feature.properties.title : 'Untitled'),
            "alert-color": alertToClass(properties["ALERT LEVEL"]),
            "alert-text": properties["ALERT LEVEL"],
            "status-color": statusToClass(properties["STATUS"]),
            "status-text": properties["STATUS"],
            "status-tooltip": statusToTooltip(properties["STATUS"]),
            "type": properties["TYPE"],
            "type": properties["TYPE"],
            "fire": properties["FIRE"],
            "size": formatSize(properties["SIZE"]),
            "council": properties["COUNCIL AREA"],
            "responsible-agency": properties["RESPONSIBLE AGENCY"],
            "last-update": properties["UPDATED"],
            "last-update-human": moment(feature.properties.pubDate).calendar(),
            "last-update-human-ago": moment(feature.properties.pubDate).fromNow(),
            "location": properties["LOCATION"]
        };

        /* generate the popup HTML from the template and template data */
        var html = compiledPopupTemplate(templateData);

        /* bind a popup to the current feature layer using our
           popup content we have just defined */
        layer.bindPopup(html);

        /* if the feature is a polygon could also create a center marker
           because tiny polygons are easily missed however it appears
           that most incidents which have a polygon also have a marker so lets
           not duplicate this. Also by using a thick polygon border style small
           areas aren't so easily missed */
        /*if (feature.geometry.type == 'Polygon') {
            var centerMarker = createFireMarker(feature, layer.getBounds().getCenter()).addTo(map);
            centerMarker.bindPopup(html, {showOnMouseOver: true});
        }*/
    } else {
        console.log("Found a feature with properties, but no description property, so won't be mapped.");
    }
}

var incidentLayer;

function resetHighlight(e) {
    if (incidentLayer) {
        incidentLayer.resetStyle(e.target);
    }
}

function highlightFeature(e) {
    var layer = e.target;

    var highlightStyle = firePolygonStyle(layer);

    highlightStyle.fillOpacity = 0.5;

    layer.setStyle(highlightStyle);
}

function addIncidentLayer(map, data) {
    incidentLayer = L.geoJson(data, {
        style: firePolygonStyle,
        pointToLayer: createFireMarker,
        onEachFeature: onEachFireFeature
    }).addTo(map);
}
