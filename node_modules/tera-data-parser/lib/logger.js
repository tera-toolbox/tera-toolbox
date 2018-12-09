// eslint-disable-next-line no-console
const c = method => console[method].bind(console);

module.exports = {
  trace: () => {},
  debug: () => {},
  info: c('log'),
  warn: () => {}, // TODO: add an option to trigger this for developers
  error: c('error'),
  fatal: c('error'),
};
