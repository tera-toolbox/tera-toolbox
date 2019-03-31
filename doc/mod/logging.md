# Using the Logging API
Proxy offers a logging API that behaves very similar to Node.JS's native console, however certain rarely used features such as `printf`-style formatting are not supported. It is highly recommended to use proxy's logging API, as future updates might no longer allow using the native console directly.

- `mod.log(...)` prefixes the message with `[module name]`
- `mod.warn(...)` prefixes the message with `[module name] WARNING:`
- `mod.error(...)` prefixes the message with `[module name] ERROR:`
