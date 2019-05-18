module.exports = {
  trace: function(...args) { if (global.TeraProxy.DevMode) console.log(...args); },
  debug: function(...args) { if (global.TeraProxy.DevMode) console.log(...args); },
  info: function(...args) { console.log(...args); },
  warn: function(...args) { console.warn(...args); },
  error: function(...args) { console.error(...args); },
  fatal: function(...args) { console.error(...args); },
};
