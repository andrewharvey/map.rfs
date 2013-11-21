popupJS:
	cat popup.header.html popup.mustache.html popup.footer.html | tr -d '\n' > popupTemplate.js
	cat sentinelPopup.header.html sentinelPopup.mustache.html sentinelPopup.footer.html | tr -d '\n' > sentinelPopupTemplate.js
