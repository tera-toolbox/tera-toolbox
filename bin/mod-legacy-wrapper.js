function DeprecationWarning(mod, prop) {
    if (global.TeraProxy.DevMode) {
        const stack = new Error().stack.split('\n').slice(1);
        while (stack.length > 0 && stack[0].includes(__dirname))
            stack.shift();
        let end = stack.findIndex(line => line.includes(__dirname));
        if (end > -1)
            stack.splice(end);

        mod.warn(`Accessing deprecated "${prop}"! Call stack:`);
        mod.warn(stack.map(line => line.replace(/^ {4}at /, '')).join('\n'));
    }
}

function ClientModWrapper(info, implementation) {
    return function (mod) {
        if (global.TeraProxy.DevMode)
            mod.warn('Using deprecated mod API. Please update!');

        let installedGPKs = [];

        let modWrapper = new Proxy(Object.create(null), {
            get: function (target, prop, receiver) {
                switch (prop) {
                    case 'name': {
                        DeprecationWarning(mod, prop);
                        return mod.info.name;
                    }
                    case 'niceName': {
                        DeprecationWarning(mod, prop);
                        return mod.info.options.niceName || mod.info.rawName;
                    }
                    case 'rootFolder': {
                        DeprecationWarning(mod, prop);
                        return mod.info.path;
                    }
                    case 'options': {
                        DeprecationWarning(mod, prop);
                        return mod.info.options;
                    }
                    case 'proxyAuthor': {
                        DeprecationWarning(mod, prop);
                        return 'caali';
                    }
                    case 'region': {
                        DeprecationWarning(mod, prop);
                        switch (mod.publisher) {
                            case 'gf': return 'eu';
                            case 'eme': return 'na';
                            case 'nx': return 'kr';
                            case 'pm': return 'jp';
                            case 'm5': return 'tw';
                            default: return 'int';
                        }
                    }
                    case "installGPK": {
                        DeprecationWarning(mod, prop);
                        return (fromPath, filename = null) => installedGPKs.push([fromPath, filename]);
                    }
                    default:
                        return mod[prop];
                }
            }
        });

        let instance = new implementation(modWrapper);
        this.install = installer => installedGPKs.forEach(file => installer.gpk(...file));
        if (typeof instance.destructor === 'function')
            this.destructor = () => instance.destructor();
    }
}

function NetworkModWrapper(info, implementation) {
    return function (mod) {
        if (global.TeraProxy.DevMode)
            mod.warn('Using deprecated mod API. Please update!');

        let modRequireWrapper = new Proxy(Object.create(null), {
            get: (obj, key) => {
                return mod.require[key].networkMod;
            },
            set() {
                throw new TypeError('Cannot set property of require');
            }
        });

        let modWrapper = new Proxy(Object.create(null), {
            get: function (target, prop, receiver) {
                switch (prop) {
                    case 'name': {
                        DeprecationWarning(mod, prop);
                        return mod.info.name;
                    }
                    case 'niceName': {
                        DeprecationWarning(mod, prop);
                        return mod.info.options.niceName || mod.info.rawName;
                    }
                    case 'rootFolder': {
                        DeprecationWarning(mod, prop);
                        return mod.info.path;
                    }
                    case 'options': {
                        DeprecationWarning(mod, prop);
                        return mod.info.options;
                    }
                    case 'proxyAuthor': {
                        DeprecationWarning(mod, prop);
                        return 'caali';
                    }
                    case 'isConsole': {
                        DeprecationWarning(mod, prop);
                        return ['ps4', 'xb1'].includes(mod.platform);
                    }
                    case 'isClassic': {
                        DeprecationWarning(mod, prop);
                        return mod.majorPatchVersion <= 27;
                    }
                    case 'region': {
                        DeprecationWarning(mod, prop);
                        switch (mod.publisher) {
                            case 'gf': return 'eu';
                            case 'eme': return 'na';
                            case 'nx': return 'kr';
                            case 'pm': return 'jp';
                            case 'm5': return 'tw';
                            default: return 'int';
                        }
                    }
                    case 'protocolVersion': {
                        DeprecationWarning(mod, prop);
                        return mod.dispatch.protocolVersion;
                    }
                    case 'require': {
                        DeprecationWarning(mod, prop);
                        return modRequireWrapper;
                    }
                    default:
                        return mod[prop];
                }
            }
        });

        let instance = new implementation(modWrapper);
        if (typeof instance.destructor === 'function') {
            console.log('redirect destructor');
            this.destructor = () => {
                console.log('destructor called!'); instance.destructor();
            }
        }
    }
}

module.exports = function ModLegacyWrapper(info, implementation) {
    switch (info.category) {
        case 'network': return { NetworkMod: NetworkModWrapper(info, implementation) }
        case 'client': return { ClientMod: ClientModWrapper(info, implementation) }
        default: throw new Error(`Invalid mod category "${info.category}"!`);
    }
}
