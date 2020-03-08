const { remote, ipcRenderer, shell } = require('electron');
const { TeraToolboxMUI, LanguageNames } = require('tera-toolbox-mui');
const Themes = ['black', 'white', 'pink'];

let mui = null;

function displayName(modInfo) {
    if (modInfo.options) {
        if (modInfo.options.guiName)
            return modInfo.options.guiName;
        if (modInfo.options.niceName)
            return modInfo.options.niceName;
    }

    return modInfo.rawName || modInfo.name;
}

jQuery(($) => {
    // --------------------------------------------------------------------
    // ----------------------------- MAIN ---------------------------------
    // --------------------------------------------------------------------
    $('#minimize-btn').click(() => {
        if (Settings.gui.minimizetotray)
            remote.getCurrentWindow().hide();
        else
            remote.getCurrentWindow().minimize();
    });

    $('#close-btn').click(() => {
        remote.getCurrentWindow().close();
    });

    // Disable mouse wheel clicks
    $(document).on('auxclick', 'a', (e) => {
        if (e.which !== 2)
            return true;

        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
    });

    // MUI
    function setLanguage(language) {
        if (mui && language && mui.language === language)
            return;

        mui = new TeraToolboxMUI(language);
        $('*').each(function () {
            const str = $(this).attr('mui');
            if (str) {
                $(this).text(mui.get(str));
            } else {
                const str_html = $(this).attr('mui-html');
                if (str_html)
                    $(this).html(mui.get(str_html));
            }
        });
    }

    // Admin indicator
    let IsAdmin = false;
    ipcRenderer.on('is admin', (_, isAdmin) => {
        IsAdmin = isAdmin;
        $('#title').text(mui.get(IsAdmin ? 'gui/main/title/admin' : 'gui/main/title/noadmin'));
    });

    // Update available indicator
    let UpdateAvailable = false;
    ipcRenderer.on('update available', _ => {
        UpdateAvailable = true;
        $('#title-status').text(mui.get('gui/main/status-update-available'));
    });

    // Proxy control
    let ProxyRunning = false;
    let ProxyStarting = false;

    function setProxyStarting() {
        ProxyStarting = true;
        $('#startproxy').text(mui.get('gui/main/start-stop-proxy-starting'));
    }

    function setProxyRunning(running) {
        if (!ProxyRunning && !running && ProxyStarting)
            return;

        ProxyRunning = running;
        ProxyStarting = false;

        $('#startproxy').text(mui.get(ProxyRunning ? 'gui/main/start-stop-proxy-running' : 'gui/main/start-stop-proxy-not-running'));
        if (!UpdateAvailable)
            $('#title-status').text(mui.get(ProxyRunning ? 'gui/main/status-proxy-running' : 'gui/main/status-proxy-not-running'));
    }

    function startProxy() {
        if (ProxyStarting || ProxyRunning)
            return;

        setProxyStarting();
        ipcRenderer.send('start proxy');
    }

    function stopProxy() {
        if (!ProxyRunning)
            return;

        $('#startproxy').text(mui.get('gui/main/start-stop-proxy-stopping'));
        ipcRenderer.send('stop proxy');
    }

    $('#startproxy').click(() => {
        if (ProxyRunning)
            stopProxy();
        else
            startProxy();
    });

    ipcRenderer.on('proxy starting', _ => setProxyStarting());
    ipcRenderer.on('proxy running', (_, running) => setProxyRunning(running));

    // --------------------------------------------------------------------
    // ----------------------------- TABS ---------------------------------
    // --------------------------------------------------------------------
    let Tabs = {};
    let CurrentTab = null;

    function addTab(tab, implementation) {
        Tabs[tab] = implementation;
    }

    function isCurrentTab(tab) {
        return CurrentTab === tab;
    }

    function emitTabEvent(tab, event, ...args) {
        if (!tab || !Tabs[tab])
            return;

        if (typeof Tabs[tab][event] === 'function')
            Tabs[tab][event](...args);
    }

    function tabReady(tab) {
        if (!isCurrentTab(tab))
            return;

        $("#" + CurrentTab + "_loading").removeClass('current');
        $("#" + CurrentTab).addClass('current');
    }

    $('ul.tabs li').click(function changeTab() {
        if ($(this).attr('tabclickonly') === 'true') {
            emitTabEvent($(this).attr('tabname'), 'click');
        } else {
            emitTabEvent(CurrentTab, 'hide');
            $('ul.tabs li').removeClass('current');
            $('.tab-content').removeClass('current');

            CurrentTab = $(this).attr('tabname');
            $(this).addClass('current');
            $("#" + CurrentTab + "_loading").addClass('current');
            emitTabEvent(CurrentTab, 'show');
        }
    });

    // --------------------------------------------------------------------
    // --------------------------- LOG TAB --------------------------------
    // --------------------------------------------------------------------
    const LogTabName = 'log';

    function log(msg, type) {
        let timeStr = '';
        if (Settings.gui.logtimes) {
            const now = new Date();
            timeStr = `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}] `;
        }

        const contents = $('#log-contents');
        contents.append($('<div/>', { class: type || 'log' }).text(`${timeStr}${msg}`));
        contents.scrollTop(contents[0].scrollHeight);
    }

    $('#clear-logs').click(() => {
        $('#log-contents').empty();
    });

    ipcRenderer.on('log', (_, data, type) => {
        log(data.toString(), type);
    });

    addTab(LogTabName, {
        show: () => {
            tabReady(LogTabName);
        },
    });

    // --------------------------------------------------------------------
    // ------------------------- SETTINGS TAB -----------------------------
    // --------------------------------------------------------------------
    let Settings = null;
    const SettingsTabName = 'settings';

    function onSettingsChanged(newSettings) {
        Settings = newSettings;
        setLanguage(Settings.uilanguage);
        setProxyRunning(ProxyRunning);

        $('#uilanguage').val(mui.language);
        $('#autostart').prop('checked', Settings.gui.autostart);
        $('#updatelog').prop('checked', Settings.updatelog);
        $('#logtimes').prop('checked', Settings.gui.logtimes);
        $('#noupdate').prop('checked', Settings.noupdate);
        $('#noselfupdate').prop('checked', Settings.noselfupdate);
        $('#devmode').prop('checked', Settings.devmode);
        $('#noslstags').prop('checked', Settings.noslstags);
        $('#minimizetotray').prop('checked', Settings.gui.minimizetotray);
        $('head').append(`<link rel="stylesheet" href="css/themes/${Themes.indexOf(Settings.gui.theme) < 0 ? Themes[0] : Settings.gui.theme}.css">`);
    }

    function updateSettings(newSettings) {
        ipcRenderer.send('set config', newSettings);
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

        let SettingsCopy = Object.assign({}, Settings);
        SettingsCopy.gui = Object.assign(SettingsCopy.gui, Override);
        updateSettings(SettingsCopy);
    }

    function loadSettingsLanguageNames() {
        const LanguageSelector = $('#uilanguage');
        Object.keys(LanguageNames).forEach(language_id => LanguageSelector.append($('<option/>', { value: language_id, text: LanguageNames[language_id] })));
    }

    loadSettingsLanguageNames();

    ipcRenderer.on('set config', (_, newConfig) => {
        onSettingsChanged(newConfig);
        tabReady(SettingsTabName);
    });

    addTab(SettingsTabName, {
        show: () => {
            ipcRenderer.send('get config');
        }
    });

    // UI events
    $('#uilanguage').change(() => {
        updateSetting('uilanguage', $('#uilanguage').val());
    });

    $('#autostart').click(() => {
        updateGUISetting('autostart', $('#autostart').is(':checked'));
    });

    $('#updatelog').click(() => {
        updateSetting('updatelog', $('#updatelog').is(':checked'));
    });

    $('#logtimes').click(() => {
        updateGUISetting('logtimes', $('#logtimes').is(':checked'));
    });

    $('#noupdate').click(() => {
        const checked = $('#noupdate').is(':checked');
        if (checked)
            ShowModal(mui.get('gui/main/modal/warn-mod-update-disabled'));
        updateSetting('noupdate', checked);
    });

    $('#noselfupdate').click(() => {
        const checked = $('#noselfupdate').is(':checked');
        if (checked)
            ShowModal(mui.get('gui/main/modal/warn-self-update-disabled'));
        updateSetting('noselfupdate', checked);
    });

    $('#devmode').click(() => {
        updateSetting('devmode', $('#devmode').is(':checked'));
    });

    $('#noslstags').click(() => {
        updateSetting('noslstags', $('#noslstags').is(':checked'));
    });

    $('#minimizetotray').click(() => {
        updateGUISetting('minimizetotray', $('#minimizetotray').is(':checked'));
    });

    Themes.forEach(theme => {
        $(`#theme_${theme}`).click(() => {
            $('head>link').filter('[rel="stylesheet"]:last').remove();
            $('head').append(`<link rel="stylesheet" href="css/themes/${theme}.css">`);
            updateGUISetting('theme', theme);
        });
    });

    // --------------------------------------------------------------------
    // ---------------------------- MODS TAB ------------------------------
    // --------------------------------------------------------------------
    const ModsTabName = 'mods';
    let WaitingForModAction = false;
    let ExpandedModNames = {};

    ipcRenderer.on('set mods', (_, modInfos) => {
        WaitingForModAction = false;
        let NewExpandedModNames = {};

        let ModIndex = 0;
        $('.modulesList').empty();
        modInfos.forEach(modInfo => {
            const escapedName = (ModIndex++).toString();
            const headerId = `modheader-${escapedName}`;
            const bodyId = `modbody-${escapedName}`;
            const donationId = `moddonate-${escapedName}`;
            const uninstallId = `moduninstall-${escapedName}`;
            const infoId = `modinfo-${escapedName}`;
            const enabledId = `modenabled-${escapedName}`;
            const updateId = `modupdate-${escapedName}`;

            $('.modulesList').append(`
                <div id="${headerId}" class="moduleHeader">
                    <div class="moduleHeader name">${modInfo.disabled ? '[DISABLED] ' : ''}${displayName(modInfo)}${modInfo.version ? `<span style="font-weight: none; font-size: 14px; font-style: italic"> (${modInfo.version})</span>` : ''}</div>
                    ${modInfo.author ? `<div class="moduleHeader author">by ${modInfo.author}${modInfo.drmKey ? ' (paid)' : ''}</div>` : ''}
                </div>
            `);

            $(`#${headerId}`).append(`
                <div id="${bodyId}" class="moduleBody">
                    <div class="moduleBody description">
                        ${modInfo.description || ''}
                    </div>
                    <div class="moduleBody buttons">
                        ${!modInfo.isCoreModule ? `<a href="#" id="${uninstallId}" class="moduleBody buttons uninstall"></a>` : ''}
                        ${modInfo.donationUrl ? `<a href="#" id="${donationId}" class="moduleBody buttons donate"></a>` : ''}
                        ${modInfo.supportUrl ? `<a href="#" id="${infoId}" class="moduleBody buttons info"></a>` : ''}
                        ${(!modInfo.isCoreModule && modInfo.compatibility === 'compatible') ? `<a href="#" id="${updateId}" class="moduleBody buttons update${modInfo.disableAutoUpdate ? 'Disabled' : 'Enabled'}"></a>` : ''}
                        ${(!modInfo.isCoreModule && modInfo.compatibility === 'compatible') ? `<a href="#" id="${enabledId}" class="moduleBody buttons load${modInfo.disabled ? 'Disabled' : 'Enabled'}"></a>` : ''}
                    </div>
                </div>`
            );

            $(`#${donationId}`).on('click', (event) => {
                event.preventDefault();
                shell.openExternal(modInfo.donationUrl);
                return false;
            });

            $(`#${infoId}`).on('click', (event) => {
                event.preventDefault();
                shell.openExternal(modInfo.supportUrl);
                return false;
            });

            $(`#${enabledId}`).on('click', (event) => {
                event.preventDefault();
                if (!WaitingForModAction) {
                    ipcRenderer.send('toggle mod load', modInfo);
                    WaitingForModAction = true;
                }
                return false;
            });

            $(`#${updateId}`).on('click', (event) => {
                event.preventDefault();
                if (!WaitingForModAction) {
                    ipcRenderer.send('toggle mod autoupdate', modInfo);
                    WaitingForModAction = true;
                }
                return false;
            });

            $(`#${uninstallId}`).on('click', (event) => {
                event.preventDefault();
                if (ProxyStarting || ProxyRunning) {
                    ShowModal(mui.get('gui/main/modal/error-cannot-uninstall-mod-while-running'));
                } else if (!WaitingForModAction) {
                    ipcRenderer.send('uninstall mod', modInfo);
                    WaitingForModAction = true;
                }
                return false;
            });

            $(".moduleBody").click(() => {
                // Cancel default action and event bubbling
                return false;
            });

            $(`#${headerId}`).click(() => {
                ExpandedModNames[modInfo.name] = !ExpandedModNames[modInfo.name];
                $(`#${bodyId}`).toggle();
                $(`#${headerId}`).toggleClass('active');
            });

            NewExpandedModNames[modInfo.name] = ExpandedModNames[modInfo.name];
            if (ExpandedModNames[modInfo.name]) {
                $(`#${bodyId}`).toggle();
                $(`#${headerId}`).toggleClass('active');
            }
        });

        ExpandedModNames = NewExpandedModNames;
        tabReady(ModsTabName);
    });

    addTab(ModsTabName, {
        show: () => {
            ipcRenderer.send('get mods');
        },
    });

    // --------------------------------------------------------------------
    // ---------------------- MODS INSTALLATION TAB -----------------------
    // --------------------------------------------------------------------
    const ModsInstallationTabName = 'newmods';
    let WaitingForModInstall = false;
    let InstallableModInfos = [];
    let InstallableModFilter = {
        keywords: [],
        network: true,
        client: true,
    };

    function requestInstallMod(modInfo) {
        ipcRenderer.send('install mod', modInfo);
        WaitingForModInstall = true;
    }

    function matchesInstallableModFilter(modInfo) {
        if (!InstallableModFilter.network && (!modInfo.category || modInfo.category === 'network'))
            return false;
        if (!InstallableModFilter.client && modInfo.category === 'client')
            return false;

        return InstallableModFilter.keywords.length === 0 || InstallableModFilter.keywords.some(keyword => (modInfo.author && modInfo.author.toLowerCase().includes(keyword)) || (modInfo.description && modInfo.description.toLowerCase().includes(keyword)) || displayName(modInfo).toLowerCase().includes(keyword));
    }

    function rebuildInstallableModsList() {
        let ModIndex = 0;
        $('.installableModulesList').empty();
        InstallableModInfos.filter(modInfo => matchesInstallableModFilter(modInfo)).forEach(modInfo => {
            const escapedName = (ModIndex++).toString();
            const headerId = `installablemodheader-${escapedName}`;
            const bodyId = `installablemodbody-${escapedName}`;
            const installId = `installablemodinstall-${escapedName}`;

            $('.installableModulesList').append(`
                <div id="${headerId}" class="installableModuleHeader">
                    <div class="installableModuleHeader name">${displayName(modInfo)}${modInfo.version ? `<span style="font-weight: none; font-size: 14px; font-style: italic"> (${modInfo.version})</span>` : ''}</div>
                    ${modInfo.author ? `<div class="installableModuleHeader author">by ${modInfo.author}</div>` : ''}
                </div>
            `);

            $(`#${headerId}`).append(`
                <div id="${bodyId}" class="installableModuleBody">
                    <div class="installableModuleBody description">
                        ${modInfo.description || ''}
                    </div>
                    <div class="installableModuleBody buttons">
                        <a href="#" id="${installId}" class="installableModuleBody buttons install"></a>
                    </div>
                </div>`
            );

            $(`#${installId}`).on('click', (event) => {
                event.preventDefault();
                if (ProxyStarting || ProxyRunning)
                    ShowModal(mui.get('gui/main/modal/error-cannot-install-mod-while-running'));
                else if (!WaitingForModInstall)
                    requestInstallMod(modInfo);
                return false;
            });

            $(".installableModuleBody").click(() => {
                // Cancel default action and event bubbling
                return false;
            });
        });
    }

    $('#installableModulesFilterString').on('input', () => {
        InstallableModFilter.keywords = $('#installableModulesFilterString').val().split(',').map(x => x.trim().toLowerCase()).filter(x => x.length > 0);
        rebuildInstallableModsList();
    });

    $('#installableModulesFilterNetwork').click(() => {
        InstallableModFilter.network = $('#installableModulesFilterNetwork').is(':checked');
        rebuildInstallableModsList();
    });

    $('#installableModulesFilterClient').click(() => {
        InstallableModFilter.client = $('#installableModulesFilterClient').is(':checked');
        rebuildInstallableModsList();
    });

    ipcRenderer.on('set installable mods', (_, modInfos) => {
        WaitingForModInstall = false;
        InstallableModInfos = modInfos;
        rebuildInstallableModsList();
        tabReady(ModsInstallationTabName);
    });

    addTab(ModsInstallationTabName, {
        show: () => {
            ipcRenderer.send('get installable mods');
        },
    });

    // --------------------------------------------------------------------
    // ----------------------------- HELP TAB -----------------------------
    // --------------------------------------------------------------------
    const HelpTabName = 'help';

    addTab(HelpTabName, {
        click: () => {
            shell.openExternal(remote.getGlobal('TeraProxy').SupportUrl);
        },
    });

    // --------------------------------------------------------------------
    // -------------------------- MODS FOLDER TAB -------------------------
    // --------------------------------------------------------------------
    const ModsFolderTabName = 'modsfolder';

    addTab(ModsFolderTabName, {
        click: () => {
            ipcRenderer.send('show mods folder');
        },
    });

    // --------------------------------------------------------------------
    // --------------------------- CREDITS TAB ----------------------------
    // --------------------------------------------------------------------
    const CreditsTabName = 'credits';

    addTab(CreditsTabName, {
        show: () => {
            tabReady(CreditsTabName);
        },
    });

    // --------------------------------------------------------------------
    // ---------------------------- MODAL BOX -----------------------------
    // --------------------------------------------------------------------
    function ShowModal(text) {
        $("#modalbox-text").text(text);
        $("#modalbox").show();
    }

    $("#modalbox-ok").click(() => {
        $("#modalbox").hide();
    });

    ipcRenderer.on('error', (_, error) => {
        ShowModal(error);
    });

    // --------------------------------------------------------------------
    // ------------------------------ RUN! --------------------------------
    // --------------------------------------------------------------------
    ipcRenderer.send('init');
});
