# Managing Network Traffic Hooks
The core feature of network mods for TERA Toolbox is obviously the ability to intercept, read, modify, and send fake network packets. This can be achieved by accessing the corresponding API offered through the `mod` parameter passed to the module's constructor. Note that hooks can be arbitrarily installed and uninstalled at any time, even from within a hook callback.

## Hooking Traffic (Read)
Let's start by taking apart a very basic example:
```js
module.exports = function MyModule(mod) {
    mod.hook('S_LOAD_TOPO', 3, event => {
        mod.log(`Switching to zone ${event.zone}!`);
    });
}
```

As you can see, `mod.hook()` installs a network traffic hook. The one in our example will trigger if and only if a packet with the name `S_LOAD_TOPO` is processed. It will use version `3` of the packet definitions available for `S_LOAD_TOPO` in order to parse the raw binary data of that packet into the `event` object passed to your hook callback function. This requires that (1) a proper opcode mapping from the name `S_LOAD_TOPO` to the corresponding number (which is randomized whenever a new client patch is distributed), and (2) a valid packet definition for that packet (the contents are subject to change on game updates) are known to TERA Toolbox. Both mappings (in `map_base`) and definitions (in `protocol`) are maintained in the [tera-data](https://github.com/tera-toolbox/tera-data) repository, which is automatically downloaded by TERA Toolbox on startup. Outdated mappings and definitions are typically purged from that repository a few weeks after they have become obsolete due to all game regions having been updated to the latest patch.

Taking a look into the definition file (`S_LOAD_TOPO.3.def`) used in our example, we see that it looks like this:
```
int32 zone
vec3  loc
bool  quick # true = no loading screen
```

As you can see, the `zone` attribute will be passed to the hook installed in the example above as `event.zone`, `loc` would be passed as `event.loc`, and so on. You can find a documentation of all data types and more [in the tera-data readme](https://github.com/tera-toolbox/tera-data/blob/master/README.md).

Based on that knowledge, we can conclude that our hook callback in the example above prints the new zone ID to the log whenever a zone change is triggered by the server. As an example, teleporting to Highwatch from Velika would print `Switching to zone 7031!`.

It should be noted that `mod.hook()` works for both directions: Client -> Server packets typically start with the prefix `C_` whereas Server -> Client packets are typically prefixed by `S_`.

## Hooking Traffic (Modify/Block)
We don't just want to be able to read traffic, however, but we also need to modify or even block the packet from being transferred altogether. For this purpose, we also use `mod.hook()` as follows:
```js
module.exports = function MyModule(mod) {
    // S_CHAT is sent by the server to transfer a chat message to the client.
    mod.hook('S_CHAT', 3, event => {
        // We don't want to read any messages from Kasea. Ever.
        // This can be achieved by returning false from our hook. It'll block the packet from being sent to the receiving end.
        if(event.name === 'Kasea')
            return false;
        
        // If we receive a chat message from SaltyMonkey, we want to fix the grammar of the message.
        // In order to do so, we modify the event object and return true from our hook.
        if(event.name === 'SaltyMonkey') {
            event.message = event.message.replace('Here', 'There is');
            return true;
        }
        
        // We don't want to touch chat messages from other people. Hence, we leave the event object intact and either return undefined,
        // or just omit the return statement altogether (which will default the return value of the hook to undefined).
    });
}
```

## Sending Fake Packets
Sometimes it's infeasible to just read or modify traffic, because we need to send additional (fake) packets to either the client or the server. For this purpose, `mod.send()` is used, once again specifying packet name and definition version, but this time passing an `event` object containing the fields of the packet definition instead of a hook callback. Note that omitted fields are defaulted to `0`, empty string, and so on, and that extraneous fields are ignored.

As an example, let's say we want to make a module that locally shows a (fake) chat message indicating your current position whenever you jump:
```js
module.exports = function MyModule(mod) {
    // C_PLAYER_LOCATION is sent by the client whenever the player moves, jumps, falls, etc.
    mod.hook('C_PLAYER_LOCATION', 5, event => {
        // Movement type 5 means "jump" (see packet definition in tera-data).
        if(event.type === 5) {
            // Send fake chat message (only visible to the player) to the client
            mod.send('S_CHAT', 3, {
                name: 'LocationLogger',
                message: `Player jumped at ${event.loc.x},${event.loc.y},${event.loc.z}!`,
            });
        }
    });
}
```

It should be noted that `mod.send()` automatically determines the direction based on the packet name - `C_` packets are sent to the server and `S_` packets are sent to the client.

## Advanced Usage
TBD
- raw hooks, raw send, toServer()/toClient()
- error handling (invalid opcode, invalid defs, ...) / tryHook, trySend, etc
- hookOnce
- hook references and unhook()
- multi-version hooks / version switches
