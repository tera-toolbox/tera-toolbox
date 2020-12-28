function DeprecationWarning(mod, prop) {
    const stack = new Error().stack.split('\n').slice(1);
    while (stack.length > 0 && stack[0].includes(__dirname))
        stack.shift();
    let end = stack.findIndex(line => line.includes(__dirname));
    if (end > -1)
        stack.splice(end);

    mod.warn(`Accessing deprecated "${prop}"! Call stack:`);
    mod.warn(stack.map(line => line.replace(/^ {4}at /, '')).join('\n'));
}

function ClientModWrapper(info, implementation) {
    return class extends implementation {
        constructor(mod) {
            if (mod.clientInterface.info.arch === 'x64')
                throw Error(`Incompatible with 64-bit client. Wait for the module to be updated!`);

            mod.warn('Using deprecated client mod API!');

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
                            return mod.info.options.cliName || mod.info.rawName;
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

            super(modWrapper);
            this.install = installer => installedGPKs.forEach(file => installer.gpk(...file));
        }
    }
}

function NetworkModWrapper(info, implementation) {
    return class extends implementation {
        constructor(mod) {
            let modRequireWrapper = new Proxy(Object.create(null), {
                get: (obj, key) => {
                    let res = mod.require[key];
                    if (!res.networkMod)
                        return res;

                    DeprecationWarning(mod, "require without RequireInterface");
                    return res.networkMod;
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
                            return mod.info.options.cliName || mod.info.rawName;
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
                            return modRequireWrapper;
                        }
                        default:
                            return mod[prop];
                    }
                }
            });

            super(modWrapper);
        }
    }
}

module.exports = function ModLegacyWrapper(info, implementation) {
    if (info.keywords.includes('client'))
        return { ClientMod: ClientModWrapper(info, implementation) };
    return { NetworkMod: NetworkModWrapper(info, implementation) };
}
