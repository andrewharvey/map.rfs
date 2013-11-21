/*
 * Application code for map.rfs
 *
 * This file is licenced CC0 http://creativecommons.org/publicdomain/zero/1.0/
 *
 */


/* compile the Mustache popup template (makes it faster for repeated use as is
 * the case here) */
var compiledSentinelPopupTemplate = Mustache.compile(sentinelPopupTemplateString);

/* for each feature from the GeoJSON do some extra tasks */
function onEachSentinelFeature(feature, layer) {
    /* FIXME we should still map features with properties but no description,
     * but for now we don't do this */
    if (feature.properties && feature.properties.description) {
        /* parsing the description value */
        var attributes = feature.properties.description.split('<br/>');
        var properties = {};
        for (var i = 0; i < attributes.length; i++) {
            /* reasoning for this regex

               format is KEY: VALUE

               however sometimes the key may have a ":" like for times

               sometimes the whitespace between ":" and "VALUE" may be a single space or a space and newline

               because VALUE may have multiple newline characters, we need the /s modifier so that the dot
               matches newline, but since it doesn't exist in javascript we use [\s\S] instead of the dot
               */
            var matches = attributes[i].trim().match(/^(.*):\s+([\s\S]*)/);
            if (matches && (matches.length == 3)) {
                var key = matches[1];
                var value = matches[2];

                properties[key] = value;
            }else{
                // problem parsing description field
                console.log("Couldn't parse: " + attributes[i]);
            }
        }

        /* now we have a proper properties object to work with */

        /* hmm... do we use feature.properties.pubDate or
         * feature.properties.description.UPDATED ?
         * They appear to be the same, except pubDate is less ambiguous because
         * it is GMT whereas UPDATED the time zone isn't specified. */

        /* data we pass into our Mustache popup template */
        var templateData = {
            "category": ((feature.properties.category) ? feature.properties.category : ''),
            "satellite": properties["SATELLITE"],
            "temp": properties["TEMPERATURE"].replace(/C$/, ''),
            "conf": properties["CONFIDENCE"],
            "obs": properties["OBS TIME"],
            "obs-human": moment(properties["OBS TIME"]).calendar(),
            "obs-human-ago": moment(properties["OBS TIME"]).fromNow()
        };

        /* generate the popup HTML from the template and template data */
        var html = compiledSentinelPopupTemplate(templateData);

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

var sentinelLayer;

function addSentinelLayer(map, data) {
    sentinelLayer = L.geoJson(data, {
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, {
                    radius: 4,
                    fillColor: "#ff7800",
                    color: "#000",
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.8
            });
        },
        onEachFeature: onEachSentinelFeature
    }).addTo(map);
}
