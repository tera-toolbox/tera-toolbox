// German translation by Shalltearz#6717

const Name = 'Deutsch';

function GetString(str, tokens) {
    switch (str) {
        // connectionManager
        case 'connectionmanager/error-ETIMEDOUT-1': return `[Verbindung] FEHLER: Verbindung zum Spiele-Server unter ${tokens.address}:${tokens.port} (Time-out) nicht möglich! Häufige Gründe hierfür sind:`;
        case 'connectionmanager/error-ETIMEDOUT-2': return '[Verbindung] - Eine instabile Internetverbindung oder eine Regions-IP Sperre';
        case 'connectionmanager/error-ETIMEDOUT-3': return '[Verbindung] - Wartung des Spiele-Servers';
        case 'connectionmanager/error-ECONNRESET-EPIPE-1': return `[Verbindung] FEHLER: ${tokens.code} - Die Verbindung zum Spiele-Server wurde unerwartet geschlossen. Häufige Gründe hierfür sind:`;
        case 'connectionmanager/error-ECONNRESET-EPIPE-2': return '[Verbindung] - Eine Unterbrechung aufgrund einer instabilen Internetverbindung';
        case 'connectionmanager/error-ECONNRESET-EPIPE-3': return '[Verbindung] - Ein Exploit / Cheat oder beschädigtes Modul, welches zum Kick geführt hat.';
        case 'connectionmanager/connected': return `[Verbindung] Umleitung von ${tokens.remote} zu ${tokens.remoteAddress}:${tokens.remotePort}`;
        case 'connectionmanager/disconnected': return `[Verbindung] ${tokens.remote} getrennt`;

        // loader-cli
        case 'loader-cli/error-node-too-old-1': return 'FEHLER: Deine installierte Version von Node.JS ist zu alt, um TERA Toolbox auszuführen!';
        case 'loader-cli/error-node-too-old-2': return 'FEHLER: Bitte downloade und installiere TERA Toolbox erneut, oder installiere die neueste Version von Node.JS mit dem folgenden Link https://nodejs.org/en/download/current/';
        case 'loader-cli/error-runtime-incompatible-default': return `FEHLER: ${tokens.message}`;
        case 'loader-cli/error-config-corrupt-1': return 'FEHLER: Whoops, es sieht so aus als wäre deine config.json Datei beschädigt!';
        case 'loader-cli/error-config-corrupt-2': return `FEHLER: Versuche den Fehler selbst zu beheben oder frage hier um Hilfe: ${tokens.supportUrl}`;
        case 'loader-cli/error-migration-failed-1': return 'FEHLER: Dateien können nicht von einer alten Version von TERA Toolbox migriert werden!';
        case 'loader-cli/error-migration-failed-2': return 'FEHLER: Bitte installiere eine saubere Kopie mit dem neuesten Installationsprogramm';
        case 'loader-cli/error-migration-failed-3': return `FEHLER: Oder bitte hier um Hilfe: ${tokens.supportUrl}`;
        case 'loader-cli/error-cannot-start-proxy': return '[Toolbox] Der Netzwerk-Proxy kann nicht gestartet werden, beenden des Prozesses...';
        case 'loader-cli/terminating': return 'Beenden des Prozesses...';
        case 'loader-cli/warning-noupdate-1': return '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!';
        case 'loader-cli/warning-noupdate-2': return '!!!!!  DU HAST AUTOMATISCHE MODUL AKTUALISIERUNGEN DEAKTIVIERT   !!!!!';
        case 'loader-cli/warning-noupdate-3': return '!!!!!          ES GIBT KEINE UNTERSTÜTZUNG FÜR PROBLEME          !!!!!';
        case 'loader-cli/warning-noupdate-4': return '!!!!!               WELCHE DADURCH ENTSTEHEN KÖNNEN              !!!!!';
        case 'loader-cli/warning-noupdate-5': return '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!';
        case 'loader-cli/warning-update-mod-not-supported': return `[Aktualisierung] WARNUNG: Modul ${tokens.name} unterstützt keine automatische Aktualisierung!`;
        case 'loader-cli/error-update-mod-failed': return `[Aktualisierung] FEHLER: Modul ${tokens.name} konnte nicht aktualisiert werden und ist möglicherweise beschädigt!`;
        case 'loader-cli/error-update-tera-data-failed-1': return '[Aktualisierung] FEHLER: Beim Aktualisieren der Opcode-Maps und Paketdefinitionen sind Fehler aufgetreten.';
        case 'loader-cli/error-update-tera-data-failed-2': return '[Aktualisierung] FEHLER: Dies kann zu weiteren Fehlern führen!';
        case 'loader-cli/error-update-failed': return 'FEHLER: Automatische Aktualisierung nicht möglich! Die vollständige Fehlermeldung lautet:';

        // loader-gui
        case 'loader-gui/tray/quit': return 'Beenden';
        case 'loader-gui/error-config-file-corrupt/title': return 'Ungültige Einstellungsdatei!';
        case 'loader-gui/error-config-file-corrupt/message': return `Die Datei config.json im TERA Toolbox Ordner ist beschädigt. Versuche den Fehler selbst zu beheben, lösche sie um eine neue zu generieren, oder frage hier ${tokens.supportUrl} um Hilfe!\n\nDas Programm wird jetzt beendet.`;
        case 'loader-gui/error-migration-failed/title': return 'Migrationsfehler!';
        case 'loader-gui/error-migration-failed/message': return `Dateien können nicht von einer alten Version von TERA Toolbox migriert werden.\nBitte installiere eine saubere Kopie mit dem neuesten Installationsprogramm oder frage hier ${tokens.supportUrl} um Hilfe!\n\nDas Programm wird jetzt beendet.`;
        case 'loader-gui/error-cannot-start-proxy': return '[Toolbox] Der Netzwerk-Proxy kann nicht gestartet werden!';
        case 'loader-gui/terminating': return 'Beenden des Prozesses...';
        case 'loader-gui/warning-noselfupdate-1': return '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!';
        case 'loader-gui/warning-noselfupdate-2': return '!!!!!  DU HAST AUTOMATISCHE TOOLBOX AKTUALISIERUNGEN DEAKTIVIERT !!!!!';
        case 'loader-gui/warning-noselfupdate-3': return '!!!!!          ES GIBT KEINE UNTERSTÜTZUNG FÜR PROBLEME          !!!!!';
        case 'loader-gui/warning-noselfupdate-4': return '!!!!!               WELCHE DADURCH ENTSTEHEN KÖNNEN              !!!!!';
        case 'loader-gui/warning-noselfupdate-5': return '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!';
        case 'loader-gui/warning-noupdate-1': return '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!';
        case 'loader-gui/warning-noupdate-2': return '!!!!!  DU HAST AUTOMATISCHE MODUL AKTUALISIERUNGEN DEAKTIVIERT   !!!!!';
        case 'loader-gui/warning-noupdate-3': return '!!!!!          ES GIBT KEINE UNTERSTÜTZUNG FÜR PROBLEME          !!!!!';
        case 'loader-gui/warning-noupdate-4': return '!!!!!               WELCHE DADURCH ENTSTEHEN KÖNNEN              !!!!!';
        case 'loader-gui/warning-noupdate-5': return '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!';
        case 'loader-gui/warning-update-mod-not-supported': return `[Aktualisierung] WARNUNG: Modul ${tokens.name} unterstützt keine automatische Aktualisierung!`;
        case 'loader-gui/error-update-mod-failed': return `[Aktualisierung] FEHLER: Modul ${tokens.name} konnte nicht aktualisiert werden und ist möglicherweise beschädigt!`;
        case 'loader-gui/error-update-tera-data-failed-1': return '[Aktualisierung] FEHLER: Beim Aktualisieren der Opcode-Maps und Paketdefinitionen sind Fehler aufgetreten.';
        case 'loader-gui/error-update-tera-data-failed-2': return '[Aktualisierung] FEHLER: Dies kann zu weiteren Fehlern führen!';
        case 'loader-gui/error-update-failed': return 'FEHLER: Automatische Aktualisierung nicht möglich! Die vollständige Fehlermeldung lautet:';
        case 'loader-gui/proxy-starting': return '[Toolbox] Netzwerk-Proxy wird gestartet ...';
        case 'loader-gui/proxy-stopping': return '[Toolbox] Netzwerk-Proxy wird gestoppt ...';
        case 'loader-gui/proxy-stopped': return '[Toolbox] Netzwerk-Proxy ist gestoppt!';
        case 'loader-gui/mod-installed': return `[Toolbox] Installieren von "${modInfo.name}"`;
        case 'loader-gui/mod-uninstalled': return `[Toolbox] Deinstallieren von "${modInfo.name}"`;
        case 'loader-gui/mod-load-toggled': return `[Toolbox] Modul "${tokens.name}" ist jetzt ${tokens.enabled ? 'aktiviert' : 'deaktiviert'}`;
        case 'loader-gui/mod-updates-toggled': return `[Toolbox] Automatische Aktualisierung von "${tokens.name} ist jetzt ${tokens.updatesEnabled ? 'aktiviert' : 'deaktiviert'}"`;

        // proxy
        case 'proxy/ready': return '[Toolbox] Bereit, warten auf den Start des Spiel-Clients!';
        case 'proxy/client-interface-error': return '[Toolbox] FEHLER: Client Schnittstellen Server kann nicht gestartet werden.';
        case 'proxy/client-interface-error-EADDRINUSE': return '[Toolbox] FEHLER: Eine andere Instanz von TERA Toolbox wird bereits ausgeführt. Bitte schließe sie oder starte deinen Computer neu und versuche es erneut!';
        case 'proxy/client-interface-error-EADDRNOTAVAIL': return '[Toolbox] FEHLER: Adresse nicht verfügbar. Starte deinen Computer neu und versuche es erneut!';
        case 'proxy/client-interface-connection-error': return `[Toolbox] Verbindung zum Client kann nicht hergestellt werden: ${tokens.error}`;
        case 'proxy/client-interface-connected': return `[Toolbox] Client wurde ${tokens.justStarted ? 'verbunden' : 'wieder verbunden'} (${tokens.region} v${tokens.majorPatchVersion}.${tokens.minorPatchVersion})`;
        case 'proxy/client-interface-disconnected': return `[Toolbox] Client wurde beendet`;
        case 'proxy/redirecting-server': return `[Toolbox] Umleitung ${tokens.name} (${tokens.region.toUpperCase()}-${tokens.serverId}) von ${tokens.listen_ip}:${tokens.listen_port} zu ${tokens.ip}:${tokens.port}`;
        case 'proxy/warning-unmapped-protocol-1': return `[Toolbox] WARNUNG: Nicht zugeordnete Protokoll-Version ${tokens.protocolVersion} (${tokens.region.toUpperCase()} v${tokens.majorPatchVersion}.${tokens.minorPatchVersion}) gefunden.`;
        case 'proxy/warning-unmapped-protocol-2': return '[Toolbox] WARNUNG: Dies kann eine der folgenden Ursachen haben:';
        case 'proxy/warning-unmapped-protocol-3': return '[Toolbox] WARNUNG: 1) Du versuchst, mit einer neu veröffentlichten Client-Version zu spielen, die noch nicht unterstützt wird.';
        case 'proxy/warning-unmapped-protocol-4': return '[Toolbox] WARNUNG:    Wenn in den letzten Stunden eine Spielwartung stattgefunden hat, melde dies bitte!';
        case 'proxy/warning-unmapped-protocol-5': return '[Toolbox] WARNUNG:    Andernfalls wurde dein Client möglicherweise zu früh für einen bevorstehenden Patch aktualisiert.';
        case 'proxy/warning-unmapped-protocol-6': return '[Toolbox] WARNUNG: 2) Du versuchst, mit einer veralteten Client-Version zu spielen.';
        case 'proxy/warning-unmapped-protocol-7': return '[Toolbox] WARNUNG:    Versuche den Client zu reparieren oder das Spiel von Grund auf neu zu installieren, um dies zu beheben!';
        case 'proxy/warning-unmapped-protocol-8': return `[Toolbox] WARNUNG: Wenn du es nicht selbst beheben kannst, frage hier um Hilfe: ${tokens.supportUrl}!`;
        case 'proxy/error-cannot-load-protocol': return `FEHLER: Protokoll-Version ${tokens.protocolVersion} (${tokens.region.toUpperCase()} v${tokens.majorPatchVersion}.${tokens.minorPatchVersion}) konnte nicht initialisiert werden!`;
        case 'proxy/protocol-loaded': return `[Toolbox] Protokoll-Version ${tokens.protocolVersion} (${tokens.region.toUpperCase()} v${tokens.majorPatchVersion}.${tokens.minorPatchVersion}) wurde erfolgreich initialisiert.`;

        // update
        case 'update/started': return '[Aktualisierung] Automatische Aktualisierung gestartet!';
        case 'update/core-module-initialized': return `[Aktualisierung] Kernmodul "${tokens.coreModule}" initialisiert`;
        case 'update/dependency-module-initialized': return `[Aktualisierung] Benötigtes Modul "${tokens.dependency}" für Modul "${tokens.name}" initialisiert`;
        case 'update/warning-module-update-disabled': return `[Aktualisierung] WARNUNG: Automatische Aktualisierung für Modul ${tokens.name} deaktiviert!`;
        case 'update/start-module-install': return `[Aktualisierung] Installieren von Modul ${tokens.name}`;
        case 'update/start-module-update': return `[Aktualisierung] Aktualisieren von Modul ${tokens.name}`;
        case 'update/warning-module-no-update-servers': return `[Aktualisierung] WARNUNG: Modul ${tokens.name} hat keine Aktualisierungs-Server angegeben!`;
        case 'update/module-download-manifest': return `[Aktualisierung] - Aktualisierungs-Manifest wird abgerufen (Server ${tokens.serverIndex})`;
        case 'update/module-download-file': return `[Aktualisierung] - Herunterladen von ${tokens.file}`;
        case 'update/module-config-changed': return '[Aktualisierung] - Modulkonfiguration geändert, Aktualisierung wird neu gestartet!';
        case 'update/module-update-failed-1': return `[Aktualisierung] FEHLER: Modul ${tokens.name} kann nicht automatisch aktualisiert werden:`;
        case 'update/module-update-failed-2-1': return `[Aktualisierung] Bitte gehe zu ${tokens.supportUrl} und befolge die angegebenen Anweisungen oder frage um Hilfe.`;
        case 'update/module-update-failed-2-2': return `[Aktualisierung] Alternativ kannst du hier um Hilfe fragen: ${tokens.supportUrl}`;
        case 'update/module-update-failed-3': return `[Aktualisierung] Bitte kontaktiere den Autor des Moduls oder frage hier um Hilfe: ${tokens.supportUrl}`;
        case 'update/tera-data': return '[Aktualisierung] Aktualisieren von tera-data';
        case 'update/tera-data-update-failed': return `[Aktualisierung] FEHLER: Die folgenden Opcode-Maps oder Paketdefinitionen können nicht aktualisiert werden. Bitte frage hier um Hilfe: ${tokens.supportUrl}`;
        case 'update/finished': return '[Aktualisierung] Automatische Aktualisierung abgeschlossen!';

        // gui
        case 'gui/main/start-stop-proxy-running': return 'Stoppen!';
        case 'gui/main/start-stop-proxy-not-running': return 'Starten!';
        case 'gui/main/start-stop-proxy-starting': return 'Starten...';
        case 'gui/main/start-stop-proxy-stopping': return 'Stoppen...';

        case 'gui/main/status-proxy-running': return 'Prozess Gestartet';
        case 'gui/main/status-proxy-not-running': return 'Prozess Angehalten';
        case 'gui/main/status-update-available': return 'AKTUALISIERUNG VERFÜGBAR - BITTE NEUSTARTEN';

        case 'gui/main/modal/buttons/ok': return 'OK';
        case 'gui/main/modal/warn-mod-update-disabled': return 'WARNUNG! Du hast die automatische Aktualisierung für alle deine Module deaktiviert. Dies wird zur Folge haben das sie irgendwann nicht mehr funktionieren. Wir leisten keinerlei Unterstützung, es sei denn, sie sind wieder aktiviert!';
        case 'gui/main/modal/warn-self-update-disabled': return 'WARNUNG! Du hast die automatische Aktualisierung für alle deine Module deaktiviert. Dies wird zur Folge haben das sie irgendwann nicht mehr funktionieren. Wir leisten keinerlei Unterstützung, es sei denn, sie sind wieder aktiviert!';
        case 'gui/main/modal/error-cannot-install-mod-while-running': return 'Du kannst keine Module installieren, während TERA Toolbox ausgeführt wird. Bitte zuerst stoppen!';
        case 'gui/main/modal/error-cannot-uninstall-mod-while-running': return 'Du kannst keine Module installieren, während TERA Toolbox ausgeführt wird. Bitte zuerst stoppen!';

        case 'gui/main/static/tabs/log/title': return 'Protokoll';
        case 'gui/main/static/tabs/log/loading': return 'Proxy-Protokoll wird geladen ...';

        case 'gui/main/static/tabs/mods/title': return 'Meine Module';
        case 'gui/main/static/tabs/mods/loading': return 'Installierte Module werden geladen ...';

        case 'gui/main/static/tabs/newmods/title': return 'Mehr Module';
        case 'gui/main/static/tabs/newmods/loading': return 'Modulliste wird geladen ...';
        case 'gui/main/static/tabs/newmods/content/filter': return 'Filter: ';
        case 'gui/main/static/tabs/newmods/content/filter/network': return 'Netzwerk / Proxy-Module';
        case 'gui/main/static/tabs/newmods/content/filter/client': return 'Client / Benutzeroberflächen-Module';

        case 'gui/main/static/tabs/settings/title': return 'Einstellungen';
        case 'gui/main/static/tabs/settings/loading': return 'Laden der Einstellungen...';
        case 'gui/main/static/tabs/settings/content/uilanguage': return 'Sprache';
        case 'gui/main/static/tabs/settings/content/theme': return 'Thema';
        case 'gui/main/static/tabs/settings/content/autostart': return 'Automatischer Start nach dem Öffnen';
        case 'gui/main/static/tabs/settings/content/updatelog': return 'Detailliertes Aktualisierungs-Protokoll';
        case 'gui/main/static/tabs/settings/content/logtimes': return 'Zeitstempel im Protokoll anzeigen';
        case 'gui/main/static/tabs/settings/content/noupdate': return 'Deaktivieren von Modul-Aktualisierungen';
        case 'gui/main/static/tabs/settings/content/noselfupdate': return 'Deaktivieren von Toolbox-Aktualisierungen';
        case 'gui/main/static/tabs/settings/content/devmode': return 'Aktivieren vom Entwicklermodus';
        case 'gui/main/static/tabs/settings/content/noslstags': return 'Proxy-Tags in der Serverliste ausblenden';
        case 'gui/main/static/tabs/settings/content/minimizetotray': return 'Minimieren in ausgeblendete Symbole';

        case 'gui/main/static/tabs/help/title': return 'Brauchst Du Hilfe?';

        case 'gui/main/static/tabs/modsfolder/title': return 'Modul Ordner Öffnen';

        case 'gui/main/static/tabs/credits/title': return 'Mitwirkende';
        case 'gui/main/static/tabs/credits/loading': return 'Laden der Mitwirkenden...';
        case 'gui/main/static/tabs/credits/content': return 'Danke an<br />SaltyMonkey: Installationsprogramm<br />Mathicha &amp; Pentagon: Kern Benutzeroberfläche<br />Foglio: Logo Design<br />Meishu: Ursprünglicher Tera-Proxy Kern<br />Allen Toolbox Übersetzern<br />Allen Modul Entwicklern';

        // tera-client-interface
        case 'tera-client-interface/index/communication-error': return '[Toolbox] Fehler bei der Kommunikation mit dem Client:';

        case 'tera-client-interface/gpkmanager/symlink-warning-1': return '[Toolbox] WARNUNG: Es sieht so aus, als ob sich entweder TERA Toolbox oder das Spiel auf einem Laufwerk / einer Partition befinden,';
        case 'tera-client-interface/gpkmanager/symlink-warning-2': return '[Toolbox] WARNUNG: die keine symbolischen Links unterstützen (z. B. weil es mit exFAT oder FAT32 formatiert ist)!';
        case 'tera-client-interface/gpkmanager/symlink-warning-3': return '[Toolbox] WARNUNG: Als Fallback werden deine Client-Module installiert, indem stattdessen Dateikopien erstellt werden.';
        case 'tera-client-interface/gpkmanager/symlink-warning-4': return '[Toolbox] WARNUNG: Beachte, dass dies die Startzeit vom Client verlangsamen und deine Festplatte belasten kann!';
        case 'tera-client-interface/gpkmanager/uninstall-error-1': return '[Toolbox] WARNUNG: Die folgende Client-Modul-Datei kann nicht entfernt werden:';
        case 'tera-client-interface/gpkmanager/uninstall-error-2': return `[Toolbox] WARNUNG: ${tokens.fullPath}`;
        case 'tera-client-interface/gpkmanager/uninstall-error-3': return '[Toolbox] WARNUNG: Sie wird stattdessen gelöscht, wenn du das Spiel das nächste Mal startest. Du kannst sie auch manuell löschen.';

        case 'tera-client-interface/module/prefix-log': return `[${tokens.name}]`;
        case 'tera-client-interface/module/prefix-warn': return `[${tokens.name}] WARNUNG:`;
        case 'tera-client-interface/module/prefix-error': return `[${tokens.name}] FEHLER:`;
        case 'tera-client-interface/module/settings-load-error-corrupted-1': return 'Du hast das Programm bei der letzten Verwendung nicht ordnungsgemäß geschlossen!';
        case 'tera-client-interface/module/settings-load-error-corrupted-2': return `Dadurch wurden die Einstellungen für das Modul "${tokens.name}" beschädigt!`;
        case 'tera-client-interface/module/settings-load-error-corrupted-3': return 'Das Modul lädt jetzt die Standardeinstellungen, passe sie also an deine Bedürfnisse an.';
        case 'tera-client-interface/module/settings-load-error-corrupted-4': return 'Bitte denke daran, das Programm ordnungsgemäß zu schließen: Schließe zuerst das Spiel und dann TERA Toolbox mit dem X-Knopf!';
        case 'tera-client-interface/module/settings-load-error-corrupted-5': return 'Fahre deinen Computer nicht herunter, während TERA Toolbox ausgeführt wird!';
        case 'tera-client-interface/module/settings-load-error-invalid-format-1': return `Ungültiges Einstellungsformat für das Modul "${tokens.name}"!`;
        case 'tera-client-interface/module/settings-load-error-invalid-format-2': return 'Dies bedeutet, dass du es beim manuellen Bearbeiten beschädigt hast.';
        case 'tera-client-interface/module/settings-load-error-invalid-format-3': return 'Bitte korrigiere die Einstellungsdatei manuell oder lösche sie, damit die Standardeinstellungen wiederhergestellt werden können.';
        case 'tera-client-interface/module/settings-load-error-invalid-format-4': return '------------------------------------------';
        case 'tera-client-interface/module/settings-load-error-invalid-format-5': return 'Erweiterte Fehlerdetails';
        case 'tera-client-interface/module/settings-load-error-invalid-format-6': return 'Der vollständige Pfad zur Datei lautet:';
        case 'tera-client-interface/module/settings-load-error-invalid-format-7': return `  ${tokens.settingsFile}`;
        case 'tera-client-interface/module/settings-load-error-invalid-format-8': return 'Die vollständige Fehlermeldung lautet:';
        case 'tera-client-interface/module/settings-load-error-invalid-format-9': return `  ${tokens.e}`;
        case 'tera-client-interface/module/settings-load-error-invalid-format-10': return '------------------------------------------';
        case 'tera-client-interface/module/settings-save-error-write': return 'Einstellungen können nicht gespeichert werden! Die vollständige Fehlermeldung lautet:';
        case 'tera-client-interface/module/settings-save-error-stringify': return 'Einstellungen können nicht serialisiert werden! Die vollständige Fehlermeldung lautet:';
        case 'tera-client-interface/module/settings-migrate-error-load-migrator': return 'Einstellungs-Migrator kann nicht geladen werden! Die vollständige Fehlermeldung lautet:';
        case 'tera-client-interface/module/settings-migrate-error-run-migrator': return 'Bei der Migration der Einstellungen ist ein Fehler aufgetreten! Die vollständige Fehlermeldung lautet:';

        case 'tera-client-interface/modulemanager/load-module-info-error': return `[Modul] FEHLER: Modulinformationen für "${tokens.name}" können nicht geladen werden! Die vollständige Fehlermeldung lautet:`;
        case 'tera-client-interface/modulemanager/duplicate-mod-error': return `[Modul] FEHLER: Modul Duplikat "${tokens.name}" gefunden!`;
        case 'tera-client-interface/modulemanager/missing-mod-dependency-error': return `[Modul] FEHLER: Modul ${tokens.name} benötigt "${tokens.dependency}" was nicht installiert ist!`;
        case 'tera-client-interface/modulemanager/mod-conflict-error': return `[Modul] FEHLER: Modul ${tokens.name} kann nicht geladen werden, während "${tokens.conflict}" installiert ist!`;
        case 'tera-client-interface/modulemanager/cannot-load-mod-not-installed': return `[Modul] FEHLER: Versuch, ein nicht installiertes Modul zu laden: ${tokens.name}`;
        case 'tera-client-interface/modulemanager/cannot-unload-mod-not-installed': return `[Modul] FEHLER: Versuch, ein nicht installiertes Modul zu entladen: ${tokens.name}`;
        case 'tera-client-interface/modulemanager/cannot-unload-mod-not-loaded': return `[Modul] FEHLER: Versuch, ein nicht geladenes Modul zu entladen: ${tokens.name}`;
        case 'tera-client-interface/modulemanager/mod-loaded': return `[Modul] Lade Modul ${tokens.name}`;
        case 'tera-client-interface/modulemanager/mod-unloaded': return `[Modul] Entlade Modul ${tokens.name}`;
        case 'tera-client-interface/modulemanager/mod-load-error-1': return `[Modul] FEHLER: Modul ${tokens.name} konnte nicht geladen werden!`;
        case 'tera-client-interface/modulemanager/mod-load-error-2': return `[Modul] FEHLER: Bitte wende dich an den Autor des Moduls: ${tokens.supportUrl}`;
        case 'tera-client-interface/modulemanager/mod-unload-error-1': return `[Modul] FEHLER: Modul ${tokens.name} konnte nicht entladen werden!`;
        case 'tera-client-interface/modulemanager/mod-unload-error-2': return `[Modul] FEHLER: Bitte wende dich an den Autor des Moduls: ${tokens.supportUrl}`;

        case 'tera-client-interface/process-listener/scan-error': return '[Toolbox] FEHLER: Nach dem Spiele-Client kann nicht gesucht werden! Die vollständige Fehlermeldung lautet:';

        case 'tera-client-interface/process-listener-dll-injector/inject-error': return `[Toolbox] FEHLER: Verbindung zum Spiele-Client nicht möglich (Prozess ID ${tokens.pid})!`;
        case 'tera-client-interface/process-listener-dll-injector/inject-error-ENOENT-1': return '[Toolbox] injector.exe existiert nicht. Es wurde wahrscheinlich von deinem Antivirenprogramm gelöscht.';
        case 'tera-client-interface/process-listener-dll-injector/inject-error-ENOENT-2': return '[Toolbox] Deaktiviere / deinstalliere dein Antivirenprogramm oder whiteliste TERA-Toolbox und die injector.exe!';
        case 'tera-client-interface/process-listener-dll-injector/inject-error-EPERM-1': return '[Toolbox] Berechtigung zum Starten von injector.exe verweigert. Wahrscheinlich wurde es von deinem Antivirenprogramm blockiert.';
        case 'tera-client-interface/process-listener-dll-injector/inject-error-EPERM-2': return '[Toolbox] Deaktiviere / deinstalliere dein Antivirenprogramm oder whiteliste TERA-Toolbox und die injector.exe!';
        case 'tera-client-interface/process-listener-dll-injector/inject-error-default-error-1': return '[Toolbox] Verbindung zum Spiele-Client fehlgeschlagen.';
        case 'tera-client-interface/process-listener-dll-injector/inject-error-default-error-2': return '[Toolbox] > Stelle sicher, dass TERA Toolbox mit Administratorrechten ausgeführt wird!';
        case 'tera-client-interface/process-listener-dll-injector/inject-error-default-error-3': return '[Toolbox] > Deaktiviere / deinstalliere dein Antivirenprogramm oder whiteliste TERA-Toolbox und die injector.exe!';
        case 'tera-client-interface/process-listener-dll-injector/inject-error-default-error-4': return '[Toolbox] > Starte deinen Computer neu oder beenden den TERA.exe-Prozess, falls sich im Task-Manager einer befindet!';
        case 'tera-client-interface/process-listener-dll-injector/inject-error-default-unknown-1': return '[Toolbox] Dies wird wahrscheinlich durch dein Antivirenprogramm verursacht. Deaktiviere / deinstalliere oder whiteliste TERA Toolbox.';
        case 'tera-client-interface/process-listener-dll-injector/inject-error-default-unknown-2': return '[Toolbox] Vollständige Fehlermeldung:';

        // tera-network-proxy
        case 'tera-network-proxy/connection/dispatch/module/prefix-log': return `[${tokens.name}]`;
        case 'tera-network-proxy/connection/dispatch/module/prefix-warn': return `[${tokens.name}] WARNUNG:`;
        case 'tera-network-proxy/connection/dispatch/module/prefix-error': return `[${tokens.name}] FEHLER:`;
        case 'tera-network-proxy/connection/dispatch/module/settings-load-error-corrupted-1': return 'Du hast das Programm bei der letzten Verwendung nicht ordnungsgemäß geschlossen!';
        case 'tera-network-proxy/connection/dispatch/module/settings-load-error-corrupted-2': return `Dadurch wurden die Einstellungen für das Modul "${tokens.name}" beschädigt!`;
        case 'tera-network-proxy/connection/dispatch/module/settings-load-error-corrupted-3': return 'Das Modul lädt jetzt die Standardeinstellungen, passe sie also an deine Bedürfnisse an.';
        case 'tera-network-proxy/connection/dispatch/module/settings-load-error-corrupted-4': return 'Bitte denke daran, das Programm ordnungsgemäß zu schließen: Schließe zuerst das Spiel und dann TERA Toolbox mit dem X-Knopf!';
        case 'tera-network-proxy/connection/dispatch/module/settings-load-error-corrupted-5': return 'Fahre deinen Computer nicht herunter, während TERA Toolbox ausgeführt wird!';
        case 'tera-network-proxy/connection/dispatch/module/settings-load-error-invalid-format-1': return `Ungültiges Einstellungsformat für das Modul "${tokens.name}"!`;
        case 'tera-network-proxy/connection/dispatch/module/settings-load-error-invalid-format-2': return 'Dies bedeutet, dass du es beim manuellen Bearbeiten beschädigt hast.';
        case 'tera-network-proxy/connection/dispatch/module/settings-load-error-invalid-format-3': return 'Bitte korrigiere die Einstellungsdatei manuell oder lösche sie, damit die Standardeinstellungen wiederhergestellt werden können.';
        case 'tera-network-proxy/connection/dispatch/module/settings-load-error-invalid-format-4': return '------------------------------------------';
        case 'tera-network-proxy/connection/dispatch/module/settings-load-error-invalid-format-5': return 'Erweiterte Fehlerdetails';
        case 'tera-network-proxy/connection/dispatch/module/settings-load-error-invalid-format-6': return 'Der vollständige Pfad zur Datei lautet:';
        case 'tera-network-proxy/connection/dispatch/module/settings-load-error-invalid-format-7': return `  ${tokens.settingsFile}`;
        case 'tera-network-proxy/connection/dispatch/module/settings-load-error-invalid-format-8': return 'Die vollständige Fehlermeldung lautet:';
        case 'tera-network-proxy/connection/dispatch/module/settings-load-error-invalid-format-9': return `  ${tokens.e}`;
        case 'tera-network-proxy/connection/dispatch/module/settings-load-error-invalid-format-10': return '------------------------------------------';
        case 'tera-network-proxy/connection/dispatch/module/settings-save-error-write': return 'Einstellungen können nicht gespeichert werden! Die vollständige Fehlermeldung lautet:';
        case 'tera-network-proxy/connection/dispatch/module/settings-save-error-stringify': return 'Einstellungen können nicht serialisiert werden! Die vollständige Fehlermeldung lautet:';
        case 'tera-network-proxy/connection/dispatch/module/settings-migrate-error-load-migrator': return 'Einstellungs-Migrator kann nicht geladen werden! Die vollständige Fehlermeldung lautet:';
        case 'tera-network-proxy/connection/dispatch/module/settings-migrate-error-run-migrator': return 'Bei der Migration der Einstellungen ist ein Fehler aufgetreten! Die vollständige Fehlermeldung lautet:';
        case 'tera-network-proxy/connection/dispatch/module/tera-game-state-not-loaded': return 'Dieses Modul könnte eine Fehlfunktion haben, weil "tera-game-state" nicht geladen werden konnte.'; 
        
        case 'tera-network-proxy/connection/dispatch/modulemanager/load-module-info-error': return `[Modul] FEHLER: Modulinformationen für "${tokens.name}" können nicht geladen werden! Die vollständige Fehlermeldung lautet:`;
        case 'tera-network-proxy/connection/dispatch/modulemanager/duplicate-mod-error': return `[Modul] FEHLER: Modul Duplikat "${tokens.name}" gefunden!`;
        case 'tera-network-proxy/connection/dispatch/modulemanager/missing-mod-dependency-error': return `[Modul] FEHLER: Modul ${tokens.name} benötigt "${tokens.dependency}" was nicht installiert ist!`;
        case 'tera-network-proxy/connection/dispatch/modulemanager/mod-conflict-error': return `[Modul] FEHLER: Modul ${tokens.name} kann nicht geladen werden, während "${tokens.conflict}" installiert ist!`;
        case 'tera-network-proxy/connection/dispatch/modulemanager/cannot-load-mod-not-installed': return `[Modul] FEHLER: Versuch, ein nicht installiertes Modul zu laden: ${tokens.name}`;
        case 'tera-network-proxy/connection/dispatch/modulemanager/cannot-unload-mod-not-installed': return `[Modul] FEHLER: Versuch, ein nicht installiertes Modul zu entladen: ${tokens.name}`;
        case 'tera-network-proxy/connection/dispatch/modulemanager/cannot-unload-mod-not-loaded': return `[Modul] FEHLER: Versuch, ein nicht geladenes Modul zu entladen: ${tokens.name}`;
        case 'tera-network-proxy/connection/dispatch/modulemanager/mod-loaded': return `[Modul] Lade Modul ${tokens.name}`;
        case 'tera-network-proxy/connection/dispatch/modulemanager/mod-unloaded': return `[Modul] Entlade Modul ${tokens.name}`;
        case 'tera-network-proxy/connection/dispatch/modulemanager/mod-load-error-1': return `[Modul] FEHLER: Modul ${tokens.name} konnte nicht geladen werden!`;
        case 'tera-network-proxy/connection/dispatch/modulemanager/mod-load-error-2': return `[Modul] FEHLER: Bitte wende dich an den Autor des Moduls: ${tokens.supportUrl}`;
        case 'tera-network-proxy/connection/dispatch/modulemanager/mod-unload-error-1': return `[Modul] FEHLER: Modul ${tokens.name} konnte nicht entladen werden!`;
        case 'tera-network-proxy/connection/dispatch/modulemanager/mod-unload-error-2': return `[Modul] FEHLER: Bitte wende dich an den Autor des Moduls: ${tokens.supportUrl}`;
        case 'tera-network-proxy/connection/dispatch/modulemanager/unsupported-def-error-1': return `[Modul] FEHLER: Modul "${tokens.name}" verwendet die folgenden veralteten / nicht unterstützten Pakete:`;
        case 'tera-network-proxy/connection/dispatch/modulemanager/unsupported-def-error-2': return `[Modul] FEHLER: - ${tokens.name}.${tokens.version}`;
        case 'tera-network-proxy/connection/dispatch/modulemanager/unsupported-def-error-3': return `[Modul] FEHLER: Bitte wende dich an den Autor des Moduls: ${tokens.supportUrl}`;
        case 'tera-network-proxy/connection/dispatch/modulemanager/cannot-reload-mod-not-installed': return `[Modul] FEHLER: Versuch, ein nicht installiertes Modul neu zu laden: ${tokens.name}`;
        case 'tera-network-proxy/connection/dispatch/modulemanager/cannot-reload-mod-not-supported': return `[Modul] FEHLER: Versuch, ein Modul neu zu laden, das kein Hot-Reload unterstützt: ${tokens.name}`;
        case 'tera-network-proxy/connection/dispatch/modulemanager/cannot-reload-mod-not-loaded': return `[Modul] FEHLER: Versuch, ein nicht geladenes Modul neu zu laden: ${tokens.name}`;
        case 'tera-network-proxy/connection/dispatch/modulemanager/cannot-reload-mod-unload-failed': return `[Modul] FEHLER: Neu laden fehlgeschlagen: ${tokens.name}`;
        case 'tera-network-proxy/connection/dispatch/modulemanager/cannot-reload-mod-load-failed': return `[Modul] FEHLER: Neu laden fehlgeschlagen: ${tokens.name}`;
        case 'tera-network-proxy/connection/dispatch/modulemanager/mod-reloaded': return `[Modul] Modul ${tokens.name} wurde neu geladen`;

        // default
        default: throw new Error(`Invalid string "${str}"!`);
    }
};

module.exports = { Name, GetString };
