const path = require("path");
const exec = require('child_process').exec;
const { app, BrowserWindow, powerMonitor, Tray, Menu, ipcMain, shell } = require("electron");
const DataFolder = path.join(__dirname, "..", "data");
const ModuleFolder = path.join(__dirname, "..", "mods");

// MUI
const mui = require("tera-toolbox-mui").DefaultInstance;

function InitializeMUI(language) {
	const { InitializeDefaultInstance } = require("tera-toolbox-mui");
	InitializeDefaultInstance(language);
}

// Configuration
function LoadConfiguration() {
	try {
		return require("./config").loadConfig();
	} catch (_) {
		const { dialog } = require("electron");

		dialog.showMessageBoxSync({
			"type": "error",
			"title": mui.get("loader-gui/error-config-file-corrupt/title"),
			"message": mui.get("loader-gui/error-config-file-corrupt/message", { "supportUrl": global.TeraProxy.SupportUrl })
		});

		app.exit();
	}
}

function SaveConfiguration(newConfig) {
	global.TeraProxy.DevMode = !!newConfig.devmode;
	global.TeraProxy.GUITheme = newConfig.gui.theme;

	InitializeMUI(newConfig.uilanguage);

	require("./config").saveConfig(newConfig);
}

// Migration
function Migration() {
	try {
		const { ToolboxMigration } = require("./migration");
		ToolboxMigration();
	} catch (e) {
		const { dialog } = require("electron");

		dialog.showMessageBoxSync({
			"type": "error",
			"title": mui.get("loader-gui/error-migration-failed/title"),
			"message": mui.get("loader-gui/error-migration-failed/message", { "supportUrl": global.TeraProxy.SupportUrl })
		});

		app.exit();
	}
}

// Installed mod management
const AvailableModuleListUrl = "https://raw.githubusercontent.com/tera-toolbox/tera-mods/master/modulelist.json";
const { listModuleInfos, installModule, uninstallModule, toggleAutoUpdate, toggleLoad } = require("tera-mod-management");

let CachedAvailableModuleList = null;
async function getInstallableMods(forceRefresh = false) {
	// (Re)download list of all available modules if required
	if (!CachedAvailableModuleList || forceRefresh) {
		const fetch = require("node-fetch");
		try {
			CachedAvailableModuleList = await (await fetch(AvailableModuleListUrl)).json();
		} catch (e) {
			showError(e.toString());
			return [];
		}
	}

	// Filter out already installed mods
	const installedModInfos = listModuleInfos(ModuleFolder);
	return CachedAvailableModuleList.filter(modInfo => !installedModInfos.some(installedModInfo => installedModInfo.name === modInfo.name.toLowerCase()));
}

// Proxy Main
let proxy = null;
let proxyRunning = false;
function _StartProxy(ModuleFolder, ProxyConfig) {
	if (proxy || proxyRunning)
		return false;

	const TeraProxy = require("./proxy");
	proxy = new TeraProxy(ModuleFolder, DataFolder, ProxyConfig);
	try {
		// Switch to highest process priority so we don't starve because of game client using all CPU
		const { setHighestProcessPriority } = require("./utils");
		setHighestProcessPriority();

		// Start proxy
		proxy.run();
		proxyRunning = true;
		return true;
	} catch (_) {
		console.error(mui.get("loader-gui/error-cannot-start-proxy"));
		proxy = null;
		proxyRunning = false;
		return false;
	}
}

async function StartProxy(ModuleFolder, ProxyConfig) {
	if (proxy || proxyRunning)
		return false;

	if (ProxyConfig.noupdate) {
		console.warn(mui.get("loader-gui/warning-noupdate-1"));
		console.warn(mui.get("loader-gui/warning-noupdate-2"));
		console.warn(mui.get("loader-gui/warning-noupdate-3"));
		console.warn(mui.get("loader-gui/warning-noupdate-4"));
		console.warn(mui.get("loader-gui/warning-noupdate-5"));
		return _StartProxy(ModuleFolder, ProxyConfig);
	} else {
		const autoUpdate = require("./update");

		try {
			const updateResult = await autoUpdate(ModuleFolder, ProxyConfig.updatelog, true);
			updateResult.legacy.forEach(mod => console.warn(mui.get("loader-gui/warning-update-mod-not-supported", { "name": mod.name })));
			updateResult.failed.forEach(mod => console.error(mui.get("loader-gui/error-update-mod-failed", { "name": mod.name })));

			return _StartProxy(ModuleFolder, ProxyConfig);
		} catch (e) {
			console.error(mui.get("loader-gui/error-update-failed"));
			console.error(e);
			return false;
		}
	}
}

async function StopProxy() {
	if (!proxy || !proxyRunning)
		return false;

	// Stop proxy
	proxy.destructor();
	proxy = null;
	proxyRunning = false;

	// Switch back to normal process priority
	const { setNormalProcessPriority } = require("./utils");
	setNormalProcessPriority();

	return true;
}

// Periodic update check
let UpdateCheckInterval = null;
let UpdateChecker = null;
function startUpdateCheck(branch, onUpdateAvailable, interval = 30 * 60 * 1000) {
	if (UpdateCheckInterval || UpdateChecker)
		return;

	const Updater = require("./update-self");
	UpdateChecker = new Updater(branch);

	UpdateCheckInterval = setInterval(async () => {
		try {
			const CheckResult = await UpdateChecker.check();
			if (CheckResult && CheckResult.operations && CheckResult.operations.length > 0)
				onUpdateAvailable();
		} catch (_) {
			// Ignore
		}
	}, interval);
}

function stopUpdateCheck() {
	clearInterval(UpdateCheckInterval);
	UpdateCheckInterval = null;
	UpdateChecker = null;
}

// Clean exit
const isWindows = process.platform === "win32";

function cleanExit() {
	console.log(mui.get("loader-gui/terminating"));

	StopProxy().then(() => {
		if (isWindows)
			process.stdin.pause();
	});
}

if (isWindows) {
	require("readline").createInterface({
		"input": process.stdin,
		"output": process.stdout
	}).on("SIGINT", () => process.emit("SIGINT"));
}

process.on("SIGHUP", cleanExit);
process.on("SIGINT", cleanExit);
process.on("SIGTERM", cleanExit);

// IPC
ipcMain.on("init", (event, _) => {
	event.sender.send("set config", config);
	event.sender.send("proxy running", false);
	event.sender.send("is admin", global.TeraProxy.IsAdmin);

	if (config.noselfupdate) {
		console.warn(mui.get("loader-gui/warning-noselfupdate-1"));
		console.warn(mui.get("loader-gui/warning-noselfupdate-2"));
		console.warn(mui.get("loader-gui/warning-noselfupdate-3"));
		console.warn(mui.get("loader-gui/warning-noselfupdate-4"));
		console.warn(mui.get("loader-gui/warning-noselfupdate-5"));
	}

	if (config.gui.autostart) {
		event.sender.send("proxy starting");
		console.log(mui.get("loader-gui/proxy-starting"));
		StartProxy(ModuleFolder, config).then((result) => {
			event.sender.send("proxy running", result);
		});
	}
});

ipcMain.on("start proxy", (event, _) => {
	if (proxy || proxyRunning)
		return;

	event.sender.send("proxy starting");
	console.log(mui.get("loader-gui/proxy-starting"));
	StartProxy(ModuleFolder, config).then((result) => {
		event.sender.send("proxy running", result);
	});
});

ipcMain.on("stop proxy", (event, _) => {
	if (!proxy || !proxyRunning)
		return;

	console.log(mui.get("loader-gui/proxy-stopping"));
	StopProxy().then(() => {
		event.sender.send("proxy running", false);
		console.log(mui.get("loader-gui/proxy-stopped"));
	});
});

ipcMain.on("get config", (event, _) => {
	event.sender.send("set config", config);
});

ipcMain.on("set config", (_, newConfig) => {
	config = newConfig;
	SaveConfiguration(config);
});

ipcMain.on("get mods", (event, _) => {
	event.sender.send("set mods", listModuleInfos(ModuleFolder));
});

ipcMain.on("get installable mods", (event, _) => {
	getInstallableMods(true).then(mods => event.sender.send("set installable mods", mods));
});

ipcMain.on("install mod", (event, modInfo) => {
	installModule(ModuleFolder, modInfo);
	console.log(mui.get("loader-gui/mod-installed", { "name": modInfo.name }));
	getInstallableMods().then(mods => event.sender.send("set installable mods", mods));
});

ipcMain.on("toggle mod load", (event, modInfo) => {
	toggleLoad(modInfo);
	console.log(mui.get("loader-gui/mod-load-toggled", { "enabled": modInfo.disabled, "name": modInfo.rawName }));
	event.sender.send("set mods", listModuleInfos(ModuleFolder));
});

ipcMain.on("toggle mod autoupdate", (event, modInfo) => {
	toggleAutoUpdate(modInfo);
	console.log(mui.get("loader-gui/mod-updates-toggled", { "updatesEnabled": modInfo.disableAutoUpdate, "name": modInfo.rawName }));
	event.sender.send("set mods", listModuleInfos(ModuleFolder));
});

ipcMain.on("uninstall mod", (event, modInfo) => {
	uninstallModule(modInfo);
	console.log(mui.get("loader-gui/mod-uninstalled", { "name": modInfo.rawName }));
	event.sender.send("set mods", listModuleInfos(ModuleFolder));
});

ipcMain.on("show mods folder", () => {
	shell.openPath(ModuleFolder);
});

ipcMain.on("open in notepad", (event, str) => {
	exec(`notepad "${str}"`)
});

// GUI
class TeraProxyGUI {
	constructor() {
		this.window = null;
		this.tray = null;
	}

	show() {
		if (this.window !== null) {
			this.window.show();
			if (this.window.isMinimized())
				this.window.restore();
			this.window.focus();
			return;
		}

		// Migration
		Migration();

		// Load configuration
		config = LoadConfiguration();
		InitializeMUI(config.uilanguage);

		global.TeraProxy.GUIMode = true;
		global.TeraProxy.DevMode = !!config.devmode;

		if (!config.gui) {
			config.gui = {
				enabled: true,
				theme: "black",
				autostart: false,
				logtimes: true,
				width: 880,
				height: 500,
				maximized: false
			};

			SaveConfiguration(config);
		} else {
			if (config.gui.logtimes === undefined) {
				config.gui.logtimes = true;
				SaveConfiguration(config);
			}

			global.TeraProxy.GUITheme = config.gui.theme || "black";
		}

		// Initialize main window
		const guiRoot = path.join(__dirname, "gui");
		const guiIcon = path.join(guiRoot, "/assets/icon.ico")
		this.window = new BrowserWindow({
			title: "TERA Toolbox",
			width: config?.gui?.width || 743,
			height: config?.gui?.height || 514,
			minWidth: 743,
			minHeight: 514,
			icon: guiIcon,
			frame: false,
			backgroundColor: "#292F33",
			resizable: true,
			centered: true,
			show: false,
			webPreferences: {
				nodeIntegration: true,
				enableRemoteModule: true,
				devTools: false,
				spellcheck: false
			}
		});
		this.window.loadFile(path.join(guiRoot, "main.html"));
		//this.window.webContents.openDevTools();

		this.window.once("ready-to-show", () => {
			this.window.show();
			if (config?.gui?.maximized) this.window.maximize();
		});

		this.window.on("close", () => {
			config.gui.maximized = this.window.isMaximized();
			if (!config.gui.maximized)
			{
				const size = this.window.getSize();
				config.gui.width = size[0];
				config.gui.height = size[1];
			}

			SaveConfiguration(config);
		});
		
		//this.window.on('minimize', () => { this.window.hide(); });
		this.window.on("closed", () => { StopProxy(); this.window = null; });
		
		// Initialize tray icon
		this.tray = new Tray(guiIcon);
		this.tray.setToolTip("TERA Toolbox");
		this.tray.setContextMenu(Menu.buildFromTemplate([
			{
				"label": mui.get("loader-gui/tray/quit"),
				"click": () => { app.exit(); }
			}
		]));

		this.tray.on("click", () => {
			if (this.window)
				this.window.isVisible() ? this.window.hide() : this.window.show();
		});

		// Redirect console to built-in one
		const nodeConsole = require("console");
		console = new nodeConsole.Console(process.stdout, process.stderr);

		const old_stdout = process.stdout.write;
		process.stdout.write = function (msg, ...args) {
			old_stdout(msg, ...args);
			log(msg, "log");
		};
		const old_stderr = process.stderr.write;
		process.stderr.write = function (msg, ...args) {
			old_stderr(msg, ...args);
			if(msg.startsWith("warn:"))
				log(msg.replace("warn:", ""), "warn");
			else 
				log(msg, "error");
		};

		// Start periodic update check
		if (!config.noselfupdate) {
			startUpdateCheck((config.branch || "master").toLowerCase(), () => {
				if (this.window)
					this.window.webContents.send("update available");
			});
		}

		powerMonitor.on('suspend', () => {
			if (this.window) {
				if (!proxy || !proxyRunning)
					return;

				console.log(mui.get("loader-gui/proxy-stopping"));
				
				StopProxy().then(() => {
					this.window.webContents.send("proxy running", false);
					console.log(mui.get("loader-gui/proxy-stopped"));
				});

			}
		});
	}

	hide() {
		if (this.window !== null)
			this.window.hide();
	}

	close() {
		if (this.window !== null) {
			stopUpdateCheck();
			StopProxy();

			this.window.close();
			this.window = null;
		}
	}

	showError(error) {
		if (this.window)
			this.window.webContents.send("error", error);
	}

	log(msg, type = "log") {
		if (this.window)
			this.window.webContents.send("log", msg, type);
	}
}

// Main
let gui;
let config;

function showError(error) {
	console.error(error);
	if (gui)
		gui.showError(error);
}

function log(msg, type = "log") {
	if (msg.length === 0)
		return;

	if (gui)
		gui.log(msg, type);
}

process.on("warning", (warning) => {
	console.warn(warning.name);
	console.warn(warning.message);
	console.warn(warning.stack);
});

module.exports = function StartGUI() {
	return new Promise((resolve, reject) => {
		const { initGlobalSettings } = require("./utils");
		initGlobalSettings(false).then(() => {
			// Boot GUI
			gui = new TeraProxyGUI;

			if (app.isReady()) {
				gui.show();
				resolve();
			} else {
				app.on("ready", () => {
					gui.show();
					resolve();
				});
			}

			app.on("second-instance", () => {
				if (gui)
					gui.show();
			});

			app.on("window-all-closed", () => {
				if (process.platform !== "darwin")
					app.quit();
			});

			app.on("activate", () => {
				gui.show();
			});
		});
	});
};
