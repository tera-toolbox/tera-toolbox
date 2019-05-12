const Connection = require('./connection');
const FakeClient = require('./clients/FakeClient');
const RealClient = require('./clients/RealClient');

module.exports = { Connection, FakeClient, RealClient };
