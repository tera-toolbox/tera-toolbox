const Name = 'English';

function GetString(str, tokens) {
    switch (str) {
        // connectionManager
        case 'connectionmanager/error-ETIMEDOUT-1': return `[connection] ERROR: Unable to connect to game server at ${tokens.address}:${tokens.port} (timeout)! Common reasons for this are:`;
        case 'connectionmanager/error-ETIMEDOUT-2': return '[connection] - An unstable internet connection or a geo-IP ban';
        case 'connectionmanager/error-ETIMEDOUT-3': return '[connection] - Game server maintenance';
        case 'connectionmanager/error-ECONNRESET-EPIPE-1': return `[connection] ERROR: ${tokens.code} - Connection to game server was closed unexpectedly. Common reasons for this are:`;
        case 'connectionmanager/error-ECONNRESET-EPIPE-2': return '[connection] - A disconnect caused by an unstable internet connection';
        case 'connectionmanager/error-ECONNRESET-EPIPE-3': return '[connection] - An exploit/cheat or broken module that got you kicked';
        case 'connectionmanager/connected': return `[connection] routing ${tokens.remote} to ${tokens.remoteAddress}:${tokens.remotePort}`;
        case 'connectionmanager/disconnected': return `[connection] ${tokens.remote} disconnected`;

        // loader-cli
        case 'loader-cli/error-node-too-old-1': return 'ERROR: Your installed version of Node.JS is too old to run TERA Toolbox!';
        case 'loader-cli/error-node-too-old-2': return 'ERROR: Please redownload and reinstall TERA Toolbox, or install the latest version of Node.JS from https://nodejs.org/en/download/current/';
        case 'loader-cli/error-runtime-incompatible-default': return `ERROR: ${tokens.message}`;
        case 'loader-cli/error-config-corrupt-1': return 'ERROR: Whoops, looks like you\'ve fucked up your config.json!';
        case 'loader-cli/error-config-corrupt-2': return `ERROR: Try to fix it yourself or ask here: ${tokens.supportUrl}`;
        case 'loader-cli/error-migration-failed-1': return 'ERROR: Unable to migrate files from an old version of TERA Toolbox!';
        case 'loader-cli/error-migration-failed-2': return 'ERROR: Please reinstall a clean copy using the latest installer';
        case 'loader-cli/error-migration-failed-3': return `ERROR: or ask for help here: ${tokens.supportUrl}`;
        case 'loader-cli/error-cannot-start-proxy': return '[toolbox] Unable to start the network proxy, terminating...';
        case 'loader-cli/terminating': return 'terminating...';
        case 'loader-cli/warning-noupdate-1': return '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!';
        case 'loader-cli/warning-noupdate-2': return '!!!!!      YOU HAVE GLOBALLY DISABLED AUTOMATIC UPDATES     !!!!!';
        case 'loader-cli/warning-noupdate-3': return '!!!!! THERE WILL BE NO SUPPORT FOR ANY KIND OF PROBLEM THAT !!!!!';
        case 'loader-cli/warning-noupdate-4': return '!!!!!      YOU MIGHT ENCOUNTER AS A RESULT OF DOING SO      !!!!!';
        case 'loader-cli/warning-noupdate-5': return '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!';
        case 'loader-cli/warning-update-mod-not-supported': return `[update] WARNING: Module ${tokens.name} does not support auto-updating!`;
        case 'loader-cli/error-update-mod-failed': return `[update] ERROR: Module ${tokens.name} could not be updated and might be broken!`;
        case 'loader-cli/error-update-tera-data-failed-1': return '[update] ERROR: There were errors updating opcode maps and packet definitions.';
        case 'loader-cli/error-update-tera-data-failed-2': return '[update] ERROR: This might result in further errors!';
        case 'loader-cli/error-update-failed': return 'ERROR: Unable to auto-update! The full error message is:';

        // loader-gui
        case 'loader-gui/tray/quit': return 'Quit';
        case 'loader-gui/error-config-file-corrupt/title': return 'Invalid settings file!';
        case 'loader-gui/error-config-file-corrupt/message': return `The config.json file in your TERA Toolbox folder is malformed. Try to fix it yourself, delete it to generate a new one, or ask in ${tokens.supportUrl} for help!\n\nThe program will now be terminated.`;
        case 'loader-gui/error-migration-failed/title': return 'Migration error!';
        case 'loader-gui/error-migration-failed/message': return `Unable to migrate files from an old version of TERA Toolbox.\nPlease reinstall a clean copy using the latest installer or ask in ${tokens.supportUrl} for help!\n\nThe program will now be terminated.`;
        case 'loader-gui/error-cannot-start-proxy': return '[toolbox] Unable to start the network proxy!';
        case 'loader-gui/terminating': return 'terminating...';
        case 'loader-gui/warning-noselfupdate-1': return '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!';
        case 'loader-gui/warning-noselfupdate-2': return '!!!!!       YOU HAVE DISABLED AUTOMATIC SELF-UPDATING       !!!!!';
        case 'loader-gui/warning-noselfupdate-3': return '!!!!! THERE WILL BE NO SUPPORT FOR ANY KIND OF PROBLEM THAT !!!!!';
        case 'loader-gui/warning-noselfupdate-4': return '!!!!!      YOU MIGHT ENCOUNTER AS A RESULT OF DOING SO      !!!!!';
        case 'loader-gui/warning-noselfupdate-5': return '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!';
        case 'loader-gui/warning-noupdate-1': return '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!';
        case 'loader-gui/warning-noupdate-2': return '!!!!!      YOU HAVE GLOBALLY DISABLED AUTOMATIC UPDATES     !!!!!';
        case 'loader-gui/warning-noupdate-3': return '!!!!! THERE WILL BE NO SUPPORT FOR ANY KIND OF PROBLEM THAT !!!!!';
        case 'loader-gui/warning-noupdate-4': return '!!!!!      YOU MIGHT ENCOUNTER AS A RESULT OF DOING SO      !!!!!';
        case 'loader-gui/warning-noupdate-5': return '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!';
        case 'loader-gui/warning-update-mod-not-supported': return `[update] WARNING: Module ${tokens.name} does not support auto-updating!`;
        case 'loader-gui/error-update-mod-failed': return `[update] ERROR: Module ${tokens.name} could not be updated and might be broken!`;
        case 'loader-gui/error-update-tera-data-failed-1': return '[update] ERROR: There were errors updating opcode maps and packet definitions.';
        case 'loader-gui/error-update-tera-data-failed-2': return '[update] ERROR: This might result in further errors!';
        case 'loader-gui/error-update-failed': return 'ERROR: Unable to auto-update! The full error message is:';
        case 'loader-gui/proxy-starting': return '[toolbox] Starting the network proxy...';
        case 'loader-gui/proxy-stopping': return '[toolbox] Stopping the network proxy...';
        case 'loader-gui/proxy-stopped': return '[toolbox] Network proxy stopped!';
        case 'loader-gui/mod-installed': return `[toolbox] Installed "${modInfo.name}"`;
        case 'loader-gui/mod-uninstalled': return `[toolbox] Uninstalled "${modInfo.name}"`;
        case 'loader-gui/mod-load-toggled': return `[toolbox] ${tokens.enabled ? 'Enabled' : 'Disabled'} "${tokens.name}"`;
        case 'loader-gui/mod-updates-toggled': return `[toolbox] ${tokens.updatesEnabled ? 'Enabled' : 'Disabled'} automatic updates for "${tokens.name}"`;

        // proxy
        case 'proxy/ready': return '[toolbox] Ready, waiting for game client start!';
        case 'proxy/client-interface-error': return '[toolbox] ERROR: Unable to start client interface server.';
        case 'proxy/client-interface-error-EADDRINUSE': return '[toolbox] ERROR: Another instance of TERA Toolbox is already running. Please close it or restart your computer and try again!';
        case 'proxy/client-interface-error-EADDRNOTAVAIL': return '[toolbox] ERROR: Address not available. Restart your computer and try again!';
        case 'proxy/client-interface-connection-error': return `[toolbox] Unable to establish connection to client: ${tokens.error}`;
        case 'proxy/client-interface-connected': return `[toolbox] Client ${tokens.justStarted ? 'connected' : 'reconnected'} (${tokens.region} v${tokens.majorPatchVersion}.${tokens.minorPatchVersion})`;
        case 'proxy/client-interface-disconnected': return `[toolbox] Client disconnected`;
        case 'proxy/redirecting-server': return `[toolbox] Redirecting ${tokens.name} (${tokens.region.toUpperCase()}-${tokens.serverId}) from ${tokens.listen_ip}:${tokens.listen_port} to ${tokens.ip}:${tokens.port}`;
        case 'proxy/warning-unmapped-protocol-1': return `[toolbox] WARNING: Unmapped protocol version ${tokens.protocolVersion} (${tokens.region.toUpperCase()} v${tokens.majorPatchVersion}.${tokens.minorPatchVersion}).`;
        case 'proxy/warning-unmapped-protocol-2': return '[toolbox] WARNING: This can be caused by either of the following:';
        case 'proxy/warning-unmapped-protocol-3': return '[toolbox] WARNING: 1) You are trying to play using a newly released client version that is not yet supported.';
        case 'proxy/warning-unmapped-protocol-4': return '[toolbox] WARNING:    If there was a game maintenance within the past few hours, please report this!';
        case 'proxy/warning-unmapped-protocol-5': return '[toolbox] WARNING:    Otherwise, your client might have been updated for an upcoming patch too early.';
        case 'proxy/warning-unmapped-protocol-6': return '[toolbox] WARNING: 2) You are trying to play using an outdated client version.';
        case 'proxy/warning-unmapped-protocol-7': return '[toolbox] WARNING:    Try a client repair or reinstalling the game from scratch to fix this!';
        case 'proxy/warning-unmapped-protocol-8': return `[toolbox] WARNING: If you cannot fix this on your own, ask for help here: ${tokens.supportUrl}!`;
        case 'proxy/error-cannot-load-protocol': return `ERROR: Unable to load protocol version ${tokens.protocolVersion} (${tokens.region.toUpperCase()} v${tokens.majorPatchVersion}.${tokens.minorPatchVersion})!`;
        case 'proxy/protocol-loaded': return `[toolbox] Loaded protocol version ${tokens.protocolVersion} (${tokens.region.toUpperCase()} v${tokens.majorPatchVersion}.${tokens.minorPatchVersion}).`;

        // update
        case 'update/started': return '[update] Auto-update started!';
        case 'update/core-module-initialized': return `[update] Initialized core module "${tokens.coreModule}"`;
        case 'update/dependency-module-initialized': return `[update] Initialized dependency "${tokens.dependency}" for module "${tokens.name}"`;
        case 'update/warning-module-update-disabled': return `[update] WARNING: Auto-update disabled for module ${tokens.name}!`;
        case 'update/start-module-install': return `[update] Installing module ${tokens.name}`;
        case 'update/start-module-update': return `[update] Updating module ${tokens.name}`;
        case 'update/warning-module-no-update-servers': return `[update] WARNING: Module ${tokens.name} does not have any update servers specified!`;
        case 'update/module-download-manifest': return `[update] - Retrieving update manifest (Server ${tokens.serverIndex})`;
        case 'update/module-download-file': return `[update] - Download ${tokens.file}`;
        case 'update/module-config-changed': return '[update] - Module configuration changed, restarting update!';
        case 'update/module-update-failed-1': return `[update] ERROR: Unable to auto-update module ${tokens.name}:`;
        case 'update/module-update-failed-2-1': return `[update] Please go to ${tokens.supportUrl} and follow the given instructions or ask for help.`;
        case 'update/module-update-failed-2-2': return `[update] Alternatively, ask here: ${tokens.supportUrl}`;
        case 'update/module-update-failed-3': return `[update] Please contact the module author or ask here: ${tokens.supportUrl}`;
        case 'update/tera-data': return '[update] Updating tera-data';
        case 'update/tera-data-update-failed': return `[update] ERROR: Unable to update the following def/map files. Please ask here for help: ${tokens.supportUrl}`;
        case 'update/finished': return '[update] Auto-update complete!';

        // gui
        case 'gui/main/start-stop-proxy-running': return 'Stop!';
        case 'gui/main/start-stop-proxy-not-running': return 'Start!';
        case 'gui/main/start-stop-proxy-starting': return 'Starting...';
        case 'gui/main/start-stop-proxy-stopping': return 'Stopping...';

        case 'gui/main/status-proxy-running': return 'Running';
        case 'gui/main/status-proxy-not-running': return 'Not Running';
        case 'gui/main/status-update-available': return 'UPDATE AVAILABLE - PLEASE RESTART';

        case 'gui/main/modal/buttons/ok': return 'OK';
        case 'gui/main/modal/warn-mod-update-disabled': return 'Warning! You disabled automatic updates for all of your mods. This will break things at some point. We will not provide any assistance unless re-enabled!';
        case 'gui/main/modal/warn-self-update-disabled': return 'Warning! You disabled automatic updates for TERA Toolbox. This will break things at some point. We will not provide any assistance unless re-enabled!';
        case 'gui/main/modal/error-cannot-install-mod-while-running': return 'You cannot install mods while TERA Toolbox is running. Please stop it first!';
        case 'gui/main/modal/error-cannot-uninstall-mod-while-running': return 'You cannot uninstall mods while TERA Toolbox is running. Please stop it first!';

        case 'gui/main/static/tabs/log/title': return 'Log';
        case 'gui/main/static/tabs/log/loading': return 'Loading proxy log...';

        case 'gui/main/static/tabs/mods/title': return 'My Mods';
        case 'gui/main/static/tabs/mods/loading': return 'Loading installed mods...';

        case 'gui/main/static/tabs/newmods/title': return 'Get More Mods';
        case 'gui/main/static/tabs/newmods/loading': return 'Loading list of mods...';
        case 'gui/main/static/tabs/newmods/content/filter': return 'Filter: ';
        case 'gui/main/static/tabs/newmods/content/filter/network': return 'Network / Proxy Mods';
        case 'gui/main/static/tabs/newmods/content/filter/client': return 'Client / UI Mods';

        case 'gui/main/static/tabs/settings/title': return 'Settings';
        case 'gui/main/static/tabs/settings/loading': return 'Loading settings...';
        case 'gui/main/static/tabs/settings/content/uilanguage': return 'Language';
        case 'gui/main/static/tabs/settings/content/theme': return 'Theme';
        case 'gui/main/static/tabs/settings/content/autostart': return 'Autostart when opening TERA Toolbox';
        case 'gui/main/static/tabs/settings/content/updatelog': return 'Show detailed update log';
        case 'gui/main/static/tabs/settings/content/logtimes': return 'Show time in log';
        case 'gui/main/static/tabs/settings/content/noupdate': return 'Disable mod updates';
        case 'gui/main/static/tabs/settings/content/noselfupdate': return 'Disable self-updates';
        case 'gui/main/static/tabs/settings/content/devmode': return 'Enable Developer Mode';
        case 'gui/main/static/tabs/settings/content/noslstags': return 'Hide tags in server list';
        case 'gui/main/static/tabs/settings/content/minimizetotray': return 'Minimize to system tray';

        case 'gui/main/static/tabs/help/title': return 'Need Help?';

        case 'gui/main/static/tabs/modsfolder/title': return 'Show Mods Folder';

        case 'gui/main/static/tabs/credits/title': return 'Credits';
        case 'gui/main/static/tabs/credits/loading': return 'Loading credits...';
        case 'gui/main/static/tabs/credits/content': return 'Thanks to<br />SaltyMonkey: Installer<br />Mathicha &amp; Pentagon: Core GUI stuff<br />Foglio: Logo design<br />Meishu: Original Tera-Proxy Core<br />All Toolbox Translators<br />All Mod Developers';

        // tera-client-interface
        case 'tera-client-interface/index/communication-error': return '[toolbox] Error communicating with client:';

        case 'tera-client-interface/gpkmanager/symlink-warning-1': return '[toolbox] WARNING: It looks like either TERA Toolbox or the game are located on a drive / partition that does';
        case 'tera-client-interface/gpkmanager/symlink-warning-2': return '[toolbox] WARNING: not support symbolic links (for example because it is formatted using exFAT or FAT32)!';
        case 'tera-client-interface/gpkmanager/symlink-warning-3': return '[toolbox] WARNING: As a fallback, your client mods will be installed by creating file copies instead.';
        case 'tera-client-interface/gpkmanager/symlink-warning-4': return '[toolbox] WARNING: Note that this might slow down your client startup time and put strain on your disk!';
        case 'tera-client-interface/gpkmanager/uninstall-error-1': return '[toolbox] WARNING: Unable to remove the following client mod file:';
        case 'tera-client-interface/gpkmanager/uninstall-error-2': return `[toolbox] WARNING: ${tokens.fullPath}`;
        case 'tera-client-interface/gpkmanager/uninstall-error-3': return '[toolbox] WARNING: It will be deleted next time you start the game, instead. You can also delete it manually.';

        case 'tera-client-interface/module/prefix-log': return `[${tokens.name}]`;
        case 'tera-client-interface/module/prefix-warn': return `[${tokens.name}] WARNING:`;
        case 'tera-client-interface/module/prefix-error': return `[${tokens.name}] ERROR:`;
        case 'tera-client-interface/module/settings-load-error-corrupted-1': return 'You closed the program improperly the last time you were using it!';
        case 'tera-client-interface/module/settings-load-error-corrupted-2': return `This caused the settings for module "${tokens.name}" to become corrupted!`;
        case 'tera-client-interface/module/settings-load-error-corrupted-3': return 'The module will load default settings now, so adjust them according to your needs.';
        case 'tera-client-interface/module/settings-load-error-corrupted-4': return 'Please remember to close the program properly: first close the game, then close TERA Toolbox using the X button!';
        case 'tera-client-interface/module/settings-load-error-corrupted-5': return 'Do not shut down your computer while TERA Toolbox is running!';
        case 'tera-client-interface/module/settings-load-error-invalid-format-1': return `Invalid settings format for module "${tokens.name}"!`;
        case 'tera-client-interface/module/settings-load-error-invalid-format-2': return 'This means that you broke it when manually editing it.';
        case 'tera-client-interface/module/settings-load-error-invalid-format-3': return 'Please fix the settings file manually or delete it so that default settings can be restored.';
        case 'tera-client-interface/module/settings-load-error-invalid-format-4': return '------------------------------------------';
        case 'tera-client-interface/module/settings-load-error-invalid-format-5': return 'Advanced error details';
        case 'tera-client-interface/module/settings-load-error-invalid-format-6': return 'The full path to the file is:';
        case 'tera-client-interface/module/settings-load-error-invalid-format-7': return `  ${tokens.settingsFile}`;
        case 'tera-client-interface/module/settings-load-error-invalid-format-8': return 'The full error message is:';
        case 'tera-client-interface/module/settings-load-error-invalid-format-9': return `  ${tokens.e}`;
        case 'tera-client-interface/module/settings-load-error-invalid-format-10': return '------------------------------------------';
        case 'tera-client-interface/module/settings-save-error-write': return 'Unable to store settings! The full error message is:';
        case 'tera-client-interface/module/settings-save-error-stringify': return 'Unable to serialize settings! The full error message is:';
        case 'tera-client-interface/module/settings-migrate-error-load-migrator': return 'Unable to load settings migrator! The full error message is:';
        case 'tera-client-interface/module/settings-migrate-error-run-migrator': return 'An error occured while migrating the settings! The full error message is:';

        case 'tera-client-interface/modulemanager/load-module-info-error': return `[mods] ERROR: Unable to load module information for "${tokens.name}"! The full error message is:`;
        case 'tera-client-interface/modulemanager/duplicate-mod-error': return `[mods] ERROR: Duplicate module "${tokens.name}" detected!`;
        case 'tera-client-interface/modulemanager/missing-mod-dependency-error': return `[mods] ERROR: Module ${tokens.name} requires "${tokens.dependency}" to be installed, but it is not!`;
        case 'tera-client-interface/modulemanager/mod-conflict-error': return `[mods] ERROR: Module ${tokens.name} cannot be loaded while "${tokens.conflict}" is installed!`;
        case 'tera-client-interface/modulemanager/cannot-load-mod-not-installed': return `[mods] ERROR: Trying to load module that is not installed: ${tokens.name}`;
        case 'tera-client-interface/modulemanager/cannot-unload-mod-not-installed': return `[mods] ERROR: Trying to unload module that is not installed: ${tokens.name}`;
        case 'tera-client-interface/modulemanager/cannot-unload-mod-not-loaded': return `[mods] ERROR: Trying to unload module that is not loaded: ${tokens.name}`;
        case 'tera-client-interface/modulemanager/mod-loaded': return `[mods] Loaded module ${tokens.name}`;
        case 'tera-client-interface/modulemanager/mod-unloaded': return `[mods] Unloaded module ${tokens.name}`;
        case 'tera-client-interface/modulemanager/mod-load-error-1': return `[mods] ERROR: Module ${tokens.name} could not be loaded!`;
        case 'tera-client-interface/modulemanager/mod-load-error-2': return `[mods] ERROR: Please contact the module's author: ${tokens.supportUrl}`;
        case 'tera-client-interface/modulemanager/mod-unload-error-1': return `[mods] ERROR: Module ${tokens.name} could not be unloaded!`;
        case 'tera-client-interface/modulemanager/mod-unload-error-2': return `[mods] ERROR: Please contact the module's author: ${tokens.supportUrl}`;

        case 'tera-client-interface/process-listener/scan-error': return '[toolbox] ERROR: Unable to scan for game clients! The full error message is:';

        case 'tera-client-interface/process-listener-dll-injector/inject-error': return `[toolbox] ERROR: Unable to connect to game client (PID ${tokens.pid})!`;
        case 'tera-client-interface/process-listener-dll-injector/inject-error-ENOENT-1': return '[toolbox] injector.exe does not exist. It has likely been deleted by your anti-virus.';
        case 'tera-client-interface/process-listener-dll-injector/inject-error-ENOENT-2': return '[toolbox] Disable/uninstall your anti-virus or whitelist TERA Toolbox and injector.exe!';
        case 'tera-client-interface/process-listener-dll-injector/inject-error-EPERM-1': return '[toolbox] Permission to launch injector.exe denied. It has likely been blocked by your anti-virus.';
        case 'tera-client-interface/process-listener-dll-injector/inject-error-EPERM-2': return '[toolbox] Disable/uninstall your anti-virus or whitelist TERA Toolbox and injector.exe!';
        case 'tera-client-interface/process-listener-dll-injector/inject-error-default-error-1': return '[toolbox] Connection to game client unsuccessful.';
        case 'tera-client-interface/process-listener-dll-injector/inject-error-default-error-2': return '[toolbox] > Make sure that TERA Toolbox is running with Administrator privileges!';
        case 'tera-client-interface/process-listener-dll-injector/inject-error-default-error-3': return '[toolbox] > Disable/uninstall your anti-virus or whitelist TERA Toolbox and injector.exe!';
        case 'tera-client-interface/process-listener-dll-injector/inject-error-default-error-4': return '[toolbox] > Reboot your computer or kill TERA.exe processes if there are any in task manager!';
        case 'tera-client-interface/process-listener-dll-injector/inject-error-default-unknown-1': return '[toolbox] This is likely caused by your anti-virus interfering. Disable/uninstall it or whitelist TERA Toolbox.';
        case 'tera-client-interface/process-listener-dll-injector/inject-error-default-unknown-2': return '[toolbox] Full error message:';

        // tera-network-proxy
        case 'tera-network-proxy/connection/dispatch/module/prefix-log': return `[${tokens.name}]`;
        case 'tera-network-proxy/connection/dispatch/module/prefix-warn': return `[${tokens.name}] WARNING:`;
        case 'tera-network-proxy/connection/dispatch/module/prefix-error': return `[${tokens.name}] ERROR:`;
        case 'tera-network-proxy/connection/dispatch/module/settings-load-error-corrupted-1': return 'You closed the program improperly the last time you were using it!';
        case 'tera-network-proxy/connection/dispatch/module/settings-load-error-corrupted-2': return `This caused the settings for module "${tokens.name}" to become corrupted!`;
        case 'tera-network-proxy/connection/dispatch/module/settings-load-error-corrupted-3': return 'The module will load default settings now, so adjust them according to your needs.';
        case 'tera-network-proxy/connection/dispatch/module/settings-load-error-corrupted-4': return 'Please remember to close the program properly: first close the game, then close TERA Toolbox using the X button!';
        case 'tera-network-proxy/connection/dispatch/module/settings-load-error-corrupted-5': return 'Do not shut down your computer while TERA Toolbox is running!';
        case 'tera-network-proxy/connection/dispatch/module/settings-load-error-invalid-format-1': return `Invalid settings format for module "${tokens.name}"!`;
        case 'tera-network-proxy/connection/dispatch/module/settings-load-error-invalid-format-2': return 'This means that you broke it when manually editing it.';
        case 'tera-network-proxy/connection/dispatch/module/settings-load-error-invalid-format-3': return 'Please fix the settings file manually or delete it so that default settings can be restored.';
        case 'tera-network-proxy/connection/dispatch/module/settings-load-error-invalid-format-4': return '------------------------------------------';
        case 'tera-network-proxy/connection/dispatch/module/settings-load-error-invalid-format-5': return 'Advanced error details';
        case 'tera-network-proxy/connection/dispatch/module/settings-load-error-invalid-format-6': return 'The full path to the file is:';
        case 'tera-network-proxy/connection/dispatch/module/settings-load-error-invalid-format-7': return `  ${tokens.settingsFile}`;
        case 'tera-network-proxy/connection/dispatch/module/settings-load-error-invalid-format-8': return 'The full error message is:';
        case 'tera-network-proxy/connection/dispatch/module/settings-load-error-invalid-format-9': return `  ${tokens.e}`;
        case 'tera-network-proxy/connection/dispatch/module/settings-load-error-invalid-format-10': return '------------------------------------------';
        case 'tera-network-proxy/connection/dispatch/module/settings-save-error-write': return 'Unable to store settings! The full error message is:';
        case 'tera-network-proxy/connection/dispatch/module/settings-save-error-stringify': return 'Unable to serialize settings! The full error message is:';
        case 'tera-network-proxy/connection/dispatch/module/settings-migrate-error-load-migrator': return 'Unable to load settings migrator! The full error message is:';
        case 'tera-network-proxy/connection/dispatch/module/settings-migrate-error-run-migrator': return 'An error occured while migrating the settings! The full error message is:';
        case 'tera-network-proxy/connection/dispatch/module/tera-game-state-not-loaded': return 'This mod might malfunction, because "tera-game-state" could not be loaded.';

        case 'tera-network-proxy/connection/dispatch/modulemanager/load-module-info-error': return `[mods] ERROR: Unable to load module information for "${tokens.name}"! The full error message is:`;
        case 'tera-network-proxy/connection/dispatch/modulemanager/duplicate-mod-error': return `[mods] ERROR: Duplicate module "${tokens.name}" detected!`;
        case 'tera-network-proxy/connection/dispatch/modulemanager/missing-mod-dependency-error': return `[mods] ERROR: Module ${tokens.name} requires "${tokens.dependency}" to be installed, but it is not!`;
        case 'tera-network-proxy/connection/dispatch/modulemanager/mod-conflict-error': return `[mods] ERROR: Module ${tokens.name} cannot be loaded while "${tokens.conflict}" is installed!`;
        case 'tera-network-proxy/connection/dispatch/modulemanager/cannot-load-mod-not-installed': return `[mods] ERROR: Trying to load module that is not installed: ${tokens.name}`;
        case 'tera-network-proxy/connection/dispatch/modulemanager/cannot-unload-mod-not-installed': return `[mods] ERROR: Trying to unload module that is not installed: ${tokens.name}`;
        case 'tera-network-proxy/connection/dispatch/modulemanager/cannot-unload-mod-not-loaded': return `[mods] ERROR: Trying to unload module that is not loaded: ${tokens.name}`;
        case 'tera-network-proxy/connection/dispatch/modulemanager/mod-loaded': return `[mods] Loaded module ${tokens.name}`;
        case 'tera-network-proxy/connection/dispatch/modulemanager/mod-unloaded': return `[mods] Unloaded module ${tokens.name}`;
        case 'tera-network-proxy/connection/dispatch/modulemanager/mod-load-error-1': return `[mods] ERROR: Module ${tokens.name} could not be loaded!`;
        case 'tera-network-proxy/connection/dispatch/modulemanager/mod-load-error-2': return `[mods] ERROR: Please contact the module's author: ${tokens.supportUrl}`;
        case 'tera-network-proxy/connection/dispatch/modulemanager/mod-unload-error-1': return `[mods] ERROR: Module ${tokens.name} could not be unloaded!`;
        case 'tera-network-proxy/connection/dispatch/modulemanager/mod-unload-error-2': return `[mods] ERROR: Please contact the module's author: ${tokens.supportUrl}`;
        case 'tera-network-proxy/connection/dispatch/modulemanager/unsupported-def-error-1': return `[mods] ERROR: Module "${tokens.name}" uses the following outdated/unsupported packets:`;
        case 'tera-network-proxy/connection/dispatch/modulemanager/unsupported-def-error-2': return `[mods] ERROR: - ${tokens.name}.${tokens.version}`;
        case 'tera-network-proxy/connection/dispatch/modulemanager/unsupported-def-error-3': return `[mods] ERROR: Please contact the module's author: ${tokens.supportUrl}`;
        case 'tera-network-proxy/connection/dispatch/modulemanager/cannot-reload-mod-not-installed': return `[mods] ERROR: Trying to reload module that is not installed: ${tokens.name}`;
        case 'tera-network-proxy/connection/dispatch/modulemanager/cannot-reload-mod-not-supported': return `[mods] ERROR: Trying to reload module that does not support hot-reload: ${tokens.name}`;
        case 'tera-network-proxy/connection/dispatch/modulemanager/cannot-reload-mod-not-loaded': return `[mods] ERROR: Trying to reload module that is not loaded: ${tokens.name}`;
        case 'tera-network-proxy/connection/dispatch/modulemanager/cannot-reload-mod-unload-failed': return `[mods] ERROR: Reload failed: ${tokens.name}`;
        case 'tera-network-proxy/connection/dispatch/modulemanager/cannot-reload-mod-load-failed': return `[mods] ERROR: Reload failed: ${tokens.name}`;
        case 'tera-network-proxy/connection/dispatch/modulemanager/mod-reloaded': return `[mods] Reloaded module ${tokens.name}`;

        // default
        default: throw new Error(`Invalid string "${str}"!`);
    }
};

module.exports = { Name, GetString };
