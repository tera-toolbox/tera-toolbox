const Connection = require('./connection');
const FakeClient = require('./clients/FakeClient');
const RealClient = require('./clients/RealClient');
const ModuleInstallation = require('./connection/dispatch/moduleInstallation');

module.exports = { Connection, FakeClient, RealClient, ModuleInstallation };
