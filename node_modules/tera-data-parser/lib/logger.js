// eslint-disable-next-line no-console
const c = method => console[method].bind(console);

module.exports = {
    trace: () => {},
    debug: () => {},
    info: () => {},
    warn: c('warn'),
    error: c('error'),
    fatal: c('error'),
};
