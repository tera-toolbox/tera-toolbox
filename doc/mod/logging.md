# Using the Logging API
TERA Toolbox offers a logging API that behaves very similar to Node.JS's native console, however certain rarely used features such as `printf`-style formatting are not supported. It is highly recommended this logging API, as future versions of TERA Toolbox might no longer allow using the native console directly.

- `mod.log(...)` prefixes the message with `[module name]`
- `mod.warn(...)` prefixes the message with `[module name] WARNING:`
- `mod.error(...)` prefixes the message with `[module name] ERROR:`
