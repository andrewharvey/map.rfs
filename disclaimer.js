/*
 * This file is licenced CC0 http://creativecommons.org/publicdomain/zero/1.0/
 */

/* Provide the user some context of what they are looking at by a modal box on
 * load.
 *
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
