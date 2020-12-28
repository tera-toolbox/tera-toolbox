/* eslint-disable no-undef */
/* eslint-disable default-case */
const { remote, ipcRenderer, shell} = require("electron");
const { TeraToolboxMUI, LanguageNames } = require("tera-toolbox-mui");
const Themes = ["black", "grey", "white", "pink", "classic-black", "classic-white", "classic-pink"];
const fs = require("fs");

let mui = null;

function displayName(modInfo) {
	if (modInfo.options) {
		if (modInfo.options.guiName)
			return modInfo.options.guiName;
		if (modInfo.options.cliName)
			return modInfo.options.cliName;
	}

	return modInfo.rawName || modInfo.name;
}

// eslint-disable-next-line no-undef
jQuery(($) => {
	const contents = $("#log-contents");

	// --------------------------------------------------------------------
	// --------------------------- MAIN BASIC CONTROLS --------------------
	// --------------------------------------------------------------------

	// MUI
	function setLanguage(language) {
		if (mui && language && mui.language === language)
			return;

		mui = new TeraToolboxMUI(language);
		$("*").each(function () {
			const str = $(this).attr("mui");
			if (str) {
				$(this).text(mui.get(str));
			} else {
				const str_html = $(this).attr("mui-html");
				if (str_html)
					$(this).html(mui.get(str_html));
			}
		});
	}

	// --------------------------------------------------------------------
	// ----------------------------- MAIN ---------------------------------
	// --------------------------------------------------------------------
	$("#minimize-btn").click(() => {
		if (Settings.gui.minimizetotray)
			remote.getCurrentWindow().hide();
		else
			remote.getCurrentWindow().minimize();
	});

	$("#close-btn").click(() => {
		remote.getCurrentWindow().close();
	});

	$("#info-btn").click(() => {
		ShowModalHtml(mui.get("gui/main/static/tabs/credits/content"));
	});

	$("#discord-btn").click(() => {
		shell.openExternal(remote.getGlobal("TeraProxy").SupportUrl);
	});

	$("#mods-btn").click(() => {
		ipcRenderer.send("show mods folder");
	});

	// Disable mouse wheel clicks
	// eslint-disable-next-line no-undef
	$(document).on("auxclick", "a", (e) => {
		if (e.which !== 2)
			return true;

		e.preventDefault();
		e.stopPropagation();
		e.stopImmediatePropagation();
		return false;
	});

	// --------------------------------------------------------------------
	// ------------------------- SETTINGS TAB -----------------------------
	// --------------------------------------------------------------------
	let Settings = null;

	function onSettingsChanged(newSettings) {
		Settings = newSettings;
		setLanguage(Settings.uilanguage);
		setProxyRunning(ProxyRunning);

		$("#uilanguage").val(mui.language);
		$("#uithemes").val(Settings.gui.theme);
		$("#autostart").prop("checked", Settings.gui.autostart);
		$("#updatelog").prop("checked", Settings.updatelog);
		$("#logtimes").prop("checked", Settings.gui.logtimes);
		$("#noupdate").prop("checked", Settings.noupdate);
		$("#noselfupdate").prop("checked", Settings.noselfupdate);
		$("#noslstags").prop("checked", Settings.noslstags);
		$("#noserverautojoin").prop("checked", Settings.noserverautojoin);
		$("#minimizetotray").prop("checked", Settings.gui.minimizetotray);
		$("#cleanstart").prop("checked", Settings.gui.cleanstart);
		$("#theme").attr("href", `css/themes/${Settings.gui.theme}.css`);
		$("#removecounters").prop("checked", Settings.removecounters);

	}

	function updateSettings(newSettings) {
		ipcRenderer.send("set config", newSettings);
		onSettingsChanged(newSettings);
	}

	function updateSetting(key, value) {
		let Override = {};
		Override[key] = value;
		updateSettings(Object.assign(Settings, Override));
	}

	function updateGUISetting(key, value) {
		let Override = {};
		Override[key] = value;

		let SettingsCopy = { ...Settings};
		SettingsCopy.gui = Object.assign(SettingsCopy.gui, Override);
		updateSettings(SettingsCopy);
	}

	function loadSettingsLanguageNames() {
		const LanguageSelector = $("#uilanguage");
		Object.keys(LanguageNames).forEach(language_id => LanguageSelector.append($("<option/>", { "value": language_id, "text": LanguageNames[language_id] })));
	}

	function loadThemesNames() {
		const ThemesSelector = $("#uithemes");
		Themes.forEach(theme => ThemesSelector.append($("<option/>", { "value": theme, "text": theme })));
	}

	loadSettingsLanguageNames();
	loadThemesNames();

	ipcRenderer.on("set config", (_, newConfig) => {
		onSettingsChanged(newConfig);
	});

	// UI events
	$("#uilanguage").change(() => {
		updateSetting("uilanguage", $("#uilanguage").val());
	});

	$("#uithemes").change(() => {
		updateGUISetting("theme", $("#uithemes").val());
	});

	$("#autostart").click(() => {
		updateGUISetting("autostart", $("#autostart").is(":checked"));
	});

	$("#updatelog").click(() => {
		updateSetting("updatelog", $("#updatelog").is(":checked"));
	});

	$("#logtimes").click(() => {
		updateGUISetting("logtimes", $("#logtimes").is(":checked"));
	});

	$("#noupdate").click(() => {
		const checked = $("#noupdate").is(":checked");
		if (checked)
			ShowModal(mui.get("gui/main/modal/warn-mod-update-disabled"));
		updateSetting("noupdate", checked);
	});

	$("#noselfupdate").click(() => {
		const checked = $("#noselfupdate").is(":checked");
		if (checked)
			ShowModal(mui.get("gui/main/modal/warn-self-update-disabled"));
		updateSetting("noselfupdate", checked);
	});

	$("#noslstags").click(() => {
		updateSetting("noslstags", $("#noslstags").is(":checked"));
	});

	$("#noserverautojoin").click(() => {
		updateSetting("noserverautojoin", $("#noserverautojoin").is(":checked"));
	});

	$("#minimizetotray").click(() => {
		updateGUISetting("minimizetotray", $("#minimizetotray").is(":checked"));
	});
	
	$("#cleanstart").click(() => {
		updateGUISetting("cleanstart", $("#cleanstart").is(":checked"));
	});

	$("#removecounters").click(() => {
		updateSetting("removecounters", $("#removecounters").is(":checked"));
	});
	// Admin indicator
	let IsAdmin = false;
	ipcRenderer.on("is admin", (_, isAdmin) => {
		IsAdmin = isAdmin;

		if (IsAdmin) {
			$("#admin-badge").removeClass("admin-badge-disabled");
			$("#admin-badge").addClass("admin-badge-enabled");
		} else {
			$("#admin-badge").removeClass("admin-badge-enabled");
			$("#admin-badge").addClass("admin-badge-disabled");
		}
	});

	// Update available indicator
	let UpdateAvailable = false;
	ipcRenderer.on("update available", _ => {
		UpdateAvailable = true;
		$("#title-status").text(mui.get("gui/main/status-update-available"));
	});

	// Proxy control
	let ProxyRunning = false;
	let ProxyStarting = false;

	function setProxyStarting() {
		ProxyStarting = true;
		$("#startproxy").text(mui.get("gui/main/start-stop-proxy-starting"));
	}

	function setProxyRunning(running) {
		if (!ProxyRunning && !running && ProxyStarting)
			return;

		ProxyRunning = running;
		ProxyStarting = false;

		$("#startproxy").text(mui.get(ProxyRunning ? "gui/main/start-stop-proxy-running" : "gui/main/start-stop-proxy-not-running"));
		if (!UpdateAvailable)
			$("#title-status").text(mui.get(ProxyRunning ? "gui/main/status-proxy-running" : "gui/main/status-proxy-not-running"));
	}

	function selectLogForcefully() {
		document.getElementById("tabone").checked = true;
		const tabs = document.querySelectorAll(".tab--active");
		for (const tab of tabs) tab.classList.remove("tab--active");
		const contentElement = document.querySelector(".tab[data-tab=\"1\"]");
		contentElement.classList.add("tab--active");
	}

	function startProxyLogJob() {
		if(Settings.gui.cleanstart) $("#log-contents").empty();
	}

	function startProxy() {
		if (ProxyStarting || ProxyRunning)
			return;

		setProxyStarting();
		ipcRenderer.send("start proxy");
		
		selectLogForcefully();
		startProxyLogJob();
	}

	function stopProxy() {
		if (!ProxyRunning)
			return;

		$("#startproxy").text(mui.get("gui/main/start-stop-proxy-stopping"));
		ipcRenderer.send("stop proxy");
	}

	$("#startproxy-btn").click(() => {
		if (ProxyRunning)
			stopProxy();
		else
			startProxy();
	});

	// eslint-disable-next-line no-unused-vars
	ipcRenderer.on("proxy starting", _ => setProxyStarting());
	ipcRenderer.on("proxy running", (_, running) => setProxyRunning(running));

	// ---------------------------------------------------------------------
	// ------------------------ LOGS ---------------------------------------
	// ---------------------------------------------------------------------
	function log(msg, type) {
		let timeStr = "";
		if (Settings.gui.logtimes) {
			const now = new Date();
			timeStr = `[${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}.${now.getMilliseconds().toString().padStart(3, "0")}] `;
		}

		contents.append($("<div/>", { "class": type || "log" }).text(`${timeStr}${msg}`));
		contents.scrollTop(contents[0].scrollHeight);
	}

	$("#clear-logs").click(() => {
		$("#log-contents").empty();
	});

	$("#save-logs").click(() => {
		remote.dialog.showSaveDialog({ 
			"title": "Select the File Path to save", 
			// defaultPath: path.join(__dirname, '../assets/'), 
			"buttonLabel": "Save File", 
			// Restricting the user to only Text Files. 
			"filters": [ 
				{ 
					"name": "Text Files", 
					"extensions": ["log"] 
				}, ], 
			"properties": [] 
		}).then(file => { 
			if (!file.canceled) { 
				// Creating and Writing to the sample.txt file 
				fs.writeFile(file.filePath.toString(),  
					$("#log-contents").text(), function (err) { 
						if (err) throw err; 
					}); 
			} 
		}).catch(err => { 
			console.log(err); 
		}); 
	});

	ipcRenderer.on("log", (_, data, type) => {
		log(data.toString(), type);
	});

	// ---------------------------------------------------------------------
	// ------------------------ MODS LIST ----------------------------------
	// ---------------------------------------------------------------------
	let WaitingForModAction = false;
	let expandedModsSummary = {};
	ipcRenderer.on("set mods", (_, modInfos) => {
		WaitingForModAction = false;

		let ModIndex = 0;
		$("#modulesList").empty();
		modInfos.forEach(modInfo => {
			const escapedName = (ModIndex++).toString();
			const headerId = `modheader-${escapedName}`;

			const readmePathId = `readme-${escapedName}`;
			const donationId = `moddonate-${escapedName}`;
			const uninstallId = `moduninstall-${escapedName}`;
			const infoId = `modinfo-${escapedName}`;
			const enabledId = `modenabled-${escapedName}`;
			const updateId = `modupdate-${escapedName}`;

			const autoUpdateClass = `${!modInfo.disableAutoUpdate ? "mdi-progress-close" : "mdi-progress-download"}`;
			const enabledClass = `${!modInfo.disabled ? "mdi-flask-minus-outline" : "mdi-flask-outline"}`;
			const headerClasses = modInfo.disabled ? "mod-info disabled-border" : "mod-info";
			
			const summaryId = `modsummary-${escapedName}`;
			$("#modulesList").append(`
				<div  class="${headerClasses} noselect">
					<details id="${headerId}" ${expandedModsSummary[modInfo.name] ? "open" : ""}>
						<summary id="${summaryId}">
								${modInfo.drmKey ? "<span class=\"mdi mdi-currency-usd\"></span>" : ""} ${displayName(modInfo)} ${modInfo.version ? `(${modInfo.version})` : ""}
								<div class="spacer"></div>
								${modInfo.author ? `by ${modInfo.author}` : ""} </summary>
						<p>${modInfo.description ? modInfo.description : " "}</p>
						<div class="mod-info-controls">
							${modInfo.readmePath ? `<div data-microtip-position="bottom-left" aria-label="${mui.get("gui/tooltip/readme")}" role="tooltip" class="mod-action-button" id="${readmePathId}"><i class="mdi mdi-information-outline"></i></div>` : ""}
							${modInfo.donationUrl ? `<div data-microtip-position="bottom-left" aria-label="${mui.get("gui/tooltip/donate")}" role="tooltip" class="mod-action-button" id="${donationId}"><i class="mdi mdi-gift-outline"></i></div>` : ""}
							${modInfo.supportUrl ? `<div data-microtip-position="bottom-left" aria-label="${mui.get("gui/tooltip/supportLink")}" role="tooltip" class="mod-action-button" id="${infoId}"><i class="mdi mdi-link-variant"></i></div>` : ""}
							${(modInfo.supportUrl || modInfo.donationUrl || modInfo.readmePath) && !modInfo.isCoreModule ? `<div class="mod-empty-action-button"></div>` : ""}
							${(!modInfo.isCoreModule && modInfo.compatibility === "compatible") ? `<div data-microtip-position="bottom-left" aria-label="${mui.get("gui/tooltip/toggleModAutoupdate")}" role="tooltip" class="mod-action-button" id="${updateId}"><i class="mdi ${autoUpdateClass}"></i></div>` : ""}
							${(!modInfo.isCoreModule && modInfo.compatibility === "compatible") ? `<div data-microtip-position="bottom-left" aria-label="${mui.get("gui/tooltip/toggleMod")}" role="tooltip" class="mod-action-button" id="${enabledId}"><i class="mdi ${enabledClass}"></i></div>` : ""}
							${!modInfo.isCoreModule ? `<div class="mod-empty-action-button"></div>` : ""}
							${!modInfo.isCoreModule ? `<div data-microtip-position="bottom-left" aria-label="${mui.get("gui/tooltip/remove")}" role="tooltip" class="mod-action-button" id="${uninstallId}"><i class="mdi mdi-trash-can-outline"></i></div>` : ""}</div>
					</details>
				</div>
			`);

			$(`#${summaryId}`).click(() => {
				if(expandedModsSummary[modInfo.name]) delete expandedModsSummary[modInfo.name];
				else expandedModsSummary[modInfo.name] = true;
			});

			$(`#${readmePathId}`).on("click", (event) => {
				event.preventDefault();
				ipcRenderer.send("open in notepad", modInfo.readmePath);
				return false;
			});
			
			$(`#${donationId}`).on("click", (event) => {
				event.preventDefault();
				shell.openExternal(modInfo.donationUrl);
				return false;
			});

			$(`#${infoId}`).on("click", (event) => {
				event.preventDefault();
				shell.openExternal(modInfo.supportUrl);
				return false;
			});
			
			$(`#${enabledId}`).on("click", (event) => {
				event.preventDefault();
				if (!WaitingForModAction) {
					ipcRenderer.send("toggle mod load", modInfo);
					WaitingForModAction = true;
				}
				return false;
			});

			$(`#${updateId}`).on("click", (event) => {
				event.preventDefault();
				if (!WaitingForModAction) {
					ipcRenderer.send("toggle mod autoupdate", modInfo);
					WaitingForModAction = true;
				}
				return false;
			});

			$(`#${uninstallId}`).on("click", (event) => {
				event.preventDefault();
				if (ProxyStarting || ProxyRunning) {
					ShowModal(mui.get("gui/main/modal/error-cannot-uninstall-mod-while-running"));
				} else if (!WaitingForModAction) {
					ipcRenderer.send("uninstall mod", modInfo);
					WaitingForModAction = true;
				}
				return false;
			});
			
		});
	});

	// --------------------------------------------------------------------
	// ---------------------- MODS INSTALLATION TAB -----------------------
	// --------------------------------------------------------------------
	let WaitingForModInstall = false;
	let InstallableModInfos = [];
	let InstallableModFilter = {
		"keywords": [],
		"network": true,
		"client": true,
	};

	function requestInstallMod(modInfo) {
		ipcRenderer.send("install mod", modInfo);
		WaitingForModInstall = true;
	}

	function matchesInstallableModFilter(modInfo) {
		if (!InstallableModFilter.network && modInfo.keywords && modInfo.keywords.includes("network"))
			return false;
		if (!InstallableModFilter.client && modInfo.keywords && modInfo.keywords.includes("client"))
			return false;

		return InstallableModFilter.keywords.length === 0 || InstallableModFilter.keywords.some(keyword => (modInfo.author && modInfo.author.toLowerCase().includes(keyword)) || (modInfo.description && modInfo.description.toLowerCase().includes(keyword)) || displayName(modInfo).toLowerCase().includes(keyword) || (modInfo.keywords && modInfo.keywords.includes(keyword)));
	}

	function rebuildInstallableModsList() {
		let ModIndex = 0;
		$("#installableModulesList").empty();
		
		InstallableModInfos.filter(modInfo => matchesInstallableModFilter(modInfo)).forEach(modInfo => {
			const escapedName = (ModIndex++).toString();
			const headerId = `installablemodheader-${escapedName}`;
			const installId = `installablemodinstall-${escapedName}`;

			$("#installableModulesList").append(`
				<div id="${headerId}" class="mod-info noselect">
					<details open>
						<summary>
							${displayName(modInfo)} ${modInfo.version ? `(${modInfo.version})` : ""} 
							<div class="spacer"></div>
							${modInfo.author ? `by ${modInfo.author}` : ""}
						</summary>
						<p>${modInfo.description ? modInfo.description : " "}</p>
						<div class="mod-info-controls">
							<div data-microtip-position="bottom-left" aria-label="${mui.get("gui/tooltip/download")}" role="tooltip" class="mod-action-button" id="${installId}"><i class="mdi mdi-cloud-download"></i></div>
						</div>
					</details>
				</div>
			`);

			$(`#${installId}`).on("click", (event) => {
				event.preventDefault();
				if (ProxyStarting || ProxyRunning)
					ShowModal(mui.get("gui/main/modal/error-cannot-install-mod-while-running"));
				else if (!WaitingForModInstall)
					requestInstallMod(modInfo);
				return false;
			});
		});
	}

	$("#installableModulesFilterString").on("input", () => {
		InstallableModFilter.keywords = $("#installableModulesFilterString").val().split(",").map(x => x.trim().toLowerCase()).filter(x => x.length > 0);
		rebuildInstallableModsList();
	});

	$("#installableModulesFilterNetwork").click(() => {
		InstallableModFilter.network = $("#installableModulesFilterNetwork").is(":checked");
		rebuildInstallableModsList();
	});

	$("#installableModulesFilterClient").click(() => {
		InstallableModFilter.client = $("#installableModulesFilterClient").is(":checked");
		rebuildInstallableModsList();
	});

	ipcRenderer.on("set installable mods", (_, modInfos) => {
		$("#loading").hide();
		$("#installableModulesList").show();
		WaitingForModInstall = false;
		InstallableModInfos = modInfos;
		rebuildInstallableModsList();
	});

	// --------------------------------------------------------------------
	// ---------------------------- MODAL BOX -----------------------------
	// --------------------------------------------------------------------
	function ShowModal(text) {
		$("#modalbox-text").text(text);
		$("#modalbox").show();
	}

	function ShowModalHtml(text) {
		$("#modalbox-text").html(text);
		$("#modalbox").show();
	}

	$("#modalbox").click(() => {
		$("#modalbox").hide();
	});

	ipcRenderer.on("error", (_, error) => {
		ShowModal(error);
	});

	// --------------------------------------------------------------------
	// -------------------- TABS AND DATA UPDATE---------------------------
	// --------------------------------------------------------------------
	function handleTabs() {
		const buttons = document.querySelectorAll("input[name=\"tabs\"]");
		for (const button of buttons) button.addEventListener("click", onTabChange);
	}

	function onTabChange($e) {
		const tab = $e.target.dataset.tab;

		switch($e.target.dataset.tab) {
		case("2"): ipcRenderer.send("get mods"); break;
		case("3"): 
			ipcRenderer.send("get installable mods"); 
			$("#installableModulesList").hide();
			$("#loading").show();
			break;
		case("4"): ipcRenderer.send("get config"); break;
		}

		const tabs = document.querySelectorAll(".tab--active");
		for (const tab of tabs) tab.classList.remove("tab--active");
		const contentElement = document.querySelector(`.tab[data-tab="${tab}"]`);
		contentElement.classList.add("tab--active");
	}
	handleTabs();
	
	// --------------------------------------------------------------------
	// ------------------------------ RUN! --------------------------------
	// --------------------------------------------------------------------
	ipcRenderer.send("init");
});