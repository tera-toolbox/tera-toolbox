const ProcessListenerDLLInjector = require('tera-client-interface/process-listener-dll-injector');

let processListener = new ProcessListenerDLLInjector(100);
processListener.run();
console.log('[toolbox] Standalone DLL injector running!');
