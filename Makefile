popupJS:
	cat popup.header.html popup.mustache.html popup.footer.html | tr -d '\n' > popupTemplate.js
