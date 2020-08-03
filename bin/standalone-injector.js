const path = require('path');
const Scanner = require('tera-client-interface/scanner');

let scanner = new Scanner('TERA.exe', path.join(path.dirname(require.resolve('tera-client-interface')), 'tera-client-interface-32.dll'), path.join(path.dirname(require.resolve('tera-client-interface')), 'tera-client-interface-64.dll'), 25);
scanner.start();
console.log('[toolbox] Standalone DLL injector running!');
process.stdin.resume();
