const { ipcRenderer } = require("electron");

document.addEventListener("DOMContentLoaded", () => {
	// --------------------------------------------------------------------
	// ----------------------------- MAIN ---------------------------------
	// --------------------------------------------------------------------
	// Disable mouse wheel clicks

	const captionElem = document.getElementById("caption");
	const infoElem = document.getElementById("info");

	document.addEventListener("auxclick", (e) => {
		if (e.which !== 2)
			return true;

		e.preventDefault();
		e.stopPropagation();
		e.stopImmediatePropagation();
		return false;
	});

	// Status display
	ipcRenderer.on("caption", (_, caption) => {
		captionElem.textContent = caption;
	});
	ipcRenderer.on("info", (_, info) => {
		infoElem.textContent = info;
	});
});